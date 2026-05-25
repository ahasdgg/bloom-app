/**
 * Location type definitions
 * Represents location context with caching support
 */

export interface LocationContext {
  latitude: number;
  longitude: number;
  timestamp: number; // Unix timestamp in milliseconds
  accuracy?: number; // in meters
  altitude?: number; // in meters
  altitudeAccuracy?: number; // in meters
  heading?: number; // degrees
  speed?: number; // meters per second
}

export interface CachedLocation extends LocationContext {
  cachedAt: number; // Unix timestamp when cached
  isStale: boolean; // whether the cache is considered stale
}

export interface LocationPermissionStatus {
  granted: boolean;
  canAskAgain: boolean;
  status: 'granted' | 'denied' | 'restricted' | 'undetermined';
}

export interface LocationServiceConfig {
  enableHighAccuracy?: boolean;
  timeout?: number; // milliseconds
  maximumAge?: number; // milliseconds
  distanceFilter?: number; // meters
  cacheExpirationTime?: number; // milliseconds
}

export interface LocationError {
  code: 'PERMISSION_DENIED' | 'POSITION_UNAVAILABLE' | 'TIMEOUT' | 'UNKNOWN';
  message: string;
}
