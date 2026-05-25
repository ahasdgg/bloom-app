/**
 * Environment configuration
 * Loads environment variables for API keys and URLs
 */

export interface EnvConfig {
  llm: {
    apiKey: string;
    apiUrl: string;
  };
  weather: {
    apiKey: string;
    apiUrl: string;
  };
  maps: {
    apiKey: string;
  };
  flags: {
    demoMode: boolean;
    privacyBlurDefault: boolean;
  };
}

// Load from environment variables or use defaults
export const env: EnvConfig = {
  llm: {
    apiKey: process.env.LLM_API_KEY || '',
    apiUrl: process.env.LLM_API_URL || 'https://generativelanguage.googleapis.com/v1beta/models',
  },
  weather: {
    apiKey: process.env.WEATHER_API_KEY || '',
    apiUrl: process.env.WEATHER_API_URL || 'https://api.openweathermap.org/data/2.5',
  },
  maps: {
    apiKey: process.env.MAPS_API_KEY || '',
  },
  flags: {
    demoMode: (process.env.DEMO_MODE || '').toLowerCase() === 'true',
    privacyBlurDefault:
      (process.env.PRIVACY_BLUR_DEFAULT || '').toLowerCase() !== 'false',
  },
};

export function checkRequiredEnv(): { ok: boolean; missing: string[] } {
  const missing: string[] = [];

  // Keys are optional for DEMO_MODE (mock mode). In real mode warn loudly.
  if (!env.flags.demoMode) {
    if (!env.llm.apiKey) missing.push('LLM_API_KEY');
    if (!env.weather.apiKey) missing.push('WEATHER_API_KEY');
    // MAPS_API_KEY can be optional depending on implementation, keep as warning-level.
  }

  return { ok: missing.length === 0, missing };
}
