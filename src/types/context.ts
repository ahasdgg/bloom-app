/**
 * Context type definitions
 * Represents the user's current context for generating recommendations
 */

import type {Location} from './activity';

export type TimeOfDay = 'morning' | 'afternoon' | 'evening' | 'night';

export type DayOfWeek =
  | 'monday'
  | 'tuesday'
  | 'wednesday'
  | 'thursday'
  | 'friday'
  | 'saturday'
  | 'sunday';

export type WeatherCondition =
  | 'clear'
  | 'cloudy'
  | 'rainy'
  | 'snowy'
  | 'stormy'
  | 'foggy'
  | 'windy';

export type UserMood =
  | 'energetic'
  | 'relaxed'
  | 'adventurous'
  | 'social'
  | 'contemplative'
  | 'stressed'
  | 'neutral';

export interface WeatherData {
  condition: WeatherCondition;
  temperature: number; // in Celsius
  feelsLike: number;
  humidity: number; // percentage
  windSpeed: number; // km/h
  precipitation: number; // mm
  uvIndex?: number;
  visibility?: number; // km
}

export interface UserContext {
  id: string;
  location: Location;
  weather: WeatherData;
  timeOfDay: TimeOfDay;
  dayOfWeek: DayOfWeek;
  userState?: {
    mood?: UserMood;
    energy?: number; // 0-100
    availableTime?: number; // minutes
    companionCount?: number;
  };
  metadata?: Record<string, unknown>;
  createdAt: Date;
}

export interface ContextUpdate {
  location?: Location;
  weather?: WeatherData;
  userState?: UserContext['userState'];
  metadata?: Record<string, unknown>;
}
