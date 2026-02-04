import { useCallback, useEffect, useState } from 'react';
import {
  FEE_TIERS,
  FeeTier,
  getEffectiveFee,
  getFeeTier,
  getNextTier,
  getSkrToNextTier,
  getTierProgress,
  SEEKER_NFT_BONUS_BPS,
  SEEKER_SGT_MINT_AUTHORITY,
  SKR_MINT,
} from '../jupiter/fees';
import { getTokenBalance } from '../solana/balance';
import { RPC_URL } from '../solana/config';
import { wallet } from '../wallet/wallet';

type UseFeeTierResult = {
  readonly tier: FeeTier;
  readonly effectiveFeeBps: number; // Final fee after all bonuses
  readonly skrBalance: number;
  readonly nextTier: FeeTier | null;
  readonly skrToNextTier: number;
  readonly tierProgress: number; // 0-100%
  readonly hasSeekerNft: boolean;
  readonly isLoading: boolean;
  readonly refresh: () => void;
};

// Check if user owns a Seeker Genesis Token (SGT)
// SGT is a Token-2022 token with specific mint authority that proves Seeker device ownership
// https://docs.solanamobile.com/marketing/engaging-seeker-users
async function checkSeekerGenesisToken(walletAddress: string): Promise<boolean> {
  try {
    // Use Helius DAS API to get Token-2022 accounts
    // This checks for tokens where the mint has the Seeker Genesis mint authority
    const response = await fetch(RPC_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: 'sgt-check',
        method: 'getAssetsByOwner',
        params: {
          ownerAddress: walletAddress,
          page: 1,
          limit: 100,
          displayOptions: {
            showFungible: false,
            showNativeBalance: false,
          },
        },
      }),
    });

    const data = await response.json();

    if (data.result?.items) {
      // Check if any asset has the Seeker Genesis Token mint authority
      return data.result.items.some(
        (item: {
          authorities?: { address: string; scopes: string[] }[];
          grouping?: { group_key: string; group_value: string }[];
        }) => {
          // Check mint authority
          const hasSgtAuthority = item.authorities?.some(
            auth => auth.address === SEEKER_SGT_MINT_AUTHORITY,
          );
          // Or check group membership
          const inSgtGroup = item.grouping?.some(
            g => g.group_key === 'collection' && g.group_value.startsWith('GT'),
          );
          return hasSgtAuthority || inSgtGroup;
        },
      );
    }
    return false;
  } catch {
    // DAS API not available or error - assume no SGT
    // Could fall back to direct RPC check if needed
    return false;
  }
}

export function useFeeTier(): UseFeeTierResult {
  const [skrBalance, setSkrBalance] = useState(0);
  const [hasSeekerNft, setHasSeekerNft] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const fetchData = useCallback(async () => {
    if (!wallet.publicKey) {
      setSkrBalance(0);
      setHasSeekerNft(false);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    const walletAddr = wallet.publicKey.toString();

    try {
      // Fetch SKR balance and Seeker Genesis Token status in parallel
      const [balance, hasSgt] = await Promise.all([
        getTokenBalance(walletAddr, SKR_MINT).catch(() => null),
        checkSeekerGenesisToken(walletAddr).catch(() => false),
      ]);

      setSkrBalance(balance ? parseFloat(balance) : 0);
      setHasSeekerNft(hasSgt);
    } catch {
      setSkrBalance(0);
      setHasSeekerNft(false);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const tier = getFeeTier(skrBalance);
  const nextTier = getNextTier(skrBalance);
  const skrToNextTier = getSkrToNextTier(skrBalance);
  const tierProgress = getTierProgress(skrBalance);
  const effectiveFeeBps = getEffectiveFee(tier.feeBps, hasSeekerNft);

  return {
    tier,
    effectiveFeeBps,
    skrBalance,
    nextTier,
    skrToNextTier,
    tierProgress,
    hasSeekerNft,
    isLoading,
    refresh: fetchData,
  };
}

// Export for UI display
export { FEE_TIERS, SEEKER_NFT_BONUS_BPS };
