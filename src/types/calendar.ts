/**
 * Calendar type definitions
 * Represents calendar context with availability detection
 */

export interface CalendarEvent {
  id: string;
  title: string;
  startDate: number; // Unix timestamp in milliseconds
  endDate: number; // Unix timestamp in milliseconds
  location?: string;
  description?: string;
  isAllDay?: boolean;
  calendar?: string;
}

export interface AvailabilityWindow {
  startTime: number; // Unix timestamp in milliseconds
  endTime: number; // Unix timestamp in milliseconds
  duration: number; // in minutes
  isFree: boolean;
}

export interface CalendarContext {
  events: CalendarEvent[];
  availabilityWindows: AvailabilityWindow[];
  nextFreeSlot?: AvailabilityWindow;
  busyUntil?: number; // Unix timestamp
  timestamp: number; // When this context was generated
}

export interface CalendarPermissionStatus {
  granted: boolean;
  canAskAgain: boolean;
  status: 'granted' | 'denied' | 'restricted' | 'undetermined';
}

export interface CalendarServiceConfig {
  minAvailabilityDuration?: number; // minutes
  lookAheadDays?: number;
  timeout?: number; // milliseconds
  cacheExpirationTime?: number; // milliseconds
}

export interface CalendarError {
  code:
    | 'PERMISSION_DENIED'
    | 'CALENDAR_NOT_FOUND'
    | 'NETWORK_ERROR'
    | 'TIMEOUT'
    | 'UNKNOWN';
  message: string;
}

export interface CachedCalendar extends CalendarContext {
  cachedAt: number; // Unix timestamp when cached
  isStale: boolean; // whether the cache is considered stale
}
