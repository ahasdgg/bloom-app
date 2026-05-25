/**
 * LLM Recommendation Engine
 * Generates personalized activity recommendations using LLM API
 */

import axios, {AxiosError} from 'axios';
import {AsyncStorageService, STORAGE_KEYS} from './asyncStorage';
import {env} from '../config/env';
import type {
  Recommendation,
  RecommendationRequest,
  RecommendationResponse,
  LLMServiceConfig,
  LLMError,
  CachedRecommendation,
  Activity,
} from '../types';

const DEFAULT_CONFIG: Required<LLMServiceConfig> = {
  apiKey: env.llm.apiKey,
  apiUrl: env.llm.apiUrl,
  model: 'gemini-pro',
  temperature: 0.7,
  maxTokens: 1000,
  timeout: 30000, // 30 seconds
  cacheExpirationTime: 30 * 60 * 1000, // 30 minutes
};

class LLMRecommendationEngine {
  private config: Required<LLMServiceConfig>;
  private cachedRecommendation: CachedRecommendation | null = null;

  constructor(config?: Partial<LLMServiceConfig>) {
    this.config = {...DEFAULT_CONFIG, ...config};
    this.loadCachedRecommendation();
  }

  /**
   * Generate recommendation based on user context
   */
  async generateRecommendation(
    request: RecommendationRequest,
    forceRefresh = false,
  ): Promise<Recommendation | CachedRecommendation> {
    // Return cached recommendation if available and not stale
    if (
      !forceRefresh &&
      this.cachedRecommendation &&
      !this.cachedRecommendation.isStale
    ) {
      return this.cachedRecommendation;
    }

    // Check if API key is configured
    if (!this.config.apiKey) {
      // Return cached recommendation if available, even if stale
      if (this.cachedRecommendation) {
        return this.cachedRecommendation;
      }
      throw this.createLLMError(
        'API_KEY_MISSING',
        'LLM API key is not configured',
      );
    }

    // Generate fresh recommendation
    try {
      const recommendation = await this.callLLMAPI(request);
      await this.cacheRecommendation(recommendation);
      return recommendation;
    } catch (error) {
      // Return cached recommendation if available, even if stale
      if (this.cachedRecommendation) {
        return this.cachedRecommendation;
      }
      throw error;
    }
  }

  /**
   * Call LLM API to generate recommendation
   */
  private async callLLMAPI(
    request: RecommendationRequest,
  ): Promise<Recommendation> {
    try {
      const prompt = this.buildPrompt(request);

      const response = await axios.post(
        `${this.config.apiUrl}/generateContent`,
        {
          contents: [
            {
              parts: [
                {
                  text: prompt,
                },
              ],
            },
          ],
          generationConfig: {
            temperature: this.config.temperature,
            maxOutputTokens: this.config.maxTokens,
          },
        },
        {
          params: {
            key: this.config.apiKey,
          },
          timeout: this.config.timeout,
          headers: {
            'Content-Type': 'application/json',
          },
        },
      );

      const responseText =
        response.data.candidates?.[0]?.content?.parts?.[0]?.text;

      if (!responseText) {
        throw this.createLLMError(
          'API_ERROR',
          'Invalid response from LLM API',
        );
      }

      // Parse LLM response
      const recommendation = this.parseRecommendationResponse(
        responseText,
        request,
      );

      return recommendation;
    } catch (error) {
      throw this.handleAPIError(error);
    }
  }

  /**
   * Build prompt for LLM
   */
  private buildPrompt(request: RecommendationRequest): string {
    const {
      location,
      weather,
      availableTime,
      preferences,
      calendar,
    } = request;

    const prompt = `You are an activity recommendation engine. Based on the user's context, recommend ONE perfect activity.

User Context:
- Location: ${location.latitude.toFixed(4)}, ${location.longitude.toFixed(4)}
- Weather: ${weather.condition}, ${weather.temperature}°C, ${weather.humidity}% humidity, ${weather.windSpeed} km/h wind
- Available Time: ${availableTime} minutes
- Preferred Categories: ${preferences.favoriteCategories.join(', ') || 'any'}
- Disliked Categories: ${preferences.dislikedCategories.join(', ') || 'none'}
- Budget: ${preferences.budgetRange.min}-${preferences.budgetRange.max}
- Max Travel Distance: ${preferences.maxDistance} km
- Preferred Difficulty: ${preferences.difficulty.join(', ')}
${calendar?.nextFreeSlot ? `- Next Free Slot: ${calendar.nextFreeSlot.duration} minutes` : ''}

Respond with a JSON object containing:
{
  "activity": {
    "name": "Activity Name",
    "description": "Brief description",
    "category": "category",
    "location": {
      "name": "Location Name",
      "latitude": 0.0,
      "longitude": 0.0,
      "address": "Address"
    },
    "duration": 60,
    "difficulty": "easy|moderate|hard|expert",
    "cost": "free|budget|moderate|premium",
    "costAmount": 0,
    "indoor": true|false,
    "imageUrl": "url",
    "bookingUrl": "url"
  },
  "relevanceScore": 0.95,
  "reasoning": "Why this activity is perfect for the user right now"
}

Important:
- Recommend only ONE activity
- Consider weather conditions (avoid outdoor activities in bad weather)
- Respect user preferences and budget
- Ensure activity fits in available time
- Provide realistic, achievable recommendations
- Score should be 0-1 based on how well it matches the context`;

    return prompt;
  }

  /**
   * Parse LLM response
   */
  private parseRecommendationResponse(
    responseText: string,
    request: RecommendationRequest,
  ): Recommendation {
    try {
      // Extract JSON from response
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('No JSON found in response');
      }

      const parsed = JSON.parse(jsonMatch[0]);
      const response: RecommendationResponse = parsed;

      // Create recommendation object
      const recommendation: Recommendation = {
        id: `rec_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        activity: response.activity,
        relevanceScore: response.relevanceScore,
        reasoning: response.reasoning,
        contextSnapshot: response.contextSnapshot,
        createdAt: Date.now(),
        expiresAt: Date.now() + this.config.cacheExpirationTime,
      };

      return recommendation;
    } catch (error) {
      console.error('Failed to parse LLM response:', error);
      throw this.createLLMError(
        'API_ERROR',
        `Failed to parse recommendation: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
    }
  }

  /**
   * Cache recommendation to AsyncStorage and memory
   */
  private async cacheRecommendation(
    recommendation: Recommendation,
  ): Promise<void> {
    const cached: CachedRecommendation = {
      ...recommendation,
      cachedAt: Date.now(),
      isStale: false,
    };

    this.cachedRecommendation = cached;

    try {
      await AsyncStorageService.setItem(
        STORAGE_KEYS.CACHED_CONTEXT,
        cached,
      );
    } catch (error) {
      console.error('Failed to cache recommendation:', error);
    }
  }

  /**
   * Load cached recommendation from AsyncStorage
   */
  private async loadCachedRecommendation(): Promise<void> {
    try {
      const cached = await AsyncStorageService.getItem<CachedRecommendation>(
        STORAGE_KEYS.CACHED_CONTEXT,
      );

      if (cached) {
        const age = Date.now() - cached.cachedAt;
        const isStale = age > this.config.cacheExpirationTime;

        this.cachedRecommendation = {
          ...cached,
          isStale,
        };
      }
    } catch (error) {
      console.error('Failed to load cached recommendation:', error);
    }
  }

  /**
   * Get cached recommendation if available
   */
  getCachedRecommendation(): CachedRecommendation | null {
    return this.cachedRecommendation;
  }

  /**
   * Clear cached recommendation
   */
  async clearCache(): Promise<void> {
    this.cachedRecommendation = null;
    try {
      await AsyncStorageService.removeItem(STORAGE_KEYS.CACHED_CONTEXT);
    } catch (error) {
      console.error('Failed to clear recommendation cache:', error);
    }
  }

  /**
   * Update service configuration
   */
  updateConfig(config: Partial<LLMServiceConfig>): void {
    this.config = {...this.config, ...config};
  }

  /**
   * Handle API errors
   */
  private handleAPIError(error: unknown): LLMError {
    const isAxiosError =
      typeof error === 'object' &&
      error !== null &&
      ('isAxiosError' in error || 'response' in error || 'code' in error);

    if (isAxiosError) {
      const axiosError = error as AxiosError;

      if (axiosError.code === 'ECONNABORTED') {
        return this.createLLMError('TIMEOUT', 'Request timeout');
      }

      if (!axiosError.response) {
        return this.createLLMError(
          'NETWORK_ERROR',
          'Network error: Unable to reach LLM service',
        );
      }

      const statusCode = axiosError.response.status;

      if (statusCode === 401 || statusCode === 403) {
        return this.createLLMError(
          'API_KEY_MISSING',
          'Invalid API key',
          statusCode,
        );
      }

      if (statusCode === 429) {
        return this.createLLMError(
          'RATE_LIMITED',
          'Rate limit exceeded',
          statusCode,
        );
      }

      if (statusCode === 400) {
        return this.createLLMError(
          'INVALID_REQUEST',
          'Invalid request to LLM API',
          statusCode,
        );
      }

      return this.createLLMError(
        'API_ERROR',
        `API error: ${axiosError.message}`,
        statusCode,
      );
    }

    return this.createLLMError(
      'UNKNOWN',
      error instanceof Error ? error.message : 'Unknown error',
    );
  }

  /**
   * Create LLMError object
   */
  private createLLMError(
    code: LLMError['code'],
    message: string,
    statusCode?: number,
  ): LLMError {
    return {code, message, statusCode};
  }
}

// Export singleton instance
export const llmRecommendationEngine = new LLMRecommendationEngine();

// Export class for testing
export {LLMRecommendationEngine};
