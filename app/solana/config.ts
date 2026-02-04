import { Connection } from '@solana/web3.js';

// =============================================================================
// RPC Configuration
// =============================================================================
//
// Development: Direct to Helius (set EXPO_PUBLIC_RPC_URL)
// Production:  Failover between proxy endpoints (set PRIMARY + FALLBACK)
//
// See docs/helius-proxy-setup.md for proxy setup
// =============================================================================

const PUBLIC_RPC_URL = 'https://api.mainnet-beta.solana.com';

// Development: Direct RPC URL (with API key)
const DEV_RPC_URL = process.env.EXPO_PUBLIC_RPC_URL ?? PUBLIC_RPC_URL;

// Production: Proxy URLs (no API key exposed)
const PROD_PRIMARY_URL = process.env.EXPO_PUBLIC_RPC_URL_PRIMARY;
const PROD_FALLBACK_URL = process.env.EXPO_PUBLIC_RPC_URL_FALLBACK;

// Determine which URL to use
function getPrimaryRpcUrl(): string {
  if (__DEV__) {
    return DEV_RPC_URL;
  }
  // Production: Use proxy if configured, otherwise fall back to direct URL
  return PROD_PRIMARY_URL ?? DEV_RPC_URL;
}

function getFallbackRpcUrl(): string | null {
  if (__DEV__) {
    return null; // No failover in dev
  }
  return PROD_FALLBACK_URL ?? null;
}

export const RPC_URL = getPrimaryRpcUrl();
const FALLBACK_RPC_URL = getFallbackRpcUrl();

// Warn about public RPC in production
const isUsingPublicRpc = RPC_URL === PUBLIC_RPC_URL;
if (!__DEV__ && isUsingPublicRpc) {
  console.warn(
    '[Solana] Using public RPC endpoint - may experience rate limits (429). ' +
    'Set EXPO_PUBLIC_RPC_URL_PRIMARY to a proxy URL for production.',
  );
}

// =============================================================================
// Connection Instances
// =============================================================================

// Primary connection (always available)
export const connection = new Connection(RPC_URL, 'confirmed');

// Fallback connection (production only, may be null)
const fallbackConnection = FALLBACK_RPC_URL
  ? new Connection(FALLBACK_RPC_URL, 'confirmed')
  : null;

// =============================================================================
// Failover Helper
// =============================================================================

/**
 * Execute an operation with automatic failover to backup RPC.
 * In development, no failover (direct to Helius).
 * In production, tries primary proxy, then fallback proxy.
 *
 * @example
 * const balance = await withRpcFailover(conn => conn.getBalance(pubkey));
 */
export async function withRpcFailover<T>(
  operation: (conn: Connection) => Promise<T>,
): Promise<T> {
  try {
    return await operation(connection);
  } catch (error) {
    // In dev or no fallback configured: rethrow
    if (__DEV__ || !fallbackConnection) {
      throw error;
    }

    // Log and try fallback
    console.warn('[Solana] Primary RPC failed, trying fallback:', error);

    try {
      return await operation(fallbackConnection);
    } catch (fallbackError) {
      console.error('[Solana] Fallback RPC also failed:', fallbackError);
      // Throw original error (more relevant)
      throw error;
    }
  }
}

// =============================================================================
// Utilities
// =============================================================================

// Check if using private RPC (for UI indicators)
export const isPrivateRpc = !isUsingPublicRpc;

// Check if failover is available
export const hasFailover = fallbackConnection !== null;

// Conditional logging helper
export function solanaLog(...args: unknown[]): void {
  if (__DEV__) {
    console.log('[Solana]', ...args);
  }
}
