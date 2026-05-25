/**
 * Context Engine
 * Orchestrates collection and analysis of user context data
 */

import {locationService} from './location';
import {weatherService} from './weather';
import {calendarService} from './calendar';
import {preferenceEngine} from './preferences';
import {useAppStore} from '../state/store';
import type {
  LocationContext,
  WeatherContext,
  CalendarContext,
  UserPreference,
} from '../types';

export interface UserContext {
  location: LocationContext | null;
  weather: WeatherContext | null;
  calendar: CalendarContext | null;
  preferences: UserPreference | null;
  timestamp: number;
}

export interface ContextEngineConfig {
  autoRefreshInterval?: number; // milliseconds
  enableAutoRefresh?: boolean;
}

const DEFAULT_CONFIG: Required<ContextEngineConfig> = {
  autoRefreshInterval: 5 * 60 * 1000, // 5 minutes
  enableAutoRefresh: true,
};

class ContextEngine {
  private config: Required<ContextEngineConfig>;
  private refreshInterval: NodeJS.Timeout | null = null;
  private lastRefreshTime: number = 0;

  constructor(config?: ContextEngineConfig) {
    this.config = {...DEFAULT_CONFIG, ...config};
  }

  /**
   * Gather complete user context
   */
  async gatherContext(userId: string, forceRefresh = false): Promise<UserContext> {
    try {
      const store = useAppStore.getState();
      store.setLoading(true);

      // Gather all context data in parallel
      const [location, weather, calendar, preferences] = await Promise.all([
        this.getLocation(forceRefresh),
        this.getWeather(forceRefresh),
        this.getCalendar(forceRefresh),
        this.getPreferences(userId),
      ]);

      const context: UserContext = {
        location,
        weather,
        calendar,
        preferences,
        timestamp: Date.now(),
      };

      // Update store
      if (location) store.setCurrentLocation(location);
      if (weather) store.setCurrentWeather(weather);
      if (calendar) store.setCalendarContext(calendar);
      if (preferences) store.setUserPreferences(preferences);

      store.setLoading(false);
      store.clearError();

      this.lastRefreshTime = Date.now();

      return context;
    } catch (error) {
      const store = useAppStore.getState();
      const errorMessage = error instanceof Error ? error.message : 'Failed to gather context';
      store.setError(errorMessage);
      store.setLoading(false);

      // Return partial context with cached data
      return {
        location: useAppStore.getState().currentLocation,
        weather: useAppStore.getState().currentWeather,
        calendar: useAppStore.getState().calendarContext,
        preferences: useAppStore.getState().userPreferences,
        timestamp: Date.now(),
      };
    }
  }

  /**
   * Get location context
   */
  private async getLocation(forceRefresh = false): Promise<LocationContext | null> {
    try {
      const location = await locationService.getCurrentLocation(forceRefresh);
      return location as LocationContext;
    } catch (error) {
      console.error('Failed to get location:', error);
      // Return cached location if available
      return useAppStore.getState().currentLocation;
    }
  }

  /**
   * Get weather context
   */
  private async getWeather(forceRefresh = false): Promise<WeatherContext | null> {
    try {
      const location = useAppStore.getState().currentLocation;
      if (!location) {
        return null;
      }

      const weather = await weatherService.getCurrentWeather(
        location.latitude,
        location.longitude,
        forceRefresh,
      );
      return weather as WeatherContext;
    } catch (error) {
      console.error('Failed to get weather:', error);
      // Return cached weather if available
      return useAppStore.getState().currentWeather;
    }
  }

  /**
   * Get calendar context
   */
  private async getCalendar(forceRefresh = false): Promise<CalendarContext | null> {
    try {
      const calendar = await calendarService.getCalendarContext(forceRefresh);
      return calendar as CalendarContext;
    } catch (error) {
      console.error('Failed to get calendar:', error);
      // Return cached calendar if available
      return useAppStore.getState().calendarContext;
    }
  }

  /**
   * Get user preferences
   */
  private async getPreferences(userId: string): Promise<UserPreference | null> {
    try {
      const preferences = await preferenceEngine.getUserPreferences(userId);
      return preferences;
    } catch (error) {
      console.error('Failed to get preferences:', error);
      return null;
    }
  }

  /**
   * Start auto-refresh of context data
   */
  startAutoRefresh(userId: string): void {
    if (this.refreshInterval) {
      this.stopAutoRefresh();
    }

    if (!this.config.enableAutoRefresh) {
      return;
    }

    this.refreshInterval = setInterval(() => {
      this.gatherContext(userId, false).catch(error => {
        console.error('Auto-refresh failed:', error);
      });
    }, this.config.autoRefreshInterval);
  }

  /**
   * Stop auto-refresh of context data
   */
  stopAutoRefresh(): void {
    if (this.refreshInterval) {
      clearInterval(this.refreshInterval);
      this.refreshInterval = null;
    }
  }

  /**
   * Get time since last refresh
   */
  getTimeSinceLastRefresh(): number {
    return Date.now() - this.lastRefreshTime;
  }

  /**
   * Check if context needs refresh
   */
  needsRefresh(maxAge: number = 5 * 60 * 1000): boolean {
    return this.getTimeSinceLastRefresh() > maxAge;
  }

  /**
   * Update configuration
   */
  updateConfig(config: Partial<ContextEngineConfig>): void {
    this.config = {...this.config, ...config};
  }

  /**
   * Cleanup resources
   */
  destroy(): void {
    this.stopAutoRefresh();
    locationService.stopWatchingLocation();
  }
}

// Export singleton instance
export const contextEngine = new ContextEngine();

// Export class for testing
export {ContextEngine};
