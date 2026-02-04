/**
 * Unit Tests - Campaign System
 *
 * Comprehensive unit tests for campaign functions
 */

import {
  SKR_SEASON_1,
  OTD_PERPETUAL,
  getCampaignStatus,
  getCampaignTimeRemaining,
  formatTimeRemaining,
  getCampaignFeeTier,
  getCampaignNextTier,
  calculateBonuses,
  getCampaignEffectiveFee,
  CAMPAIGN_IDEAS,
  type Campaign,
  type BonusCondition,
} from '../../app/jupiter/campaigns';

describe('Campaign Functions - Unit Tests', () => {
  describe('getCampaignStatus', () => {
    it('returns "upcoming" for future start date', () => {
      const future: Campaign = {
        ...SKR_SEASON_1,
        startDate: new Date('2099-01-01'),
        endDate: new Date('2099-12-31'),
      };
      expect(getCampaignStatus(future)).toBe('upcoming');
    });

    it('returns "active" for current date range', () => {
      const now = new Date();
      const active: Campaign = {
        ...SKR_SEASON_1,
        startDate: new Date(now.getTime() - 86400000), // Yesterday
        endDate: new Date(now.getTime() + 86400000), // Tomorrow
      };
      expect(getCampaignStatus(active)).toBe('active');
    });

    it('returns "ended" for past end date', () => {
      const past: Campaign = {
        ...SKR_SEASON_1,
        startDate: new Date('2020-01-01'),
        endDate: new Date('2020-12-31'),
      };
      expect(getCampaignStatus(past)).toBe('ended');
    });

    it('returns "active" for perpetual campaign', () => {
      expect(getCampaignStatus(OTD_PERPETUAL)).toBe('active');
    });
  });

  describe('getCampaignTimeRemaining', () => {
    it('returns null for perpetual campaigns', () => {
      expect(getCampaignTimeRemaining(OTD_PERPETUAL)).toBeNull();
    });

    it('returns correct time components', () => {
      const campaign: Campaign = {
        ...SKR_SEASON_1,
        startDate: new Date('2020-01-01'),
        endDate: new Date(Date.now() + 86400000 * 5 + 3600000 * 3 + 60000 * 30),
      };

      const remaining = getCampaignTimeRemaining(campaign);
      expect(remaining).not.toBeNull();
      expect(remaining!.days).toBe(5);
      expect(remaining!.hours).toBe(3);
      expect(remaining!.minutes).toBe(30);
    });

    it('returns zeros for ended campaigns', () => {
      const ended: Campaign = {
        ...SKR_SEASON_1,
        startDate: new Date('2020-01-01'),
        endDate: new Date('2020-12-31'),
      };

      const remaining = getCampaignTimeRemaining(ended);
      expect(remaining!.total).toBe(0);
    });
  });

  describe('formatTimeRemaining', () => {
    it('returns "Ongoing" for perpetual', () => {
      expect(formatTimeRemaining(OTD_PERPETUAL)).toBe('Ongoing');
    });

    it('returns "Ended" for past campaigns', () => {
      const ended: Campaign = {
        ...SKR_SEASON_1,
        startDate: new Date('2020-01-01'),
        endDate: new Date('2020-12-31'),
      };
      expect(formatTimeRemaining(ended)).toBe('Ended');
    });

    it('formats with days when > 0', () => {
      const campaign: Campaign = {
        ...SKR_SEASON_1,
        startDate: new Date('2020-01-01'),
        endDate: new Date(Date.now() + 86400000 * 10),
      };
      expect(formatTimeRemaining(campaign)).toMatch(/\d+d.*remaining/);
    });

    it('formats hours when < 1 day', () => {
      const campaign: Campaign = {
        ...SKR_SEASON_1,
        startDate: new Date('2020-01-01'),
        endDate: new Date(Date.now() + 3600000 * 5),
      };
      expect(formatTimeRemaining(campaign)).toMatch(/\d+h.*remaining/);
    });

    it('formats minutes when < 1 hour', () => {
      const campaign: Campaign = {
        ...SKR_SEASON_1,
        startDate: new Date('2020-01-01'),
        endDate: new Date(Date.now() + 60000 * 30),
      };
      expect(formatTimeRemaining(campaign)).toMatch(/\d+m remaining/);
    });
  });

  describe('getCampaignFeeTier', () => {
    describe('SKR Campaign', () => {
      it('returns Explorer for 0 balance', () => {
        const tier = getCampaignFeeTier(SKR_SEASON_1, 0);
        expect(tier.name).toBe('Explorer');
        expect(tier.level).toBe(1);
      });

      it('returns Initiate for 1000 balance', () => {
        const tier = getCampaignFeeTier(SKR_SEASON_1, 1000);
        expect(tier.name).toBe('Initiate');
      });

      it('returns Mythic for 2M+ balance', () => {
        const tier = getCampaignFeeTier(SKR_SEASON_1, 2000000);
        expect(tier.name).toBe('Mythic');
        expect(tier.feeBps).toBe(0);
      });

      it('returns correct tier at boundary - 1', () => {
        const tier = getCampaignFeeTier(SKR_SEASON_1, 999);
        expect(tier.name).toBe('Explorer');
      });

      it('handles very large balances', () => {
        const tier = getCampaignFeeTier(SKR_SEASON_1, 999999999);
        expect(tier.name).toBe('Mythic');
      });
    });

    describe('OTD Campaign', () => {
      it('returns Tapper for 0 balance', () => {
        const tier = getCampaignFeeTier(OTD_PERPETUAL, 0);
        expect(tier.name).toBe('Tapper');
      });

      it('returns Legend for 1M+ balance', () => {
        const tier = getCampaignFeeTier(OTD_PERPETUAL, 1000000);
        expect(tier.name).toBe('Legend');
        expect(tier.feeBps).toBe(0);
      });
    });

    describe('Edge cases', () => {
      it('handles negative balance (returns first tier)', () => {
        const tier = getCampaignFeeTier(SKR_SEASON_1, -100);
        expect(tier.name).toBe('Explorer');
      });

      it('handles NaN (returns first tier)', () => {
        const tier = getCampaignFeeTier(SKR_SEASON_1, NaN);
        expect(tier.name).toBe('Explorer');
      });

      it('handles Infinity (returns highest tier)', () => {
        const tier = getCampaignFeeTier(SKR_SEASON_1, Infinity);
        expect(tier.name).toBe('Mythic');
      });
    });
  });

  describe('getCampaignNextTier', () => {
    it('returns next tier for Explorer', () => {
      const next = getCampaignNextTier(SKR_SEASON_1, 0);
      expect(next?.name).toBe('Initiate');
    });

    it('returns null for Mythic', () => {
      const next = getCampaignNextTier(SKR_SEASON_1, 2000000);
      expect(next).toBeNull();
    });

    it('returns correct next for mid-tier', () => {
      const next = getCampaignNextTier(SKR_SEASON_1, 100000);
      expect(next?.name).toBe('Guardian');
    });
  });

  describe('calculateBonuses', () => {
    it('returns 0 when no bonuses match', () => {
      const result = calculateBonuses(SKR_SEASON_1, () => false);
      expect(result).toBe(0);
    });

    it('returns bonus amount when match found', () => {
      const result = calculateBonuses(SKR_SEASON_1, (b) => b.id === 'sgt-holder');
      expect(result).toBe(5);
    });

    it('sums multiple matching bonuses', () => {
      const multiBonus: Campaign = {
        ...SKR_SEASON_1,
        bonuses: [
          { id: 'a', name: 'A', description: '', bonusBps: 3, checkType: 'nft', checkValue: '' },
          { id: 'b', name: 'B', description: '', bonusBps: 5, checkType: 'nft', checkValue: '' },
          { id: 'c', name: 'C', description: '', bonusBps: 2, checkType: 'nft', checkValue: '' },
        ],
      };

      const result = calculateBonuses(multiBonus, () => true);
      expect(result).toBe(10);
    });

    it('handles empty bonus array', () => {
      const noBonus: Campaign = {
        ...SKR_SEASON_1,
        bonuses: [],
      };
      const result = calculateBonuses(noBonus, () => true);
      expect(result).toBe(0);
    });
  });

  describe('getCampaignEffectiveFee', () => {
    it('returns tier fee with no bonuses', () => {
      const fee = getCampaignEffectiveFee(SKR_SEASON_1, 0, () => false);
      expect(fee).toBe(25);
    });

    it('subtracts bonus from tier fee', () => {
      const fee = getCampaignEffectiveFee(SKR_SEASON_1, 0, (b) => b.id === 'sgt-holder');
      expect(fee).toBe(20); // 25 - 5
    });

    it('never goes below 0', () => {
      const fee = getCampaignEffectiveFee(SKR_SEASON_1, 2000000, () => true);
      expect(fee).toBe(0);
    });

    it('combines tier and bonus correctly', () => {
      // Supporter tier = 15 bps, SGT bonus = 5 bps
      const fee = getCampaignEffectiveFee(SKR_SEASON_1, 50000, (b) => b.id === 'sgt-holder');
      expect(fee).toBe(10);
    });
  });
});

describe('Campaign Data Validation', () => {
  const allCampaigns = [SKR_SEASON_1, OTD_PERPETUAL, ...CAMPAIGN_IDEAS];

  describe('Tier structure', () => {
    it('all campaigns have at least one tier', () => {
      for (const campaign of allCampaigns) {
        expect(campaign.tiers.length).toBeGreaterThan(0);
      }
    });

    it('first tier requires 0 tokens', () => {
      for (const campaign of allCampaigns) {
        expect(campaign.tiers[0].minSkr).toBe(0);
      }
    });

    it('tiers are in ascending order', () => {
      for (const campaign of allCampaigns) {
        for (let i = 1; i < campaign.tiers.length; i++) {
          expect(campaign.tiers[i].minSkr).toBeGreaterThan(campaign.tiers[i - 1].minSkr);
        }
      }
    });

    it('fees decrease as tier increases', () => {
      for (const campaign of allCampaigns) {
        for (let i = 1; i < campaign.tiers.length; i++) {
          expect(campaign.tiers[i].feeBps).toBeLessThanOrEqual(campaign.tiers[i - 1].feeBps);
        }
      }
    });

    it('highest tier has lowest fee (0 or minimal)', () => {
      for (const campaign of allCampaigns) {
        const lastTier = campaign.tiers[campaign.tiers.length - 1];
        expect(lastTier.feeBps).toBeLessThanOrEqual(5);
      }
    });
  });

  describe('Required fields', () => {
    it('all campaigns have unique IDs', () => {
      const ids = allCampaigns.map(c => c.id);
      const uniqueIds = new Set(ids);
      expect(uniqueIds.size).toBe(ids.length);
    });

    it('all campaigns have token symbol', () => {
      for (const campaign of allCampaigns) {
        expect(campaign.tokenSymbol).toBeTruthy();
        expect(campaign.tokenSymbol.length).toBeGreaterThan(0);
      }
    });

    it('all campaigns have sponsor name', () => {
      for (const campaign of allCampaigns) {
        expect(campaign.sponsorName).toBeTruthy();
      }
    });

    it('all campaigns have colors', () => {
      for (const campaign of allCampaigns) {
        expect(campaign.colors.primary).toMatch(/^#[0-9A-Fa-f]{6}$/);
        expect(campaign.colors.secondary).toMatch(/^#[0-9A-Fa-f]{6}$/);
      }
    });
  });

  describe('Date validation', () => {
    it('all campaigns have valid start date', () => {
      for (const campaign of allCampaigns) {
        expect(campaign.startDate).toBeInstanceOf(Date);
        expect(campaign.startDate.getTime()).toBeGreaterThan(0);
      }
    });

    it('end date is after start date when defined', () => {
      for (const campaign of allCampaigns) {
        if (campaign.endDate) {
          expect(campaign.endDate.getTime()).toBeGreaterThan(campaign.startDate.getTime());
        }
      }
    });
  });
});

describe('Bonus Conditions', () => {
  it('SGT bonus has correct structure', () => {
    const sgtBonus = SKR_SEASON_1.bonuses.find(b => b.id === 'sgt-holder');
    expect(sgtBonus).toBeDefined();
    expect(sgtBonus!.bonusBps).toBe(5);
    expect(sgtBonus!.checkType).toBe('nft');
    expect(sgtBonus!.checkValue).toBeTruthy();
  });

  it('bonus checkType is valid enum value', () => {
    const validTypes = ['nft', 'token', 'activity'];
    for (const campaign of [SKR_SEASON_1, OTD_PERPETUAL]) {
      for (const bonus of campaign.bonuses) {
        expect(validTypes).toContain(bonus.checkType);
      }
    }
  });
});
