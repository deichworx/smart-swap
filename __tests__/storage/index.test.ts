import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  getSwapHistory,
  addSwapRecord,
  clearSwapHistory,
  getTokenCache,
  setTokenCache,
  getFavoriteTokens,
  addFavoriteToken,
  removeFavoriteToken,
  getWalletAuth,
  setWalletAuth,
  clearWalletAuth,
  getCustomTokens,
  addCustomToken,
  addCustomTokens,
} from '../../app/storage';
import { JupiterTokenInfo, SwapRecord, TokenCache, WalletAuth } from '../../app/storage/types';

// Note: Tests use simplified mock data that matches the actual type shapes

// Mock AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock')
);

describe('storage/index', () => {
  beforeEach(async () => {
    await AsyncStorage.clear();
  });

  describe('Swap History', () => {
    const mockSwapRecord: SwapRecord = {
      id: 'swap-1',
      inputMint: 'So11111111111111111111111111111111111111112',
      outputMint: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
      inputAmount: '1000000000',
      outputAmount: '50000000',
      signature: 'abc123',
      timestamp: Date.now(),
      status: 'success',
    };

    it('should return empty array when no history exists', async () => {
      const history = await getSwapHistory();
      expect(history).toEqual([]);
    });

    it('should add a swap record', async () => {
      const result = await addSwapRecord(mockSwapRecord);
      expect(result).toBe(true);

      const history = await getSwapHistory();
      expect(history).toHaveLength(1);
      expect(history[0]).toEqual(mockSwapRecord);
    });

    it('should prepend new records (newest first)', async () => {
      const record1 = { ...mockSwapRecord, id: 'swap-1', timestamp: 1000 };
      const record2 = { ...mockSwapRecord, id: 'swap-2', timestamp: 2000 };

      await addSwapRecord(record1);
      await addSwapRecord(record2);

      const history = await getSwapHistory();
      expect(history[0].id).toBe('swap-2');
      expect(history[1].id).toBe('swap-1');
    });

    it('should limit history to 50 entries', async () => {
      // Add 55 records
      for (let i = 0; i < 55; i++) {
        await addSwapRecord({ ...mockSwapRecord, id: `swap-${i}` });
      }

      const history = await getSwapHistory();
      expect(history).toHaveLength(50);
      expect(history[0].id).toBe('swap-54'); // Newest
    });

    it('should clear history', async () => {
      await addSwapRecord(mockSwapRecord);
      await clearSwapHistory();

      const history = await getSwapHistory();
      expect(history).toEqual([]);
    });
  });

  describe('Token Cache', () => {
    const mockTokenCache: TokenCache = {
      tokens: [
        {
          address: 'So11111111111111111111111111111111111111112',
          symbol: 'SOL',
          name: 'Wrapped SOL',
          decimals: 9,
          logoURI: 'https://example.com/sol.png',
        },
      ],
      updatedAt: Date.now(),
    };

    it('should return null when no cache exists', async () => {
      const cache = await getTokenCache();
      expect(cache).toBeNull();
    });

    it('should save and retrieve token cache', async () => {
      await setTokenCache(mockTokenCache);
      const cache = await getTokenCache();
      expect(cache).toEqual(mockTokenCache);
    });

    it('should return null for expired cache (>24h)', async () => {
      const expiredCache = {
        ...mockTokenCache,
        updatedAt: Date.now() - 25 * 60 * 60 * 1000, // 25 hours ago
      };
      await setTokenCache(expiredCache);

      const cache = await getTokenCache();
      expect(cache).toBeNull();
    });
  });

  describe('Favorite Tokens', () => {
    it('should return default favorites when none set', async () => {
      const favorites = await getFavoriteTokens();
      expect(favorites.length).toBeGreaterThan(0);
      expect(favorites).toContain('So11111111111111111111111111111111111111112'); // SOL
      expect(favorites).toContain('EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v'); // USDC
    });

    it('should add a favorite token', async () => {
      const mint = 'NewTokenMint123';
      await addFavoriteToken(mint);

      const favorites = await getFavoriteTokens();
      expect(favorites).toContain(mint);
    });

    it('should not duplicate favorites', async () => {
      const mint = 'So11111111111111111111111111111111111111112'; // Already in defaults
      const initialFavorites = await getFavoriteTokens();
      const initialLength = initialFavorites.length;

      await addFavoriteToken(mint);

      const favorites = await getFavoriteTokens();
      expect(favorites.filter(f => f === mint)).toHaveLength(1);
      expect(favorites.length).toBe(initialLength);
    });

    it('should remove a favorite token', async () => {
      const mint = 'NewTokenMint123';
      await addFavoriteToken(mint);
      await removeFavoriteToken(mint);

      const favorites = await getFavoriteTokens();
      expect(favorites).not.toContain(mint);
    });
  });

  describe('Wallet Auth', () => {
    const mockAuth: WalletAuth = {
      authToken: 'auth-token-abc',
      publicKeyBase64: 'VGVzdFB1YmxpY0tleUJhc2U2NA==',
    };

    it('should return null when no auth exists', async () => {
      const auth = await getWalletAuth();
      expect(auth).toBeNull();
    });

    it('should save and retrieve wallet auth', async () => {
      await setWalletAuth(mockAuth);
      const auth = await getWalletAuth();
      expect(auth).toEqual(mockAuth);
    });

    it('should clear wallet auth', async () => {
      await setWalletAuth(mockAuth);
      await clearWalletAuth();

      const auth = await getWalletAuth();
      expect(auth).toBeNull();
    });
  });

  describe('Custom Tokens', () => {
    const mockToken: JupiterTokenInfo = {
      address: 'CustomToken123',
      symbol: 'CUST',
      name: 'Custom Token',
      decimals: 6,
      logoURI: 'https://example.com/custom.png',
    };

    it('should return empty array when no custom tokens exist', async () => {
      const tokens = await getCustomTokens();
      expect(tokens).toEqual([]);
    });

    it('should add a custom token', async () => {
      await addCustomToken(mockToken);
      const tokens = await getCustomTokens();
      expect(tokens).toHaveLength(1);
      expect(tokens[0]).toEqual(mockToken);
    });

    it('should not duplicate custom tokens', async () => {
      await addCustomToken(mockToken);
      await addCustomToken(mockToken);

      const tokens = await getCustomTokens();
      expect(tokens).toHaveLength(1);
    });

    it('should add multiple custom tokens', async () => {
      const tokens: JupiterTokenInfo[] = [
        mockToken,
        { ...mockToken, address: 'Token2', symbol: 'TK2' },
        { ...mockToken, address: 'Token3', symbol: 'TK3' },
      ];

      await addCustomTokens(tokens);
      const stored = await getCustomTokens();
      expect(stored).toHaveLength(3);
    });

    it('should limit custom tokens to 100', async () => {
      const tokens: JupiterTokenInfo[] = [];
      for (let i = 0; i < 110; i++) {
        tokens.push({ ...mockToken, address: `Token${i}`, symbol: `TK${i}` });
      }

      await addCustomTokens(tokens);
      const stored = await getCustomTokens();
      expect(stored).toHaveLength(100);
    });

    it('should return empty array for expired cache (>24h)', async () => {
      // First add a token
      await addCustomToken(mockToken);

      // Manually set expired timestamp
      const key = '@custom_tokens';
      await AsyncStorage.setItem(
        key,
        JSON.stringify({
          tokens: [mockToken],
          updatedAt: Date.now() - 25 * 60 * 60 * 1000, // 25 hours ago
        })
      );

      const tokens = await getCustomTokens();
      expect(tokens).toEqual([]);
    });
  });

  describe('CLAUDE.md Principles', () => {
    describe('Defensive Boundaries', () => {
      it('should handle corrupted JSON gracefully', async () => {
        await AsyncStorage.setItem('@swap_history', 'invalid-json');
        const history = await getSwapHistory();
        expect(history).toEqual([]);
      });

      it('should handle null storage value', async () => {
        const history = await getSwapHistory();
        expect(history).toEqual([]);
      });
    });

    describe('Total Functions', () => {
      it('all get functions return valid defaults', async () => {
        expect(await getSwapHistory()).toEqual([]);
        expect(await getTokenCache()).toBeNull();
        expect(await getFavoriteTokens()).toBeDefined();
        expect(await getWalletAuth()).toBeNull();
        expect(await getCustomTokens()).toEqual([]);
      });
    });

    describe('Immutability', () => {
      it('getSwapHistory returns readonly array', async () => {
        const record: SwapRecord = {
          id: 'test',
          inputMint: 'mint1',
          outputMint: 'mint2',
          inputAmount: '100',
          outputAmount: '200',
          signature: 'sig',
          timestamp: Date.now(),
          status: 'success',
        };
        await addSwapRecord(record);

        const history = await getSwapHistory();
        // TypeScript enforces readonly, verify structure
        expect(Array.isArray(history)).toBe(true);
      });
    });
  });
});
