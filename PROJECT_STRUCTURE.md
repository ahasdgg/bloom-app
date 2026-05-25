# Breath of Fresh Air - Project Structure

## Overview
This is a React Native + TypeScript mobile application with context-aware LLM-powered outdoor activity recommendations.

## Directory Structure

```
src/
├── components/       # Reusable UI components
├── config/          # Configuration files
│   ├── env.ts       # Environment variables configuration
│   ├── storage.ts   # Storage configuration (AsyncStorage & SQLite)
│   └── index.ts     # Config exports
├── screens/         # Screen components
├── services/        # Business logic and API services
│   ├── asyncStorage.ts  # AsyncStorage wrapper service
│   ├── database.ts      # SQLite database service
│   └── index.ts         # Services exports
├── state/           # State management (Redux/Context/etc)
├── theme/           # Theme configuration (colors, typography, etc)
│   └── colors.ts
├── types/           # TypeScript type definitions
│   ├── activity.ts       # Activity types
│   ├── context.ts        # User context types
│   ├── preferences.ts    # User preference types
│   ├── recommendation.ts # Recommendation types
│   └── index.ts          # Type exports
└── utils/           # Utility functions
```

## Core Data Models

### Activity
Represents outdoor activities that can be recommended to users.
- Categories: hiking, cycling, water sports, winter sports, climbing, camping, etc.
- Properties: name, description, location, duration, difficulty, cost, etc.

### UserContext
Represents the user's current context for generating recommendations.
- Location data (GPS coordinates, address)
- Weather data (condition, temperature, humidity, wind, etc.)
- Time context (time of day, day of week)
- User state (mood, energy level, available time, companion count)

### Recommendation
Represents LLM-generated activity recommendations based on context.
- Activity reference
- Relevance score (0-1)
- LLM reasoning/explanation
- Context snapshot at time of recommendation
- Expiration time

### UserPreference
Stores user preferences for personalized recommendations.
- Favorite/disliked activity categories
- Preferred difficulty levels
- Budget constraints
- Accessibility requirements
- Notification preferences
- Privacy settings

## Configuration

### Environment Variables
Environment variables are configured in `.env` file (see `.env.example` for template):
- `LLM_API_KEY`: API key for LLM service (OpenAI, etc.)
- `MAPS_API_KEY`: API key for maps service
- `WEATHER_API_KEY`: API key for weather service
- `BOOKING_API_KEY`: API key for booking services

### Storage
The app uses a hybrid storage approach for offline-first architecture:

#### AsyncStorage
Used for simple key-value storage:
- User preferences
- Last sync timestamp
- Cached context data
- Offline operation queue
- App state

#### SQLite
Used for structured data storage:
- Activities table
- Recommendations table
- User context history
- Sync queue for offline operations

## TypeScript Configuration
Strict type checking is enabled with the following compiler options:
- `strict: true`
- `noImplicitAny: true`
- `strictNullChecks: true`
- `noUnusedLocals: true`
- `noUnusedParameters: true`
- `noImplicitReturns: true`

Path aliases are configured:
- `@/*` maps to `src/*`

## Offline-First Architecture
The app is designed to work offline with periodic synchronization:
1. All data is stored locally in SQLite
2. API calls are queued when offline
3. Background sync runs when connection is restored
4. Cached recommendations expire after 30 minutes
5. Weather data expires after 15 minutes
6. Context data expires after 5 minutes

## Next Steps
1. Implement screen components
2. Create LLM service for generating recommendations
3. Implement location and weather services
4. Build state management layer
5. Create UI components
6. Implement offline sync logic
