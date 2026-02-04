// Jupiter API Configuration
// Get your free API key at: https://portal.jup.ag/
// Copy this file to config.ts and add your key

export const JUPITER_API_KEY = 'YOUR_JUPITER_API_KEY_HERE';
export const JUPITER_API_BASE = 'https://api.jup.ag';

export function getJupiterHeaders(): Record<string, string> {
  const headers: Record<string, string> = {
    'Accept': 'application/json',
    'Content-Type': 'application/json',
  };
  if (JUPITER_API_KEY !== 'YOUR_JUPITER_API_KEY_HERE') {
    headers['x-api-key'] = JUPITER_API_KEY;
  }
  return headers;
}
