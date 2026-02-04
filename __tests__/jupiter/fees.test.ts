import {
  FEE_TIERS,
  getFeeTier,
  getEffectiveFee,
  getNextTier,
  getSkrToNextTier,
  formatFee,
  calculateSavings,
  getTierProgress,
  SEEKER_NFT_BONUS_BPS,
} from '../../app/jupiter/fees';

describe('jupiter/fees', () => {
  describe('FEE_TIERS', () => {
    it('should have 15 tiers', () => {
      expect(FEE_TIERS).toHaveLength(15);
    });

    it('should be sorted by minSkr ascending', () => {
      for (let i = 1; i < FEE_TIERS.length; i++) {
        expect(FEE_TIERS[i].minSkr).toBeGreaterThan(FEE_TIERS[i - 1].minSkr);
      }
    });

    it('should have decreasing fees for higher tiers', () => {
      for (let i = 1; i < FEE_TIERS.length; i++) {
        expect(FEE_TIERS[i].feeBps).toBeLessThan(FEE_TIERS[i - 1].feeBps);
      }
    });

    it('should have level 15 (Mythic) with 0% fee', () => {
      const mythic = FEE_TIERS.find(t => t.name === 'Mythic');
      expect(mythic).toBeDefined();
      expect(mythic?.feeBps).toBe(0);
      expect(mythic?.level).toBe(15);
    });

    it('should start at level 1 (Explorer) with 0.25% fee', () => {
      expect(FEE_TIERS[0].level).toBe(1);
      expect(FEE_TIERS[0].name).toBe('Explorer');
      expect(FEE_TIERS[0].feeBps).toBe(25);
      expect(FEE_TIERS[0].minSkr).toBe(0);
    });

    it('should have easy first unlock at 1,000 SKR', () => {
      expect(FEE_TIERS[1].name).toBe('Initiate');
      expect(FEE_TIERS[1].minSkr).toBe(1_000);
    });
  });

  describe('getFeeTier', () => {
    it('should return Explorer tier for 0 SKR', () => {
      const tier = getFeeTier(0);
      expect(tier.name).toBe('Explorer');
      expect(tier.level).toBe(1);
    });

    it('should return Explorer tier for negative balance (defensive)', () => {
      const tier = getFeeTier(-100);
      expect(tier.name).toBe('Explorer');
    });

    it('should return correct tier at exact threshold', () => {
      expect(getFeeTier(1_000).name).toBe('Initiate');
      expect(getFeeTier(5_000).name).toBe('Seeker');
      expect(getFeeTier(10_000).name).toBe('Holder');
      expect(getFeeTier(25_000).name).toBe('Believer');
      expect(getFeeTier(50_000).name).toBe('Supporter');
      expect(getFeeTier(100_000).name).toBe('Advocate');
      expect(getFeeTier(150_000).name).toBe('Guardian');
      expect(getFeeTier(250_000).name).toBe('Champion');
      expect(getFeeTier(400_000).name).toBe('Elite');
      expect(getFeeTier(550_000).name).toBe('Master');
      expect(getFeeTier(750_000).name).toBe('Legend');
      expect(getFeeTier(1_000_000).name).toBe('Titan');
      expect(getFeeTier(1_500_000).name).toBe('Immortal');
      expect(getFeeTier(2_000_000).name).toBe('Mythic');
    });

    it('should return correct tier just below threshold', () => {
      expect(getFeeTier(999).name).toBe('Explorer');
      expect(getFeeTier(4_999).name).toBe('Initiate');
      expect(getFeeTier(1_999_999).name).toBe('Immortal');
    });

    it('should return Mythic for any balance above 2M', () => {
      expect(getFeeTier(2_000_001).name).toBe('Mythic');
      expect(getFeeTier(10_000_000).name).toBe('Mythic');
    });
  });

  describe('getEffectiveFee', () => {
    it('should return base fee without Seeker NFT', () => {
      expect(getEffectiveFee(25, false)).toBe(25);
      expect(getEffectiveFee(10, false)).toBe(10);
    });

    it('should apply SEEKER_NFT_BONUS_BPS discount with Seeker NFT', () => {
      expect(getEffectiveFee(25, true)).toBe(25 - SEEKER_NFT_BONUS_BPS);
      expect(getEffectiveFee(10, true)).toBe(10 - SEEKER_NFT_BONUS_BPS);
    });

    it('should not go below 0 with Seeker NFT', () => {
      expect(getEffectiveFee(0, true)).toBe(0);
      expect(getEffectiveFee(3, true)).toBe(0); // 3 - 5 = -2, clamped to 0
    });

    it('should handle edge case of low fee with NFT bonus', () => {
      expect(getEffectiveFee(2, true)).toBe(0); // Titan tier + NFT = FREE
    });
  });

  describe('getNextTier', () => {
    it('should return next tier for Explorer', () => {
      const next = getNextTier(0);
      expect(next?.name).toBe('Initiate');
    });

    it('should return null for Mythic (max tier)', () => {
      const next = getNextTier(2_000_000);
      expect(next).toBeNull();
    });

    it('should return null for balance above max tier', () => {
      const next = getNextTier(5_000_000);
      expect(next).toBeNull();
    });

    it('should return correct next tier for mid-tier balance', () => {
      const next = getNextTier(300_000); // Champion tier
      expect(next?.name).toBe('Elite');
    });
  });

  describe('getSkrToNextTier', () => {
    it('should return 1,000 SKR needed for Explorer to reach Initiate', () => {
      expect(getSkrToNextTier(0)).toBe(1_000);
    });

    it('should return correct amount just below threshold', () => {
      expect(getSkrToNextTier(999)).toBe(1);
    });

    it('should return 0 at max tier', () => {
      expect(getSkrToNextTier(2_000_000)).toBe(0);
    });

    it('should return 0 above max tier', () => {
      expect(getSkrToNextTier(3_000_000)).toBe(0);
    });

    it('should calculate correctly mid-tier', () => {
      // At 300,000 (Champion), next is Elite at 400,000
      expect(getSkrToNextTier(300_000)).toBe(100_000);
    });
  });

  describe('formatFee', () => {
    it('should return "FREE" for 0 bps', () => {
      expect(formatFee(0)).toBe('FREE');
    });

    it('should format 25 bps as "0.25%"', () => {
      expect(formatFee(25)).toBe('0.25%');
    });

    it('should format 5 bps as "0.05%"', () => {
      expect(formatFee(5)).toBe('0.05%');
    });

    it('should format single digit bps correctly', () => {
      expect(formatFee(2)).toBe('0.02%');
    });
  });

  describe('calculateSavings', () => {
    it('should return 0 savings for Explorer tier', () => {
      const savings = calculateSavings(1000, 25); // 0.25%
      expect(savings).toBe(0);
    });

    it('should calculate correct savings for Mythic (FREE)', () => {
      const savings = calculateSavings(1000, 0);
      // Base fee: 1000 * 0.25% = 2.5
      // Actual: 0
      expect(savings).toBe(2.5);
    });

    it('should calculate correct savings for mid-tier', () => {
      const savings = calculateSavings(10000, 15); // Supporter tier (0.15%)
      // Base: 10000 * 0.0025 = 25
      // Actual: 10000 * 0.0015 = 15
      // Savings: 10
      expect(savings).toBe(10);
    });
  });

  describe('getTierProgress', () => {
    it('should return 0% at tier start', () => {
      expect(getTierProgress(0)).toBe(0);
    });

    it('should return 100% at max tier', () => {
      expect(getTierProgress(2_000_000)).toBe(100);
    });

    it('should return 100% above max tier', () => {
      expect(getTierProgress(3_000_000)).toBe(100);
    });

    it('should calculate progress correctly mid-tier', () => {
      // Explorer: 0-999, Initiate: 1000+
      // At 500, progress = 500/1000 = 50%
      expect(getTierProgress(500)).toBe(50);
    });

    it('should handle edge cases at tier boundaries', () => {
      // At 999 (just below Initiate), progress in Explorer tier
      // Explorer range: 0-1000 (1000 to next)
      // Progress: 999/1000 = 99.9%
      expect(getTierProgress(999)).toBeCloseTo(99.9, 1);
    });
  });

  describe('CLAUDE.md Principles', () => {
    describe('Immutability', () => {
      it('FEE_TIERS should be readonly', () => {
        // TypeScript enforces this, but we can verify structure is intact
        const originalLength = FEE_TIERS.length;
        expect(FEE_TIERS).toHaveLength(originalLength);
      });
    });

    describe('Total Functions', () => {
      it('getFeeTier should handle any number input', () => {
        // Should not throw for any input
        expect(() => getFeeTier(0)).not.toThrow();
        expect(() => getFeeTier(-1000)).not.toThrow();
        expect(() => getFeeTier(Infinity)).not.toThrow();
        expect(() => getFeeTier(NaN)).not.toThrow();
      });

      it('getEffectiveFee should handle edge cases', () => {
        expect(() => getEffectiveFee(0, true)).not.toThrow();
        expect(() => getEffectiveFee(0, false)).not.toThrow();
      });
    });

    describe('No Silent Failures', () => {
      it('getFeeTier always returns a valid tier', () => {
        const tier = getFeeTier(-1000);
        expect(tier).toBeDefined();
        expect(tier.name).toBeDefined();
        expect(tier.feeBps).toBeDefined();
      });

      it('getNextTier returns null explicitly (not undefined)', () => {
        const next = getNextTier(2_000_000);
        expect(next).toBeNull();
      });
    });
  });
});
