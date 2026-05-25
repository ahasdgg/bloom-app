/**
 * Recommendation type definitions
 * Represents LLM-generated activity recommendations
 */

import type {ActivityCategory, DifficultyLevel, CostLevel} from './activity';

export interface Activity {
  id: string;
  name: string;
  description: string;
  category: ActivityCategory;
  location: {
    name: string;
    latitude: number;
    longitude: number;
    address?: string;
  };
  duration: number; // in minutes
  difficulty: DifficultyLevel;
  cost: CostLevel;
  costAmount?: number; // in local currency
  indoor: boolean;
  imageUrl?: string;
  bookingUrl?: string;
  metadata?: Record<string, any>;
}

export interface Recommendation {
  id: string;
  activity: Activity;
  relevanceScore: number; // 0-1
  reasoning: string; // Why this activity was recommended
  contextSnapshot: {
    temperature?: number;
    weather?: string;
    timeOfDay?: string;
    dayOfWeek?: string;
    availableTime?: number; // in minutes
    userMood?: string;
  };
  createdAt: number; // Unix timestamp
  expiresAt: number; // Unix timestamp
}

export interface RecommendationRequest {
  userId: string;
  location: {
    latitude: number;
    longitude: number;
  };
  weather: {
    condition: string;
    temperature: number;
    humidity: number;
    windSpeed: number;
  };
  availableTime: number; // in minutes
  preferences: {
    favoriteCategories: ActivityCategory[];
    dislikedCategories: ActivityCategory[];
    budgetRange: {min: number; max: number};
    maxDistance: number; // in km
    difficulty: DifficultyLevel[];
  };
  calendar?: {
    nextFreeSlot?: {
      startTime: number;
      duration: number;
    };
    busyUntil?: number;
  };
}

export interface RecommendationResponse {
  activity: Activity;
  relevanceScore: number;
  reasoning: string;
  contextSnapshot: Recommendation['contextSnapshot'];
}

export interface RecommendationFeedback {
  recommendationId: string;
  liked: boolean;
  reason?: string;
  completed: boolean;
}

export interface LLMServiceConfig {
  apiKey: string;
  apiUrl: string;
  model?: string;
  temperature?: number;
  maxTokens?: number;
  timeout?: number; // milliseconds
  cacheExpirationTime?: number; // milliseconds
}

export interface LLMError {
  code:
    | 'API_KEY_MISSING'
    | 'API_ERROR'
    | 'NETWORK_ERROR'
    | 'INVALID_REQUEST'
    | 'TIMEOUT'
    | 'RATE_LIMITED'
    | 'UNKNOWN';
  message: string;
  statusCode?: number;
}

export interface CachedRecommendation extends Recommendation {
  cachedAt: number;
  isStale: boolean;
}
