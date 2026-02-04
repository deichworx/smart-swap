import {
  parseAmountForDisplay,
  parseRawAmountForDisplay,
  toSubscript,
  formatAmountAsString,
} from '../../app/jupiter/formatAmount';

describe('toSubscript', () => {
  it('converts single digits to subscript', () => {
    expect(toSubscript(0)).toBe('₀');
    expect(toSubscript(1)).toBe('₁');
    expect(toSubscript(5)).toBe('₅');
    expect(toSubscript(9)).toBe('₉');
  });

  it('converts double digits to subscript', () => {
    expect(toSubscript(10)).toBe('₁₀');
    expect(toSubscript(15)).toBe('₁₅');
    expect(toSubscript(99)).toBe('₉₉');
  });

  it('returns plain string for out-of-range numbers', () => {
    expect(toSubscript(-1)).toBe('-1');
    expect(toSubscript(100)).toBe('100');
  });
});

describe('parseAmountForDisplay', () => {
  describe('large and normal values (no subscript)', () => {
    it('handles values >= 1', () => {
      const result = parseAmountForDisplay(1.234);
      expect(result.hasSubscript).toBe(false);
      expect(result.significantDigits).toContain('1');
    });

    it('handles large values', () => {
      const result = parseAmountForDisplay(1234567.89);
      expect(result.hasSubscript).toBe(false);
      expect(result.value).toBe(1234567.89);
    });

    it('handles values between 0.001 and 1', () => {
      const result = parseAmountForDisplay(0.123);
      expect(result.hasSubscript).toBe(false);
      expect(result.value).toBe(0.123);
    });

    it('handles exactly 0.001 (boundary)', () => {
      const result = parseAmountForDisplay(0.001);
      expect(result.hasSubscript).toBe(false);
    });
  });

  describe('small values (with subscript)', () => {
    it('formats 0.0001 with subscript', () => {
      const result = parseAmountForDisplay(0.0001);
      expect(result.hasSubscript).toBe(true);
      expect(result.prefix).toBe('0.0');
      expect(result.zeroCount).toBe(3);
      expect(result.significantDigits).toBe('1');
    });

    it('formats 0.00001 with subscript', () => {
      const result = parseAmountForDisplay(0.00001);
      expect(result.hasSubscript).toBe(true);
      expect(result.zeroCount).toBe(4);
      expect(result.significantDigits).toBe('1');
    });

    it('formats 0.0000000001 (9 zeros) with subscript', () => {
      const result = parseAmountForDisplay(0.0000000001);
      expect(result.hasSubscript).toBe(true);
      expect(result.zeroCount).toBe(9);
      expect(result.significantDigits).toBe('1');
    });

    it('preserves multiple significant digits', () => {
      const result = parseAmountForDisplay(0.00012345);
      expect(result.hasSubscript).toBe(true);
      expect(result.zeroCount).toBe(3);
      // Should have up to 4 significant digits
      expect(result.significantDigits).toBe('1.234');
    });

    it('handles very small values', () => {
      const result = parseAmountForDisplay(1e-18);
      expect(result.hasSubscript).toBe(true);
      expect(result.zeroCount).toBe(17);
      expect(result.significantDigits).toBe('1');
    });
  });

  describe('edge cases', () => {
    it('handles zero', () => {
      const result = parseAmountForDisplay(0);
      expect(result.hasSubscript).toBe(false);
      expect(result.significantDigits).toBe('0');
      expect(result.value).toBe(0);
    });

    it('handles negative values', () => {
      const result = parseAmountForDisplay(-0.0001);
      expect(result.hasSubscript).toBe(false);
      expect(result.significantDigits).toBe('0');
    });

    it('handles NaN', () => {
      const result = parseAmountForDisplay(NaN);
      expect(result.hasSubscript).toBe(false);
      expect(result.significantDigits).toBe('0');
    });

    it('handles Infinity', () => {
      const result = parseAmountForDisplay(Infinity);
      expect(result.hasSubscript).toBe(false);
      expect(result.significantDigits).toBe('0');
    });

    it('handles string input', () => {
      const result = parseAmountForDisplay('0.0001');
      expect(result.hasSubscript).toBe(true);
      expect(result.zeroCount).toBe(3);
    });

    it('handles invalid string input', () => {
      const result = parseAmountForDisplay('invalid');
      expect(result.hasSubscript).toBe(false);
      expect(result.significantDigits).toBe('0');
    });
  });
});

describe('parseRawAmountForDisplay', () => {
  it('converts raw token amount with decimals', () => {
    // 1 SOL = 1_000_000_000 lamports (9 decimals)
    const result = parseRawAmountForDisplay(1_000_000_000, 9);
    expect(result.hasSubscript).toBe(false);
    expect(result.value).toBe(1);
  });

  it('converts small raw amounts to subscript', () => {
    // 100 lamports = 0.0000001 SOL
    const result = parseRawAmountForDisplay(100, 9);
    expect(result.hasSubscript).toBe(true);
    expect(result.zeroCount).toBe(6);
    expect(result.significantDigits).toBe('1');
  });

  it('handles USDC (6 decimals)', () => {
    // 1 USDC = 1_000_000 (6 decimals)
    const result = parseRawAmountForDisplay(1_000_000, 6);
    expect(result.hasSubscript).toBe(false);
    expect(result.value).toBe(1);
  });

  it('handles small USDC amounts', () => {
    // 1 smallest unit = 0.000001 USDC
    const result = parseRawAmountForDisplay(1, 6);
    expect(result.hasSubscript).toBe(true);
    expect(result.zeroCount).toBe(5);
  });
});

describe('formatAmountAsString', () => {
  it('formats normal values without subscript', () => {
    const parsed = parseAmountForDisplay(1.234);
    const result = formatAmountAsString(parsed);
    expect(result).not.toContain('₀');
  });

  it('formats small values with Unicode subscript', () => {
    const parsed = parseAmountForDisplay(0.0000000001);
    const result = formatAmountAsString(parsed);
    expect(result).toBe('0.0₉1');
  });

  it('formats values with multiple zero subscript', () => {
    const parsed = parseAmountForDisplay(0.00000000000001); // 10^-14
    const result = formatAmountAsString(parsed);
    expect(result).toBe('0.0₁₃1');
  });
});
