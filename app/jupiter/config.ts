// Jupiter API Configuration
// Environment variables: Set in .env or app.config.js

// API Key - get yours at: https://portal.jup.ag/
// In production, set EXPO_PUBLIC_JUPITER_API_KEY in your environment
export const JUPITER_API_KEY =
  process.env.EXPO_PUBLIC_JUPITER_API_KEY ?? '';

export const JUPITER_API_BASE = 'https://api.jup.ag';

// Platform Fee Configuration
// Set EXPO_PUBLIC_FEE_ACCOUNT to your wallet address to enable fees
export const FEE_ACCOUNT = process.env.EXPO_PUBLIC_FEE_ACCOUNT ?? null;
export const PLATFORM_FEE_BPS = 25; // 0.25% Fee

export function getJupiterHeaders(): Record<string, string> {
  return {
    'Accept': 'application/json',
    'Content-Type': 'application/json',
    'x-api-key': JUPITER_API_KEY,
  };
}

// Conditional logging helper
export function jupiterLog(...args: unknown[]): void {
  if (__DEV__) {
    console.log('[Jupiter]', ...args);
  }
}
