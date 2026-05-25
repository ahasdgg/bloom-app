/**
 * Weather Service
 * Handles weather data fetching, caching, and error handling
 */

import axios, {AxiosError} from 'axios';
import {AsyncStorageService, STORAGE_KEYS} from './asyncStorage';
import {env} from '../config/env';
import type {
  WeatherContext,
  CachedWeather,
  WeatherServiceConfig,
  WeatherError,
  WeatherCondition,
  OpenWeatherMapResponse,
  OpenWeatherMapForecastResponse,
  WeatherForecast,
  ForecastItem,
} from '../types';

const DEFAULT_CONFIG: Required<WeatherServiceConfig> = {
  apiKey: env.weather.apiKey,
  apiUrl: env.weather.apiUrl,
  units: 'metric',
  language: 'en',
  cacheExpirationTime: 900000, // 15 minutes
  timeout: 10000, // 10 seconds
};

class WeatherService {
  private config: Required<WeatherServiceConfig>;
  private cachedWeather: CachedWeather | null = null;

  constructor(config?: Partial<WeatherServiceConfig>) {
    this.config = {...DEFAULT_CONFIG, ...config};
    this.loadCachedWeather();
  }

  /**
   * Get current weather for a location with caching support
   */
  async getCurrentWeather(
    latitude: number,
    longitude: number,
    forceRefresh = false,
  ): Promise<WeatherContext | CachedWeather> {
    // Return cached weather if available and not stale
    if (
      !forceRefresh &&
      this.cachedWeather &&
      !this.cachedWeather.isStale &&
      this.isSameLocation(latitude, longitude)
    ) {
      return this.cachedWeather;
    }

    // Check if API key is configured
    if (!this.config.apiKey) {
      // Return cached weather if available, even if stale
      if (this.cachedWeather) {
        return this.cachedWeather;
      }
      throw this.createWeatherError(
        'API_KEY_MISSING',
        'Weather API key is not configured',
      );
    }

    // Fetch fresh weather data
    try {
      const weather = await this.fetchCurrentWeather(latitude, longitude);
      await this.cacheWeather(weather, latitude, longitude);
      return weather;
    } catch (error) {
      // Return cached weather if available, even if stale
      if (this.cachedWeather) {
        return this.cachedWeather;
      }
      throw error;
    }
  }

  /**
   * Get weather forecast for a location
   */
  async getWeatherForecast(
    latitude: number,
    longitude: number,
    forceRefresh = false,
  ): Promise<WeatherForecast> {
    // Return cached forecast if available and not stale
    if (
      !forceRefresh &&
      this.cachedWeather &&
      !this.cachedWeather.isStale &&
      this.cachedWeather.forecast &&
      this.isSameLocation(latitude, longitude)
    ) {
      return this.cachedWeather.forecast;
    }

    // Check if API key is configured
    if (!this.config.apiKey) {
      // Return cached forecast if available, even if stale
      if (this.cachedWeather?.forecast) {
        return this.cachedWeather.forecast;
      }
      throw this.createWeatherError(
        'API_KEY_MISSING',
        'Weather API key is not configured',
      );
    }

    // Fetch fresh forecast data
    try {
      const forecast = await this.fetchWeatherForecast(latitude, longitude);
      
      // Update cache with forecast
      if (this.cachedWeather && this.isSameLocation(latitude, longitude)) {
        this.cachedWeather.forecast = forecast;
        await AsyncStorageService.setItem(
          STORAGE_KEYS.CACHED_WEATHER,
          this.cachedWeather,
        );
      }
      
      return forecast;
    } catch (error) {
      // Return cached forecast if available, even if stale
      if (this.cachedWeather?.forecast) {
        return this.cachedWeather.forecast;
      }
      throw error;
    }
  }

  /**
   * Fetch current weather from OpenWeatherMap API
   */
  private async fetchCurrentWeather(
    latitude: number,
    longitude: number,
  ): Promise<WeatherContext> {
    try {
      const response = await axios.get<OpenWeatherMapResponse>(
        `${this.config.apiUrl}/weather`,
        {
          params: {
            lat: latitude,
            lon: longitude,
            appid: this.config.apiKey,
            units: this.config.units,
            lang: this.config.language,
          },
          timeout: this.config.timeout,
        },
      );

      return this.mapOpenWeatherMapResponse(response.data);
    } catch (error) {
      throw this.handleApiError(error);
    }
  }

  /**
   * Fetch weather forecast from OpenWeatherMap API
   */
  private async fetchWeatherForecast(
    latitude: number,
    longitude: number,
  ): Promise<WeatherForecast> {
    try {
      const response = await axios.get<OpenWeatherMapForecastResponse>(
        `${this.config.apiUrl}/forecast`,
        {
          params: {
            lat: latitude,
            lon: longitude,
            appid: this.config.apiKey,
            units: this.config.units,
            lang: this.config.language,
          },
          timeout: this.config.timeout,
        },
      );

      return this.mapOpenWeatherMapForecastResponse(response.data);
    } catch (error) {
      throw this.handleApiError(error);
    }
  }

  /**
   * Map OpenWeatherMap response to WeatherContext
   */
  private mapOpenWeatherMapResponse(
    data: OpenWeatherMapResponse,
  ): WeatherContext {
    const condition = this.mapWeatherCondition(data.weather[0]?.main);
    const precipitation = data.rain?.['1h'] || data.snow?.['1h'] || 0;

    return {
      condition,
      temperature: data.main.temp,
      feelsLike: data.main.feels_like,
      humidity: data.main.humidity,
      windSpeed: this.convertWindSpeed(data.wind.speed),
      windDirection: data.wind.deg,
      precipitation,
      visibility: data.visibility ? data.visibility / 1000 : undefined, // Convert m to km
      pressure: data.main.pressure,
      cloudCover: data.clouds.all,
      timestamp: data.dt * 1000, // Convert to milliseconds
      sunrise: data.sys.sunrise * 1000,
      sunset: data.sys.sunset * 1000,
    };
  }

  /**
   * Map OpenWeatherMap forecast response to WeatherForecast
   */
  private mapOpenWeatherMapForecastResponse(
    data: OpenWeatherMapForecastResponse,
  ): WeatherForecast {
    const hourly: ForecastItem[] = [];
    const daily: ForecastItem[] = [];
    const dailyMap = new Map<string, ForecastItem[]>();

    // Process forecast items
    data.list.forEach(item => {
      const forecastItem: ForecastItem = {
        timestamp: item.dt * 1000,
        condition: this.mapWeatherCondition(item.weather[0]?.main),
        temperature: item.main.temp,
        feelsLike: item.main.feels_like,
        humidity: item.main.humidity,
        windSpeed: this.convertWindSpeed(item.wind.speed),
        precipitation: item.rain?.['3h'] || item.snow?.['3h'] || 0,
        precipitationProbability: item.pop * 100,
      };

      // Add to hourly (limit to 48 hours)
      if (hourly.length < 16) {
        // 16 items * 3 hours = 48 hours
        hourly.push(forecastItem);
      }

      // Group by day for daily forecast
      const date = new Date(item.dt * 1000).toISOString().split('T')[0];
      if (!dailyMap.has(date)) {
        dailyMap.set(date, []);
      }
      dailyMap.get(date)!.push(forecastItem);
    });

    // Create daily forecast by averaging values for each day
    dailyMap.forEach((items, date) => {
      if (daily.length < 7) {
        // Limit to 7 days
        const avgTemp =
          items.reduce((sum, item) => sum + item.temperature, 0) / items.length;
        const avgFeelsLike =
          items.reduce((sum, item) => sum + item.feelsLike, 0) / items.length;
        const avgHumidity =
          items.reduce((sum, item) => sum + item.humidity, 0) / items.length;
        const avgWindSpeed =
          items.reduce((sum, item) => sum + item.windSpeed, 0) / items.length;
        const totalPrecipitation = items.reduce(
          (sum, item) => sum + (item.precipitation || 0),
          0,
        );
        const maxPrecipProb = Math.max(
          ...items.map(item => item.precipitationProbability || 0),
        );

        // Use the most common condition for the day
        const conditionCounts = new Map<WeatherCondition, number>();
        items.forEach(item => {
          conditionCounts.set(
            item.condition,
            (conditionCounts.get(item.condition) || 0) + 1,
          );
        });
        const mostCommonCondition = Array.from(conditionCounts.entries()).sort(
          (a, b) => b[1] - a[1],
        )[0][0];

        daily.push({
          timestamp: new Date(date).getTime(),
          condition: mostCommonCondition,
          temperature: avgTemp,
          feelsLike: avgFeelsLike,
          humidity: avgHumidity,
          windSpeed: avgWindSpeed,
          precipitation: totalPrecipitation,
          precipitationProbability: maxPrecipProb,
        });
      }
    });

    return {hourly, daily};
  }

  /**
   * Map OpenWeatherMap weather condition to our WeatherCondition type
   */
  private mapWeatherCondition(condition: string): WeatherCondition {
    const conditionLower = condition?.toLowerCase() || '';

    if (conditionLower.includes('clear')) return 'clear';
    if (conditionLower.includes('cloud')) return 'cloudy';
    if (conditionLower.includes('rain')) return 'rainy';
    if (conditionLower.includes('drizzle')) return 'drizzle';
    if (conditionLower.includes('snow')) return 'snowy';
    if (conditionLower.includes('thunderstorm')) return 'thunderstorm';
    if (conditionLower.includes('mist')) return 'mist';
    if (conditionLower.includes('smoke')) return 'smoke';
    if (conditionLower.includes('haze')) return 'haze';
    if (conditionLower.includes('dust')) return 'dust';
    if (conditionLower.includes('sand')) return 'sand';
    if (conditionLower.includes('ash')) return 'ash';
    if (conditionLower.includes('squall')) return 'squall';
    if (conditionLower.includes('tornado')) return 'tornado';
    if (conditionLower.includes('fog')) return 'foggy';

    // Check wind speed for windy condition
    return 'clear'; // Default fallback
  }

  /**
   * Convert wind speed from m/s to km/h
   */
  private convertWindSpeed(speedMs: number): number {
    return speedMs * 3.6; // m/s to km/h
  }

  /**
   * Check if the cached weather is for the same location
   */
  private isSameLocation(latitude: number, longitude: number): boolean {
    if (!this.cachedWeather) return false;

    // Store location with cached weather (we'll add this to the cache structure)
    const cached = this.cachedWeather as CachedWeather & {
      latitude?: number;
      longitude?: number;
    };

    if (cached.latitude === undefined || cached.longitude === undefined) {
      return false;
    }

    // Check if within ~1km (approximately 0.01 degrees)
    const latDiff = Math.abs(cached.latitude - latitude);
    const lonDiff = Math.abs(cached.longitude - longitude);

    return latDiff < 0.01 && lonDiff < 0.01;
  }

  /**
   * Cache weather data to AsyncStorage and memory
   */
  private async cacheWeather(
    weather: WeatherContext,
    latitude: number,
    longitude: number,
  ): Promise<void> {
    const cachedWeather: CachedWeather & {
      latitude: number;
      longitude: number;
    } = {
      ...weather,
      cachedAt: Date.now(),
      isStale: false,
      latitude,
      longitude,
    };

    this.cachedWeather = cachedWeather;

    try {
      await AsyncStorageService.setItem(
        STORAGE_KEYS.CACHED_WEATHER,
        cachedWeather,
      );
    } catch (error) {
      console.error('Failed to cache weather:', error);
    }
  }

  /**
   * Load cached weather from AsyncStorage
   */
  private async loadCachedWeather(): Promise<void> {
    try {
      const cached = await AsyncStorageService.getItem<
        CachedWeather & {latitude?: number; longitude?: number}
      >(STORAGE_KEYS.CACHED_WEATHER);

      if (cached) {
        const age = Date.now() - cached.cachedAt;
        const isStale = age > this.config.cacheExpirationTime;

        this.cachedWeather = {
          ...cached,
          isStale,
        };
      }
    } catch (error) {
      console.error('Failed to load cached weather:', error);
    }
  }

  /**
   * Get cached weather if available
   */
  getCachedWeather(): CachedWeather | null {
    return this.cachedWeather;
  }

  /**
   * Clear cached weather
   */
  async clearCache(): Promise<void> {
    this.cachedWeather = null;
    try {
      await AsyncStorageService.removeItem(STORAGE_KEYS.CACHED_WEATHER);
    } catch (error) {
      console.error('Failed to clear weather cache:', error);
    }
  }

  /**
   * Update service configuration
   */
  updateConfig(config: Partial<WeatherServiceConfig>): void {
    this.config = {...this.config, ...config};
  }

  /**
   * Handle API errors
   */
  private handleApiError(error: unknown): WeatherError {
    // Check if it's an axios-like error object
    const isAxiosError =
      typeof error === 'object' &&
      error !== null &&
      ('isAxiosError' in error || 'response' in error || 'code' in error);

    if (isAxiosError) {
      const axiosError = error as AxiosError;

      if (axiosError.code === 'ECONNABORTED') {
        return this.createWeatherError('TIMEOUT', 'Request timeout');
      }

      if (!axiosError.response) {
        return this.createWeatherError(
          'NETWORK_ERROR',
          'Network error: Unable to reach weather service',
        );
      }

      const statusCode = axiosError.response.status;

      if (statusCode === 401) {
        return this.createWeatherError(
          'API_KEY_MISSING',
          'Invalid API key',
          statusCode,
        );
      }

      if (statusCode === 404) {
        return this.createWeatherError(
          'INVALID_LOCATION',
          'Location not found',
          statusCode,
        );
      }

      return this.createWeatherError(
        'API_ERROR',
        `API error: ${axiosError.message}`,
        statusCode,
      );
    }

    return this.createWeatherError(
      'UNKNOWN',
      error instanceof Error ? error.message : 'Unknown error',
    );
  }

  /**
   * Create WeatherError object
   */
  private createWeatherError(
    code: WeatherError['code'],
    message: string,
    statusCode?: number,
  ): WeatherError {
    return {code, message, statusCode};
  }
}

// Export singleton instance
export const weatherService = new WeatherService();

// Export class for testing
export {WeatherService};
