/**
 * Calendar Service
 * Handles calendar integration, availability detection, and caching
 */

import {Platform, PermissionsAndroid} from 'react-native';
import RNCalendarEvents from 'react-native-calendar-events';
import {AsyncStorageService, STORAGE_KEYS} from './asyncStorage';
import {env} from '../config/env';
import type {
  CalendarEvent,
  CalendarContext,
  AvailabilityWindow,
  CalendarPermissionStatus,
  CalendarServiceConfig,
  CalendarError,
  CachedCalendar,
} from '../types';

const DEFAULT_CONFIG: Required<CalendarServiceConfig> = {
  minAvailabilityDuration: 30, // 30 minutes minimum
  lookAheadDays: 7,
  timeout: 10000, // 10 seconds
  cacheExpirationTime: 300000, // 5 minutes
};

class CalendarService {
  private config: Required<CalendarServiceConfig>;
  private cachedCalendar: CachedCalendar | null = null;

  constructor(config?: CalendarServiceConfig) {
    this.config = {...DEFAULT_CONFIG, ...config};
    this.loadCachedCalendar();
  }

  /**
   * Request calendar permissions for iOS and Android
   */
  async requestPermissions(): Promise<CalendarPermissionStatus> {
    if (Platform.OS === 'ios') {
      return this.requestIOSPermissions();
    } else if (Platform.OS === 'android') {
      return this.requestAndroidPermissions();
    }

    return {
      granted: false,
      canAskAgain: false,
      status: 'denied',
    };
  }

  /**
   * Request iOS calendar permissions
   */
  private async requestIOSPermissions(): Promise<CalendarPermissionStatus> {
    try {
      const result = await RNCalendarEvents.requestPermissions();

      if (result === 'authorized') {
        return {
          granted: true,
          canAskAgain: false,
          status: 'granted',
        };
      } else if (result === 'denied') {
        return {
          granted: false,
          canAskAgain: true,
          status: 'denied',
        };
      } else if (result === 'restricted') {
        return {
          granted: false,
          canAskAgain: false,
          status: 'restricted',
        };
      }

      return {
        granted: false,
        canAskAgain: true,
        status: 'undetermined',
      };
    } catch (error) {
      console.error('iOS calendar permission error:', error);
      return {
        granted: false,
        canAskAgain: true,
        status: 'undetermined',
      };
    }
  }

  /**
   * Request Android calendar permissions
   */
  private async requestAndroidPermissions(): Promise<CalendarPermissionStatus> {
    try {
      const granted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.READ_CALENDAR,
        {
          title: 'Calendar Permission',
          message:
            'This app needs access to your calendar to provide context-aware recommendations.',
          buttonNeutral: 'Ask Me Later',
          buttonNegative: 'Cancel',
          buttonPositive: 'OK',
        },
      );

      if (granted === PermissionsAndroid.RESULTS.GRANTED) {
        return {
          granted: true,
          canAskAgain: false,
          status: 'granted',
        };
      } else if (granted === PermissionsAndroid.RESULTS.NEVER_ASK_AGAIN) {
        return {
          granted: false,
          canAskAgain: false,
          status: 'denied',
        };
      } else {
        return {
          granted: false,
          canAskAgain: true,
          status: 'denied',
        };
      }
    } catch (error) {
      console.error('Android calendar permission error:', error);
      return {
        granted: false,
        canAskAgain: true,
        status: 'denied',
      };
    }
  }

  /**
   * Check current permission status
   */
  async checkPermissions(): Promise<CalendarPermissionStatus> {
    if (Platform.OS === 'android') {
      const granted = await PermissionsAndroid.check(
        PermissionsAndroid.PERMISSIONS.READ_CALENDAR,
      );
      return {
        granted,
        canAskAgain: !granted,
        status: granted ? 'granted' : 'undetermined',
      };
    }

    // For iOS, we'll attempt to fetch events and handle errors
    return {
      granted: true,
      canAskAgain: true,
      status: 'undetermined',
    };
  }

  /**
   * Get calendar context with availability windows
   */
  async getCalendarContext(
    forceRefresh = false,
  ): Promise<CalendarContext | CachedCalendar> {
    // Return cached calendar if available and not stale
    if (!forceRefresh && this.cachedCalendar && !this.cachedCalendar.isStale) {
      return this.cachedCalendar;
    }

    // Check permissions first
    const permissions = await this.checkPermissions();
    if (!permissions.granted) {
      const requestResult = await this.requestPermissions();
      if (!requestResult.granted) {
        // Return cached calendar if available, even if stale
        if (this.cachedCalendar) {
          return this.cachedCalendar;
        }
        throw this.createCalendarError(
          'PERMISSION_DENIED',
          'Calendar permission denied',
        );
      }
    }

    // Fetch fresh calendar data
    try {
      const context = await this.fetchCalendarContext();
      await this.cacheCalendar(context);
      return context;
    } catch (error) {
      // Return cached calendar if available, even if stale
      if (this.cachedCalendar) {
        return this.cachedCalendar;
      }
      throw error;
    }
  }

  /**
   * Fetch calendar events and compute availability
   */
  private async fetchCalendarContext(): Promise<CalendarContext> {
    try {
      const now = Date.now();
      const endDate = new Date(now + this.config.lookAheadDays * 24 * 60 * 60 * 1000);

      // Fetch events from device calendar
      const events = await RNCalendarEvents.fetchAllEvents(
        new Date(now),
        endDate,
      );

      // Convert to our CalendarEvent type
      const calendarEvents: CalendarEvent[] = events.map((event, idx) => {
        const base: CalendarEvent = {
          id: event.id,
          title: event.title,
          startDate: new Date(event.startDate).getTime(),
          endDate: new Date(event.endDate).getTime(),
          location: event.location,
          description: event.description,
          isAllDay: event.allDay,
          calendar: event.calendar,
        };

        // DEMO_MODE: anonymize personal calendar content for safe sharing
        if (env.flags.demoMode) {
          const anonTitles = ['Рабочая встреча', 'Личное время', 'Звонок', 'Задача', 'Событие'];
          const t = anonTitles[idx % anonTitles.length];
          return {
            ...base,
            title: t,
            location: undefined,
            description: undefined,
          };
        }

        return base;
      });

      // Sort events by start date
      calendarEvents.sort((a, b) => a.startDate - b.startDate);

      // Compute availability windows
      const availabilityWindows = this.computeAvailabilityWindows(
        calendarEvents,
        now,
        endDate.getTime(),
      );

      // Find next free slot
      const nextFreeSlot = availabilityWindows.find(w => w.isFree);

      // Find when user is busy until
      const busyUntil = calendarEvents.length > 0 ? calendarEvents[0].endDate : undefined;

      return {
        events: calendarEvents,
        availabilityWindows,
        nextFreeSlot,
        busyUntil,
        timestamp: now,
      };
    } catch (error) {
      console.error('Failed to fetch calendar context:', error);
      throw this.mapCalendarError(error);
    }
  }

  /**
   * Compute availability windows from events
   */
  private computeAvailabilityWindows(
    events: CalendarEvent[],
    startTime: number,
    endTime: number,
  ): AvailabilityWindow[] {
    const windows: AvailabilityWindow[] = [];
    let currentTime = startTime;

    // Add buffer for current time (round up to next 15 minutes)
    const bufferMinutes = 15;
    currentTime = Math.ceil(currentTime / (bufferMinutes * 60 * 1000)) * (bufferMinutes * 60 * 1000);

    for (const event of events) {
      // If there's a gap before this event, it's available
      if (currentTime < event.startDate) {
        const duration = Math.floor((event.startDate - currentTime) / (60 * 1000));

        if (duration >= this.config.minAvailabilityDuration) {
          windows.push({
            startTime: currentTime,
            endTime: event.startDate,
            duration,
            isFree: true,
          });
        }
      }

      // Move current time to end of event
      currentTime = Math.max(currentTime, event.endDate);
    }

    // Add final window if there's time left
    if (currentTime < endTime) {
      const duration = Math.floor((endTime - currentTime) / (60 * 1000));

      if (duration >= this.config.minAvailabilityDuration) {
        windows.push({
          startTime: currentTime,
          endTime,
          duration,
          isFree: true,
        });
      }
    }

    return windows;
  }

  /**
   * Add event to calendar
   */
  async addEventToCalendar(
    title: string,
    startDate: Date,
    endDate: Date,
    location?: string,
    description?: string,
  ): Promise<string> {
    try {
      const permissions = await this.checkPermissions();
      if (!permissions.granted) {
        const requestResult = await this.requestPermissions();
        if (!requestResult.granted) {
          throw this.createCalendarError(
            'PERMISSION_DENIED',
            'Calendar write permission denied',
          );
        }
      }

      // Get default calendar
      const calendars = await RNCalendarEvents.findCalendars();
      if (calendars.length === 0) {
        throw this.createCalendarError(
          'CALENDAR_NOT_FOUND',
          'No calendar found on device',
        );
      }

      const calendarId = calendars[0].id;

      // Add event
      const eventId = await RNCalendarEvents.saveEvent(title, {
        startDate,
        endDate,
        location,
        description,
        calendarId,
      });

      // Invalidate cache
      await this.clearCache();

      return eventId;
    } catch (error) {
      console.error('Failed to add event to calendar:', error);
      throw this.mapCalendarError(error);
    }
  }

  /**
   * Cache calendar data to AsyncStorage and memory
   */
  private async cacheCalendar(context: CalendarContext): Promise<void> {
    const cachedCalendar: CachedCalendar = {
      ...context,
      cachedAt: Date.now(),
      isStale: false,
    };

    this.cachedCalendar = cachedCalendar;

    try {
      await AsyncStorageService.setItem(
        STORAGE_KEYS.CACHED_CALENDAR,
        cachedCalendar,
      );
    } catch (error) {
      console.error('Failed to cache calendar:', error);
    }
  }

  /**
   * Load cached calendar from AsyncStorage
   */
  private async loadCachedCalendar(): Promise<void> {
    try {
      const cached = await AsyncStorageService.getItem<CachedCalendar>(
        STORAGE_KEYS.CACHED_CALENDAR,
      );

      if (cached) {
        const age = Date.now() - cached.cachedAt;
        const isStale = age > this.config.cacheExpirationTime;

        this.cachedCalendar = {
          ...cached,
          isStale,
        };
      }
    } catch (error) {
      console.error('Failed to load cached calendar:', error);
    }
  }

  /**
   * Get cached calendar if available
   */
  getCachedCalendar(): CachedCalendar | null {
    return this.cachedCalendar;
  }

  /**
   * Clear cached calendar
   */
  async clearCache(): Promise<void> {
    this.cachedCalendar = null;
    try {
      await AsyncStorageService.removeItem(STORAGE_KEYS.CACHED_CALENDAR);
    } catch (error) {
      console.error('Failed to clear calendar cache:', error);
    }
  }

  /**
   * Update service configuration
   */
  updateConfig(config: Partial<CalendarServiceConfig>): void {
    this.config = {...this.config, ...config};
  }

  /**
   * Map error to CalendarError
   */
  private mapCalendarError(error: unknown): CalendarError {
    if (error instanceof Error) {
      if (error.message.includes('permission')) {
        return this.createCalendarError('PERMISSION_DENIED', error.message);
      }
      if (error.message.includes('timeout')) {
        return this.createCalendarError('TIMEOUT', error.message);
      }
      if (error.message.includes('not found')) {
        return this.createCalendarError('CALENDAR_NOT_FOUND', error.message);
      }
    }

    return this.createCalendarError(
      'UNKNOWN',
      error instanceof Error ? error.message : 'Unknown error',
    );
  }

  /**
   * Create CalendarError object
   */
  private createCalendarError(
    code: CalendarError['code'],
    message: string,
  ): CalendarError {
    return {code, message};
  }
}

// Export singleton instance
export const calendarService = new CalendarService();

// Export class for testing
export {CalendarService};
