/**
 * Weather Service Tests
 */

import axios from 'axios';
import {WeatherService} from './weather';
import {AsyncStorageService} from './asyncStorage';
import type {
  OpenWeatherMapResponse,
  OpenWeatherMapForecastResponse,
  WeatherContext,
  CachedWeather,
} from '../types';

// Mock axios
jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

// Mock AsyncStorageService
jest.mock('./asyncStorage', () => ({
  AsyncStorageService: {
    setItem: jest.fn(),
    getItem: jest.fn(),
    removeItem: jest.fn(),
  },
  STORAGE_KEYS: {
    CACHED_WEATHER: '@breath_of_fresh_air:cached_weather',
  },
}));

describe('WeatherService', () => {
  let weatherService: WeatherService;
  const mockApiKey = 'test-api-key';
  const mockLatitude = 37.7749;
  const mockLongitude = -122.4194;

  const mockOpenWeatherMapResponse: OpenWeatherMapResponse = {
    coord: {lon: mockLongitude, lat: mockLatitude},
    weather: [{id: 800, main: 'Clear', description: 'clear sky', icon: '01d'}],
    base: 'stations',
    main: {
      temp: 20,
      feels_like: 19,
      temp_min: 18,
      temp_max: 22,
      pressure: 1013,
      humidity: 65,
    },
    visibility: 10000,
    wind: {speed: 5, deg: 180},
    clouds: {all: 10},
    dt: 1609459200,
    sys: {
      country: 'US',
      sunrise: 1609423200,
      sunset: 1609459200,
    },
    timezone: -28800,
    id: 5391959,
    name: 'San Francisco',
    cod: 200,
  };

  const mockForecastResponse: OpenWeatherMapForecastResponse = {
    cod: '200',
    message: 0,
    cnt: 40,
    list: [
      {
        dt: 1609459200,
        main: {
          temp: 20,
          feels_like: 19,
          temp_min: 18,
          temp_max: 22,
          pressure: 1013,
          sea_level: 1013,
          grnd_level: 1010,
          humidity: 65,
          temp_kf: 0,
        },
        weather: [
          {id: 800, main: 'Clear', description: 'clear sky', icon: '01d'},
        ],
        clouds: {all: 10},
        wind: {speed: 5, deg: 180},
        visibility: 10000,
        pop: 0.1,
        sys: {pod: 'd'},
        dt_txt: '2021-01-01 00:00:00',
      },
      {
        dt: 1609470000,
        main: {
          temp: 18,
          feels_like: 17,
          temp_min: 16,
          temp_max: 20,
          pressure: 1013,
          sea_level: 1013,
          grnd_level: 1010,
          humidity: 70,
          temp_kf: 0,
        },
        weather: [
          {id: 801, main: 'Clouds', description: 'few clouds', icon: '02d'},
        ],
        clouds: {all: 20},
        wind: {speed: 6, deg: 190},
        visibility: 10000,
        pop: 0.2,
        sys: {pod: 'd'},
        dt_txt: '2021-01-01 03:00:00',
      },
    ],
    city: {
      id: 5391959,
      name: 'San Francisco',
      coord: {lat: mockLatitude, lon: mockLongitude},
      country: 'US',
      population: 864816,
      timezone: -28800,
      sunrise: 1609423200,
      sunset: 1609459200,
    },
  };

  beforeEach(() => {
    jest.clearAllMocks();
    weatherService = new WeatherService({
      apiKey: mockApiKey,
      apiUrl: 'https://api.openweathermap.org/data/2.5',
      cacheExpirationTime: 900000, // 15 minutes
    });
  });

  describe('getCurrentWeather', () => {
    it('should fetch and return current weather', async () => {
      mockedAxios.get.mockResolvedValueOnce({data: mockOpenWeatherMapResponse});

      const weather = await weatherService.getCurrentWeather(
        mockLatitude,
        mockLongitude,
      );

      expect(mockedAxios.get).toHaveBeenCalledWith(
        'https://api.openweathermap.org/data/2.5/weather',
        expect.objectContaining({
          params: expect.objectContaining({
            lat: mockLatitude,
            lon: mockLongitude,
            appid: mockApiKey,
            units: 'metric',
          }),
        }),
      );

      expect(weather).toMatchObject({
        condition: 'clear',
        temperature: 20,
        feelsLike: 19,
        humidity: 65,
        windSpeed: 18, // 5 m/s * 3.6 = 18 km/h
        pressure: 1013,
        cloudCover: 10,
      });
    });

    it('should return cached weather if not stale', async () => {
      // First call to populate cache
      mockedAxios.get.mockResolvedValueOnce({data: mockOpenWeatherMapResponse});
      await weatherService.getCurrentWeather(mockLatitude, mockLongitude);

      // Second call should use cache
      const cachedWeather = await weatherService.getCurrentWeather(
        mockLatitude,
        mockLongitude,
      );

      expect(mockedAxios.get).toHaveBeenCalledTimes(1);
      expect(cachedWeather).toMatchObject({
        condition: 'clear',
        temperature: 20,
      });
    });

    it('should fetch fresh weather when forceRefresh is true', async () => {
      // First call to populate cache
      mockedAxios.get.mockResolvedValueOnce({data: mockOpenWeatherMapResponse});
      await weatherService.getCurrentWeather(mockLatitude, mockLongitude);

      // Second call with forceRefresh
      mockedAxios.get.mockResolvedValueOnce({data: mockOpenWeatherMapResponse});
      await weatherService.getCurrentWeather(
        mockLatitude,
        mockLongitude,
        true,
      );

      expect(mockedAxios.get).toHaveBeenCalledTimes(2);
    });

    it('should throw error when API key is missing', async () => {
      const serviceWithoutKey = new WeatherService({apiKey: ''});

      await expect(
        serviceWithoutKey.getCurrentWeather(mockLatitude, mockLongitude),
      ).rejects.toMatchObject({
        code: 'API_KEY_MISSING',
        message: 'Weather API key is not configured',
      });
    });

    it('should return cached weather on API error if cache exists', async () => {
      // First call to populate cache
      mockedAxios.get.mockResolvedValueOnce({data: mockOpenWeatherMapResponse});
      await weatherService.getCurrentWeather(mockLatitude, mockLongitude);

      // Second call with API error
      mockedAxios.get.mockRejectedValueOnce(new Error('Network error'));
      const weather = await weatherService.getCurrentWeather(
        mockLatitude,
        mockLongitude,
        true,
      );

      expect(weather).toMatchObject({
        condition: 'clear',
        temperature: 20,
      });
    });

    it('should handle network errors', async () => {
      mockedAxios.get.mockRejectedValueOnce({
        isAxiosError: true,
        response: undefined,
        message: 'Network Error',
      });

      await expect(
        weatherService.getCurrentWeather(mockLatitude, mockLongitude),
      ).rejects.toMatchObject({
        code: 'NETWORK_ERROR',
        message: 'Network error: Unable to reach weather service',
      });
    });

    it('should handle timeout errors', async () => {
      mockedAxios.get.mockRejectedValueOnce({
        isAxiosError: true,
        code: 'ECONNABORTED',
        message: 'timeout of 10000ms exceeded',
      });

      await expect(
        weatherService.getCurrentWeather(mockLatitude, mockLongitude),
      ).rejects.toMatchObject({
        code: 'TIMEOUT',
        message: 'Request timeout',
      });
    });

    it('should handle invalid API key error', async () => {
      mockedAxios.get.mockRejectedValueOnce({
        isAxiosError: true,
        response: {status: 401},
        message: 'Unauthorized',
      });

      await expect(
        weatherService.getCurrentWeather(mockLatitude, mockLongitude),
      ).rejects.toMatchObject({
        code: 'API_KEY_MISSING',
        message: 'Invalid API key',
        statusCode: 401,
      });
    });

    it('should handle location not found error', async () => {
      mockedAxios.get.mockRejectedValueOnce({
        isAxiosError: true,
        response: {status: 404},
        message: 'Not Found',
      });

      await expect(
        weatherService.getCurrentWeather(mockLatitude, mockLongitude),
      ).rejects.toMatchObject({
        code: 'INVALID_LOCATION',
        message: 'Location not found',
        statusCode: 404,
      });
    });

    it('should map different weather conditions correctly', async () => {
      const conditions = [
        {main: 'Rain', expected: 'rainy'},
        {main: 'Snow', expected: 'snowy'},
        {main: 'Clouds', expected: 'cloudy'},
        {main: 'Drizzle', expected: 'drizzle'},
        {main: 'Thunderstorm', expected: 'thunderstorm'},
        {main: 'Mist', expected: 'mist'},
        {main: 'Fog', expected: 'foggy'},
      ];

      for (const {main, expected} of conditions) {
        const response = {
          ...mockOpenWeatherMapResponse,
          weather: [{...mockOpenWeatherMapResponse.weather[0], main}],
        };
        mockedAxios.get.mockResolvedValueOnce({data: response});

        const weather = await weatherService.getCurrentWeather(
          mockLatitude,
          mockLongitude,
          true,
        );

        expect(weather.condition).toBe(expected);
      }
    });

    it('should convert wind speed from m/s to km/h', async () => {
      const response = {
        ...mockOpenWeatherMapResponse,
        wind: {speed: 10, deg: 180}, // 10 m/s
      };
      mockedAxios.get.mockResolvedValueOnce({data: response});

      const weather = await weatherService.getCurrentWeather(
        mockLatitude,
        mockLongitude,
      );

      expect(weather.windSpeed).toBe(36); // 10 * 3.6 = 36 km/h
    });

    it('should handle precipitation from rain data', async () => {
      const response = {
        ...mockOpenWeatherMapResponse,
        rain: {'1h': 5.5},
      };
      mockedAxios.get.mockResolvedValueOnce({data: response});

      const weather = await weatherService.getCurrentWeather(
        mockLatitude,
        mockLongitude,
      );

      expect(weather.precipitation).toBe(5.5);
    });

    it('should handle precipitation from snow data', async () => {
      const response = {
        ...mockOpenWeatherMapResponse,
        snow: {'1h': 3.2},
      };
      mockedAxios.get.mockResolvedValueOnce({data: response});

      const weather = await weatherService.getCurrentWeather(
        mockLatitude,
        mockLongitude,
      );

      expect(weather.precipitation).toBe(3.2);
    });
  });

  describe('getWeatherForecast', () => {
    it('should fetch and return weather forecast', async () => {
      mockedAxios.get.mockResolvedValueOnce({data: mockForecastResponse});

      const forecast = await weatherService.getWeatherForecast(
        mockLatitude,
        mockLongitude,
      );

      expect(mockedAxios.get).toHaveBeenCalledWith(
        'https://api.openweathermap.org/data/2.5/forecast',
        expect.objectContaining({
          params: expect.objectContaining({
            lat: mockLatitude,
            lon: mockLongitude,
            appid: mockApiKey,
          }),
        }),
      );

      expect(forecast).toHaveProperty('hourly');
      expect(forecast).toHaveProperty('daily');
      expect(Array.isArray(forecast.hourly)).toBe(true);
      expect(Array.isArray(forecast.daily)).toBe(true);
    });

    it('should return cached forecast if not stale', async () => {
      // First fetch weather to populate cache
      mockedAxios.get.mockResolvedValueOnce({data: mockOpenWeatherMapResponse});
      await weatherService.getCurrentWeather(mockLatitude, mockLongitude);

      // Then fetch forecast
      mockedAxios.get.mockResolvedValueOnce({data: mockForecastResponse});
      await weatherService.getWeatherForecast(mockLatitude, mockLongitude);

      // Second call should use cache
      const cachedForecast = await weatherService.getWeatherForecast(
        mockLatitude,
        mockLongitude,
      );

      expect(mockedAxios.get).toHaveBeenCalledTimes(2); // Only initial calls
      expect(cachedForecast).toHaveProperty('hourly');
      expect(cachedForecast).toHaveProperty('daily');
    });

    it('should throw error when API key is missing', async () => {
      const serviceWithoutKey = new WeatherService({apiKey: ''});

      await expect(
        serviceWithoutKey.getWeatherForecast(mockLatitude, mockLongitude),
      ).rejects.toMatchObject({
        code: 'API_KEY_MISSING',
      });
    });
  });

  describe('caching', () => {
    it('should cache weather data to AsyncStorage', async () => {
      mockedAxios.get.mockResolvedValueOnce({data: mockOpenWeatherMapResponse});

      await weatherService.getCurrentWeather(mockLatitude, mockLongitude);

      expect(AsyncStorageService.setItem).toHaveBeenCalledWith(
        '@breath_of_fresh_air:cached_weather',
        expect.objectContaining({
          condition: 'clear',
          temperature: 20,
          cachedAt: expect.any(Number),
          isStale: false,
        }),
      );
    });

    it('should load cached weather from AsyncStorage on initialization', async () => {
      const cachedWeather: CachedWeather = {
        condition: 'clear',
        temperature: 20,
        feelsLike: 19,
        humidity: 65,
        windSpeed: 18,
        timestamp: Date.now(),
        cachedAt: Date.now(),
        isStale: false,
      };

      (AsyncStorageService.getItem as jest.Mock).mockResolvedValueOnce(
        cachedWeather,
      );

      const newService = new WeatherService({apiKey: mockApiKey});
      await new Promise(resolve => setTimeout(resolve, 100)); // Wait for async load

      const cached = newService.getCachedWeather();
      expect(cached).toMatchObject({
        condition: 'clear',
        temperature: 20,
      });
    });

    it('should mark cache as stale when expired', async () => {
      const expiredCache: CachedWeather = {
        condition: 'clear',
        temperature: 20,
        feelsLike: 19,
        humidity: 65,
        windSpeed: 18,
        timestamp: Date.now(),
        cachedAt: Date.now() - 1000000, // Old cache
        isStale: false,
      };

      (AsyncStorageService.getItem as jest.Mock).mockResolvedValueOnce(
        expiredCache,
      );

      const newService = new WeatherService({
        apiKey: mockApiKey,
        cacheExpirationTime: 900000,
      });
      await new Promise(resolve => setTimeout(resolve, 100));

      const cached = newService.getCachedWeather();
      expect(cached?.isStale).toBe(true);
    });

    it('should clear cache', async () => {
      mockedAxios.get.mockResolvedValueOnce({data: mockOpenWeatherMapResponse});
      await weatherService.getCurrentWeather(mockLatitude, mockLongitude);

      await weatherService.clearCache();

      expect(AsyncStorageService.removeItem).toHaveBeenCalledWith(
        '@breath_of_fresh_air:cached_weather',
      );
      expect(weatherService.getCachedWeather()).toBeNull();
    });
  });

  describe('configuration', () => {
    it('should use custom configuration', () => {
      const customService = new WeatherService({
        apiKey: 'custom-key',
        apiUrl: 'https://custom.api.com',
        units: 'imperial',
        language: 'es',
        cacheExpirationTime: 600000,
        timeout: 5000,
      });

      expect(customService).toBeDefined();
    });

    it('should update configuration', async () => {
      weatherService.updateConfig({
        units: 'imperial',
        language: 'fr',
      });

      mockedAxios.get.mockResolvedValueOnce({data: mockOpenWeatherMapResponse});
      await weatherService.getCurrentWeather(mockLatitude, mockLongitude, true);

      expect(mockedAxios.get).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          params: expect.objectContaining({
            units: 'imperial',
            lang: 'fr',
          }),
        }),
      );
    });
  });
});
