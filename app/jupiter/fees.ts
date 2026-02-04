// Campaign-Based Loyalty Fee System
// Users get reduced platform fees based on:
// 1. Campaign token holdings (currently SKR)
// 2. Bonus conditions (e.g., Seeker NFT ownership)
//
// This system supports multiple time-limited campaigns with different
// sponsor tokens, tier structures, and rewards.
// See campaigns.ts for the full campaign system.

import {
  SKR_SEASON_1,
  getActiveCampaign,
  getCampaignFeeTier,
  getCampaignNextTier,
  getCampaignEffectiveFee,
  type Campaign,
  type BonusCondition,
} from './campaigns';

// Re-export campaign functions for convenience
export { getActiveCampaign, getCampaignStatus, formatTimeRemaining } from './campaigns';
export type { Campaign, CampaignReward, BonusCondition, CampaignStatus } from './campaigns';

// Current active campaign (defaults to SKR Season 1)
export const ACTIVE_CAMPAIGN: Campaign = getActiveCampaign() ?? SKR_SEASON_1;

// Legacy exports for backwards compatibility
// These use the active campaign's token
export const SKR_MINT = ACTIVE_CAMPAIGN.tokenMint;

// Seeker Genesis Token (SGT) - NFT proving Seeker device ownership
// Mint Authority used to verify SGT tokens (Token-2022 with extensions)
// https://docs.solanamobile.com/marketing/engaging-seeker-users
export const SEEKER_SGT_MINT_AUTHORITY = 'GT2zuHVaZQYZSyQMgJPLzvkmyztfyXg2NJunqFp4p3A4';
export const SEEKER_SGT_GROUP = process.env.EXPO_PUBLIC_SEEKER_NFT ?? 'GT22s89nU4iWFkNXj1Bw6uYhJJWDRPpShHt4Bk8f99Te';

// Seeker NFT holders get a fee reduction bonus (in basis points)
// Now derived from campaign bonus conditions
export const SEEKER_NFT_BONUS_BPS = ACTIVE_CAMPAIGN.bonuses.find(
  b => b.id === 'sgt-holder'
)?.bonusBps ?? 5;

// Fee Tier type definition
export type FeeTier = {
  readonly level: number;
  readonly name: string;
  readonly minSkr: number; // Generic "min tokens" - named minSkr for backwards compat
  readonly feeBps: number; // basis points (1 = 0.01%)
  readonly icon: string;
};

// Fee tiers from active campaign (backwards compatible export)
export const FEE_TIERS: readonly FeeTier[] = ACTIVE_CAMPAIGN.tiers;

// Get the fee tier for a given token balance (uses active campaign)
export function getFeeTier(tokenBalance: number): FeeTier {
  return getCampaignFeeTier(ACTIVE_CAMPAIGN, tokenBalance);
}

// Calculate effective fee with all bonuses (uses active campaign)
export function getEffectiveFee(baseFee: number, hasSeekerNft: boolean): number {
  // Simple bonus check for backwards compatibility
  if (hasSeekerNft) {
    return Math.max(0, baseFee - SEEKER_NFT_BONUS_BPS);
  }
  return baseFee;
}

// Advanced: Get effective fee with campaign bonus system
export function getEffectiveFeeWithBonuses(
  tokenBalance: number,
  bonusChecker: (bonus: BonusCondition) => boolean
): number {
  return getCampaignEffectiveFee(ACTIVE_CAMPAIGN, tokenBalance, bonusChecker);
}

// Get the next tier (for "hold X more to unlock" UI)
export function getNextTier(tokenBalance: number): FeeTier | null {
  return getCampaignNextTier(ACTIVE_CAMPAIGN, tokenBalance);
}

// Calculate tokens needed to reach next tier
export function getSkrToNextTier(tokenBalance: number): number {
  const nextTier = getNextTier(tokenBalance);
  if (!nextTier) return 0;
  return Math.max(0, nextTier.minSkr - tokenBalance);
}

// Format fee for display (e.g., "0.25%" or "FREE")
export function formatFee(feeBps: number): string {
  if (feeBps === 0) return 'FREE';
  return `${(feeBps / 100).toFixed(2)}%`;
}

// Calculate fee savings compared to base tier
export function calculateSavings(swapAmount: number, feeBps: number): number {
  const baseFee = swapAmount * (FEE_TIERS[0].feeBps / 10000);
  const actualFee = swapAmount * (feeBps / 10000);
  return baseFee - actualFee;
}

// Get tier progress percentage
export function getTierProgress(skrBalance: number): number {
  const currentTier = getFeeTier(skrBalance);
  const nextTier = getNextTier(skrBalance);

  if (!nextTier) return 100; // Max tier reached

  const tierRange = nextTier.minSkr - currentTier.minSkr;
  const userProgress = skrBalance - currentTier.minSkr;

  return Math.min(100, (userProgress / tierRange) * 100);
}
