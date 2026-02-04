import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { fetchTokenList, searchTokensLive, searchTokensLocal } from '../jupiter/tokenLists';
import { addCustomToken, addFavoriteToken, getCustomTokens, getFavoriteTokens, removeFavoriteToken } from '../storage';
import { JupiterTokenInfo } from '../storage/types';

type UseTokenListResult = {
  readonly tokens: readonly JupiterTokenInfo[];
  readonly favoriteTokens: readonly JupiterTokenInfo[];
  readonly favoriteMints: readonly string[];
  readonly isLoading: boolean;
  readonly searchResults: readonly JupiterTokenInfo[];
  readonly isSearching: boolean;
  readonly searchLocal: (query: string) => readonly JupiterTokenInfo[];
  readonly searchLive: (query: string) => void;
  readonly clearSearch: () => void;
  readonly addFavorite: (mint: string) => Promise<void>;
  readonly removeFavorite: (mint: string) => Promise<void>;
  readonly isFavorite: (mint: string) => boolean;
  readonly getToken: (mint: string) => JupiterTokenInfo | undefined;
  readonly addTokenToCache: (token: JupiterTokenInfo) => void;
};

export function useTokenList(): UseTokenListResult {
  const [tokens, setTokens] = useState<readonly JupiterTokenInfo[]>([]);
  const [customTokens, setCustomTokens] = useState<readonly JupiterTokenInfo[]>([]);
  const [favoriteMints, setFavoriteMints] = useState<readonly string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchResults, setSearchResults] = useState<readonly JupiterTokenInfo[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    async function load() {
      setIsLoading(true);
      const [tokenList, favorites, custom] = await Promise.all([
        fetchTokenList(),
        getFavoriteTokens(),
        getCustomTokens(),
      ]);
      setTokens(tokenList);
      setFavoriteMints(favorites);
      setCustomTokens(custom);
      setIsLoading(false);
    }
    load();
  }, []);

  const tokensByMint = useMemo(() => {
    const map = new Map<string, JupiterTokenInfo>();
    // Add base tokens first
    for (const token of tokens) {
      map.set(token.address, token);
    }
    // Add custom (persisted) tokens
    for (const token of customTokens) {
      if (!map.has(token.address)) {
        map.set(token.address, token);
      }
    }
    // Also add search results to the map
    for (const token of searchResults) {
      if (!map.has(token.address)) {
        map.set(token.address, token);
      }
    }
    return map;
  }, [tokens, customTokens, searchResults]);

  const favoriteTokens = useMemo(() => {
    return favoriteMints
      .map(mint => tokensByMint.get(mint))
      .filter((t): t is JupiterTokenInfo => t !== undefined);
  }, [favoriteMints, tokensByMint]);

  const searchLocal = useCallback(
    (query: string) => searchTokensLocal(tokens, query),
    [tokens],
  );

  const searchLive = useCallback((query: string) => {
    // Clear previous timeout
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    if (!query.trim() || query.length < 2) {
      setSearchResults([]);
      setIsSearching(false);
      return;
    }

    setIsSearching(true);

    // Debounce API call by 300ms
    searchTimeoutRef.current = setTimeout(async () => {
      try {
        const results = await searchTokensLive(query);
        setSearchResults(results);
      } catch {
        setSearchResults([]);
      } finally {
        setIsSearching(false);
      }
    }, 300);
  }, []);

  const clearSearch = useCallback(() => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }
    setSearchResults([]);
    setIsSearching(false);
  }, []);

  const addFavorite = useCallback(async (mint: string) => {
    await addFavoriteToken(mint);
    setFavoriteMints(prev => (prev.includes(mint) ? prev : [...prev, mint]));
  }, []);

  const removeFavorite = useCallback(async (mint: string) => {
    await removeFavoriteToken(mint);
    setFavoriteMints(prev => prev.filter(m => m !== mint));
  }, []);

  const isFavorite = useCallback(
    (mint: string) => favoriteMints.includes(mint),
    [favoriteMints],
  );

  const getToken = useCallback(
    (mint: string) => tokensByMint.get(mint),
    [tokensByMint],
  );

  const addTokenToCache = useCallback((token: JupiterTokenInfo) => {
    // Add to in-memory custom tokens
    setCustomTokens(prev => {
      if (prev.some(t => t.address === token.address)) {
        return prev;
      }
      return [token, ...prev];
    });
    // Persist to storage (fire and forget)
    addCustomToken(token);
  }, []);

  return {
    tokens,
    favoriteTokens,
    favoriteMints,
    isLoading,
    searchResults,
    isSearching,
    searchLocal,
    searchLive,
    clearSearch,
    addFavorite,
    removeFavorite,
    isFavorite,
    getToken,
    addTokenToCache,
  };
}
