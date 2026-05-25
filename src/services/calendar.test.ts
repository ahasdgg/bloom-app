/**
 * Calendar Service Tests
 * Unit tests for calendar integration, availability detection, and permission handling
 */

import {Platform, PermissionsAndroid} from 'react-native';
import RNCalendarEvents from 'react-native-calendar-events';
import {CalendarService} from './calendar';
import {AsyncStorageService, STORAGE_KEYS} from './asyncStorage';
import type {
  CalendarContext,
  CachedCalendar,
  CalendarEvent,
} from '../types/calendar';

// Mock dependencies
jest.mock('react-native-calendar-events');
jest.mock('./asyncStorage');
jest.mock('react-native', () => ({
  Platform: {
    OS: 'ios',
  },
  PermissionsAndroid: {
    PERMISSIONS: {
      READ_CALENDAR: 'android.permission.READ_CALENDAR',
    },
    RESULTS: {
      GRANTED: 'granted',
      DENIED: 'denied',
      NEVER_ASK_AGAIN: 'never_ask_again',
    },
    request: jest.fn(),
    check: jest.fn(),
  },
}));

describe('CalendarService', () => {
  let calendarService: CalendarService;
  const mockNow = new Date('2024-01-15T10:00:00Z');

  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
    jest.setSystemTime(mockNow);

    // Mock AsyncStorage
    (AsyncStorageService.getItem as jest.Mock).mockResolvedValue(null);
    (AsyncStorageService.setItem as jest.Mock).mockResolvedValue(undefined);
    (AsyncStorageService.removeItem as jest.Mock).mockResolvedValue(undefined);

    calendarService = new CalendarService();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe('Permission Handling', () => {
    describe('iOS', () => {
      beforeEach(() => {
        Platform.OS = 'ios';
      });

      it('should request iOS calendar permissions successfully', async () => {
        (RNCalendarEvents.requestPermissions as jest.Mock).mockResolvedValue(
          'authorized',
        );

        const result = await calendarService.requestPermissions();

        expect(result).toEqual({
          granted: true,
          canAskAgain: false,
          status: 'granted',
        });
        expect(RNCalendarEvents.requestPermissions).toHaveBeenCalled();
      });

      it('should handle iOS permission denial', async () => {
        (RNCalendarEvents.requestPermissions as jest.Mock).mockResolvedValue(
          'denied',
        );

        const result = await calendarService.requestPermissions();

        expect(result).toEqual({
          granted: false,
          canAskAgain: false,
          status: 'denied',
        });
      });

      it('should handle iOS restricted status', async () => {
        (RNCalendarEvents.requestPermissions as jest.Mock).mockResolvedValue(
          'restricted',
        );

        const result = await calendarService.requestPermissions();

        expect(result).toEqual({
          granted: false,
          canAskAgain: false,
          status: 'restricted',
        });
      });

      it('should check iOS calendar permissions', async () => {
        (RNCalendarEvents.checkPermissions as jest.Mock).mockResolvedValue(
          'authorized',
        );

        const result = await calendarService.checkPermissions();

        expect(result).toEqual({
          granted: true,
          canAskAgain: false,
          status: 'granted',
        });
      });
    });

    describe('Android', () => {
      beforeEach(() => {
        Platform.OS = 'android';
      });

      it('should request Android calendar permissions successfully', async () => {
        (PermissionsAndroid.request as jest.Mock).mockResolvedValue(
          PermissionsAndroid.RESULTS.GRANTED,
        );

        const result = await calendarService.requestPermissions();

        expect(result).toEqual({
          granted: true,
          canAskAgain: false,
          status: 'granted',
        });
        expect(PermissionsAndroid.request).toHaveBeenCalledWith(
          PermissionsAndroid.PERMISSIONS.READ_CALENDAR,
          expect.any(Object),
        );
      });

      it('should handle Android permission denial', async () => {
        (PermissionsAndroid.request as jest.Mock).mockResolvedValue(
          PermissionsAndroid.RESULTS.DENIED,
        );

        const result = await calendarService.requestPermissions();

        expect(result).toEqual({
          granted: false,
          canAskAgain: true,
          status: 'denied',
        });
      });

      it('should handle Android never ask again', async () => {
        (PermissionsAndroid.request as jest.Mock).mockResolvedValue(
          PermissionsAndroid.RESULTS.NEVER_ASK_AGAIN,
        );

        const result = await calendarService.requestPermissions();

        expect(result).toEqual({
          granted: false,
          canAskAgain: false,
          status: 'denied',
        });
      });
    });
  });

  describe('Calendar Context Fetching', () => {
    const mockEvents: CalendarEvent[] = [
      {
        id: '1',
        title: 'Meeting',
        startDate: '2024-01-15T14:00:00Z',
        endDate: '2024-01-15T15:00:00Z',
        allDay: false,
      },
      {
        id: '2',
        title: 'Lunch',
        startDate: '2024-01-15T12:00:00Z',
        endDate: '2024-01-15T13:00:00Z',
        allDay: false,
      },
      {
        id: '3',
        title: 'All Day Event',
        startDate: '2024-01-16T00:00:00Z',
        endDate: '2024-01-16T23:59:59Z',
        allDay: true,
      },
    ];

    beforeEach(() => {
      Platform.OS = 'ios';
      (RNCalendarEvents.checkPermissions as jest.Mock).mockResolvedValue(
        'authorized',
      );
    });

    it('should fetch calendar context successfully', async () => {
      (RNCalendarEvents.fetchAllEvents as jest.Mock).mockResolvedValue(
        mockEvents,
      );

      const result = await calendarService.getCalendarContext();

      expect(result.hasPermission).toBe(true);
      expect(result.upcomingEvents).toHaveLength(3);
      expect(result.availabilityWindows.length).toBeGreaterThan(0);
      expect(RNCalendarEvents.fetchAllEvents).toHaveBeenCalled();
    });

    it('should calculate availability windows correctly', async () => {
      (RNCalendarEvents.fetchAllEvents as jest.Mock).mockResolvedValue(
        mockEvents,
      );

      const result = await calendarService.getCalendarContext();

      // Should have windows between events (excluding all-day events)
      expect(result.availabilityWindows.length).toBeGreaterThan(0);

      // First window should be from now (10:00) to lunch (12:00) = 120 minutes
      const firstWindow = result.availabilityWindows[0];
      expect(firstWindow.durationMinutes).toBe(120);
    });

    it('should filter out availability windows shorter than minimum', async () => {
      const shortGapEvents: CalendarEvent[] = [
        {
          id: '1',
          title: 'Event 1',
          startDate: '2024-01-15T10:00:00Z',
          endDate: '2024-01-15T10:15:00Z',
          allDay: false,
        },
        {
          id: '2',
          title: 'Event 2',
          startDate: '2024-01-15T10:30:00Z',
          endDate: '2024-01-15T11:00:00Z',
          allDay: false,
        },
      ];

      (RNCalendarEvents.fetchAllEvents as jest.Mock).mockResolvedValue(
        shortGapEvents,
      );

      const result = await calendarService.getCalendarContext();

      // 15-minute gap should be filtered out (default min is 30 minutes)
      const shortWindows = result.availabilityWindows.filter(
        w => w.durationMinutes < 30,
      );
      expect(shortWindows).toHaveLength(0);
    });

    it('should identify next available slot', async () => {
      (RNCalendarEvents.fetchAllEvents as jest.Mock).mockResolvedValue(
        mockEvents,
      );

      const result = await calendarService.getCalendarContext();

      expect(result.nextAvailableSlot).not.toBeNull();
      expect(result.nextAvailableSlot?.startTime).toBeLessThanOrEqual(
        Date.now(),
      );
    });

    it('should exclude all-day events from availability calculation', async () => {
      (RNCalendarEvents.fetchAllEvents as jest.Mock).mockResolvedValue(
        mockEvents,
      );

      const result = await calendarService.getCalendarContext();

      // All-day event should not create gaps in availability
      const allDayEvent = result.upcomingEvents.find(e => e.allDay);
      expect(allDayEvent).toBeDefined();

      // Availability windows should only consider timed events
      result.availabilityWindows.forEach(window => {
        const overlapsAllDay =
          window.startTime >= new Date('2024-01-16T00:00:00Z').getTime() &&
          window.endTime <= new Date('2024-01-16T23:59:59Z').getTime();
        // All-day events shouldn't block availability
        expect(overlapsAllDay).toBe(false);
      });
    });

    it('should handle permission denial gracefully', async () => {
      (RNCalendarEvents.checkPermissions as jest.Mock).mockResolvedValue(
        'denied',
      );
      (RNCalendarEvents.requestPermissions as jest.Mock).mockResolvedValue(
        'denied',
      );

      await expect(
        calendarService.getCalendarContext(),
      ).rejects.toMatchObject({
        code: 'PERMISSION_DENIED',
        message: 'Calendar permission denied',
      });
    });

    it('should handle fetch errors', async () => {
      (RNCalendarEvents.fetchAllEvents as jest.Mock).mockRejectedValue(
        new Error('Network error'),
      );

      await expect(
        calendarService.getCalendarContext(),
      ).rejects.toMatchObject({
        code: 'FETCH_FAILED',
        message: 'Network error',
      });
    });
  });

  describe('Caching', () => {
    const mockContext: CalendarContext = {
      availabilityWindows: [
        {
          startTime: Date.now(),
          endTime: Date.now() + 3600000,
          durationMinutes: 60,
        },
      ],
      nextAvailableSlot: {
        startTime: Date.now(),
        endTime: Date.now() + 3600000,
        durationMinutes: 60,
      },
      upcomingEvents: [],
      timestamp: Date.now(),
      hasPermission: true,
    };

    beforeEach(() => {
      Platform.OS = 'ios';
      (RNCalendarEvents.checkPermissions as jest.Mock).mockResolvedValue(
        'authorized',
      );
      (RNCalendarEvents.fetchAllEvents as jest.Mock).mockResolvedValue([]);
    });

    it('should cache calendar context after fetching', async () => {
      await calendarService.getCalendarContext();

      expect(AsyncStorageService.setItem).toHaveBeenCalledWith(
        STORAGE_KEYS.CACHED_CALENDAR,
        expect.objectContaining({
          cachedAt: expect.any(Number),
          isStale: false,
        }),
      );
    });

    it('should return cached context when not stale', async () => {
      const cachedCalendar: CachedCalendar = {
        ...mockContext,
        cachedAt: Date.now(),
        isStale: false,
      };

      (AsyncStorageService.getItem as jest.Mock).mockResolvedValue(
        cachedCalendar,
      );

      // Create new instance to load cache
      const service = new CalendarService();
      await new Promise(resolve => setTimeout(resolve, 0)); // Wait for async load

      const result = await service.getCalendarContext();

      expect(RNCalendarEvents.fetchAllEvents).not.toHaveBeenCalled();
      expect(result.cachedAt).toBe(cachedCalendar.cachedAt);
    });

    it('should refresh stale cache', async () => {
      const staleCache: CachedCalendar = {
        ...mockContext,
        cachedAt: Date.now() - 600000, // 10 minutes ago (stale)
        isStale: true,
      };

      (AsyncStorageService.getItem as jest.Mock).mockResolvedValue(staleCache);

      const service = new CalendarService();
      await new Promise(resolve => setTimeout(resolve, 0));

      await service.getCalendarContext();

      expect(RNCalendarEvents.fetchAllEvents).toHaveBeenCalled();
    });

    it('should force refresh when requested', async () => {
      const cachedCalendar: CachedCalendar = {
        ...mockContext,
        cachedAt: Date.now(),
        isStale: false,
      };

      (AsyncStorageService.getItem as jest.Mock).mockResolvedValue(
        cachedCalendar,
      );

      const service = new CalendarService();
      await new Promise(resolve => setTimeout(resolve, 0));

      await service.getCalendarContext(true);

      expect(RNCalendarEvents.fetchAllEvents).toHaveBeenCalled();
    });

    it('should return stale cache on fetch error', async () => {
      const staleCache: CachedCalendar = {
        ...mockContext,
        cachedAt: Date.now() - 600000,
        isStale: true,
      };

      (AsyncStorageService.getItem as jest.Mock).mockResolvedValue(staleCache);
      (RNCalendarEvents.fetchAllEvents as jest.Mock).mockRejectedValue(
        new Error('Network error'),
      );

      const service = new CalendarService();
      await new Promise(resolve => setTimeout(resolve, 0));

      const result = await service.getCalendarContext();

      expect(result.isStale).toBe(true);
      expect(result.cachedAt).toBe(staleCache.cachedAt);
    });

    it('should clear cache', async () => {
      await calendarService.clearCache();

      expect(AsyncStorageService.removeItem).toHaveBeenCalledWith(
        STORAGE_KEYS.CACHED_CALENDAR,
      );
      expect(calendarService.getCachedCalendar()).toBeNull();
    });
  });

  describe('Configuration', () => {
    it('should use default configuration', () => {
      const service = new CalendarService();
      expect(service).toBeDefined();
    });

    it('should accept custom configuration', () => {
      const customConfig = {
        lookAheadDays: 14,
        minAvailabilityMinutes: 60,
        cacheExpirationTime: 600000,
      };

      const service = new CalendarService(customConfig);
      expect(service).toBeDefined();
    });

    it('should update configuration', () => {
      calendarService.updateConfig({
        lookAheadDays: 30,
        minAvailabilityMinutes: 45,
      });

      expect(calendarService).toBeDefined();
    });
  });

  describe('Edge Cases', () => {
    beforeEach(() => {
      Platform.OS = 'ios';
      (RNCalendarEvents.checkPermissions as jest.Mock).mockResolvedValue(
        'authorized',
      );
    });

    it('should handle empty calendar', async () => {
      (RNCalendarEvents.fetchAllEvents as jest.Mock).mockResolvedValue([]);

      const result = await calendarService.getCalendarContext();

      expect(result.upcomingEvents).toHaveLength(0);
      expect(result.availabilityWindows.length).toBeGreaterThan(0); // Should have one big window
    });

    it('should handle overlapping events', async () => {
      const overlappingEvents: CalendarEvent[] = [
        {
          id: '1',
          title: 'Event 1',
          startDate: '2024-01-15T14:00:00Z',
          endDate: '2024-01-15T16:00:00Z',
          allDay: false,
        },
        {
          id: '2',
          title: 'Event 2',
          startDate: '2024-01-15T15:00:00Z',
          endDate: '2024-01-15T17:00:00Z',
          allDay: false,
        },
      ];

      (RNCalendarEvents.fetchAllEvents as jest.Mock).mockResolvedValue(
        overlappingEvents,
      );

      const result = await calendarService.getCalendarContext();

      // Should handle overlapping events gracefully
      expect(result.upcomingEvents).toHaveLength(2);
      expect(result.availabilityWindows).toBeDefined();
    });

    it('should handle events with missing optional fields', async () => {
      const minimalEvent: CalendarEvent[] = [
        {
          id: '1',
          title: 'Minimal Event',
          startDate: '2024-01-15T14:00:00Z',
          endDate: '2024-01-15T15:00:00Z',
          allDay: false,
        },
      ];

      (RNCalendarEvents.fetchAllEvents as jest.Mock).mockResolvedValue(
        minimalEvent,
      );

      const result = await calendarService.getCalendarContext();

      expect(result.upcomingEvents[0]).toMatchObject({
        id: '1',
        title: 'Minimal Event',
        allDay: false,
      });
    });
  });
});
