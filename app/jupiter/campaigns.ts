// Campaign-Based Loyalty System
// Allows time-limited loyalty programs with different sponsor tokens
// Each campaign has its own tier structure, rewards, and time period

import { FeeTier } from './fees';

// Campaign status derived from dates
export type CampaignStatus = 'upcoming' | 'active' | 'ended';

// Reward types that campaigns can offer
export type RewardType = 'fee_discount' | 'airdrop' | 'nft' | 'multiplier';

export type CampaignReward = {
  readonly type: RewardType;
  readonly name: string;
  readonly description: string;
  readonly requirement?: string; // e.g., "Complete 10 swaps"
  readonly value?: string; // e.g., "1000 tokens" or "Exclusive NFT"
};

// Bonus condition that can modify fees beyond tier
export type BonusCondition = {
  readonly id: string;
  readonly name: string;
  readonly description: string;
  readonly bonusBps: number; // Additional discount in basis points
  readonly checkType: 'nft' | 'token' | 'activity';
  readonly checkValue: string; // Mint address, collection, or activity type
};

// Main Campaign type
export type Campaign = {
  readonly id: string;
  readonly name: string;
  readonly description: string;
  readonly sponsorName: string;
  readonly sponsorLogo?: string; // URL or asset name
  readonly tokenMint: string; // The token that determines tier
  readonly tokenSymbol: string;
  readonly tokenDecimals: number;
  readonly tiers: readonly FeeTier[];
  readonly startDate: Date;
  readonly endDate?: Date; // undefined = perpetual
  readonly rewards: readonly CampaignReward[];
  readonly bonuses: readonly BonusCondition[];
  readonly colors: {
    readonly primary: string;
    readonly secondary: string;
  };
};

// SKR Season 1 Tiers (current implementation)
const SKR_TIERS: readonly FeeTier[] = [
  { level: 1, name: 'Explorer', minSkr: 0, feeBps: 25, icon: '🔍' },
  { level: 2, name: 'Initiate', minSkr: 1_000, feeBps: 23, icon: '🌱' },
  { level: 3, name: 'Seeker', minSkr: 5_000, feeBps: 21, icon: '🎯' },
  { level: 4, name: 'Holder', minSkr: 10_000, feeBps: 19, icon: '💎' },
  { level: 5, name: 'Believer', minSkr: 25_000, feeBps: 17, icon: '🌟' },
  { level: 6, name: 'Supporter', minSkr: 50_000, feeBps: 15, icon: '⭐' },
  { level: 7, name: 'Advocate', minSkr: 100_000, feeBps: 13, icon: '🚀' },
  { level: 8, name: 'Guardian', minSkr: 150_000, feeBps: 11, icon: '🛡️' },
  { level: 9, name: 'Champion', minSkr: 250_000, feeBps: 9, icon: '🏆' },
  { level: 10, name: 'Elite', minSkr: 400_000, feeBps: 7, icon: '💫' },
  { level: 11, name: 'Master', minSkr: 550_000, feeBps: 5, icon: '🎖️' },
  { level: 12, name: 'Legend', minSkr: 750_000, feeBps: 3, icon: '👑' },
  { level: 13, name: 'Titan', minSkr: 1_000_000, feeBps: 2, icon: '⚡' },
  { level: 14, name: 'Immortal', minSkr: 1_500_000, feeBps: 1, icon: '🔱' },
  { level: 15, name: 'Mythic', minSkr: 2_000_000, feeBps: 0, icon: '🌈' },
] as const;

// Seeker Genesis Token bonus
const SEEKER_SGT_BONUS: BonusCondition = {
  id: 'sgt-holder',
  name: 'Seeker Genesis',
  description: 'Seeker device owners get an extra discount',
  bonusBps: 5, // -0.05%
  checkType: 'nft',
  checkValue: 'GT22s89nU4iWFkNXj1Bw6uYhJJWDRPpShHt4Bk8f99Te',
};

// OTD Token - Smart Swap's native token for the loyalty platform
// "One Tap Dapp" - The governance and utility token
export const OTD_MINT = process.env.EXPO_PUBLIC_OTD_MINT ?? 'OTDTokenMint111111111111111111111111111111';

// OTD Perpetual Campaign (platform's own token - always active)
export const OTD_PERPETUAL: Campaign = {
  id: 'otd-perpetual',
  name: 'OTD Rewards',
  description: 'Hold OTD tokens for permanent fee discounts. The more you hold, the less you pay - forever.',
  sponsorName: 'Smart Swap',
  tokenMint: OTD_MINT,
  tokenSymbol: 'OTD',
  tokenDecimals: 9,
  tiers: [
    { level: 1, name: 'Tapper', minSkr: 0, feeBps: 25, icon: '👆' },
    { level: 2, name: 'Swapper', minSkr: 100, feeBps: 20, icon: '🔄' },
    { level: 3, name: 'Trader', minSkr: 1_000, feeBps: 15, icon: '📈' },
    { level: 4, name: 'Pro', minSkr: 10_000, feeBps: 10, icon: '💎' },
    { level: 5, name: 'Whale', minSkr: 100_000, feeBps: 5, icon: '🐋' },
    { level: 6, name: 'Legend', minSkr: 1_000_000, feeBps: 0, icon: '👑' },
  ],
  startDate: new Date('2026-01-01T00:00:00Z'),
  endDate: undefined, // Perpetual - never ends
  rewards: [
    { type: 'fee_discount', name: 'Permanent Discounts', description: 'Lower fees for life' },
    { type: 'airdrop', name: 'OTD Staking Rewards', description: 'Earn more OTD by staking', requirement: 'Stake OTD tokens' },
    { type: 'multiplier', name: 'Governance Power', description: 'Vote on platform decisions', requirement: 'Hold 1000+ OTD' },
  ],
  bonuses: [SEEKER_SGT_BONUS],
  colors: { primary: '#9945FF', secondary: '#14F195' },
};

// SKR Season 1 Campaign (the current/launch campaign)
export const SKR_SEASON_1: Campaign = {
  id: 'skr-season-1',
  name: 'SKR Season 1',
  description: 'Hold SKR tokens to unlock lower trading fees. The more you hold, the less you pay.',
  sponsorName: 'Seeker Community',
  tokenMint: process.env.EXPO_PUBLIC_SKR_MINT ?? 'ExQRYF7ha2C7dgJ9f1keMXwHpnJWub1A7jNJTQKDpump',
  tokenSymbol: 'SKR',
  tokenDecimals: 6,
  tiers: SKR_TIERS,
  startDate: new Date('2026-01-01T00:00:00Z'),
  endDate: undefined, // Perpetual for now
  rewards: [
    {
      type: 'fee_discount',
      name: 'Reduced Fees',
      description: 'Lower platform fees on every swap',
    },
    {
      type: 'airdrop',
      name: 'Season 1 Airdrop',
      description: 'Top traders eligible for SKR airdrops',
      requirement: 'Top 100 volume traders',
      value: 'Share of 1M SKR pool',
    },
  ],
  bonuses: [SEEKER_SGT_BONUS],
  colors: {
    primary: '#9945FF', // Solana purple
    secondary: '#14F195', // Solana green
  },
};

// =============================================================================
// CAMPAIGN IDEAS - Future Partnership Opportunities
// =============================================================================
// Smart Swap can partner with token projects to run time-limited campaigns.
// Each campaign brings new users to Smart Swap while promoting partner tokens.
// Partners fund airdrops, Smart Swap provides the trading infrastructure.

// CAMPAIGN TYPE 1: New Token Launch
// Partner: Any new Solana project launching their token
// Benefit: Drives initial trading volume and creates holder base
export const EXAMPLE_LAUNCH_CAMPAIGN: Campaign = {
  id: 'bonk-summer-2026',
  name: 'BONK Summer',
  description: 'Hold BONK to unlock trading fee discounts. Trade more, earn more BONK airdrops!',
  sponsorName: 'BONK Community',
  tokenMint: 'DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263',
  tokenSymbol: 'BONK',
  tokenDecimals: 5,
  tiers: [
    { level: 1, name: 'Pup', minSkr: 0, feeBps: 20, icon: '🐕' },
    { level: 2, name: 'Good Boy', minSkr: 1_000_000, feeBps: 15, icon: '🦴' },
    { level: 3, name: 'Alpha', minSkr: 10_000_000, feeBps: 10, icon: '🐺' },
    { level: 4, name: 'Doge Lord', minSkr: 100_000_000, feeBps: 5, icon: '👑' },
    { level: 5, name: 'BONK King', minSkr: 1_000_000_000, feeBps: 0, icon: '🔥' },
  ],
  startDate: new Date('2026-06-01T00:00:00Z'),
  endDate: new Date('2026-08-31T23:59:59Z'),
  rewards: [
    { type: 'fee_discount', name: 'Fee Reduction', description: 'Up to 100% fee reduction' },
    { type: 'airdrop', name: 'BONK Airdrop', description: 'Weekly BONK airdrops to top traders', requirement: 'Top 500 by volume', value: 'Share of 10B BONK pool' },
    { type: 'nft', name: 'BONK Summer NFT', description: 'Limited edition commemorative NFT', requirement: 'Trade $500+ during campaign' },
  ],
  bonuses: [],
  colors: { primary: '#F9A825', secondary: '#FF6F00' },
};

// CAMPAIGN TYPE 2: DeFi Protocol Partnership
// Partner: DEX, lending protocol, or yield aggregator
// Benefit: Cross-promotion, shared liquidity benefits
export const EXAMPLE_DEFI_CAMPAIGN: Campaign = {
  id: 'jupiter-rewards',
  name: 'Jupiter Rewards',
  description: 'Hold JUP tokens for exclusive fee discounts on Jupiter-powered swaps.',
  sponsorName: 'Jupiter Exchange',
  tokenMint: 'JUPyiwrYJFskUPiHa7hkeR8VUtAeFoSYbKedZNsDvCN',
  tokenSymbol: 'JUP',
  tokenDecimals: 6,
  tiers: [
    { level: 1, name: 'Astronaut', minSkr: 0, feeBps: 20, icon: '🚀' },
    { level: 2, name: 'Pilot', minSkr: 100, feeBps: 15, icon: '👨‍🚀' },
    { level: 3, name: 'Captain', minSkr: 1_000, feeBps: 10, icon: '🎖️' },
    { level: 4, name: 'Commander', minSkr: 10_000, feeBps: 5, icon: '⭐' },
    { level: 5, name: 'Jupiter Elite', minSkr: 50_000, feeBps: 0, icon: '🪐' },
  ],
  startDate: new Date('2026-07-01T00:00:00Z'),
  endDate: new Date('2026-09-30T23:59:59Z'),
  rewards: [
    { type: 'fee_discount', name: 'Priority Routing', description: 'Best Jupiter routes with reduced fees' },
    { type: 'airdrop', name: 'JUP Rewards', description: 'Monthly JUP distribution to active traders', requirement: 'Minimum 50 swaps/month' },
    { type: 'multiplier', name: '2x Points', description: 'Double points in Jupiter rewards program', requirement: 'Hold 1000+ JUP' },
  ],
  bonuses: [],
  colors: { primary: '#1E90FF', secondary: '#00CED1' },
};

// CAMPAIGN TYPE 3: Stablecoin Volume Drive
// Partner: Stablecoin issuer (USDC, USDT, etc.)
// Benefit: Drives stablecoin adoption and swap volume
export const EXAMPLE_STABLE_CAMPAIGN: Campaign = {
  id: 'usdc-adoption',
  name: 'USDC Adoption Month',
  description: 'Trade with USDC for zero fees! Plus earn bonus rewards.',
  sponsorName: 'Circle',
  tokenMint: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
  tokenSymbol: 'USDC',
  tokenDecimals: 6,
  tiers: [
    { level: 1, name: 'Starter', minSkr: 0, feeBps: 15, icon: '💵' },
    { level: 2, name: 'Holder', minSkr: 100, feeBps: 10, icon: '💰' },
    { level: 3, name: 'Whale', minSkr: 10_000, feeBps: 5, icon: '🐋' },
    { level: 4, name: 'Mega', minSkr: 100_000, feeBps: 0, icon: '🏦' },
  ],
  startDate: new Date('2026-09-01T00:00:00Z'),
  endDate: new Date('2026-09-30T23:59:59Z'),
  rewards: [
    { type: 'fee_discount', name: 'USDC Zero Fees', description: 'Zero fees on all USDC swaps' },
    { type: 'airdrop', name: 'USDC Cashback', description: '0.1% cashback on all USDC swaps', requirement: 'Minimum $100 daily volume' },
  ],
  bonuses: [],
  colors: { primary: '#2775CA', secondary: '#00D4AA' },
};

// CAMPAIGN TYPE 4: Gaming/NFT Partnership
// Partner: Gaming project or NFT collection
// Benefit: Onboard gaming community to DeFi
export const EXAMPLE_GAMING_CAMPAIGN: Campaign = {
  id: 'star-atlas-season',
  name: 'Star Atlas Trading Season',
  description: 'Hold ATLAS for galactic trading discounts. Trade tokens, earn POLIS rewards!',
  sponsorName: 'Star Atlas',
  tokenMint: 'ATLASXmbPQxBUYbxPsV97usA3fPQYEqzQBUHgiFCUsXx',
  tokenSymbol: 'ATLAS',
  tokenDecimals: 8,
  tiers: [
    { level: 1, name: 'Cadet', minSkr: 0, feeBps: 20, icon: '🌟' },
    { level: 2, name: 'Ensign', minSkr: 1_000, feeBps: 15, icon: '🚀' },
    { level: 3, name: 'Lieutenant', minSkr: 10_000, feeBps: 10, icon: '🎖️' },
    { level: 4, name: 'Captain', minSkr: 100_000, feeBps: 5, icon: '⚓' },
    { level: 5, name: 'Admiral', minSkr: 500_000, feeBps: 0, icon: '👑' },
  ],
  startDate: new Date('2026-10-01T00:00:00Z'),
  endDate: new Date('2026-12-31T23:59:59Z'),
  rewards: [
    { type: 'fee_discount', name: 'Galactic Discount', description: 'Reduced fees for all trades' },
    { type: 'airdrop', name: 'POLIS Rewards', description: 'Earn POLIS governance tokens', requirement: 'Trade ATLAS pairs' },
    { type: 'nft', name: 'Ship NFT Raffle', description: 'Entry into exclusive ship NFT raffle', requirement: 'Complete 100 swaps' },
  ],
  bonuses: [],
  colors: { primary: '#6B4EFF', secondary: '#00D4FF' },
};

// CAMPAIGN TYPE 5: Meme Coin Season
// Partner: Popular meme tokens
// Benefit: Capitalize on meme coin trading activity
export const EXAMPLE_MEME_CAMPAIGN: Campaign = {
  id: 'meme-madness',
  name: 'Meme Madness',
  description: 'Hold any supported meme token for fee discounts. The dankest traders win!',
  sponsorName: 'Meme DAO',
  tokenMint: 'MEMETokenMint11111111111111111111111111111',
  tokenSymbol: 'MEME',
  tokenDecimals: 9,
  tiers: [
    { level: 1, name: 'Normie', minSkr: 0, feeBps: 25, icon: '😐' },
    { level: 2, name: 'Degen', minSkr: 100, feeBps: 15, icon: '🤪' },
    { level: 3, name: 'Chad', minSkr: 10_000, feeBps: 5, icon: '💪' },
    { level: 4, name: 'Gigachad', minSkr: 1_000_000, feeBps: 0, icon: '🗿' },
  ],
  startDate: new Date('2026-04-01T00:00:00Z'),
  endDate: new Date('2026-04-30T23:59:59Z'),
  rewards: [
    { type: 'fee_discount', name: 'Degen Discount', description: 'Trade memes for less' },
    { type: 'airdrop', name: 'Meme Airdrop', description: 'Random meme token airdrops', requirement: 'Trade any meme token' },
    { type: 'nft', name: 'Rare Pepe', description: 'Ultra rare Pepe NFT', requirement: 'Top 100 traders' },
  ],
  bonuses: [],
  colors: { primary: '#FF4500', secondary: '#00FF00' },
};

// All example campaigns (for reference/documentation)
export const CAMPAIGN_IDEAS: readonly Campaign[] = [
  EXAMPLE_LAUNCH_CAMPAIGN,
  EXAMPLE_DEFI_CAMPAIGN,
  EXAMPLE_STABLE_CAMPAIGN,
  EXAMPLE_GAMING_CAMPAIGN,
  EXAMPLE_MEME_CAMPAIGN,
] as const;

// All available campaigns (for future campaign selection)
export const ALL_CAMPAIGNS: readonly Campaign[] = [
  SKR_SEASON_1,
  // Future campaigns can be added here
] as const;

// Get campaign status from dates
export function getCampaignStatus(campaign: Campaign): CampaignStatus {
  const now = new Date();

  if (now < campaign.startDate) {
    return 'upcoming';
  }

  if (campaign.endDate && now > campaign.endDate) {
    return 'ended';
  }

  return 'active';
}

// Get the currently active campaign
export function getActiveCampaign(): Campaign | null {
  const active = ALL_CAMPAIGNS.find(c => getCampaignStatus(c) === 'active');
  return active ?? null;
}

// Get time remaining in campaign
export function getCampaignTimeRemaining(campaign: Campaign): {
  days: number;
  hours: number;
  minutes: number;
  total: number;
} | null {
  if (!campaign.endDate) return null; // Perpetual campaign

  const now = new Date();
  const total = campaign.endDate.getTime() - now.getTime();

  if (total <= 0) {
    return { days: 0, hours: 0, minutes: 0, total: 0 };
  }

  const days = Math.floor(total / (1000 * 60 * 60 * 24));
  const hours = Math.floor((total % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((total % (1000 * 60 * 60)) / (1000 * 60));

  return { days, hours, minutes, total };
}

// Format time remaining for display
export function formatTimeRemaining(campaign: Campaign): string {
  const remaining = getCampaignTimeRemaining(campaign);

  if (!remaining) return 'Ongoing';
  if (remaining.total === 0) return 'Ended';

  if (remaining.days > 0) {
    return `${remaining.days}d ${remaining.hours}h remaining`;
  }
  if (remaining.hours > 0) {
    return `${remaining.hours}h ${remaining.minutes}m remaining`;
  }
  return `${remaining.minutes}m remaining`;
}

// Get fee tier for a campaign
export function getCampaignFeeTier(campaign: Campaign, tokenBalance: number): FeeTier {
  const tiers = campaign.tiers;

  for (let i = tiers.length - 1; i >= 0; i--) {
    if (tokenBalance >= tiers[i].minSkr) {
      return tiers[i];
    }
  }

  return tiers[0];
}

// Get next tier for a campaign
export function getCampaignNextTier(campaign: Campaign, tokenBalance: number): FeeTier | null {
  const currentTier = getCampaignFeeTier(campaign, tokenBalance);
  const currentIndex = campaign.tiers.findIndex(t => t.level === currentTier.level);

  if (currentIndex < campaign.tiers.length - 1) {
    return campaign.tiers[currentIndex + 1];
  }

  return null;
}

// Calculate total bonus from all applicable bonuses
export function calculateBonuses(
  campaign: Campaign,
  hasBonus: (bonus: BonusCondition) => boolean
): number {
  return campaign.bonuses.reduce((total, bonus) => {
    if (hasBonus(bonus)) {
      return total + bonus.bonusBps;
    }
    return total;
  }, 0);
}

// Get effective fee with all bonuses applied
export function getCampaignEffectiveFee(
  campaign: Campaign,
  tokenBalance: number,
  hasBonus: (bonus: BonusCondition) => boolean
): number {
  const tier = getCampaignFeeTier(campaign, tokenBalance);
  const bonusReduction = calculateBonuses(campaign, hasBonus);

  return Math.max(0, tier.feeBps - bonusReduction);
}
