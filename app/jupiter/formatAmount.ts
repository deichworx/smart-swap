/**
 * Subscript formatting for small token amounts.
 * Converts e.g. 0.0000000001 → 0.0₉1 for compact display.
 */

const SUBSCRIPT_DIGITS = ['₀', '₁', '₂', '₃', '₄', '₅', '₆', '₇', '₈', '₉'] as const;

/**
 * Minimum leading zeros after decimal to trigger subscript.
 * 3+ zeros → subscript (e.g. 0.0001 → 0.0₃1)
 */
const MIN_ZEROS_FOR_SUBSCRIPT = 3;

/**
 * Maximum significant digits to show after subscript.
 */
const MAX_SIGNIFICANT_DIGITS = 4;

export type ParsedAmount = {
  /** Whether subscript notation should be used */
  readonly hasSubscript: boolean;
  /** The "0." prefix */
  readonly prefix: string;
  /** Number of zeros after decimal (for subscript) */
  readonly zeroCount: number;
  /** Significant digits after the zeros */
  readonly significantDigits: string;
  /** Original value as number (for fallback formatting) */
  readonly value: number;
};

/**
 * Convert a number to Unicode subscript.
 * @example toSubscript(9) → "₉"
 */
export function toSubscript(num: number): string {
  if (num < 0 || num > 99) {
    return String(num);
  }
  return String(num)
    .split('')
    .map(d => SUBSCRIPT_DIGITS[parseInt(d, 10)])
    .join('');
}

/**
 * Parse a numeric amount for display with potential subscript notation.
 *
 * @param amount - String or number representation of the amount
 * @returns Parsed components for rendering
 *
 * @example
 * parseAmountForDisplay("0.0000000001")
 * // → { hasSubscript: true, prefix: "0.0", zeroCount: 9, significantDigits: "1", value: 1e-10 }
 *
 * parseAmountForDisplay("1.234")
 * // → { hasSubscript: false, prefix: "", zeroCount: 0, significantDigits: "1.234", value: 1.234 }
 */
export function parseAmountForDisplay(amount: string | number): ParsedAmount {
  const value = typeof amount === 'string' ? parseFloat(amount) : amount;

  // Handle invalid, zero, or negative values
  if (!Number.isFinite(value) || value <= 0) {
    return {
      hasSubscript: false,
      prefix: '',
      zeroCount: 0,
      significantDigits: '0',
      value: 0,
    };
  }

  // Values >= 1 don't need subscript
  if (value >= 1) {
    return {
      hasSubscript: false,
      prefix: '',
      zeroCount: 0,
      significantDigits: formatLargeNumber(value),
      value,
    };
  }

  // Values between 0.001 and 1 (less than MIN_ZEROS zeros)
  if (value >= Math.pow(10, -MIN_ZEROS_FOR_SUBSCRIPT)) {
    return {
      hasSubscript: false,
      prefix: '',
      zeroCount: 0,
      significantDigits: value.toLocaleString(undefined, {
        minimumFractionDigits: 0,
        maximumFractionDigits: 6,
      }),
      value,
    };
  }

  // Small values that need subscript notation
  // Calculate number of leading zeros after decimal
  const log10 = Math.floor(Math.log10(value));
  const zeroCount = Math.abs(log10) - 1;

  // Extract significant digits
  const significantPart = value * Math.pow(10, Math.abs(log10));
  const significantDigits = significantPart
    .toPrecision(MAX_SIGNIFICANT_DIGITS)
    .replace(/\.?0+$/, ''); // Remove trailing zeros

  return {
    hasSubscript: true,
    prefix: '0.0',
    zeroCount,
    significantDigits,
    value,
  };
}

/**
 * Format a large number with locale-aware separators.
 */
function formatLargeNumber(value: number): string {
  if (value >= 1_000_000) {
    return value.toLocaleString(undefined, { maximumFractionDigits: 2 });
  }
  if (value >= 1000) {
    return value.toLocaleString(undefined, { maximumFractionDigits: 4 });
  }
  return value.toLocaleString(undefined, { maximumFractionDigits: 6 });
}

/**
 * Format a raw token amount (in smallest units) for display.
 * This is a replacement for formatTokenAmount in tokens.ts.
 *
 * @param rawAmount - Amount in smallest units (e.g. lamports)
 * @param decimals - Token decimals
 * @returns ParsedAmount for rendering
 */
export function parseRawAmountForDisplay(
  rawAmount: string | number,
  decimals: number,
): ParsedAmount {
  const raw = typeof rawAmount === 'string' ? parseFloat(rawAmount) : rawAmount;
  const value = raw / Math.pow(10, decimals);
  return parseAmountForDisplay(value);
}

/**
 * Format amount as a plain string (for non-React contexts or accessibility).
 * Uses subscript Unicode characters.
 */
export function formatAmountAsString(parsed: ParsedAmount): string {
  if (!parsed.hasSubscript) {
    return parsed.significantDigits;
  }
  return `${parsed.prefix}${toSubscript(parsed.zeroCount)}${parsed.significantDigits}`;
}
