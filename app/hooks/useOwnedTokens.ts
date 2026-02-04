import { useCallback, useEffect, useMemo, useState } from 'react';
import { getAllTokenBalances } from '../solana/balance';
import { wallet } from '../wallet/wallet';

export type OwnedToken = {
  readonly mint: string;
  readonly amount: string;
  readonly decimals: number;
};

type UseOwnedTokensResult = {
  readonly ownedTokens: readonly OwnedToken[];
  readonly isLoading: boolean;
  readonly refresh: () => Promise<void>;
  readonly getBalance: (mint: string) => string | null;
};

export function useOwnedTokens(): UseOwnedTokensResult {
  const [ownedTokens, setOwnedTokens] = useState<readonly OwnedToken[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const loadBalances = useCallback(async () => {
    if (!wallet.publicKey) {
      setOwnedTokens([]);
      return;
    }

    setIsLoading(true);
    try {
      const balances = await getAllTokenBalances(wallet.publicKey.toString());
      // Sort by amount (descending) - tokens with higher value first
      const sorted = [...balances].sort((a, b) => {
        const aVal = parseFloat(a.amount);
        const bVal = parseFloat(b.amount);
        return bVal - aVal;
      });
      setOwnedTokens(sorted);
    } catch (error) {
      if (__DEV__) {
        console.error('[OwnedTokens] Error loading:', error);
      }
      setOwnedTokens([]);
    }
    setIsLoading(false);
  }, []);

  useEffect(() => {
    loadBalances();
  }, [loadBalances]);

  // O(1) balance lookup map - computed once when ownedTokens changes
  const balanceByMint = useMemo(() => {
    const map = new Map<string, string>();
    for (const token of ownedTokens) {
      map.set(token.mint, token.amount);
    }
    return map;
  }, [ownedTokens]);

  const getBalance = useCallback(
    (mint: string): string | null => {
      return balanceByMint.get(mint) ?? null;
    },
    [balanceByMint],
  );

  return {
    ownedTokens,
    isLoading,
    refresh: loadBalances,
    getBalance,
  };
}
