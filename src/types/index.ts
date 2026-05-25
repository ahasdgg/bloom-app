/**
 * Core type definitions index
 * Central export point for all application types
 */

// Activity types
export type {
  Activity,
  ActivityCategory,
  ActivityFilter,
  CostLevel,
  DifficultyLevel,
  Location,
} from './activity';

// Context types
export type {
  ContextUpdate,
  DayOfWeek,
  TimeOfDay,
  UserContext,
  UserMood,
  WeatherCondition,
  WeatherData,
} from './context';

// Preference types
export type {
  ActivityCategory,
  CostLevel,
  DifficultyLevel,
  PreferenceError,
  PreferenceServiceConfig,
  PreferenceUpdate,
  UserPreference,
} from './preferences';

// Calendar types
export type {
  AvailabilityWindow,
  CachedCalendar,
  CalendarContext,
  CalendarError,
  CalendarEvent,
  CalendarPermissionStatus,
  CalendarServiceConfig,
} from './calendar';

// Recommendation types
export type {
  Activity,
  CachedRecommendation,
  LLMError,
  LLMServiceConfig,
  Recommendation,
  RecommendationFeedback,
  RecommendationRequest,
  RecommendationResponse,
} from './recommendation';

// Location types
export type {
  CachedLocation,
  LocationContext,
  LocationError,
  LocationPermissionStatus,
  LocationServiceConfig,
} from './location';

// Weather types
export type {
  CachedWeather,
  ForecastItem,
  OpenWeatherMapForecastResponse,
  OpenWeatherMapResponse,
  WeatherContext,
  WeatherError,
  WeatherForecast,
  WeatherServiceConfig,
} from './weather';

// Calendar types
export type {
  AvailabilityWindow,
  CachedCalendar,
  CalendarContext,
  CalendarError,
  CalendarEvent,
  CalendarPermissionStatus,
  CalendarServiceConfig,
} from './calendar';

