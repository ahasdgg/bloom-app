/**
 * Location Service Tests
 * Tests for location tracking, permissions, and caching
 */

import {Platform, PermissionsAndroid} from 'react-native';
import {LocationService} from './location';
import {AsyncStorageService} from './asyncStorage';
import {LocationContext, CachedLocation} from '../types';

// Mock dependencies
jest.mock('react-native', () => ({
  Platform: {
    OS: 'ios',
  },
  PermissionsAndroid: {
    PERMISSIONS: {
      ACCESS_FINE_LOCATION: 'android.permission.ACCESS_FINE_LOCATION',
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

jest.mock('@react-native-community/geolocation', () => ({
  requestAuthorization: jest.fn(),
  getCurrentPosition: jest.fn(),
  watchPosition: jest.fn(),
  clearWatch: jest.fn(),
}));

jest.mock('./asyncStorage', () => ({
  AsyncStorageService: {
    setItem: jest.fn(),
    getItem: jest.fn(),
    removeItem: jest.fn(),
  },
  STORAGE_KEYS: {
    CACHED_LOCATION: '@breath_of_fresh_air:cached_location',
  },
}));

import Geolocation from '@react-native-community/geolocation';

describe('LocationService', () => {
  let locationService: LocationService;

  const mockLocation: LocationContext = {
    latitude: 37.7749,
    longitude: -122.4194,
    timestamp: Date.now(),
    accuracy: 10,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    locationService = new LocationService();
    (AsyncStorageService.getItem as jest.Mock).mockResolvedValue(null);
  });

  describe('Permission Handling', () => {
    describe('iOS', () => {
      beforeEach(() => {
        (Platform as any).OS = 'ios';
      });

      it('should request iOS location permissions successfully', async () => {
        (Geolocation.requestAuthorization as jest.Mock).mockImplementation(
          (successCallback: () => void) => {
            successCallback();
          },
        );

        const result = await locationService.requestPermissions();

        expect(result).toEqual({
          granted: true,
          canAskAgain: false,
          status: 'granted',
        });
        expect(Geolocation.requestAuthorization).toHaveBeenCalled();
      });

      it('should handle iOS permission denial', async () => {
        (Geolocation.requestAuthorization as jest.Mock).mockImplementation(
          (_: () => void, errorCallback: (error: any) => void) => {
            errorCallback(new Error('Permission denied'));
          },
        );

        const result = await locationService.requestPermissions();

        expect(result).toEqual({
          granted: false,
          canAskAgain: false,
          status: 'denied',
        });
      });
    });

    describe('Android', () => {
      beforeEach(() => {
        (Platform as any).OS = 'android';
      });

      it('should request Android location permissions successfully', async () => {
        (PermissionsAndroid.request as jest.Mock).mockResolvedValue(
          PermissionsAndroid.RESULTS.GRANTED,
        );

        const result = await locationService.requestPermissions();

        expect(result).toEqual({
          granted: true,
          canAskAgain: false,
          status: 'granted',
        });
        expect(PermissionsAndroid.request).toHaveBeenCalledWith(
          PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
          expect.any(Object),
        );
      });

      it('should handle Android permission denial', async () => {
        (PermissionsAndroid.request as jest.Mock).mockResolvedValue(
          PermissionsAndroid.RESULTS.DENIED,
        );

        const result = await locationService.requestPermissions();

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

        const result = await locationService.requestPermissions();

        expect(result).toEqual({
          granted: false,
          canAskAgain: false,
          status: 'denied',
        });
      });

      it('should check Android permissions', async () => {
        (PermissionsAndroid.check as jest.Mock).mockResolvedValue(true);

        const result = await locationService.checkPermissions();

        expect(result.granted).toBe(true);
        expect(PermissionsAndroid.check).toHaveBeenCalledWith(
          PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
        );
      });
    });
  });

  describe('Location Fetching', () => {
    beforeEach(() => {
      (Platform as any).OS = 'ios';
      (Geolocation.requestAuthorization as jest.Mock).mockImplementation(
        (successCallback: () => void) => {
          successCallback();
        },
      );
    });

    it('should fetch current location successfully', async () => {
      (Geolocation.getCurrentPosition as jest.Mock).mockImplementation(
        (successCallback: (position: any) => void) => {
          successCallback({
            coords: {
              latitude: mockLocation.latitude,
              longitude: mockLocation.longitude,
              accuracy: mockLocation.accuracy,
              altitude: null,
              altitudeAccuracy: null,
              heading: null,
              speed: null,
            },
            timestamp: mockLocation.timestamp,
          });
        },
      );

      const location = await locationService.getCurrentLocation(true);

      expect(location.latitude).toBe(mockLocation.latitude);
      expect(location.longitude).toBe(mockLocation.longitude);
      expect(Geolocation.getCurrentPosition).toHaveBeenCalled();
    });

    it('should handle location fetch timeout', async () => {
      (Geolocation.getCurrentPosition as jest.Mock).mockImplementation(
        (_: any, errorCallback: (error: any) => void) => {
          errorCallback({code: 3, message: 'Timeout'});
        },
      );

      await expect(
        locationService.getCurrentLocation(true),
      ).rejects.toMatchObject({
        code: 'TIMEOUT',
        message: 'Timeout',
      });
    });

    it('should handle position unavailable error', async () => {
      (Geolocation.getCurrentPosition as jest.Mock).mockImplementation(
        (_: any, errorCallback: (error: any) => void) => {
          errorCallback({code: 2, message: 'Position unavailable'});
        },
      );

      await expect(
        locationService.getCurrentLocation(true),
      ).rejects.toMatchObject({
        code: 'POSITION_UNAVAILABLE',
        message: 'Position unavailable',
      });
    });
  });

  describe('Location Caching', () => {
    beforeEach(() => {
      (Platform as any).OS = 'ios';
      (Geolocation.requestAuthorization as jest.Mock).mockImplementation(
        (successCallback: () => void) => {
          successCallback();
        },
      );
    });

    it('should cache location after fetching', async () => {
      (Geolocation.getCurrentPosition as jest.Mock).mockImplementation(
        (successCallback: (position: any) => void) => {
          successCallback({
            coords: {
              latitude: mockLocation.latitude,
              longitude: mockLocation.longitude,
              accuracy: mockLocation.accuracy,
              altitude: null,
              altitudeAccuracy: null,
              heading: null,
              speed: null,
            },
            timestamp: mockLocation.timestamp,
          });
        },
      );

      await locationService.getCurrentLocation(true);

      expect(AsyncStorageService.setItem).toHaveBeenCalledWith(
        '@breath_of_fresh_air:cached_location',
        expect.objectContaining({
          latitude: mockLocation.latitude,
          longitude: mockLocation.longitude,
          cachedAt: expect.any(Number),
          isStale: false,
        }),
      );
    });

    it('should return cached location when not stale', async () => {
      const cachedLocation: CachedLocation = {
        ...mockLocation,
        cachedAt: Date.now(),
        isStale: false,
      };

      (AsyncStorageService.getItem as jest.Mock).mockResolvedValue(
        cachedLocation,
      );

      // Create new instance to trigger cache loading
      const service = new LocationService();
      await new Promise(resolve => setTimeout(resolve, 100)); // Wait for async load

      const location = await service.getCurrentLocation(false);

      expect(location).toMatchObject({
        latitude: mockLocation.latitude,
        longitude: mockLocation.longitude,
      });
      expect(Geolocation.getCurrentPosition).not.toHaveBeenCalled();
    });

    it('should fetch fresh location when cache is stale', async () => {
      const staleLocation: CachedLocation = {
        ...mockLocation,
        cachedAt: Date.now() - 400000, // 6+ minutes ago
        isStale: true,
      };

      (AsyncStorageService.getItem as jest.Mock).mockResolvedValue(
        staleLocation,
      );

      (Geolocation.getCurrentPosition as jest.Mock).mockImplementation(
        (successCallback: (position: any) => void) => {
          successCallback({
            coords: {
              latitude: 40.7128,
              longitude: -74.006,
              accuracy: 15,
              altitude: null,
              altitudeAccuracy: null,
              heading: null,
              speed: null,
            },
            timestamp: Date.now(),
          });
        },
      );

      const service = new LocationService();
      await new Promise(resolve => setTimeout(resolve, 100));

      const location = await service.getCurrentLocation(false);

      expect(location.latitude).toBe(40.7128);
      expect(Geolocation.getCurrentPosition).toHaveBeenCalled();
    });

    it('should return stale cache when fetch fails', async () => {
      const staleLocation: CachedLocation = {
        ...mockLocation,
        cachedAt: Date.now() - 400000,
        isStale: true,
      };

      (AsyncStorageService.getItem as jest.Mock).mockResolvedValue(
        staleLocation,
      );

      (Geolocation.getCurrentPosition as jest.Mock).mockImplementation(
        (_: any, errorCallback: (error: any) => void) => {
          errorCallback({code: 3, message: 'Timeout'});
        },
      );

      const service = new LocationService();
      await new Promise(resolve => setTimeout(resolve, 100));

      const location = await service.getCurrentLocation(false);

      expect(location).toMatchObject({
        latitude: mockLocation.latitude,
        longitude: mockLocation.longitude,
        isStale: true,
      });
    });

    it('should clear cached location', async () => {
      await locationService.clearCache();

      expect(AsyncStorageService.removeItem).toHaveBeenCalledWith(
        '@breath_of_fresh_air:cached_location',
      );
      expect(locationService.getCachedLocation()).toBeNull();
    });
  });

  describe('Location Watching', () => {
    beforeEach(() => {
      (Platform as any).OS = 'ios';
    });

    it('should start watching location changes', () => {
      const mockWatchId = 123;
      (Geolocation.watchPosition as jest.Mock).mockReturnValue(mockWatchId);

      const onUpdate = jest.fn();
      const onError = jest.fn();

      locationService.startWatchingLocation(onUpdate, onError);

      expect(Geolocation.watchPosition).toHaveBeenCalledWith(
        expect.any(Function),
        expect.any(Function),
        expect.objectContaining({
          enableHighAccuracy: true,
          timeout: 15000,
        }),
      );
    });

    it('should call onLocationUpdate when location changes', () => {
      const onUpdate = jest.fn();

      (Geolocation.watchPosition as jest.Mock).mockImplementation(
        (successCallback: (position: any) => void) => {
          successCallback({
            coords: {
              latitude: mockLocation.latitude,
              longitude: mockLocation.longitude,
              accuracy: mockLocation.accuracy,
              altitude: null,
              altitudeAccuracy: null,
              heading: null,
              speed: null,
            },
            timestamp: mockLocation.timestamp,
          });
          return 123;
        },
      );

      locationService.startWatchingLocation(onUpdate);

      expect(onUpdate).toHaveBeenCalledWith(
        expect.objectContaining({
          latitude: mockLocation.latitude,
          longitude: mockLocation.longitude,
        }),
      );
    });

    it('should stop watching location', () => {
      const mockWatchId = 123;
      (Geolocation.watchPosition as jest.Mock).mockReturnValue(mockWatchId);

      locationService.startWatchingLocation(jest.fn());
      locationService.stopWatchingLocation();

      expect(Geolocation.clearWatch).toHaveBeenCalledWith(mockWatchId);
    });

    it('should clear previous watch when starting new watch', () => {
      const mockWatchId1 = 123;
      const mockWatchId2 = 456;

      (Geolocation.watchPosition as jest.Mock)
        .mockReturnValueOnce(mockWatchId1)
        .mockReturnValueOnce(mockWatchId2);

      locationService.startWatchingLocation(jest.fn());
      locationService.startWatchingLocation(jest.fn());

      expect(Geolocation.clearWatch).toHaveBeenCalledWith(mockWatchId1);
    });
  });

  describe('Configuration', () => {
    it('should use default configuration', () => {
      const service = new LocationService();
      expect(service).toBeDefined();
    });

    it('should accept custom configuration', () => {
      const customConfig = {
        enableHighAccuracy: false,
        timeout: 5000,
        cacheExpirationTime: 60000,
      };

      const service = new LocationService(customConfig);
      expect(service).toBeDefined();
    });

    it('should update configuration', () => {
      locationService.updateConfig({
        timeout: 20000,
        enableHighAccuracy: false,
      });

      expect(locationService).toBeDefined();
    });
  });

  describe('Offline Scenarios', () => {
    beforeEach(() => {
      (Platform as any).OS = 'ios';
      (Geolocation.requestAuthorization as jest.Mock).mockImplementation(
        (successCallback: () => void) => {
          successCallback();
        },
      );
    });

    it('should return cached location when offline', async () => {
      const cachedLocation: CachedLocation = {
        ...mockLocation,
        cachedAt: Date.now() - 100000,
        isStale: false,
      };

      (AsyncStorageService.getItem as jest.Mock).mockResolvedValue(
        cachedLocation,
      );

      const service = new LocationService();
      await new Promise(resolve => setTimeout(resolve, 100));

      const location = await service.getCurrentLocation(false);

      expect(location).toMatchObject({
        latitude: mockLocation.latitude,
        longitude: mockLocation.longitude,
      });
    });

    it('should throw error when no cache and permission denied', async () => {
      // Clear any cached location first
      await locationService.clearCache();
      
      (Geolocation.requestAuthorization as jest.Mock).mockImplementation(
        (_: () => void, errorCallback: (error: any) => void) => {
          errorCallback(new Error('Permission denied'));
        },
      );
      
      // Also mock getCurrentPosition to fail with permission denied
      (Geolocation.getCurrentPosition as jest.Mock).mockImplementation(
        (_: any, errorCallback: (error: any) => void) => {
          errorCallback({code: 1, message: 'Permission denied'});
        },
      );

      await expect(
        locationService.getCurrentLocation(true),
      ).rejects.toMatchObject({
        code: 'PERMISSION_DENIED',
      });
    });
  });
});
