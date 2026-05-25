/**
 * User Preference type definitions
 * Represents user preferences for personalized recommendations
 */

export type ActivityCategory =
  | 'hiking'
  | 'cycling'
  | 'water_sports'
  | 'winter_sports'
  | 'climbing'
  | 'camping'
  | 'yoga'
  | 'fitness'
  | 'arts'
  | 'culture'
  | 'food'
  | 'social'
  | 'relaxation'
  | 'adventure'
  | 'nature';

export type DifficultyLevel = 'easy' | 'moderate' | 'hard' | 'expert';

export type CostLevel = 'free' | 'budget' | 'moderate' | 'premium';

export interface UserPreference {
  userId: string;
  favoriteCategories: ActivityCategory[];
  dislikedCategories: ActivityCategory[];
  preferredDifficultyLevels: DifficultyLevel[];
  budgetRange: {
    min: number; // in local currency
    max: number;
  };
  maxTravelDistance: number; // in kilometers
  accessibility: {
    wheelchairAccessible?: boolean;
    petFriendly?: boolean;
    childFriendly?: boolean;
    seniorFriendly?: boolean;
  };
  notificationPreferences: {
    enabled: boolean;
    frequency: 'immediate' | 'daily' | 'weekly' | 'never';
    quietHours?: {
      startTime: string; // HH:mm format
      endTime: string; // HH:mm format
    };
  };
  privacySettings: {
    shareLocation: boolean;
    shareCalendar: boolean;
    shareActivityHistory: boolean;
    allowAnalytics: boolean;
  };
  timestamp: number; // Last updated timestamp
}

export interface PreferenceUpdate {
  favoriteCategories?: ActivityCategory[];
  dislikedCategories?: ActivityCategory[];
  preferredDifficultyLevels?: DifficultyLevel[];
  budgetRange?: {
    min: number;
    max: number;
  };
  maxTravelDistance?: number;
  accessibility?: Partial<UserPreference['accessibility']>;
  notificationPreferences?: Partial<UserPreference['notificationPreferences']>;
  privacySettings?: Partial<UserPreference['privacySettings']>;
}

export interface PreferenceServiceConfig {
  defaultBudgetMin?: number;
  defaultBudgetMax?: number;
  defaultMaxDistance?: number;
  cacheExpirationTime?: number; // milliseconds
}

export interface PreferenceError {
  code: 'INVALID_PREFERENCE' | 'STORAGE_ERROR' | 'UNKNOWN';
  message: string;
}
