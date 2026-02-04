import { useNavigation } from '@react-navigation/native';
import * as Clipboard from 'expo-clipboard';
import * as Haptics from 'expo-haptics';
import { useCallback, useEffect, useState } from 'react';
import {
  Alert,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  AuditAnomaly,
  clearSwapAuditLog,
  detectAnomalies,
  exportAuditLog,
  getAuditStats,
  getSwapAuditLog,
  SwapAuditEntry,
} from '../storage/swapAudit';
import { borderRadius, colors, fontSize, fontWeight, spacing } from '../theme';

export default function Debug() {
  const navigation = useNavigation();
  const [entries, setEntries] = useState<readonly SwapAuditEntry[]>([]);
  const [anomalies, setAnomalies] = useState<readonly AuditAnomaly[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = useCallback(async () => {
    const auditEntries = await getSwapAuditLog();
    setEntries(auditEntries);
    setAnomalies(detectAnomalies(auditEntries));
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  }, [loadData]);

  const handleExport = async () => {
    const json = await exportAuditLog();
    await Clipboard.setStringAsync(json);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    Alert.alert('Exported', 'Audit log copied to clipboard');
  };

  const handleClear = () => {
    Alert.alert(
      'Clear Audit Log',
      'Are you sure you want to delete all audit entries?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear',
          style: 'destructive',
          onPress: async () => {
            await clearSwapAuditLog();
            await loadData();
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          },
        },
      ],
    );
  };

  const stats = getAuditStats(entries);

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getAnomalyForEntry = (entryId: string) => {
    return anomalies.find(a => a.entryId === entryId);
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <View style={styles.headerRow}>
          <Pressable
            onPress={() => navigation.goBack()}
            style={styles.backButton}
            accessibilityLabel="Go back"
            accessibilityRole="button"
            android_ripple={{ color: 'rgba(255,255,255,0.1)', borderless: true }}
          >
            <Text style={styles.backIcon}>←</Text>
          </Pressable>
          <View>
            <Text style={styles.title}>Fee Audit Log</Text>
            <Text style={styles.subtitle}>DEV BUILD ONLY</Text>
          </View>
        </View>
      </View>

      {/* Stats Summary */}
      <View style={styles.statsContainer}>
        <View style={styles.statBox}>
          <Text style={styles.statValue}>{stats.totalSwaps}</Text>
          <Text style={styles.statLabel}>Swaps</Text>
        </View>
        <View style={styles.statBox}>
          <Text style={[styles.statValue, stats.anomalyCount > 0 && styles.statValueWarning]}>
            {stats.anomalyCount}
          </Text>
          <Text style={styles.statLabel}>Anomalies</Text>
        </View>
        <View style={styles.statBox}>
          <Text style={styles.statValue}>{stats.averageFeeBps}</Text>
          <Text style={styles.statLabel}>Avg Fee (bps)</Text>
        </View>
        <View style={styles.statBox}>
          <Text style={styles.statValue}>{stats.zeroFeeCount}</Text>
          <Text style={styles.statLabel}>Zero Fee</Text>
        </View>
      </View>

      {/* Actions */}
      <View style={styles.actions}>
        <Pressable
          style={styles.actionButton}
          onPress={handleExport}
          android_ripple={{ color: 'rgba(255,255,255,0.1)' }}
        >
          <Text style={styles.actionButtonText}>Export JSON</Text>
        </Pressable>
        <Pressable
          style={[styles.actionButton, styles.actionButtonDanger]}
          onPress={handleClear}
          android_ripple={{ color: 'rgba(255,107,107,0.2)' }}
        >
          <Text style={styles.actionButtonText}>Clear Log</Text>
        </Pressable>
      </View>

      {/* Anomalies Banner */}
      {anomalies.length > 0 && (
        <View style={styles.anomalyBanner}>
          <Text style={styles.anomalyBannerIcon}>⚠️</Text>
          <Text style={styles.anomalyBannerText}>
            {anomalies.length} anomal{anomalies.length === 1 ? 'y' : 'ies'} detected
          </Text>
        </View>
      )}

      {/* Entries List */}
      <ScrollView
        style={styles.list}
        contentContainerStyle={styles.listContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.accent.purple} />}
      >
        {entries.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>📋</Text>
            <Text style={styles.emptyText}>No audit entries yet</Text>
            <Text style={styles.emptySubtext}>Swap some tokens to see audit data</Text>
          </View>
        ) : (
          entries.map(entry => {
            const anomaly = getAnomalyForEntry(entry.id);
            return (
              <View
                key={entry.id}
                style={[styles.entryCard, anomaly && styles.entryCardAnomaly]}
              >
                {anomaly && (
                  <View style={styles.anomalyTag}>
                    <Text style={styles.anomalyTagText}>{anomaly.type}</Text>
                  </View>
                )}
                <View style={styles.entryHeader}>
                  <Text style={styles.entryTime}>{formatDate(entry.timestamp)}</Text>
                  <Text style={styles.entryWallet}>
                    {entry.wallet.slice(0, 4)}...{entry.wallet.slice(-4)}
                  </Text>
                </View>
                <View style={styles.entryRow}>
                  <Text style={styles.entryLabel}>Input</Text>
                  <Text style={styles.entryValue}>{entry.inputAmount}</Text>
                </View>
                <View style={styles.entryRow}>
                  <Text style={styles.entryLabel}>Mints</Text>
                  <Text style={styles.entryValueSmall} numberOfLines={1}>
                    {entry.inputMint.slice(0, 4)}→{entry.outputMint.slice(0, 4)}
                  </Text>
                </View>
                <View style={styles.entryRow}>
                  <Text style={styles.entryLabel}>Expected Fee</Text>
                  <Text style={styles.entryValue}>{entry.expectedFeeBps} bps</Text>
                </View>
                <View style={styles.entryRow}>
                  <Text style={styles.entryLabel}>Actual Fee</Text>
                  <Text
                    style={[
                      styles.entryValue,
                      entry.actualFeeBps < entry.expectedFeeBps && styles.entryValueWarning,
                    ]}
                  >
                    {entry.actualFeeBps} bps
                  </Text>
                </View>
                <View style={styles.entryRow}>
                  <Text style={styles.entryLabel}>SKR Balance</Text>
                  <Text style={styles.entryValue}>{entry.skrBalance.toLocaleString()}</Text>
                </View>
                <View style={styles.entryRow}>
                  <Text style={styles.entryLabel}>Seeker NFT</Text>
                  <Text style={styles.entryValue}>{entry.hasSeekerNft ? 'Yes' : 'No'}</Text>
                </View>
                {entry.txSignature && (
                  <View style={styles.entryRow}>
                    <Text style={styles.entryLabel}>TX</Text>
                    <Text style={styles.entryValueSmall} numberOfLines={1}>
                      {entry.txSignature.slice(0, 16)}...
                    </Text>
                  </View>
                )}
                {anomaly && (
                  <View style={styles.anomalyDescription}>
                    <Text style={styles.anomalyDescriptionText}>{anomaly.description}</Text>
                  </View>
                )}
              </View>
            );
          })
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg.primary,
  },
  header: {
    padding: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.primary,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
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
  subtitle: {
    fontSize: fontSize.xs,
    color: colors.status.warning,
    fontWeight: fontWeight.medium,
    marginTop: spacing.xs,
  },
  statsContainer: {
    flexDirection: 'row',
    padding: spacing.md,
    gap: spacing.sm,
  },
  statBox: {
    flex: 1,
    backgroundColor: colors.bg.card,
    borderRadius: borderRadius.md,
    padding: spacing.sm,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border.primary,
  },
  statValue: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.bold,
    color: colors.text.primary,
  },
  statValueWarning: {
    color: colors.status.error,
  },
  statLabel: {
    fontSize: fontSize.xs,
    color: colors.text.tertiary,
    marginTop: 2,
  },
  actions: {
    flexDirection: 'row',
    paddingHorizontal: spacing.md,
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  actionButton: {
    flex: 1,
    backgroundColor: colors.bg.card,
    borderRadius: borderRadius.md,
    padding: spacing.sm,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border.primary,
  },
  actionButtonDanger: {
    borderColor: colors.status.error,
  },
  actionButtonText: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
    color: colors.text.primary,
  },
  anomalyBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.status.errorBg,
    marginHorizontal: spacing.md,
    marginBottom: spacing.md,
    padding: spacing.md,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.status.error,
    gap: spacing.sm,
  },
  anomalyBannerIcon: {
    fontSize: fontSize.lg,
  },
  anomalyBannerText: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
    color: colors.status.error,
  },
  list: {
    flex: 1,
  },
  listContent: {
    padding: spacing.md,
    paddingTop: 0,
    gap: spacing.sm,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: spacing.xxl,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: spacing.md,
  },
  emptyText: {
    fontSize: fontSize.md,
    color: colors.text.primary,
    fontWeight: fontWeight.medium,
  },
  emptySubtext: {
    fontSize: fontSize.sm,
    color: colors.text.tertiary,
    marginTop: spacing.xs,
  },
  entryCard: {
    backgroundColor: colors.bg.card,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border.primary,
  },
  entryCardAnomaly: {
    borderColor: colors.status.error,
  },
  anomalyTag: {
    position: 'absolute',
    top: spacing.sm,
    right: spacing.sm,
    backgroundColor: colors.status.errorBg,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: borderRadius.sm,
  },
  anomalyTagText: {
    fontSize: fontSize.xs,
    color: colors.status.error,
    fontWeight: fontWeight.medium,
  },
  entryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
    paddingBottom: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.primary,
  },
  entryTime: {
    fontSize: fontSize.xs,
    color: colors.text.tertiary,
  },
  entryWallet: {
    fontSize: fontSize.xs,
    color: colors.text.secondary,
    fontFamily: 'monospace',
  },
  entryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 2,
  },
  entryLabel: {
    fontSize: fontSize.sm,
    color: colors.text.tertiary,
  },
  entryValue: {
    fontSize: fontSize.sm,
    color: colors.text.primary,
    fontWeight: fontWeight.medium,
  },
  entryValueSmall: {
    fontSize: fontSize.xs,
    color: colors.text.secondary,
    fontFamily: 'monospace',
    maxWidth: '60%',
  },
  entryValueWarning: {
    color: colors.status.error,
  },
  anomalyDescription: {
    marginTop: spacing.sm,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border.primary,
  },
  anomalyDescriptionText: {
    fontSize: fontSize.xs,
    color: colors.status.error,
  },
});
