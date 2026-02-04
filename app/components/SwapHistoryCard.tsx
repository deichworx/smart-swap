import { memo, useCallback } from 'react';
import { Linking, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { borderRadius, colors, fontSize, fontWeight, spacing } from '../theme';
import { FormattedAmount } from './FormattedAmount';

type Props = {
  readonly inputSymbol: string;
  readonly outputSymbol: string;
  readonly inputAmount: string;
  readonly outputAmount: string;
  readonly signature: string;
  readonly timestamp: number;
  readonly status: 'success' | 'failed';
};

function formatTimestamp(timestamp: number): string {
  const date = new Date(timestamp);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;

  return date.toLocaleDateString();
}

function SwapHistoryCard({
  inputSymbol,
  outputSymbol,
  inputAmount,
  outputAmount,
  signature,
  timestamp,
  status,
}: Props) {

  const openSolscan = useCallback(() => {
    const url = `https://solscan.io/tx/${signature}`;
    Linking.openURL(url);
  }, [signature]);

  const accessibilityLabel = `Swap ${inputAmount} ${inputSymbol} to ${outputAmount} ${outputSymbol}, ${status === 'success' ? 'successful' : 'failed'}, ${formatTimestamp(timestamp)}`;

  return (
    <View style={styles.card} accessibilityLabel={accessibilityLabel}>
      <View style={styles.header}>
        <View style={styles.tokenPair}>
          <View style={styles.tokenIcon}>
            <Text style={styles.tokenIconText}>{inputSymbol.charAt(0)}</Text>
          </View>
          <Text style={styles.arrow}>→</Text>
          <View style={styles.tokenIcon}>
            <Text style={styles.tokenIconText}>{outputSymbol.charAt(0)}</Text>
          </View>
        </View>
        <View style={styles.headerRight}>
          <Text style={styles.timestamp}>{formatTimestamp(timestamp)}</Text>
          <View
            style={[styles.statusBadge, status === 'failed' && styles.statusFailed]}
          >
            <Text
              style={[
                styles.statusText,
                status === 'failed' && styles.statusTextFailed,
              ]}
            >
              {status === 'success' ? '✓' : '✗'}
            </Text>
          </View>
        </View>
      </View>

      <View style={styles.amounts}>
        <FormattedAmount
          amount={inputAmount}
          symbol={inputSymbol}
          style={styles.amountText}
        />
        <Text style={styles.amountArrow}>→</Text>
        <FormattedAmount
          amount={outputAmount}
          symbol={outputSymbol}
          style={styles.amountText}
        />
      </View>

      <Pressable
        style={styles.txButton}
        onPress={openSolscan}
        accessibilityLabel="View transaction on Solscan"
        accessibilityRole="link"
        android_ripple={{ color: 'rgba(153,69,255,0.2)' }}
      >
        <Text style={styles.txButtonText}>View on Solscan</Text>
        <Text style={styles.txSig} numberOfLines={1}>
          {signature.slice(0, 8)}...{signature.slice(-8)}
        </Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.bg.card,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.border.primary,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  tokenPair: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  tokenIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.bg.tertiary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  tokenIconText: {
    color: colors.text.primary,
    fontSize: fontSize.sm,
    fontWeight: fontWeight.bold,
  },
  arrow: {
    color: colors.text.tertiary,
    fontSize: fontSize.md,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  timestamp: {
    color: colors.text.tertiary,
    fontSize: fontSize.xs,
  },
  statusBadge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.status.successBg,
    justifyContent: 'center',
    alignItems: 'center',
  },
  statusFailed: {
    backgroundColor: colors.status.errorBg,
  },
  statusText: {
    color: colors.status.success,
    fontSize: fontSize.sm,
    fontWeight: fontWeight.bold,
  },
  statusTextFailed: {
    color: colors.status.error,
  },
  amounts: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  amountText: {
    color: colors.text.primary,
    fontSize: fontSize.md,
    fontWeight: fontWeight.medium,
    flex: 1,
    flexShrink: 1,
  },
  amountArrow: {
    color: colors.text.tertiary,
    fontSize: fontSize.md,
    marginHorizontal: spacing.sm,
  },
  txButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.bg.tertiary,
    padding: spacing.sm,
    borderRadius: borderRadius.md,
  },
  txButtonText: {
    color: colors.accent.purple,
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
  },
  txSig: {
    color: colors.text.tertiary,
    fontSize: fontSize.xs,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    maxWidth: '50%',
  },
});

export default memo(SwapHistoryCard);
