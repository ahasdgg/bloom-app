/**
 * Activity type definitions
 * Represents outdoor activities that can be recommended to users
 */

export type ActivityCategory =
  | 'hiking'
  | 'cycling'
  | 'water_sports'
  | 'winter_sports'
  | 'climbing'
  | 'camping'
  | 'wildlife'
  | 'photography'
  | 'relaxation'
  | 'adventure'
  | 'fitness'
  | 'social'
  | 'cultural'
  | 'other';

export type DifficultyLevel = 'easy' | 'moderate' | 'challenging' | 'expert';

export type CostLevel = 'free' | 'low' | 'moderate' | 'high';

export interface Location {
  latitude: number;
  longitude: number;
  address?: string;
  city?: string;
  region?: string;
  country?: string;
}

export interface Activity {
  id: string;
  name: string;
  description: string;
  category: ActivityCategory;
  location?: Location;
  duration?: number; // in minutes
  difficulty?: DifficultyLevel;
  indoor: boolean;
  cost?: CostLevel;
  metadata?: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}

export interface ActivityFilter {
  categories?: ActivityCategory[];
  maxDuration?: number;
  difficulty?: DifficultyLevel[];
  indoor?: boolean;
  maxCost?: CostLevel;
  nearLocation?: {
    latitude: number;
    longitude: number;
    radiusKm: number;
  };
}
