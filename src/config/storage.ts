/**
 * Storage configuration for offline-first architecture
 * Configures AsyncStorage and SQLite for data persistence
 */

/**
 * AsyncStorage keys for simple key-value storage
 */
export const STORAGE_KEYS = {
  USER_PREFERENCES: '@breath_of_fresh_air:user_preferences',
  LAST_SYNC: '@breath_of_fresh_air:last_sync',
  CACHED_CONTEXT: '@breath_of_fresh_air:cached_context',
  CACHED_LOCATION: '@breath_of_fresh_air:cached_location',
  CACHED_WEATHER: '@breath_of_fresh_air:cached_weather',
  CACHED_CALENDAR: '@breath_of_fresh_air:cached_calendar',
  OFFLINE_QUEUE: '@breath_of_fresh_air:offline_queue',
  APP_STATE: '@breath_of_fresh_air:app_state',
} as const;

/**
 * SQLite database configuration
 */
export const DATABASE_CONFIG = {
  name: 'breath_of_fresh_air.db',
  version: 1,
  displayName: 'Breath of Fresh Air Database',
  size: 5 * 1024 * 1024, // 5MB
} as const;

/**
 * SQLite table names
 */
export const TABLES = {
  ACTIVITIES: 'activities',
  RECOMMENDATIONS: 'recommendations',
  USER_CONTEXT: 'user_context',
  SYNC_QUEUE: 'sync_queue',
} as const;

/**
 * Database schema initialization SQL
 */
export const SCHEMA_SQL = {
  CREATE_ACTIVITIES: `
    CREATE TABLE IF NOT EXISTS ${TABLES.ACTIVITIES} (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      description TEXT,
      category TEXT NOT NULL,
      location TEXT,
      duration INTEGER,
      difficulty TEXT,
      indoor BOOLEAN,
      cost TEXT,
      metadata TEXT,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL
    );
  `,
  CREATE_RECOMMENDATIONS: `
    CREATE TABLE IF NOT EXISTS ${TABLES.RECOMMENDATIONS} (
      id TEXT PRIMARY KEY,
      activity_id TEXT NOT NULL,
      score REAL NOT NULL,
      reasoning TEXT,
      context_snapshot TEXT,
      created_at INTEGER NOT NULL,
      expires_at INTEGER,
      FOREIGN KEY (activity_id) REFERENCES ${TABLES.ACTIVITIES}(id)
    );
  `,
  CREATE_USER_CONTEXT: `
    CREATE TABLE IF NOT EXISTS ${TABLES.USER_CONTEXT} (
      id TEXT PRIMARY KEY,
      location TEXT,
      weather TEXT,
      time_of_day TEXT,
      day_of_week TEXT,
      user_state TEXT,
      metadata TEXT,
      created_at INTEGER NOT NULL
    );
  `,
  CREATE_SYNC_QUEUE: `
    CREATE TABLE IF NOT EXISTS ${TABLES.SYNC_QUEUE} (
      id TEXT PRIMARY KEY,
      operation TEXT NOT NULL,
      table_name TEXT NOT NULL,
      record_id TEXT NOT NULL,
      data TEXT NOT NULL,
      created_at INTEGER NOT NULL,
      synced BOOLEAN DEFAULT 0
    );
  `,
} as const;

/**
 * Cache expiration times (in milliseconds)
 */
export const CACHE_EXPIRATION = {
  RECOMMENDATIONS: 30 * 60 * 1000, // 30 minutes
  WEATHER: 15 * 60 * 1000, // 15 minutes
  CONTEXT: 5 * 60 * 1000, // 5 minutes
  ACTIVITIES: 24 * 60 * 60 * 1000, // 24 hours
} as const;
