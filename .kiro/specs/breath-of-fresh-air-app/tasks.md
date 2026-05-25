# Implementation Plan: Breath of Fresh Air App

## Overview

This implementation plan breaks down the development of "The Breath of Fresh Air" mobile app into discrete, actionable tasks. The app is a React Native + TypeScript application that provides context-aware, LLM-powered activity recommendations with a calming, gamified user experience.

The implementation follows an offline-first architecture with three main screens (Seed, Bloom, Path), Digital Garden gamification, and integrations with maps, booking services, and calendars.

## Tasks

- [x] 1. Set up core project structure and configuration
  - Create directory structure for screens, components, services, and state management
  - Set up TypeScript configuration for strict type checking
  - Configure environment variables for API keys (LLM, maps, weather, booking services)
  - Set up offline storage with AsyncStorage and SQLite configuration
  - Create base types and interfaces for core data models (Activity, Recommendation, Context, UserPreference)
  - _Requirements: Core architecture, offline-first approach_

- [ ] 2. Implement Context Engine foundation
  - [x] 2.1 Create Location Service
    - Implement location tracking with react-native-geolocation or expo-location
    - Add permission handling for iOS and Android
    - Implement location caching for offline scenarios
    - Create LocationContext type with latitude, longitude, timestamp
    - _Requirements: Context-aware recommendations, location tracking_
  
  - [x] 2.2 Create Weather Service
    - Integrate weather API (OpenWeatherMap or similar)
    - Implement weather data fetching with error handling
    - Add weather data caching with expiration logic
    - Create WeatherContext type with temperature, conditions, forecast
    - _Requirements: Context-aware recommendations, weather integration_
  
- [x] 2.3 Create Calendar Service
    - Integrate with device calendar (react-native-calendar-events or expo-calendar)
    - Implement availability detection logic
    - Add permission handling for calendar access
    - Create CalendarContext type with availability windows
    - _Requirements: Context-aware recommendations, calendar integration_
  
- [x] 2.4 Create Preference Engine
    - Implement user preference storage and retrieval
    - Create preference data model (activity types, budget, accessibility needs)
    - Add preference learning logic based on user interactions
    - Create UserPreference type with all preference fields
    - _Requirements: Personalized recommendations, user preferences_

- [x] 3. Implement State Management
  - Set up Zustand or Redux store structure
  - Create slices/stores for: app state, context data, recommendations, garden progress
  - Implement actions for updating context, fetching recommendations, tracking activities
  - Add persistence middleware for offline-first behavior
  - Create selectors for accessing state efficiently
  - _Requirements: State management, offline-first architecture_

- [x] 4. Checkpoint - Verify core services
  - Ensure all context services can fetch and cache data
  - Test state management with mock data
  - Verify offline storage is working correctly
  - Ask the user if questions arise.

- [x] 5. Implement LLM Recommendation Engine
  - [x] 5.1 Create LLM API integration
    - Set up API client for Gemini or GPT-4
    - Implement prompt engineering for activity recommendations
    - Add context serialization (location, weather, calendar, preferences)
    - Create error handling and fallback logic
    - _Requirements: LLM-powered recommendations, context-aware suggestions_
  
  - [x] 5.2 Implement recommendation caching and offline support
    - Create recommendation cache with SQLite
    - Implement cache invalidation strategy based on context changes
    - Add offline recommendation fallback using cached data
    - Create Recommendation type with activity details, reasoning, booking links
    - _Requirements: Offline-first architecture, recommendation engine_
  
  - [ ]* 5.3 Write unit tests for recommendation engine
    - Test prompt generation with various context combinations
    - Test cache hit/miss scenarios
    - Test offline fallback behavior
    - _Requirements: Recommendation engine reliability_

- [x] 6. Implement Seed Screen (main interaction)
  - [x] 6.1 Create animated sphere component
    - Implement 3D-like sphere using react-native-reanimated
    - Add breathing animation (scale, opacity pulsing)
    - Implement touch interaction with haptic feedback
    - Add dawn-inspired gradient background with LinearGradient
    - _Requirements: Seed screen, breathing animations, visual design_
  
  - [x] 6.2 Implement recommendation trigger logic
    - Connect sphere press to context gathering
    - Show loading state during recommendation fetch
    - Implement smooth transition to Bloom screen
    - Add error handling with user-friendly messages
    - _Requirements: Seed screen interaction, recommendation flow_
  
  - [ ]* 6.3 Write unit tests for Seed Screen
    - Test animation lifecycle
    - Test touch interaction handling
    - Test navigation to Bloom screen
    - _Requirements: Seed screen functionality_

- [x] 7. Implement Bloom Screen (recommendation display)
  - [x] 7.1 Create recommendation card component
    - Design card layout with activity name, description, reasoning
    - Add dawn-inspired gradient styling
    - Implement smooth entrance animation
    - Display context information (weather, time, location)
    - _Requirements: Bloom screen, recommendation display_
  
  - [x] 7.2 Implement action buttons
    - Add "Book Now" button with booking integration
    - Add "Navigate" button with maps integration
    - Add "Add to Calendar" button with calendar integration
    - Add "Get Another" button to fetch new recommendation
    - Implement haptic feedback for all buttons
    - _Requirements: Bloom screen actions, booking integration, navigation integration_
  
  - [x] 7.3 Integrate booking services
    - Implement TimePad API integration for events
    - Add cinema booking API integration
    - Add fitness studio booking API integration
    - Create unified booking interface with deep linking
    - _Requirements: Booking integration, external service integration_
  
  - [x] 7.4 Integrate navigation services
    - Implement Yandex Maps integration with fallback to Google Maps
    - Add "Open in Maps" functionality with deep linking
    - Handle map app availability detection
    - _Requirements: Navigation integration, maps integration_
  
  - [ ]* 7.5 Write integration tests for Bloom Screen
    - Test recommendation display with various data
    - Test booking button interactions
    - Test navigation button interactions
    - Test calendar integration
    - _Requirements: Bloom screen functionality_

- [x] 8. Checkpoint - Verify core user flow
  - Test complete flow: Seed → Context gathering → LLM recommendation → Bloom display
  - Verify all integrations work (booking, maps, calendar)
  - Test offline scenarios
  - Ask the user if questions arise.

- [x] 9. Implement Path Screen (timeline)
  - [x] 9.1 Create timeline component
    - Design vertical timeline layout with past activities
    - Implement activity card component with date, activity name, location
    - Add smooth scroll animations
    - Display activity completion status
    - _Requirements: Path screen, activity timeline_
  
  - [x] 9.2 Implement activity history storage
    - Create activity history data model
    - Implement SQLite storage for completed activities
    - Add CRUD operations for activity history
    - Create ActivityHistory type with all fields
    - _Requirements: Activity tracking, offline storage_
  
  - [x] 9.3 Add timeline filtering and search
    - Implement date range filtering
    - Add activity type filtering
    - Implement search functionality
    - Add empty state for new users
    - _Requirements: Path screen functionality_
  
  - [ ]* 9.4 Write unit tests for Path Screen
    - Test timeline rendering with various data sets
    - Test filtering logic
    - Test search functionality
    - _Requirements: Path screen functionality_

- [x] 10. Implement Digital Garden gamification
  - [x] 10.1 Create Garden Screen
    - Design garden visualization with SVG or react-native-svg
    - Implement plant growth visualization based on activity completion
    - Add dawn-inspired gradient background
    - Display garden statistics (plants grown, activities completed)
    - _Requirements: Digital Garden gamification, visual design_
  
  - [x] 10.2 Implement gamification logic
    - Create point system for activity completion
    - Implement plant unlocking logic based on points
    - Add achievement system (milestones, streaks)
    - Create GardenProgress type with points, plants, achievements
    - _Requirements: Gamification system, user engagement_
  
  - [x] 10.3 Add garden animations
    - Implement plant growth animations using react-native-reanimated
    - Add celebration animations for achievements
    - Implement smooth transitions between garden states
    - _Requirements: Garden animations, user engagement_
  
  - [ ]* 10.4 Write unit tests for gamification logic
    - Test point calculation
    - Test plant unlocking logic
    - Test achievement triggers
    - _Requirements: Gamification system reliability_

- [x] 11. Implement navigation and app structure
  - [x] 11.1 Set up bottom tab navigation
    - Create tab navigator with Seed, Path, Garden tabs
    - Design custom tab bar with dawn-inspired styling
    - Add tab icons with active/inactive states
    - Implement smooth tab transitions
    - _Requirements: App navigation, user experience_
  
  - [x] 11.2 Add settings screen
    - Create settings screen with user preferences
    - Implement preference editing UI
    - Add notification settings
    - Add privacy settings (location, calendar permissions)
    - _Requirements: User preferences, settings management_
  
  - [ ] 11.3 Implement onboarding flow
    - Create welcome screens explaining app concept
    - Add permission request screens (location, calendar, notifications)
    - Implement initial preference setup
    - Add skip/complete onboarding logic
    - _Requirements: User onboarding, first-time experience_

- [x] 12. Checkpoint - Verify complete app structure
  - Test navigation between all screens
  - Verify gamification system works end-to-end
  - Test settings and preferences
  - Ask the user if questions arise.

- [ ] 13. Implement UI polish and animations
  - [ ] 13.1 Refine breathing animations
    - Fine-tune sphere breathing animation timing
    - Add subtle background animations throughout app
    - Implement smooth screen transitions
    - Add loading state animations
    - _Requirements: Breathing animations, visual polish_
  
  - [ ] 13.2 Implement haptic feedback
    - Add haptic feedback for all button presses
    - Implement success/error haptic patterns
    - Add subtle haptics for animations
    - _Requirements: User experience, tactile feedback_
  
  - [ ] 13.3 Refine typography and spacing
    - Apply rounded typography throughout app
    - Ensure consistent spacing using design tokens
    - Implement responsive layout for different screen sizes
    - _Requirements: Visual design, typography_

- [ ] 14. Implement error handling and edge cases
  - [ ] 14.1 Add comprehensive error handling
    - Implement error boundaries for React components
    - Add user-friendly error messages
    - Implement retry logic for failed API calls
    - Add error logging for debugging
    - _Requirements: Error handling, app reliability_
  
  - [ ] 14.2 Handle edge cases
    - Handle no internet connection scenarios
    - Handle denied permissions gracefully
    - Handle empty states (no recommendations, no history)
    - Handle API rate limiting
    - _Requirements: Edge case handling, app reliability_
  
  - [ ]* 14.3 Write integration tests for error scenarios
    - Test offline behavior
    - Test permission denial handling
    - Test API failure scenarios
    - _Requirements: App reliability_

- [ ] 15. Implement performance optimizations
  - [ ] 15.1 Optimize rendering performance
    - Implement React.memo for expensive components
    - Add useMemo/useCallback where appropriate
    - Optimize list rendering with FlatList
    - Implement image lazy loading
    - _Requirements: Performance, user experience_
  
  - [ ] 15.2 Optimize data fetching and caching
    - Implement request deduplication
    - Add stale-while-revalidate caching strategy
    - Optimize SQLite queries with indexes
    - Implement background data refresh
    - _Requirements: Performance, offline-first architecture_

- [ ] 16. Final checkpoint and testing
  - [ ] 16.1 Perform end-to-end testing
    - Test complete user journey from onboarding to activity completion
    - Test all integrations (LLM, booking, maps, calendar)
    - Test offline scenarios thoroughly
    - Test on both iOS and Android
    - _Requirements: Complete app functionality_
  
  - [ ]* 16.2 Write end-to-end tests
    - Create E2E test suite with Detox or similar
    - Test critical user flows
    - Test cross-platform compatibility
    - _Requirements: App quality assurance_
  
  - [ ] 16.3 Final polish and bug fixes
    - Fix any remaining bugs discovered during testing
    - Ensure all animations are smooth
    - Verify all text is properly localized (if applicable)
    - Ensure all tests pass
    - Ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP delivery
- The implementation uses React Native with TypeScript for type safety
- **WEB VERSION**: A complete React + Vite web version has been created in the `web/` directory with all 5 screens, responsive design, and production build (280KB gzipped)
- Offline-first architecture is critical - all features should work without internet when possible
- Dawn-inspired gradients (soft sage, muted lavender, warm sand) should be used consistently
- Breathing animations should be subtle and calming, not distracting
- All external integrations (LLM, booking, maps) should have fallback behavior
- The Digital Garden gamification should feel rewarding but not overwhelming
- Haptic feedback should enhance the experience without being excessive
- Performance is critical for smooth animations and responsive UI
