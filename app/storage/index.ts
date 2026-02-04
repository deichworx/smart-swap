import AsyncStorage from '@react-native-async-storage/async-storage';
import { AppSettings, CustomTokenCache, FavoriteTokens, JupiterTokenInfo, SwapRecord, TokenCache, WalletAuth } from './types';

const KEYS = {
  SWAP_HISTORY: '@swap_history',
  TOKEN_CACHE: '@token_cache',
  FAVORITE_TOKENS: '@favorite_tokens',
  WALLET_AUTH: '@wallet_auth',
  CUSTOM_TOKENS: '@custom_tokens',
  APP_SETTINGS: '@app_settings',
} as const;

type StorageValue<K> = K extends typeof KEYS.SWAP_HISTORY
  ? readonly SwapRecord[]
  : K extends typeof KEYS.TOKEN_CACHE
    ? TokenCache
    : K extends typeof KEYS.FAVORITE_TOKENS
      ? FavoriteTokens
      : K extends typeof KEYS.WALLET_AUTH
        ? WalletAuth
        : K extends typeof KEYS.CUSTOM_TOKENS
          ? CustomTokenCache
          : K extends typeof KEYS.APP_SETTINGS
            ? AppSettings
            : never;

async function getItem<K extends (typeof KEYS)[keyof typeof KEYS]>(
  key: K,
): Promise<StorageValue<K> | null> {
  try {
    const value = await AsyncStorage.getItem(key);
    if (value === null) return null;
    return JSON.parse(value) as StorageValue<K>;
  } catch {
    return null;
  }
}

async function setItem<K extends (typeof KEYS)[keyof typeof KEYS]>(
  key: K,
  value: StorageValue<K>,
): Promise<boolean> {
  try {
    await AsyncStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch {
    return false;
  }
}

const MAX_HISTORY_ENTRIES = 50;

export async function getSwapHistory(): Promise<readonly SwapRecord[]> {
  const history = await getItem(KEYS.SWAP_HISTORY);
  return history ?? [];
}

export async function addSwapRecord(record: SwapRecord): Promise<boolean> {
  const history = await getSwapHistory();
  const updated = [record, ...history].slice(0, MAX_HISTORY_ENTRIES);
  return setItem(KEYS.SWAP_HISTORY, updated);
}

export async function clearSwapHistory(): Promise<boolean> {
  return setItem(KEYS.SWAP_HISTORY, []);
}

const TOKEN_CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours

export async function getTokenCache(): Promise<TokenCache | null> {
  const cache = await getItem(KEYS.TOKEN_CACHE);
  if (!cache) return null;

  const isExpired = Date.now() - cache.updatedAt > TOKEN_CACHE_TTL_MS;
  if (isExpired) return null;

  return cache;
}

export async function setTokenCache(cache: TokenCache): Promise<boolean> {
  return setItem(KEYS.TOKEN_CACHE, cache);
}

const DEFAULT_FAVORITE_MINTS: readonly string[] = [
  'So11111111111111111111111111111111111111112', // SOL
  'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v', // USDC
  'Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB', // USDT
  'DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263', // BONK
  'JUPyiwrYJFskUPiHa7hkeR8VUtAeFoSYbKedZNsDvCN', // JUP
  'EKpQGSJtjMFqKZ9KQanSqYXRcF8fBopzLHYxdM65zcjm', // WIF
  '4k3Dyjzvzp8eMZWUXbBCjEvwSkkk59S5iCNLY3QrkX6R', // RAY
];

export async function getFavoriteTokens(): Promise<readonly string[]> {
  const favorites = await getItem(KEYS.FAVORITE_TOKENS);
  return favorites?.mints ?? DEFAULT_FAVORITE_MINTS;
}

export async function addFavoriteToken(mint: string): Promise<boolean> {
  const mints = await getFavoriteTokens();
  if (mints.includes(mint)) return true;
  return setItem(KEYS.FAVORITE_TOKENS, { mints: [...mints, mint] });
}

export async function removeFavoriteToken(mint: string): Promise<boolean> {
  const mints = await getFavoriteTokens();
  return setItem(KEYS.FAVORITE_TOKENS, { mints: mints.filter(m => m !== mint) });
}

export async function getWalletAuth(): Promise<WalletAuth | null> {
  return getItem(KEYS.WALLET_AUTH);
}

export async function setWalletAuth(auth: WalletAuth): Promise<boolean> {
  return setItem(KEYS.WALLET_AUTH, auth);
}

export async function clearWalletAuth(): Promise<boolean> {
  try {
    await AsyncStorage.removeItem(KEYS.WALLET_AUTH);
    return true;
  } catch {
    return false;
  }
}

// Custom token cache - persists searched/selected tokens for faster loading
const CUSTOM_TOKEN_CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours
const MAX_CUSTOM_TOKENS = 100;

export async function getCustomTokens(): Promise<readonly JupiterTokenInfo[]> {
  const cache = await getItem(KEYS.CUSTOM_TOKENS);
  if (!cache) return [];

  const isExpired = Date.now() - cache.updatedAt > CUSTOM_TOKEN_CACHE_TTL_MS;
  if (isExpired) return [];

  return cache.tokens;
}

export async function addCustomToken(token: JupiterTokenInfo): Promise<boolean> {
  const existing = await getCustomTokens();
  // Don't add if already exists
  if (existing.some(t => t.address === token.address)) return true;

  // Add new token and limit to max size
  const updated = [token, ...existing].slice(0, MAX_CUSTOM_TOKENS);
  return setItem(KEYS.CUSTOM_TOKENS, {
    tokens: updated,
    updatedAt: Date.now(),
  });
}

export async function addCustomTokens(tokens: readonly JupiterTokenInfo[]): Promise<boolean> {
  const existing = await getCustomTokens();
  const existingMints = new Set(existing.map(t => t.address));

  // Filter out duplicates
  const newTokens = tokens.filter(t => !existingMints.has(t.address));
  if (newTokens.length === 0) return true;

  const updated = [...newTokens, ...existing].slice(0, MAX_CUSTOM_TOKENS);
  return setItem(KEYS.CUSTOM_TOKENS, {
    tokens: updated,
    updatedAt: Date.now(),
  });
}

// App Settings
const DEFAULT_SETTINGS: AppSettings = {
  confettiEnabled: true,
  hapticFeedbackEnabled: true,
  autoRefreshQuotes: true,
  preferredSlippage: 50, // 0.5%
};

export async function getAppSettings(): Promise<AppSettings> {
  const settings = await getItem(KEYS.APP_SETTINGS);
  return settings ?? DEFAULT_SETTINGS;
}

export async function updateAppSettings(updates: Partial<AppSettings>): Promise<boolean> {
  const current = await getAppSettings();
  const updated: AppSettings = { ...current, ...updates };
  return setItem(KEYS.APP_SETTINGS, updated);
}

export async function resetAppSettings(): Promise<boolean> {
  return setItem(KEYS.APP_SETTINGS, DEFAULT_SETTINGS);
}

export { DEFAULT_SETTINGS };
