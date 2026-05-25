/**
 * Weather Service Usage Examples
 * 
 * This file demonstrates how to use the Weather Service in the application.
 * DO NOT import this file in production code - it's for reference only.
 */

import {weatherService} from './weather';
import {locationService} from './location';

/**
 * Example 1: Get current weather for user's location
 */
async function getCurrentWeatherForUser() {
  try {
    // Get user's current location
    const location = await locationService.getCurrentLocation();
    
    // Fetch weather for that location
    const weather = await weatherService.getCurrentWeather(
      location.latitude,
      location.longitude,
    );
    
    console.log('Current weather:', {
      condition: weather.condition,
      temperature: `${weather.temperature}°C`,
      feelsLike: `${weather.feelsLike}°C`,
      humidity: `${weather.humidity}%`,
      windSpeed: `${weather.windSpeed} km/h`,
    });
    
    return weather;
  } catch (error) {
    console.error('Failed to get weather:', error);
    throw error;
  }
}

/**
 * Example 2: Get weather forecast
 */
async function getWeatherForecastForUser() {
  try {
    const location = await locationService.getCurrentLocation();
    
    const forecast = await weatherService.getWeatherForecast(
      location.latitude,
      location.longitude,
    );
    
    console.log('Hourly forecast (next 48 hours):', forecast.hourly.length, 'items');
    console.log('Daily forecast (next 7 days):', forecast.daily.length, 'items');
    
    // Show next 24 hours
    const next24Hours = forecast.hourly.slice(0, 8); // 8 items * 3 hours = 24 hours
    next24Hours.forEach(item => {
      const date = new Date(item.timestamp);
      console.log(`${date.toLocaleString()}: ${item.temperature}°C, ${item.condition}`);
    });
    
    return forecast;
  } catch (error) {
    console.error('Failed to get forecast:', error);
    throw error;
  }
}

/**
 * Example 3: Use cached weather data
 */
async function useCachedWeather() {
  // Check if we have cached weather
  const cached = weatherService.getCachedWeather();
  
  if (cached) {
    console.log('Using cached weather:', {
      temperature: cached.temperature,
      isStale: cached.isStale,
      age: `${Math.round((Date.now() - cached.cachedAt) / 1000 / 60)} minutes old`,
    });
    return cached;
  }
  
  // No cache, fetch fresh data
  const location = await locationService.getCurrentLocation();
  return await weatherService.getCurrentWeather(
    location.latitude,
    location.longitude,
  );
}

/**
 * Example 4: Force refresh weather data
 */
async function refreshWeather() {
  try {
    const location = await locationService.getCurrentLocation();
    
    // Force refresh even if cache is valid
    const weather = await weatherService.getCurrentWeather(
      location.latitude,
      location.longitude,
      true, // forceRefresh = true
    );
    
    console.log('Fresh weather data:', weather);
    return weather;
  } catch (error) {
    console.error('Failed to refresh weather:', error);
    throw error;
  }
}

/**
 * Example 5: Handle weather errors gracefully
 */
async function getWeatherWithFallback() {
  try {
    const location = await locationService.getCurrentLocation();
    const weather = await weatherService.getCurrentWeather(
      location.latitude,
      location.longitude,
    );
    return weather;
  } catch (error: any) {
    // Handle specific error types
    if (error.code === 'API_KEY_MISSING') {
      console.warn('Weather API key not configured, using cached data');
      return weatherService.getCachedWeather();
    }
    
    if (error.code === 'NETWORK_ERROR') {
      console.warn('Network unavailable, using cached data');
      return weatherService.getCachedWeather();
    }
    
    if (error.code === 'TIMEOUT') {
      console.warn('Request timeout, using cached data');
      return weatherService.getCachedWeather();
    }
    
    // For other errors, rethrow
    throw error;
  }
}

/**
 * Example 6: Configure weather service
 */
function configureWeatherService() {
  // Update configuration at runtime
  weatherService.updateConfig({
    units: 'imperial', // Use Fahrenheit instead of Celsius
    language: 'es', // Spanish language
    cacheExpirationTime: 600000, // 10 minutes cache
    timeout: 5000, // 5 second timeout
  });
}

/**
 * Example 7: Clear weather cache
 */
async function clearWeatherCache() {
  await weatherService.clearCache();
  console.log('Weather cache cleared');
}

/**
 * Example 8: Check weather conditions for activity recommendations
 */
async function isGoodWeatherForOutdoorActivity() {
  try {
    const location = await locationService.getCurrentLocation();
    const weather = await weatherService.getCurrentWeather(
      location.latitude,
      location.longitude,
    );
    
    // Define good weather conditions
    const isGoodWeather =
      weather.temperature >= 15 && // At least 15°C
      weather.temperature <= 30 && // Not too hot
      !['rainy', 'stormy', 'snowy'].includes(weather.condition) &&
      weather.windSpeed < 40; // Not too windy
    
    console.log('Good weather for outdoor activity:', isGoodWeather);
    return isGoodWeather;
  } catch (error) {
    console.error('Failed to check weather:', error);
    return false;
  }
}

// Export examples for reference
export {
  getCurrentWeatherForUser,
  getWeatherForecastForUser,
  useCachedWeather,
  refreshWeather,
  getWeatherWithFallback,
  configureWeatherService,
  clearWeatherCache,
  isGoodWeatherForOutdoorActivity,
};
