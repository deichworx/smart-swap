import { useCallback, useEffect, useState } from 'react';
import { getSwapHistory as getOnChainHistory, OnChainSwap } from '../solana/history';
import { wallet } from '../wallet/wallet';

type UseSwapHistoryResult = {
  readonly history: readonly OnChainSwap[];
  readonly isLoading: boolean;
  readonly refresh: () => Promise<void>;
};

export function useSwapHistory(): UseSwapHistoryResult {
  const [history, setHistory] = useState<readonly OnChainSwap[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadHistory = useCallback(async () => {
    if (!wallet.publicKey) {
      setHistory([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    try {
      const swaps = await getOnChainHistory(wallet.publicKey.toString());
      if (__DEV__) {
        console.log('[History] Loaded on-chain swaps:', swaps.length);
      }
      setHistory(swaps);
    } catch (error) {
      if (__DEV__) {
        console.error('[History] Error loading:', error);
      }
      setHistory([]);
    }
    setIsLoading(false);
  }, []);

  useEffect(() => {
    loadHistory();
  }, [loadHistory]);

  return {
    history,
    isLoading,
    refresh: loadHistory,
  };
}
