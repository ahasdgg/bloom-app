/**
 * State Management Store
 * Using Zustand for global state management with offline-first support
 */

import {create} from 'zustand';
import {persist, createJSONStorage} from 'zustand/middleware';
import {AsyncStorageService} from '../services/asyncStorage';
import type {
  UserContext,
  Recommendation,
  UserPreference,
  CalendarContext,
  WeatherContext,
  LocationContext,
} from '../types';

/**
 * App state interface
 */
export interface AppState {
  // User data
  userId: string | null;
  userPreferences: UserPreference | null;

  // Context data
  currentLocation: LocationContext | null;
  currentWeather: WeatherContext | null;
  calendarContext: CalendarContext | null;

  // Recommendations
  currentRecommendation: Recommendation | null;
  recommendationHistory: Recommendation[];

  // UI state
  isLoading: boolean;
  error: string | null;
  lastUpdated: number;

  // Garden progress
  gardenProgress: {
    totalActivities: number;
    plants: string[];
    points: number;
    achievements: string[];
  };

  // Actions
  setUserId: (userId: string) => void;
  setUserPreferences: (preferences: UserPreference) => void;
  setCurrentLocation: (location: LocationContext) => void;
  setCurrentWeather: (weather: WeatherContext) => void;
  setCalendarContext: (context: CalendarContext) => void;
  setCurrentRecommendation: (recommendation: Recommendation) => void;
  addToRecommendationHistory: (recommendation: Recommendation) => void;
  setLoading: (isLoading: boolean) => void;
  setError: (error: string | null) => void;
  updateGardenProgress: (progress: Partial<AppState['gardenProgress']>) => void;
  clearError: () => void;
  reset: () => void;
}

/**
 * Initial state
 */
const initialState = {
  userId: null,
  userPreferences: null,
  currentLocation: null,
  currentWeather: null,
  calendarContext: null,
  currentRecommendation: null,
  recommendationHistory: [],
  isLoading: false,
  error: null,
  lastUpdated: 0,
  gardenProgress: {
    totalActivities: 0,
    plants: [],
    points: 0,
    achievements: [],
  },
};

/**
 * Create Zustand store with persistence
 */
export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      ...initialState,

      setUserId: (userId: string) => {
        set({userId, lastUpdated: Date.now()});
      },

      setUserPreferences: (preferences: UserPreference) => {
        set({userPreferences: preferences, lastUpdated: Date.now()});
      },

      setCurrentLocation: (location: LocationContext) => {
        set({currentLocation: location, lastUpdated: Date.now()});
      },

      setCurrentWeather: (weather: WeatherContext) => {
        set({currentWeather: weather, lastUpdated: Date.now()});
      },

      setCalendarContext: (context: CalendarContext) => {
        set({calendarContext: context, lastUpdated: Date.now()});
      },

      setCurrentRecommendation: (recommendation: Recommendation) => {
        set({currentRecommendation: recommendation, lastUpdated: Date.now()});
      },

      addToRecommendationHistory: (recommendation: Recommendation) => {
        const history = get().recommendationHistory;
        // Keep only last 100 recommendations
        const newHistory = [recommendation, ...history].slice(0, 100);
        set({recommendationHistory: newHistory, lastUpdated: Date.now()});
      },

      setLoading: (isLoading: boolean) => {
        set({isLoading});
      },

      setError: (error: string | null) => {
        set({error, lastUpdated: Date.now()});
      },

      updateGardenProgress: (progress: Partial<AppState['gardenProgress']>) => {
        const current = get().gardenProgress;
        set({
          gardenProgress: {...current, ...progress},
          lastUpdated: Date.now(),
        });
      },

      clearError: () => {
        set({error: null});
      },

      reset: () => {
        set(initialState);
      },
    }),
    {
      name: '@breath_of_fresh_air:app_state',
      storage: createJSONStorage(() => ({
        getItem: async (name: string) => {
          try {
            const item = await AsyncStorageService.getItem(name);
            return item ? JSON.stringify(item) : null;
          } catch (error) {
            console.error('Failed to get item from storage:', error);
            return null;
          }
        },
        setItem: async (name: string, value: string) => {
          try {
            await AsyncStorageService.setItem(name, JSON.parse(value));
          } catch (error) {
            console.error('Failed to set item in storage:', error);
          }
        },
        removeItem: async (name: string) => {
          try {
            await AsyncStorageService.removeItem(name);
          } catch (error) {
            console.error('Failed to remove item from storage:', error);
          }
        },
      })),
      partialize: (state) => ({
        userId: state.userId,
        userPreferences: state.userPreferences,
        recommendationHistory: state.recommendationHistory,
        gardenProgress: state.gardenProgress,
      }),
    },
  ),
);

/**
 * Selectors for efficient state access
 */
export const selectUserId = (state: AppState) => state.userId;
export const selectUserPreferences = (state: AppState) => state.userPreferences;
export const selectCurrentLocation = (state: AppState) => state.currentLocation;
export const selectCurrentWeather = (state: AppState) => state.currentWeather;
export const selectCalendarContext = (state: AppState) => state.calendarContext;
export const selectCurrentRecommendation = (state: AppState) =>
  state.currentRecommendation;
export const selectRecommendationHistory = (state: AppState) =>
  state.recommendationHistory;
export const selectIsLoading = (state: AppState) => state.isLoading;
export const selectError = (state: AppState) => state.error;
export const selectGardenProgress = (state: AppState) => state.gardenProgress;
export const selectLastUpdated = (state: AppState) => state.lastUpdated;

/**
 * Composite selectors
 */
export const selectContextData = (state: AppState) => ({
  location: state.currentLocation,
  weather: state.currentWeather,
  calendar: state.calendarContext,
});

export const selectUIState = (state: AppState) => ({
  isLoading: state.isLoading,
  error: state.error,
  lastUpdated: state.lastUpdated,
});
