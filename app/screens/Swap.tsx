import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { RootStackParamList } from '../app';
import AmountInput from '../components/AmountInput';
import { Confetti } from '../components/Confetti';
import DoubleTapButton from '../components/DoubleTapButton';
import TokenSelector from '../components/TokenSelector';
import { useAutoRefreshingQuote } from '../hooks/useAutoRefreshingQuote';
import { useFeeTier } from '../hooks/useFeeTier';
import { useSettings } from '../hooks/useSettings';
import { useNetworkStatus } from '../hooks/useNetworkStatus';
import { FormattedAmount, FormattedRawAmount } from '../components/FormattedAmount';
import { formatFee } from '../jupiter/fees';
import { getSwapTransaction } from '../jupiter/quote';
import { getToken, parseTokenAmount, Token, TOKENS } from '../jupiter/tokens';
import { getTokenBalance } from '../solana/balance';
import { logSwapAudit } from '../storage/swapAudit';
import { borderRadius, colors, fontSize, fontWeight, spacing } from '../theme';
import { wallet } from '../wallet/wallet';

type NavigationProp = NativeStackNavigationProp<RootStackParamList, 'Swap'>;

export default function Swap() {
  const navigation = useNavigation<NavigationProp>();
  const { isConnected } = useNetworkStatus();
  const { settings } = useSettings();
  const {
    tier,
    effectiveFeeBps,
    nextTier,
    tierProgress,
    hasSeekerNft,
    skrBalance,
  } = useFeeTier();
  const [inputToken, setInputToken] = useState<Token>(TOKENS[0]);
  const [outputToken, setOutputToken] = useState<Token>(TOKENS[1]);
  const [inputAmount, setInputAmount] = useState('0.01');
  const [txStatus, setTxStatus] = useState<'idle' | 'signing' | 'executing' | 'success'>('idle');
  const [txError, setTxError] = useState<string | null>(null);
  const [txSignature, setTxSignature] = useState<string | null>(null);
  const [inputBalance, setInputBalance] = useState<string | null>(null);
  const [outputBalance, setOutputBalance] = useState<string | null>(null);
  const [showConfetti, setShowConfetti] = useState(false);

  // Show confetti on successful swap
  useEffect(() => {
    if (txStatus === 'success' && settings.confettiEnabled) {
      setShowConfetti(true);
    }
  }, [txStatus, settings.confettiEnabled]);

  const handleConfettiComplete = useCallback(() => {
    setShowConfetti(false);
  }, []);

  // Use the auto-refreshing quote hook with dynamic fee based on SKR tier
  const isPaused = txStatus === 'signing' || txStatus === 'executing' || txStatus === 'success';
  const {
    quote,
    quoteAge,
    status: quoteStatus,
    error: quoteError,
    refresh: refreshQuote,
    clearQuote,
  } = useAutoRefreshingQuote({
    inputToken,
    outputToken,
    inputAmount,
    isConnected,
    isPaused,
    platformFeeBps: effectiveFeeBps,
  });

  // Fetch token balances
  useEffect(() => {
    if (!wallet.publicKey) return;

    const walletAddr = wallet.publicKey.toString();

    getTokenBalance(walletAddr, inputToken.mint)
      .then(setInputBalance)
      .catch(() => setInputBalance(null));

    getTokenBalance(walletAddr, outputToken.mint)
      .then(setOutputBalance)
      .catch(() => setOutputBalance(null));
  }, [inputToken.mint, outputToken.mint, txStatus]); // Refresh after swap

  const swapTokens = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const temp = inputToken;
    setInputToken(outputToken);
    setOutputToken(temp);
    setInputAmount('');
    clearQuote();
  };

  const executeSwap = async () => {
    if (!quote || !wallet.publicKey) return;

    // Check network before executing
    if (!isConnected) {
      setTxError('No internet connection');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      return;
    }

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setTxStatus('signing');
    setTxError(null);

    try {
      // 1. Get swap transaction from Jupiter
      const tx = await getSwapTransaction(quote, wallet.publicKey.toString());

      // 2. Sign and send with wallet (MWA handles submission)
      setTxStatus('executing');
      const signature = await wallet.signAndSendTransaction(tx);

      setTxSignature(signature);
      setTxStatus('success');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

      // Log swap for fee audit
      logSwapAudit({
        wallet: wallet.publicKey.toString(),
        inputMint: inputToken.mint,
        outputMint: outputToken.mint,
        inputAmount,
        expectedFeeBps: effectiveFeeBps,
        actualFeeBps: quote.platformFee?.feeBps ?? effectiveFeeBps,
        skrBalance,
        hasSeekerNft,
        txSignature: signature,
      });
    } catch (e) {
      const errorMsg = e instanceof Error ? e.message : 'Swap failed';

      // CancellationException means wallet closed after signing
      // Transaction was likely sent - user should check wallet/history
      if (errorMsg.includes('Cancellation') || errorMsg.includes('check wallet')) {
        setTxSignature('Transaction sent - check History');
        setTxStatus('success');
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

        // Log swap for fee audit (even uncertain ones)
        logSwapAudit({
          wallet: wallet.publicKey.toString(),
          inputMint: inputToken.mint,
          outputMint: outputToken.mint,
          inputAmount,
          expectedFeeBps: effectiveFeeBps,
          actualFeeBps: quote.platformFee?.feeBps ?? effectiveFeeBps,
          skrBalance,
          hasSeekerNft,
          txSignature: null,
        });
      } else {
        setTxError(errorMsg);
        setTxStatus('idle');
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      }
    }
  };

  const resetSwap = () => {
    setTxStatus('idle');
    setTxSignature(null);
    setTxError(null);
    setInputAmount('');
    clearQuote();
  };

  const isLoading = quoteStatus === 'loading' || txStatus === 'signing' || txStatus === 'executing';
  const canSwap = quote && wallet.publicKey && txStatus === 'idle' && quoteStatus === 'idle' && parseTokenAmount(inputAmount, inputToken.decimals) !== '0';

  // Combined error from quote or transaction
  const error = txError || quoteError;

  const outputDecimals = quote ? (getToken(quote.outputMint)?.decimals ?? 6) : 6;

  // Calculate rate for display
  const rate = quote
    ? (Number(quote.outAmount) / Number(quote.inAmount) * Math.pow(10, inputToken.decimals - (getToken(quote.outputMint)?.decimals ?? 6))).toFixed(4)
    : null;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <Confetti visible={showConfetti} onComplete={handleConfettiComplete} />
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          contentContainerStyle={styles.scroll}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>Swap</Text>
            <View style={styles.headerRight}>
              <Pressable
                style={styles.headerButton}
                onPress={() => navigation.navigate('Settings')}
                accessibilityLabel="Settings"
                accessibilityRole="button"
                android_ripple={{ color: 'rgba(255,255,255,0.1)', borderless: true }}
              >
                <Text style={styles.headerButtonIcon}>⚙️</Text>
              </Pressable>
              <Pressable
                style={styles.historyButton}
                onPress={() => navigation.navigate('History')}
                accessibilityLabel="View swap history"
                accessibilityRole="button"
                android_ripple={{ color: 'rgba(255,255,255,0.1)' }}
              >
                <Text style={styles.historyButtonText}>History</Text>
              </Pressable>
              {wallet.publicKey && (
                <Pressable
                  style={styles.walletBadge}
                  onLongPress={async () => {
                    await wallet.disconnect();
                    navigation.reset({
                      index: 0,
                      routes: [{ name: 'Home' }],
                    });
                  }}
                  accessibilityLabel={`Connected wallet ${wallet.publicKey.toString().slice(0, 4)}...${wallet.publicKey.toString().slice(-4)}. Long press to disconnect.`}
                  accessibilityRole="button"
                  accessibilityHint="Long press to disconnect wallet"
                  android_ripple={{ color: 'rgba(255,255,255,0.1)' }}
                >
                  <View style={styles.walletDot} />
                  <Text style={styles.walletText}>
                    {wallet.publicKey.toString().slice(0, 4)}...
                    {wallet.publicKey.toString().slice(-4)}
                  </Text>
                </Pressable>
              )}
            </View>
          </View>

          {/* Offline Banner */}
          {!isConnected && (
            <View style={styles.offlineBanner}>
              <Text style={styles.offlineIcon}>📶</Text>
              <Text style={styles.offlineText}>No internet connection</Text>
            </View>
          )}

          {/* Compact SKR Loyalty Badge - Tap for full details */}
          <Pressable
            style={({ pressed }) => [styles.tierBadgeCompact, pressed && { opacity: 0.7 }]}
            onPress={() => navigation.navigate('Loyalty')}
            accessibilityLabel={`${tier.name} tier, ${formatFee(effectiveFeeBps)} fee. Tap for details.`}
            accessibilityRole="button"
            android_ripple={{ color: 'rgba(255,255,255,0.1)' }}
          >
            <Text style={styles.tierIconCompact}>{tier.icon}</Text>
            <View style={styles.tierInfoCompact}>
              <Text style={styles.tierNameCompact}>{tier.name}</Text>
              {nextTier && (
                <View style={styles.tierProgressCompact}>
                  <View style={[styles.tierProgressFillCompact, { width: `${tierProgress}%` }]} />
                </View>
              )}
            </View>
            <View style={styles.tierFeeCompact}>
              <Text style={[
                styles.tierFeeValueCompact,
                effectiveFeeBps === 0 && styles.tierFeeFreeCompact,
              ]}>
                {formatFee(effectiveFeeBps)}
              </Text>
              {hasSeekerNft && <Text style={styles.nftBonusCompact}>+NFT</Text>}
            </View>
            <Text style={styles.tierChevron}>›</Text>
          </Pressable>

          {/* Jupiter Badge + Rate */}
          <View style={styles.rateContainer}>
            <View style={styles.ultraBadge}>
              <Text style={styles.ultraText}>⚡ Jupiter</Text>
            </View>
            {rate && (
              <View style={styles.rateBox}>
                <Text style={styles.ratePreview}>
                  1 {inputToken.symbol} = {rate} {outputToken.symbol}
                </Text>
                <Text style={[
                  styles.rateAge,
                  quoteAge > 8 && styles.rateAgeStale,
                ]}>
                  {quoteAge}s
                </Text>
                <Pressable
                  onPress={refreshQuote}
                  disabled={quoteStatus === 'loading'}
                  style={styles.refreshButton}
                  accessibilityLabel="Refresh quote"
                  accessibilityRole="button"
                  android_ripple={{ color: 'rgba(255,255,255,0.2)', borderless: true }}
                >
                  <Text style={[
                    styles.refreshIcon,
                    quoteStatus === 'loading' && styles.refreshIconLoading,
                  ]}>↻</Text>
                </Pressable>
              </View>
            )}
          </View>

          {/* Input Card */}
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <View>
                <Text style={styles.cardLabel}>You pay</Text>
                {inputBalance !== null && (
                  <Text style={styles.balanceText}>
                    Balance: <FormattedAmount amount={inputBalance} symbol={inputToken.symbol} style={styles.balanceText} />
                  </Text>
                )}
              </View>
              <TokenSelector
                selected={inputToken}
                onSelect={setInputToken}
                excludeMint={outputToken.mint}
              />
            </View>
            <AmountInput
              value={inputAmount}
              onChangeText={setInputAmount}
              token={inputToken}
              label=""
            />
            {inputBalance !== null && (
              <Pressable
                style={styles.maxButton}
                onPress={() => setInputAmount(inputBalance)}
                accessibilityLabel={`Set maximum amount: ${parseFloat(inputBalance).toLocaleString(undefined, { maximumFractionDigits: 4 })} ${inputToken.symbol}`}
                accessibilityRole="button"
                android_ripple={{ color: 'rgba(153,69,255,0.3)' }}
              >
                <Text style={styles.maxButtonText}>MAX</Text>
              </Pressable>
            )}
          </View>

          {/* Swap Arrow */}
          <Pressable
            style={styles.swapArrow}
            onPress={swapTokens}
            accessibilityLabel={`Swap ${inputToken.symbol} and ${outputToken.symbol} positions`}
            accessibilityRole="button"
            android_ripple={{ color: 'rgba(255,255,255,0.2)', borderless: true }}
          >
            <LinearGradient
              colors={colors.accent.gradient}
              style={styles.swapArrowGradient}
            >
              <Text style={styles.swapArrowIcon}>↕</Text>
            </LinearGradient>
          </Pressable>

          {/* Output Card */}
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <View>
                <Text style={styles.cardLabel}>You receive</Text>
                {outputBalance !== null && (
                  <Text style={styles.balanceText}>
                    Balance: <FormattedAmount amount={outputBalance} symbol={outputToken.symbol} style={styles.balanceText} />
                  </Text>
                )}
              </View>
              <TokenSelector
                selected={outputToken}
                onSelect={setOutputToken}
                excludeMint={inputToken.mint}
              />
            </View>
            <View style={styles.outputDisplay}>
              {quote ? (
                <FormattedRawAmount
                  rawAmount={quote.outAmount}
                  decimals={outputDecimals}
                  style={styles.outputAmount}
                />
              ) : (
                <Text style={[styles.outputAmount, styles.outputPlaceholder]}>—</Text>
              )}
              {quoteStatus === 'loading' && (
                <ActivityIndicator size="small" color={colors.accent.purple} />
              )}
            </View>
          </View>

          {/* Quote Details */}
          {quote && quoteStatus !== 'loading' && (
            <View style={styles.detailsCard}>
              <DetailRow
                label="Rate"
                value={`1 ${inputToken.symbol} ≈ ${rate} ${outputToken.symbol}`}
              />
              <DetailRow
                label="Route"
                value={quote.routePlan.map(r => r.swapInfo.label).join(' → ')}
              />
              <DetailRow
                label="Price Impact"
                value={`${Number(quote.priceImpactPct).toFixed(3)}%`}
                valueColor={Number(quote.priceImpactPct) > 1 ? colors.status.warning : colors.text.secondary}
              />
              <DetailRow
                label="Slippage"
                value={`${(quote.slippageBps ?? 50) / 100}%`}
              />
            </View>
          )}

          {/* Error State */}
          {error && (
            <View style={styles.errorCard}>
              <Text style={styles.errorIcon}>⚠️</Text>
              <Text style={styles.errorText}>{error}</Text>
              <Pressable
                onPress={() => {
                  setTxError(null);
                  refreshQuote();
                }}
                accessibilityLabel="Retry fetching quote"
                accessibilityRole="button"
                android_ripple={{ color: 'rgba(255,255,255,0.2)' }}
              >
                <Text style={styles.retryText}>Try again</Text>
              </Pressable>
            </View>
          )}

          {/* Success State */}
          {txStatus === 'success' && txSignature && (
            <View style={styles.successCard}>
              <LinearGradient
                colors={[colors.status.successBg, 'transparent']}
                style={styles.successGradient}
              />
              <Text style={styles.successIcon}>✓</Text>
              <Text style={styles.successTitle}>Swap Complete!</Text>
              <Text style={styles.successSig} numberOfLines={1}>
                {txSignature}
              </Text>
              <Pressable
                style={styles.newSwapButton}
                onPress={resetSwap}
                accessibilityLabel="Start a new swap"
                accessibilityRole="button"
                android_ripple={{ color: 'rgba(20,241,149,0.2)' }}
              >
                <Text style={styles.newSwapText}>New Swap</Text>
              </Pressable>
            </View>
          )}

          {/* Processing State */}
          {(txStatus === 'signing' || txStatus === 'executing') && (
            <View style={styles.processingCard}>
              <ActivityIndicator size="large" color={colors.accent.purple} />
              <Text style={styles.processingText}>
                {txStatus === 'signing' ? 'Confirm in wallet...' : 'Jupiter executing swap...'}
              </Text>
            </View>
          )}
        </ScrollView>

        {/* Bottom Action */}
        {txStatus !== 'success' && (
          <View style={styles.bottomAction}>
            <DoubleTapButton
              onConfirm={executeSwap}
              disabled={!canSwap || isLoading}
              label="Tap to Swap"
              confirmLabel="Tap again to confirm"
            />
          </View>
        )}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function DetailRow({
  label,
  value,
  valueColor,
}: {
  label: string;
  value: string;
  valueColor?: string;
}) {
  return (
    <View style={styles.detailRow}>
      <Text style={styles.detailLabel}>{label}</Text>
      <Text style={[styles.detailValue, valueColor && { color: valueColor }]} numberOfLines={1}>
        {value}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg.primary,
  },
  flex: {
    flex: 1,
  },
  scroll: {
    padding: spacing.lg,
    paddingBottom: 120,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  title: {
    fontSize: fontSize.xxl,
    fontWeight: fontWeight.bold,
    color: colors.text.primary,
  },
  headerButton: {
    backgroundColor: colors.bg.card,
    padding: spacing.sm,
    borderRadius: borderRadius.full,
    borderWidth: 1,
    borderColor: colors.border.primary,
    marginRight: spacing.sm,
  },
  headerButtonIcon: {
    fontSize: fontSize.md,
  },
  historyButton: {
    backgroundColor: colors.bg.card,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.full,
    borderWidth: 1,
    borderColor: colors.border.primary,
  },
  historyButtonText: {
    fontSize: fontSize.xs,
    color: colors.text.secondary,
    fontWeight: fontWeight.medium,
  },
  walletBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.bg.card,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.full,
    borderWidth: 1,
    borderColor: colors.border.primary,
  },
  walletDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.accent.green,
    marginRight: spacing.sm,
  },
  walletText: {
    fontSize: fontSize.xs,
    color: colors.text.secondary,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  // Compact Tier Badge
  tierBadgeCompact: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.bg.card,
    borderRadius: borderRadius.md,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.border.primary,
    gap: spacing.sm,
  },
  tierIconCompact: {
    fontSize: 18,
  },
  tierInfoCompact: {
    flex: 1,
  },
  tierNameCompact: {
    color: colors.text.primary,
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
  },
  tierProgressCompact: {
    height: 3,
    backgroundColor: colors.bg.tertiary,
    borderRadius: 2,
    marginTop: 4,
    overflow: 'hidden',
  },
  tierProgressFillCompact: {
    height: '100%',
    backgroundColor: colors.accent.purple,
    borderRadius: 2,
  },
  tierFeeCompact: {
    alignItems: 'flex-end',
  },
  tierFeeValueCompact: {
    color: colors.accent.green,
    fontSize: fontSize.sm,
    fontWeight: fontWeight.bold,
  },
  tierFeeFreeCompact: {
    color: colors.accent.purple,
  },
  nftBonusCompact: {
    color: colors.accent.green,
    fontSize: 9,
    fontWeight: fontWeight.medium,
  },
  tierChevron: {
    color: colors.text.tertiary,
    fontSize: fontSize.lg,
    marginLeft: spacing.xs,
  },
  rateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  ultraBadge: {
    backgroundColor: colors.overlay.purpleLight,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.sm,
  },
  ultraText: {
    color: colors.accent.purple,
    fontSize: fontSize.xs,
    fontWeight: fontWeight.medium,
  },
  rateBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.bg.secondary,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.sm,
    gap: spacing.sm,
  },
  ratePreview: {
    color: colors.accent.green,
    fontSize: fontSize.xs,
    fontWeight: fontWeight.medium,
  },
  rateAge: {
    color: colors.text.tertiary,
    fontSize: fontSize.xs,
    minWidth: 24,
    textAlign: 'right',
  },
  rateAgeStale: {
    color: colors.status.warning,
  },
  refreshButton: {
    padding: spacing.sm,
    marginLeft: spacing.xs,
    minWidth: 44,
    minHeight: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  refreshIcon: {
    color: colors.accent.purple,
    fontSize: fontSize.md,
    fontWeight: fontWeight.bold,
  },
  refreshIconLoading: {
    color: colors.text.tertiary,
  },
  card: {
    backgroundColor: colors.bg.card,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border.primary,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  cardLabel: {
    fontSize: fontSize.sm,
    color: colors.text.secondary,
  },
  balanceText: {
    fontSize: fontSize.xs,
    color: colors.text.tertiary,
    marginTop: 2,
  },
  maxButton: {
    position: 'absolute',
    right: spacing.md,
    bottom: spacing.md,
    backgroundColor: colors.bg.secondary,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.sm,
  },
  maxButtonText: {
    fontSize: fontSize.xs,
    color: colors.accent.purple,
    fontWeight: fontWeight.semibold,
  },
  swapArrow: {
    alignSelf: 'center',
    marginVertical: -spacing.md,
    zIndex: 10,
  },
  swapArrowGradient: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: colors.bg.primary,
  },
  swapArrowIcon: {
    fontSize: 18,
    color: colors.text.primary,
    fontWeight: fontWeight.bold,
  },
  outputDisplay: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
  },
  outputAmount: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.semibold,
    color: colors.text.primary,
    flex: 1,
  },
  outputPlaceholder: {
    color: colors.text.tertiary,
  },
  detailsCard: {
    backgroundColor: colors.bg.secondary,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginTop: spacing.md,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: spacing.xs,
  },
  detailLabel: {
    fontSize: fontSize.sm,
    color: colors.text.tertiary,
  },
  detailValue: {
    fontSize: fontSize.sm,
    color: colors.text.secondary,
    maxWidth: '60%',
    textAlign: 'right',
  },
  errorCard: {
    backgroundColor: colors.status.errorBg,
    borderRadius: borderRadius.md,
    padding: spacing.lg,
    marginTop: spacing.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.status.error,
  },
  errorIcon: {
    fontSize: 24,
    marginBottom: spacing.sm,
  },
  errorText: {
    color: colors.status.error,
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  retryText: {
    color: colors.text.primary,
    fontWeight: fontWeight.semibold,
  },
  successCard: {
    backgroundColor: colors.bg.card,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    marginTop: spacing.md,
    alignItems: 'center',
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.accent.green,
  },
  successGradient: {
    ...StyleSheet.absoluteFillObject,
  },
  successIcon: {
    fontSize: 48,
    color: colors.accent.green,
    marginBottom: spacing.sm,
  },
  successTitle: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.semibold,
    color: colors.text.primary,
    marginBottom: spacing.sm,
  },
  successSig: {
    fontSize: fontSize.xs,
    color: colors.text.tertiary,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    marginBottom: spacing.md,
  },
  newSwapButton: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.accent.green,
  },
  newSwapText: {
    color: colors.accent.green,
    fontWeight: fontWeight.semibold,
  },
  processingCard: {
    backgroundColor: colors.bg.card,
    borderRadius: borderRadius.lg,
    padding: spacing.xl,
    marginTop: spacing.md,
    alignItems: 'center',
  },
  processingText: {
    color: colors.text.secondary,
    marginTop: spacing.md,
  },
  bottomAction: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: spacing.lg,
    backgroundColor: colors.bg.primary,
    borderTopWidth: 1,
    borderTopColor: colors.border.primary,
  },
  offlineBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.status.warningBg,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.md,
    marginBottom: spacing.md,
    gap: spacing.sm,
  },
  offlineIcon: {
    fontSize: fontSize.md,
  },
  offlineText: {
    color: colors.status.warning,
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
  },
});
