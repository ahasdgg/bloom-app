/**
 * Weather type definitions
 * Represents weather context with caching and forecast support
 */

export type WeatherCondition =
  | 'clear'
  | 'cloudy'
  | 'rainy'
  | 'snowy'
  | 'stormy'
  | 'foggy'
  | 'windy'
  | 'drizzle'
  | 'thunderstorm'
  | 'mist'
  | 'smoke'
  | 'haze'
  | 'dust'
  | 'sand'
  | 'ash'
  | 'squall'
  | 'tornado';

export interface WeatherContext {
  condition: WeatherCondition;
  temperature: number; // in Celsius
  feelsLike: number; // in Celsius
  humidity: number; // percentage (0-100)
  windSpeed: number; // km/h
  windDirection?: number; // degrees (0-360)
  precipitation?: number; // mm
  uvIndex?: number; // 0-11+
  visibility?: number; // km
  pressure?: number; // hPa
  cloudCover?: number; // percentage (0-100)
  timestamp: number; // Unix timestamp in milliseconds
  sunrise?: number; // Unix timestamp in milliseconds
  sunset?: number; // Unix timestamp in milliseconds
}

export interface ForecastItem {
  timestamp: number; // Unix timestamp in milliseconds
  condition: WeatherCondition;
  temperature: number; // in Celsius
  feelsLike: number; // in Celsius
  humidity: number; // percentage
  windSpeed: number; // km/h
  precipitation?: number; // mm
  precipitationProbability?: number; // percentage (0-100)
}

export interface WeatherForecast {
  hourly: ForecastItem[]; // Next 48 hours
  daily: ForecastItem[]; // Next 7 days
}

export interface CachedWeather extends WeatherContext {
  cachedAt: number; // Unix timestamp when cached
  isStale: boolean; // whether the cache is considered stale
  forecast?: WeatherForecast;
}

export interface WeatherServiceConfig {
  apiKey: string;
  apiUrl: string;
  units?: 'metric' | 'imperial' | 'standard';
  language?: string;
  cacheExpirationTime?: number; // milliseconds
  timeout?: number; // milliseconds
}

export interface WeatherError {
  code:
    | 'API_KEY_MISSING'
    | 'API_ERROR'
    | 'NETWORK_ERROR'
    | 'INVALID_LOCATION'
    | 'TIMEOUT'
    | 'UNKNOWN';
  message: string;
  statusCode?: number;
}

/**
 * OpenWeatherMap API response types
 */
export interface OpenWeatherMapResponse {
  coord: {
    lon: number;
    lat: number;
  };
  weather: Array<{
    id: number;
    main: string;
    description: string;
    icon: string;
  }>;
  base: string;
  main: {
    temp: number;
    feels_like: number;
    temp_min: number;
    temp_max: number;
    pressure: number;
    humidity: number;
    sea_level?: number;
    grnd_level?: number;
  };
  visibility: number;
  wind: {
    speed: number;
    deg: number;
    gust?: number;
  };
  clouds: {
    all: number;
  };
  rain?: {
    '1h'?: number;
    '3h'?: number;
  };
  snow?: {
    '1h'?: number;
    '3h'?: number;
  };
  dt: number;
  sys: {
    type?: number;
    id?: number;
    country: string;
    sunrise: number;
    sunset: number;
  };
  timezone: number;
  id: number;
  name: string;
  cod: number;
}

export interface OpenWeatherMapForecastResponse {
  cod: string;
  message: number;
  cnt: number;
  list: Array<{
    dt: number;
    main: {
      temp: number;
      feels_like: number;
      temp_min: number;
      temp_max: number;
      pressure: number;
      sea_level: number;
      grnd_level: number;
      humidity: number;
      temp_kf: number;
    };
    weather: Array<{
      id: number;
      main: string;
      description: string;
      icon: string;
    }>;
    clouds: {
      all: number;
    };
    wind: {
      speed: number;
      deg: number;
      gust?: number;
    };
    visibility: number;
    pop: number; // Probability of precipitation
    rain?: {
      '3h': number;
    };
    snow?: {
      '3h': number;
    };
    sys: {
      pod: string;
    };
    dt_txt: string;
  }>;
  city: {
    id: number;
    name: string;
    coord: {
      lat: number;
      lon: number;
    };
    country: string;
    population: number;
    timezone: number;
    sunrise: number;
    sunset: number;
  };
}
