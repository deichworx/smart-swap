import { memo } from 'react';
import { StyleSheet, Text, TextStyle } from 'react-native';
import {
  formatAmountAsString,
  parseAmountForDisplay,
  parseRawAmountForDisplay,
  toSubscript,
} from '../jupiter/formatAmount';
import { fontSize } from '../theme';

type Props = {
  /** The amount to display (already converted to human-readable units) */
  readonly amount: string | number;
  /** Optional token symbol to append */
  readonly symbol?: string;
  /** Style for the main text */
  readonly style?: TextStyle;
  /** Style for the subscript (defaults to smaller font) */
  readonly subscriptStyle?: TextStyle;
};

type RawProps = {
  /** Raw amount in smallest units (e.g. lamports) */
  readonly rawAmount: string | number;
  /** Token decimals for conversion */
  readonly decimals: number;
  /** Optional token symbol to append */
  readonly symbol?: string;
  /** Style for the main text */
  readonly style?: TextStyle;
  /** Style for the subscript */
  readonly subscriptStyle?: TextStyle;
};

/**
 * Renders a token amount with subscript notation for very small values.
 * Example: 0.0000000001 → 0.0₉1
 *
 * Uses nested <Text> for proper subscript rendering without layout overflow.
 */
function FormattedAmountInner({ amount, symbol, style, subscriptStyle }: Props) {
  const parsed = parseAmountForDisplay(amount);

  // For accessibility, provide the full value
  const accessibilityLabel = `${formatAmountAsString(parsed)}${symbol ? ` ${symbol}` : ''}`;

  if (!parsed.hasSubscript) {
    return (
      <Text style={style} numberOfLines={1} accessibilityLabel={accessibilityLabel}>
        {parsed.significantDigits}
        {symbol ? ` ${symbol}` : ''}
      </Text>
    );
  }

  // Render with subscript: "0.0" + subscript + significant digits
  return (
    <Text style={style} numberOfLines={1} accessibilityLabel={accessibilityLabel}>
      {parsed.prefix}
      <Text style={[styles.subscript, subscriptStyle]}>
        {toSubscript(parsed.zeroCount)}
      </Text>
      {parsed.significantDigits}
      {symbol ? ` ${symbol}` : ''}
    </Text>
  );
}

/**
 * FormattedAmount component for displaying human-readable amounts.
 */
export const FormattedAmount = memo(FormattedAmountInner);

/**
 * Variant that takes raw token amounts (in smallest units) and decimals.
 */
function FormattedRawAmountInner({
  rawAmount,
  decimals,
  symbol,
  style,
  subscriptStyle,
}: RawProps) {
  const parsed = parseRawAmountForDisplay(rawAmount, decimals);

  const accessibilityLabel = `${formatAmountAsString(parsed)}${symbol ? ` ${symbol}` : ''}`;

  if (!parsed.hasSubscript) {
    return (
      <Text style={style} numberOfLines={1} accessibilityLabel={accessibilityLabel}>
        {parsed.significantDigits}
        {symbol ? ` ${symbol}` : ''}
      </Text>
    );
  }

  return (
    <Text style={style} numberOfLines={1} accessibilityLabel={accessibilityLabel}>
      {parsed.prefix}
      <Text style={[styles.subscript, subscriptStyle]}>
        {toSubscript(parsed.zeroCount)}
      </Text>
      {parsed.significantDigits}
      {symbol ? ` ${symbol}` : ''}
    </Text>
  );
}

/**
 * FormattedRawAmount component for displaying raw token amounts with decimals.
 */
export const FormattedRawAmount = memo(FormattedRawAmountInner);

const styles = StyleSheet.create({
  subscript: {
    fontSize: fontSize.xs,
    lineHeight: fontSize.xs,
  },
});
