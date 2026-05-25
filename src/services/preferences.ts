/**
 * Preference Engine
 * Handles user preference storage, retrieval, and learning
 */

import {AsyncStorageService, STORAGE_KEYS} from './asyncStorage';
import type {
  UserPreference,
  PreferenceUpdate,
  PreferenceServiceConfig,
  PreferenceError,
  ActivityCategory,
  DifficultyLevel,
} from '../types';

const DEFAULT_CONFIG: Required<PreferenceServiceConfig> = {
  defaultBudgetMin: 0,
  defaultBudgetMax: 100,
  defaultMaxDistance: 50, // km
  cacheExpirationTime: 3600000, // 1 hour
};

class PreferenceEngine {
  private config: Required<PreferenceServiceConfig>;
  private preferences: Map<string, UserPreference> = new Map();

  constructor(config?: PreferenceServiceConfig) {
    this.config = {...DEFAULT_CONFIG, ...config};
    this.loadPreferences();
  }

  /**
   * Get user preferences
   */
  async getUserPreferences(userId: string): Promise<UserPreference> {
    // Check memory cache first
    if (this.preferences.has(userId)) {
      return this.preferences.get(userId)!;
    }

    // Try to load from storage
    try {
      const stored = await AsyncStorageService.getItem<UserPreference>(
        this.getStorageKey(userId),
      );

      if (stored) {
        this.preferences.set(userId, stored);
        return stored;
      }
    } catch (error) {
      console.error('Failed to load preferences from storage:', error);
    }

    // Return default preferences
    return this.createDefaultPreferences(userId);
  }

  /**
   * Update user preferences
   */
  async updateUserPreferences(
    userId: string,
    updates: PreferenceUpdate,
  ): Promise<UserPreference> {
    try {
      // Get current preferences
      const current = await this.getUserPreferences(userId);

      // Validate updates
      this.validatePreferenceUpdate(updates);

      // Merge updates
      const updated: UserPreference = {
        ...current,
        ...updates,
        userId, // Ensure userId is not changed
        timestamp: Date.now(),
      };

      // Save to storage
      await AsyncStorageService.setItem(
        this.getStorageKey(userId),
        updated,
      );

      // Update memory cache
      this.preferences.set(userId, updated);

      return updated;
    } catch (error) {
      if (error instanceof Error && 'code' in error) {
        throw error;
      }
      throw this.createPreferenceError(
        'STORAGE_ERROR',
        `Failed to update preferences: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
    }
  }

  /**
   * Add favorite activity category
   */
  async addFavoriteCategory(
    userId: string,
    category: ActivityCategory,
  ): Promise<UserPreference> {
    const prefs = await this.getUserPreferences(userId);

    if (!prefs.favoriteCategories.includes(category)) {
      prefs.favoriteCategories.push(category);
      return this.updateUserPreferences(userId, {
        favoriteCategories: prefs.favoriteCategories,
      });
    }

    return prefs;
  }

  /**
   * Remove favorite activity category
   */
  async removeFavoriteCategory(
    userId: string,
    category: ActivityCategory,
  ): Promise<UserPreference> {
    const prefs = await this.getUserPreferences(userId);

    prefs.favoriteCategories = prefs.favoriteCategories.filter(
      c => c !== category,
    );

    return this.updateUserPreferences(userId, {
      favoriteCategories: prefs.favoriteCategories,
    });
  }

  /**
   * Add disliked activity category
   */
  async addDislikedCategory(
    userId: string,
    category: ActivityCategory,
  ): Promise<UserPreference> {
    const prefs = await this.getUserPreferences(userId);

    if (!prefs.dislikedCategories.includes(category)) {
      prefs.dislikedCategories.push(category);
      return this.updateUserPreferences(userId, {
        dislikedCategories: prefs.dislikedCategories,
      });
    }

    return prefs;
  }

  /**
   * Remove disliked activity category
   */
  async removeDislikedCategory(
    userId: string,
    category: ActivityCategory,
  ): Promise<UserPreference> {
    const prefs = await this.getUserPreferences(userId);

    prefs.dislikedCategories = prefs.dislikedCategories.filter(
      c => c !== category,
    );

    return this.updateUserPreferences(userId, {
      dislikedCategories: prefs.dislikedCategories,
    });
  }

  /**
   * Update budget range
   */
  async updateBudgetRange(
    userId: string,
    min: number,
    max: number,
  ): Promise<UserPreference> {
    if (min < 0 || max < 0 || min > max) {
      throw this.createPreferenceError(
        'INVALID_PREFERENCE',
        'Invalid budget range: min must be >= 0, max must be >= min',
      );
    }

    return this.updateUserPreferences(userId, {
      budgetRange: {min, max},
    });
  }

  /**
   * Update max travel distance
   */
  async updateMaxTravelDistance(
    userId: string,
    distance: number,
  ): Promise<UserPreference> {
    if (distance < 0) {
      throw this.createPreferenceError(
        'INVALID_PREFERENCE',
        'Max travel distance must be >= 0',
      );
    }

    return this.updateUserPreferences(userId, {
      maxTravelDistance: distance,
    });
  }

  /**
   * Update accessibility settings
   */
  async updateAccessibilitySettings(
    userId: string,
    settings: Partial<UserPreference['accessibility']>,
  ): Promise<UserPreference> {
    const prefs = await this.getUserPreferences(userId);

    return this.updateUserPreferences(userId, {
      accessibility: {
        ...prefs.accessibility,
        ...settings,
      },
    });
  }

  /**
   * Update notification preferences
   */
  async updateNotificationPreferences(
    userId: string,
    settings: Partial<UserPreference['notificationPreferences']>,
  ): Promise<UserPreference> {
    const prefs = await this.getUserPreferences(userId);

    return this.updateUserPreferences(userId, {
      notificationPreferences: {
        ...prefs.notificationPreferences,
        ...settings,
      },
    });
  }

  /**
   * Update privacy settings
   */
  async updatePrivacySettings(
    userId: string,
    settings: Partial<UserPreference['privacySettings']>,
  ): Promise<UserPreference> {
    const prefs = await this.getUserPreferences(userId);

    return this.updateUserPreferences(userId, {
      privacySettings: {
        ...prefs.privacySettings,
        ...settings,
      },
    });
  }

  /**
   * Learn from user feedback (add/remove categories based on activity)
   */
  async learnFromFeedback(
    userId: string,
    activityCategory: ActivityCategory,
    liked: boolean,
  ): Promise<UserPreference> {
    const prefs = await this.getUserPreferences(userId);

    if (liked) {
      // Add to favorites if not already there
      if (!prefs.favoriteCategories.includes(activityCategory)) {
        prefs.favoriteCategories.push(activityCategory);
      }
      // Remove from disliked if present
      prefs.dislikedCategories = prefs.dislikedCategories.filter(
        c => c !== activityCategory,
      );
    } else {
      // Add to disliked if not already there
      if (!prefs.dislikedCategories.includes(activityCategory)) {
        prefs.dislikedCategories.push(activityCategory);
      }
      // Remove from favorites if present
      prefs.favoriteCategories = prefs.favoriteCategories.filter(
        c => c !== activityCategory,
      );
    }

    return this.updateUserPreferences(userId, {
      favoriteCategories: prefs.favoriteCategories,
      dislikedCategories: prefs.dislikedCategories,
    });
  }

  /**
   * Clear all preferences for a user
   */
  async clearPreferences(userId: string): Promise<void> {
    try {
      await AsyncStorageService.removeItem(this.getStorageKey(userId));
      this.preferences.delete(userId);
    } catch (error) {
      console.error('Failed to clear preferences:', error);
      throw this.createPreferenceError(
        'STORAGE_ERROR',
        'Failed to clear preferences',
      );
    }
  }

  /**
   * Load all preferences from storage
   */
  private async loadPreferences(): Promise<void> {
    try {
      // This would load all user preferences if we had a way to enumerate them
      // For now, we'll load on-demand
    } catch (error) {
      console.error('Failed to load preferences:', error);
    }
  }

  /**
   * Create default preferences for a user
   */
  private createDefaultPreferences(userId: string): UserPreference {
    return {
      userId,
      favoriteCategories: [],
      dislikedCategories: [],
      preferredDifficultyLevels: ['easy', 'moderate'],
      budgetRange: {
        min: this.config.defaultBudgetMin,
        max: this.config.defaultBudgetMax,
      },
      maxTravelDistance: this.config.defaultMaxDistance,
      accessibility: {
        wheelchairAccessible: false,
        petFriendly: false,
        childFriendly: false,
        seniorFriendly: false,
      },
      notificationPreferences: {
        enabled: true,
        frequency: 'daily',
        quietHours: {
          startTime: '22:00',
          endTime: '08:00',
        },
      },
      privacySettings: {
        shareLocation: true,
        shareCalendar: true,
        shareActivityHistory: false,
        allowAnalytics: true,
      },
      timestamp: Date.now(),
    };
  }

  /**
   * Validate preference update
   */
  private validatePreferenceUpdate(updates: PreferenceUpdate): void {
    if (updates.budgetRange) {
      if (
        updates.budgetRange.min < 0 ||
        updates.budgetRange.max < 0 ||
        updates.budgetRange.min > updates.budgetRange.max
      ) {
        throw this.createPreferenceError(
          'INVALID_PREFERENCE',
          'Invalid budget range',
        );
      }
    }

    if (updates.maxTravelDistance !== undefined) {
      if (updates.maxTravelDistance < 0) {
        throw this.createPreferenceError(
          'INVALID_PREFERENCE',
          'Max travel distance must be >= 0',
        );
      }
    }

    if (updates.preferredDifficultyLevels) {
      const validLevels: DifficultyLevel[] = [
        'easy',
        'moderate',
        'hard',
        'expert',
      ];
      for (const level of updates.preferredDifficultyLevels) {
        if (!validLevels.includes(level)) {
          throw this.createPreferenceError(
            'INVALID_PREFERENCE',
            `Invalid difficulty level: ${level}`,
          );
        }
      }
    }
  }

  /**
   * Get storage key for user preferences
   */
  private getStorageKey(userId: string): string {
    return `@breath_of_fresh_air:preferences:${userId}`;
  }

  /**
   * Create PreferenceError object
   */
  private createPreferenceError(
    code: PreferenceError['code'],
    message: string,
  ): PreferenceError {
    return {code, message};
  }

  /**
   * Update service configuration
   */
  updateConfig(config: Partial<PreferenceServiceConfig>): void {
    this.config = {...this.config, ...config};
  }
}

// Export singleton instance
export const preferenceEngine = new PreferenceEngine();

// Export class for testing
export {PreferenceEngine};
