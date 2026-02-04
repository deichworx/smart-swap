import { useNavigation } from '@react-navigation/native';
import { useCallback, useMemo } from 'react';
import {
  ActivityIndicator,
  FlatList,
  ListRenderItemInfo,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import SwapHistoryCard from '../components/SwapHistoryCard';
import { useSwapHistory } from '../hooks/useSwapHistory';
import { useTokenList } from '../hooks/useTokenList';
import { colors, fontSize, fontWeight, spacing } from '../theme';

type HistoryItemData = {
  readonly inputSymbol: string;
  readonly outputSymbol: string;
  readonly inputAmount: string;
  readonly outputAmount: string;
  readonly signature: string;
  readonly timestamp: number;
  readonly status: 'success' | 'failed';
};

export default function History() {
  const navigation = useNavigation();
  const { history, isLoading, refresh } = useSwapHistory();
  const { getToken, isLoading: tokensLoading } = useTokenList();

  const loading = isLoading || tokensLoading;

  // Pre-compute symbol lookups once when history or tokens change
  const historyWithSymbols = useMemo((): readonly HistoryItemData[] => {
    return history.map((item): HistoryItemData => {
      const inputToken = item.inputMint ? getToken(item.inputMint) : undefined;
      const outputToken = item.outputMint ? getToken(item.outputMint) : undefined;
      return {
        inputSymbol: inputToken?.symbol ?? (item.inputMint ? `${item.inputMint.slice(0, 4)}...` : '?'),
        outputSymbol: outputToken?.symbol ?? (item.outputMint ? `${item.outputMint.slice(0, 4)}...` : '?'),
        inputAmount: item.inputAmount ?? '?',
        outputAmount: item.outputAmount ?? '?',
        signature: item.signature,
        timestamp: item.timestamp,
        status: item.status,
      };
    });
  }, [history, getToken]);

  const renderItem = useCallback(({ item }: ListRenderItemInfo<HistoryItemData>) => (
    <SwapHistoryCard
      inputSymbol={item.inputSymbol}
      outputSymbol={item.outputSymbol}
      inputAmount={item.inputAmount}
      outputAmount={item.outputAmount}
      signature={item.signature}
      timestamp={item.timestamp}
      status={item.status}
    />
  ), []);

  const keyExtractor = useCallback((item: HistoryItemData) => item.signature, []);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Pressable
          onPress={() => navigation.goBack()}
          style={styles.backButton}
          accessibilityLabel="Go back to swap screen"
          accessibilityRole="button"
          android_ripple={{ color: 'rgba(255,255,255,0.1)', borderless: true }}
        >
          <Text style={styles.backIcon}>←</Text>
        </Pressable>
        <Text style={styles.title}>Swap History</Text>
        <View style={styles.backButton} />
      </View>

      {loading && history.length === 0 ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.accent.purple} />
        </View>
      ) : history.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyIcon}>📜</Text>
          <Text style={styles.emptyTitle}>No Swaps Yet</Text>
          <Text style={styles.emptyText}>
            Your swap history will appear here after your first transaction.
          </Text>
        </View>
      ) : (
        <FlatList
          data={historyWithSymbols}
          keyExtractor={keyExtractor}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={isLoading}
              onRefresh={refresh}
              tintColor={colors.accent.purple}
            />
          }
          renderItem={renderItem}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg.primary,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xl,
    paddingBottom: spacing.md,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  backIcon: {
    color: colors.text.primary,
    fontSize: fontSize.xl,
  },
  title: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.bold,
    color: colors.text.primary,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: spacing.md,
  },
  emptyTitle: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.semibold,
    color: colors.text.primary,
    marginBottom: spacing.sm,
  },
  emptyText: {
    fontSize: fontSize.md,
    color: colors.text.secondary,
    textAlign: 'center',
  },
  list: {
    padding: spacing.lg,
    paddingTop: spacing.sm,
  },
});
