/**
 * Location Service
 * Handles location tracking, permissions, and caching for offline scenarios
 */

import {Platform, PermissionsAndroid} from 'react-native';
import Geolocation from '@react-native-community/geolocation';
import {AsyncStorageService, STORAGE_KEYS} from './asyncStorage';
import type {
  LocationContext,
  CachedLocation,
  LocationPermissionStatus,
  LocationServiceConfig,
  LocationError,
} from '../types';

const DEFAULT_CONFIG: Required<LocationServiceConfig> = {
  enableHighAccuracy: true,
  timeout: 15000, // 15 seconds
  maximumAge: 10000, // 10 seconds
  distanceFilter: 10, // 10 meters
  cacheExpirationTime: 300000, // 5 minutes
};

class LocationService {
  private config: Required<LocationServiceConfig>;
  private cachedLocation: CachedLocation | null = null;
  private watchId: number | null = null;

  constructor(config?: LocationServiceConfig) {
    this.config = {...DEFAULT_CONFIG, ...config};
    this.loadCachedLocation();
  }

  /**
   * Request location permissions for iOS and Android
   */
  async requestPermissions(): Promise<LocationPermissionStatus> {
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
   * Request iOS location permissions
   */
  private async requestIOSPermissions(): Promise<LocationPermissionStatus> {
    return new Promise(resolve => {
      Geolocation.requestAuthorization(
        () => {
          resolve({
            granted: true,
            canAskAgain: false,
            status: 'granted',
          });
        },
        error => {
          console.error('iOS location permission error:', error);
          resolve({
            granted: false,
            canAskAgain: false,
            status: 'denied',
          });
        },
      );
    });
  }

  /**
   * Request Android location permissions
   */
  private async requestAndroidPermissions(): Promise<LocationPermissionStatus> {
    try {
      const granted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
        {
          title: 'Location Permission',
          message:
            'This app needs access to your location to provide context-aware recommendations.',
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
      console.error('Android location permission error:', error);
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
  async checkPermissions(): Promise<LocationPermissionStatus> {
    if (Platform.OS === 'android') {
      const granted = await PermissionsAndroid.check(
        PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
      );
      return {
        granted,
        canAskAgain: !granted,
        status: granted ? 'granted' : 'undetermined',
      };
    }

    // For iOS, we'll attempt to get location and handle errors
    return {
      granted: true,
      canAskAgain: true,
      status: 'undetermined',
    };
  }

  /**
   * Get current location with caching support
   */
  async getCurrentLocation(
    forceRefresh = false,
  ): Promise<LocationContext | CachedLocation> {
    // Return cached location if available and not stale
    if (!forceRefresh && this.cachedLocation && !this.cachedLocation.isStale) {
      return this.cachedLocation;
    }

    // Check permissions first
    const permissions = await this.checkPermissions();
    if (!permissions.granted) {
      const requestResult = await this.requestPermissions();
      if (!requestResult.granted) {
        // Return cached location if available, even if stale
        if (this.cachedLocation) {
          return this.cachedLocation;
        }
        throw this.createLocationError(
          'PERMISSION_DENIED',
          'Location permission denied',
        );
      }
    }

    // Fetch fresh location
    try {
      const location = await this.fetchCurrentLocation();
      await this.cacheLocation(location);
      return location;
    } catch (error) {
      // Return cached location if available, even if stale
      if (this.cachedLocation) {
        return this.cachedLocation;
      }
      throw error;
    }
  }

  /**
   * Fetch current location from device
   */
  private fetchCurrentLocation(): Promise<LocationContext> {
    return new Promise((resolve, reject) => {
      Geolocation.getCurrentPosition(
        position => {
          const location: LocationContext = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            timestamp: position.timestamp,
            accuracy: position.coords.accuracy,
            altitude: position.coords.altitude ?? undefined,
            altitudeAccuracy: position.coords.altitudeAccuracy ?? undefined,
            heading: position.coords.heading ?? undefined,
            speed: position.coords.speed ?? undefined,
          };
          resolve(location);
        },
        error => {
          console.error('Location fetch error:', error);
          reject(this.mapGeolocationError(error));
        },
        {
          enableHighAccuracy: this.config.enableHighAccuracy,
          timeout: this.config.timeout,
          maximumAge: this.config.maximumAge,
        },
      );
    });
  }

  /**
   * Start watching location changes
   */
  startWatchingLocation(
    onLocationUpdate: (location: LocationContext) => void,
    onError?: (error: LocationError) => void,
  ): void {
    if (this.watchId !== null) {
      this.stopWatchingLocation();
    }

    this.watchId = Geolocation.watchPosition(
      position => {
        const location: LocationContext = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          timestamp: position.timestamp,
          accuracy: position.coords.accuracy,
          altitude: position.coords.altitude ?? undefined,
          altitudeAccuracy: position.coords.altitudeAccuracy ?? undefined,
          heading: position.coords.heading ?? undefined,
          speed: position.coords.speed ?? undefined,
        };
        this.cacheLocation(location);
        onLocationUpdate(location);
      },
      error => {
        console.error('Location watch error:', error);
        if (onError) {
          onError(this.mapGeolocationError(error));
        }
      },
      {
        enableHighAccuracy: this.config.enableHighAccuracy,
        timeout: this.config.timeout,
        maximumAge: this.config.maximumAge,
        distanceFilter: this.config.distanceFilter,
      },
    );
  }

  /**
   * Stop watching location changes
   */
  stopWatchingLocation(): void {
    if (this.watchId !== null) {
      Geolocation.clearWatch(this.watchId);
      this.watchId = null;
    }
  }

  /**
   * Cache location to AsyncStorage and memory
   */
  private async cacheLocation(location: LocationContext): Promise<void> {
    const cachedLocation: CachedLocation = {
      ...location,
      cachedAt: Date.now(),
      isStale: false,
    };

    this.cachedLocation = cachedLocation;

    try {
      await AsyncStorageService.setItem(
        STORAGE_KEYS.CACHED_LOCATION,
        cachedLocation,
      );
    } catch (error) {
      console.error('Failed to cache location:', error);
    }
  }

  /**
   * Load cached location from AsyncStorage
   */
  private async loadCachedLocation(): Promise<void> {
    try {
      const cached = await AsyncStorageService.getItem<CachedLocation>(
        STORAGE_KEYS.CACHED_LOCATION,
      );

      if (cached) {
        const age = Date.now() - cached.cachedAt;
        const isStale = age > this.config.cacheExpirationTime;

        this.cachedLocation = {
          ...cached,
          isStale,
        };
      }
    } catch (error) {
      console.error('Failed to load cached location:', error);
    }
  }

  /**
   * Get cached location if available
   */
  getCachedLocation(): CachedLocation | null {
    return this.cachedLocation;
  }

  /**
   * Clear cached location
   */
  async clearCache(): Promise<void> {
    this.cachedLocation = null;
    try {
      await AsyncStorageService.removeItem(STORAGE_KEYS.CACHED_LOCATION);
    } catch (error) {
      console.error('Failed to clear location cache:', error);
    }
  }

  /**
   * Update service configuration
   */
  updateConfig(config: Partial<LocationServiceConfig>): void {
    this.config = {...this.config, ...config};
  }

  /**
   * Map Geolocation error to LocationError
   */
  private mapGeolocationError(error: {
    code: number;
    message: string;
  }): LocationError {
    switch (error.code) {
      case 1:
        return this.createLocationError('PERMISSION_DENIED', error.message);
      case 2:
        return this.createLocationError('POSITION_UNAVAILABLE', error.message);
      case 3:
        return this.createLocationError('TIMEOUT', error.message);
      default:
        return this.createLocationError('UNKNOWN', error.message);
    }
  }

  /**
   * Create LocationError object
   */
  private createLocationError(
    code: LocationError['code'],
    message: string,
  ): LocationError {
    return {code, message};
  }
}

// Export singleton instance
export const locationService = new LocationService();

// Export class for testing
export {LocationService};
