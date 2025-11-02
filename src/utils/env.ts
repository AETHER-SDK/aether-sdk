/**
 * Environment utility functions
 * 
 * Allows optional dotenv loading for SDK usage
 */

let dotenvLoaded = false

/**
 * Load environment variables from .env file (if not already loaded)
 * This is optional and only runs once
 */
export function loadEnvIfNeeded(): void {
  if (dotenvLoaded) {
    return
  }

  try {
    // Only load dotenv if it's available (not bundled in SDK)
    const dotenv = require('dotenv')
    if (dotenv && typeof dotenv.config === 'function') {
      dotenv.config()
      dotenvLoaded = true
    }
  } catch (error) {
    // dotenv is optional - if not available, environment variables
    // should be provided by the user via process.env
  }
}

/**
 * Get environment variable with optional default
 */
export function getEnv(key: string, defaultValue?: string): string | undefined {
  loadEnvIfNeeded()
  return process.env[key] || defaultValue
}

