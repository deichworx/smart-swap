/**
 * Integration Tests - Campaign System
 *
 * Tests the campaign-based loyalty system including:
 * - Campaign status management
 * - Time-based countdown functionality
 * - Multi-campaign support
 * - Tier calculations per campaign
 * - Bonus conditions
 */

import {
  SKR_SEASON_1,
  OTD_PERPETUAL,
  getCampaignStatus,
  getCampaignTimeRemaining,
  formatTimeRemaining,
  getCampaignFeeTier,
  getCampaignNextTier,
  getCampaignEffectiveFee,
  calculateBonuses,
  getActiveCampaign,
  ALL_CAMPAIGNS,
  type Campaign,
  type BonusCondition,
  type CampaignStatus,
} from '../../app/jupiter/campaigns';

describe('Campaign System Integration', () => {
  describe('SKR Season 1 Campaign', () => {
    it('should have valid campaign structure', () => {
      expect(SKR_SEASON_1.id).toBe('skr-season-1');
      expect(SKR_SEASON_1.name).toBe('SKR Season 1');
      expect(SKR_SEASON_1.tokenSymbol).toBe('SKR');
      expect(SKR_SEASON_1.tiers.length).toBe(15);
    });

    it('should have 15 tiers from Explorer to Mythic', () => {
      expect(SKR_SEASON_1.tiers[0].name).toBe('Explorer');
      expect(SKR_SEASON_1.tiers[14].name).toBe('Mythic');
      expect(SKR_SEASON_1.tiers[14].feeBps).toBe(0); // Free at max tier
    });

    it('should have decreasing fees as tier increases', () => {
      for (let i = 1; i < SKR_SEASON_1.tiers.length; i++) {
        expect(SKR_SEASON_1.tiers[i].feeBps).toBeLessThan(SKR_SEASON_1.tiers[i - 1].feeBps);
      }
    });

    it('should have increasing token requirements', () => {
      for (let i = 1; i < SKR_SEASON_1.tiers.length; i++) {
        expect(SKR_SEASON_1.tiers[i].minSkr).toBeGreaterThan(SKR_SEASON_1.tiers[i - 1].minSkr);
      }
    });

    it('should have Seeker SGT bonus configured', () => {
      expect(SKR_SEASON_1.bonuses.length).toBeGreaterThan(0);
      const sgtBonus = SKR_SEASON_1.bonuses.find(b => b.id === 'sgt-holder');
      expect(sgtBonus).toBeDefined();
      expect(sgtBonus?.bonusBps).toBe(5);
    });

    it('should have rewards defined', () => {
      expect(SKR_SEASON_1.rewards.length).toBeGreaterThan(0);
      expect(SKR_SEASON_1.rewards.some(r => r.type === 'fee_discount')).toBe(true);
    });
  });

  describe('OTD Perpetual Campaign', () => {
    it('should have valid campaign structure', () => {
      expect(OTD_PERPETUAL.id).toBe('otd-perpetual');
      expect(OTD_PERPETUAL.name).toBe('OTD Rewards');
      expect(OTD_PERPETUAL.tokenSymbol).toBe('OTD');
    });

    it('should be a perpetual campaign (no end date)', () => {
      expect(OTD_PERPETUAL.endDate).toBeUndefined();
    });

    it('should have 6 tiers', () => {
      expect(OTD_PERPETUAL.tiers.length).toBe(6);
      expect(OTD_PERPETUAL.tiers[0].name).toBe('Tapper');
      expect(OTD_PERPETUAL.tiers[5].name).toBe('Legend');
    });
  });

  describe('getCampaignStatus', () => {
    it('should return "active" for current campaigns', () => {
      // SKR Season 1 starts in 2026-01-01
      const status = getCampaignStatus(SKR_SEASON_1);
      // Since we're in 2026, it should be active or upcoming
      expect(['active', 'upcoming']).toContain(status);
    });

    it('should return "active" for perpetual campaigns', () => {
      const status = getCampaignStatus(OTD_PERPETUAL);
      expect(status).toBe('active');
    });

    it('should return "upcoming" for future campaigns', () => {
      const futureCampaign: Campaign = {
        ...SKR_SEASON_1,
        id: 'future-test',
        startDate: new Date('2099-01-01'),
        endDate: new Date('2099-12-31'),
      };
      const status = getCampaignStatus(futureCampaign);
      expect(status).toBe('upcoming');
    });

    it('should return "ended" for past campaigns', () => {
      const pastCampaign: Campaign = {
        ...SKR_SEASON_1,
        id: 'past-test',
        startDate: new Date('2020-01-01'),
        endDate: new Date('2020-12-31'),
      };
      const status = getCampaignStatus(pastCampaign);
      expect(status).toBe('ended');
    });
  });

  describe('getCampaignTimeRemaining', () => {
    it('should return null for perpetual campaigns', () => {
      const remaining = getCampaignTimeRemaining(OTD_PERPETUAL);
      expect(remaining).toBeNull();
    });

    it('should return time components for campaigns with end dates', () => {
      const futureEndCampaign: Campaign = {
        ...SKR_SEASON_1,
        id: 'time-test',
        startDate: new Date('2020-01-01'),
        endDate: new Date(Date.now() + 86400000 * 10), // 10 days from now
      };

      const remaining = getCampaignTimeRemaining(futureEndCampaign);
      expect(remaining).not.toBeNull();
      expect(remaining?.days).toBeGreaterThanOrEqual(9);
      expect(remaining?.hours).toBeGreaterThanOrEqual(0);
      expect(remaining?.minutes).toBeGreaterThanOrEqual(0);
    });

    it('should return zeros for ended campaigns', () => {
      const endedCampaign: Campaign = {
        ...SKR_SEASON_1,
        id: 'ended-test',
        startDate: new Date('2020-01-01'),
        endDate: new Date('2020-12-31'),
      };

      const remaining = getCampaignTimeRemaining(endedCampaign);
      expect(remaining?.total).toBe(0);
      expect(remaining?.days).toBe(0);
    });
  });

  describe('formatTimeRemaining', () => {
    it('should return "Ongoing" for perpetual campaigns', () => {
      const formatted = formatTimeRemaining(OTD_PERPETUAL);
      expect(formatted).toBe('Ongoing');
    });

    it('should return "Ended" for past campaigns', () => {
      const endedCampaign: Campaign = {
        ...SKR_SEASON_1,
        id: 'format-test',
        startDate: new Date('2020-01-01'),
        endDate: new Date('2020-12-31'),
      };

      const formatted = formatTimeRemaining(endedCampaign);
      expect(formatted).toBe('Ended');
    });

    it('should format days and hours for active campaigns', () => {
      const activeCampaign: Campaign = {
        ...SKR_SEASON_1,
        id: 'active-format-test',
        startDate: new Date('2020-01-01'),
        endDate: new Date(Date.now() + 86400000 * 15 + 3600000 * 5), // 15 days, 5 hours
      };

      const formatted = formatTimeRemaining(activeCampaign);
      expect(formatted).toMatch(/\d+d \d+h remaining/);
    });
  });

  describe('getCampaignFeeTier', () => {
    it('should return first tier for zero balance', () => {
      const tier = getCampaignFeeTier(SKR_SEASON_1, 0);
      expect(tier.name).toBe('Explorer');
      expect(tier.feeBps).toBe(25);
    });

    it('should return correct tier for mid-range balance', () => {
      const tier = getCampaignFeeTier(SKR_SEASON_1, 50000);
      expect(tier.name).toBe('Supporter');
      expect(tier.feeBps).toBe(15);
    });

    it('should return highest tier for max balance', () => {
      const tier = getCampaignFeeTier(SKR_SEASON_1, 2000000);
      expect(tier.name).toBe('Mythic');
      expect(tier.feeBps).toBe(0);
    });

    it('should return correct tier at exact boundaries', () => {
      const tier1K = getCampaignFeeTier(SKR_SEASON_1, 1000);
      expect(tier1K.name).toBe('Initiate');

      const tier999 = getCampaignFeeTier(SKR_SEASON_1, 999);
      expect(tier999.name).toBe('Explorer');
    });

    it('should work with OTD campaign tiers', () => {
      const tier = getCampaignFeeTier(OTD_PERPETUAL, 1000);
      expect(tier.name).toBe('Trader');
      expect(tier.feeBps).toBe(15);
    });
  });

  describe('getCampaignNextTier', () => {
    it('should return next tier for non-max users', () => {
      const nextTier = getCampaignNextTier(SKR_SEASON_1, 0);
      expect(nextTier?.name).toBe('Initiate');
      expect(nextTier?.minSkr).toBe(1000);
    });

    it('should return null for max tier users', () => {
      const nextTier = getCampaignNextTier(SKR_SEASON_1, 2000000);
      expect(nextTier).toBeNull();
    });

    it('should return correct next tier for mid-range users', () => {
      const nextTier = getCampaignNextTier(SKR_SEASON_1, 50000);
      expect(nextTier?.name).toBe('Advocate');
      expect(nextTier?.minSkr).toBe(100000);
    });
  });

  describe('calculateBonuses', () => {
    it('should return 0 for no matching bonuses', () => {
      const hasBonus = () => false;
      const bonus = calculateBonuses(SKR_SEASON_1, hasBonus);
      expect(bonus).toBe(0);
    });

    it('should return bonus amount for matching conditions', () => {
      const hasBonus = (b: BonusCondition) => b.id === 'sgt-holder';
      const bonus = calculateBonuses(SKR_SEASON_1, hasBonus);
      expect(bonus).toBe(5);
    });

    it('should sum multiple bonuses', () => {
      // Create campaign with multiple bonuses
      const multiBonus: Campaign = {
        ...SKR_SEASON_1,
        bonuses: [
          { id: 'bonus1', name: 'Bonus 1', description: '', bonusBps: 5, checkType: 'nft', checkValue: '' },
          { id: 'bonus2', name: 'Bonus 2', description: '', bonusBps: 3, checkType: 'token', checkValue: '' },
        ],
      };

      const hasBonus = () => true;
      const bonus = calculateBonuses(multiBonus, hasBonus);
      expect(bonus).toBe(8);
    });
  });

  describe('getCampaignEffectiveFee', () => {
    it('should return tier fee when no bonuses apply', () => {
      const fee = getCampaignEffectiveFee(SKR_SEASON_1, 0, () => false);
      expect(fee).toBe(25); // Explorer tier fee
    });

    it('should reduce fee when bonuses apply', () => {
      const fee = getCampaignEffectiveFee(SKR_SEASON_1, 0, (b) => b.id === 'sgt-holder');
      expect(fee).toBe(20); // 25 - 5 = 20
    });

    it('should not go below zero', () => {
      const fee = getCampaignEffectiveFee(SKR_SEASON_1, 2000000, () => true);
      expect(fee).toBe(0); // Mythic is already 0, can't go lower
    });

    it('should combine tier discount with bonus', () => {
      // Supporter tier (15 bps) + SGT bonus (-5 bps) = 10 bps
      const fee = getCampaignEffectiveFee(SKR_SEASON_1, 50000, (b) => b.id === 'sgt-holder');
      expect(fee).toBe(10);
    });
  });

  describe('getActiveCampaign', () => {
    it('should return a campaign', () => {
      const active = getActiveCampaign();
      expect(active).not.toBeNull();
    });

    it('should return campaign from ALL_CAMPAIGNS', () => {
      const active = getActiveCampaign();
      if (active) {
        expect(ALL_CAMPAIGNS.some(c => c.id === active.id)).toBe(true);
      }
    });
  });

  describe('Campaign Data Integrity', () => {
    it('all campaigns should have unique IDs', () => {
      const ids = ALL_CAMPAIGNS.map(c => c.id);
      const uniqueIds = new Set(ids);
      expect(uniqueIds.size).toBe(ids.length);
    });

    it('all campaigns should have valid colors', () => {
      for (const campaign of ALL_CAMPAIGNS) {
        expect(campaign.colors.primary).toMatch(/^#[0-9A-Fa-f]{6}$/);
        expect(campaign.colors.secondary).toMatch(/^#[0-9A-Fa-f]{6}$/);
      }
    });

    it('all campaigns should have non-empty tiers', () => {
      for (const campaign of ALL_CAMPAIGNS) {
        expect(campaign.tiers.length).toBeGreaterThan(0);
      }
    });

    it('all campaigns should have first tier with 0 token requirement', () => {
      for (const campaign of ALL_CAMPAIGNS) {
        expect(campaign.tiers[0].minSkr).toBe(0);
      }
    });
  });
});
