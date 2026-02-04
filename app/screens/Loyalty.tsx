import { useNavigation } from '@react-navigation/native';
import { memo, useCallback, useEffect, useState } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { FEE_TIERS, SEEKER_NFT_BONUS_BPS, useFeeTier } from '../hooks/useFeeTier';
import { formatFee, FeeTier, ACTIVE_CAMPAIGN } from '../jupiter/fees';
import {
  getCampaignStatus,
  getCampaignTimeRemaining,
  type CampaignReward,
  type CampaignStatus,
} from '../jupiter/campaigns';
import { borderRadius, colors, fontSize, fontWeight, spacing } from '../theme';

// Hook for live countdown timer
function useCampaignCountdown() {
  const [timeRemaining, setTimeRemaining] = useState(() => getCampaignTimeRemaining(ACTIVE_CAMPAIGN));
  const [status, setStatus] = useState<CampaignStatus>(() => getCampaignStatus(ACTIVE_CAMPAIGN));

  useEffect(() => {
    // Update every second for campaigns with end dates
    if (!ACTIVE_CAMPAIGN.endDate) return;

    const interval = setInterval(() => {
      const remaining = getCampaignTimeRemaining(ACTIVE_CAMPAIGN);
      setTimeRemaining(remaining);
      setStatus(getCampaignStatus(ACTIVE_CAMPAIGN));
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  // Format for display
  const formatCountdown = (): string => {
    if (!timeRemaining) return 'Ongoing';
    if (timeRemaining.total === 0) return 'Ended';

    const { days, hours, minutes } = timeRemaining;
    if (days > 0) {
      return `${days}d ${hours}h ${minutes}m`;
    }
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  };

  return { timeRemaining, status, formatCountdown };
}

type TierRowProps = {
  readonly tier: FeeTier;
  readonly isCurrentTier: boolean;
  readonly isUnlocked: boolean;
  readonly skrBalance: number;
};

const TierRow = memo(function TierRow({
  tier,
  isCurrentTier,
  isUnlocked,
  skrBalance,
}: TierRowProps) {
  const skrNeeded = tier.minSkr - skrBalance;

  return (
    <View
      style={[
        styles.tierRow,
        isCurrentTier && styles.tierRowCurrent,
        !isUnlocked && styles.tierRowLocked,
      ]}
    >
      <View style={styles.tierRowLeft}>
        <Text style={styles.tierIcon}>{tier.icon}</Text>
        <View>
          <View style={styles.tierNameRow}>
            <Text style={[styles.tierName, !isUnlocked && styles.tierNameLocked]}>
              {tier.name}
            </Text>
            {isCurrentTier && (
              <View style={styles.currentBadge}>
                <Text style={styles.currentBadgeText}>Current</Text>
              </View>
            )}
          </View>
          <Text style={styles.tierRequirement}>
            {tier.minSkr === 0 ? 'No minimum' : `${tier.minSkr.toLocaleString()} ${ACTIVE_CAMPAIGN.tokenSymbol}`}
          </Text>
        </View>
      </View>
      <View style={styles.tierRowRight}>
        <Text style={[styles.tierFee, tier.feeBps === 0 && styles.tierFeeFree]}>
          {formatFee(tier.feeBps)}
        </Text>
        {!isUnlocked && skrNeeded > 0 && (
          <Text style={styles.tierSkrNeeded}>
            +{skrNeeded.toLocaleString()} {ACTIVE_CAMPAIGN.tokenSymbol}
          </Text>
        )}
      </View>
    </View>
  );
});

export default function Loyalty() {
  const navigation = useNavigation();
  const {
    tier,
    effectiveFeeBps,
    skrBalance,
    nextTier,
    skrToNextTier,
    tierProgress,
    hasSeekerNft,
  } = useFeeTier();

  // Live countdown timer
  const { status: campaignStatus, formatCountdown } = useCampaignCountdown();
  const campaignTimeRemaining = formatCountdown();

  const goBack = useCallback(() => navigation.goBack(), [navigation]);

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable
          onPress={goBack}
          style={styles.backButton}
          accessibilityLabel="Go back"
          accessibilityRole="button"
        >
          <Text style={styles.backIcon}>←</Text>
        </Pressable>
        <Text style={styles.title}>{ACTIVE_CAMPAIGN.name}</Text>
        <View style={styles.backButton} />
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Campaign Info Card */}
        <View style={styles.campaignCard}>
          <View style={styles.campaignHeader}>
            <View style={styles.campaignBadge}>
              <Text style={styles.campaignBadgeText}>
                {campaignStatus === 'active' ? 'ACTIVE' : campaignStatus.toUpperCase()}
              </Text>
            </View>
            <Text style={styles.campaignTime}>{campaignTimeRemaining}</Text>
          </View>
          <Text style={styles.campaignDescription}>{ACTIVE_CAMPAIGN.description}</Text>
          <View style={styles.campaignSponsor}>
            <Text style={styles.campaignSponsorLabel}>Sponsored by</Text>
            <Text style={styles.campaignSponsorName}>{ACTIVE_CAMPAIGN.sponsorName}</Text>
          </View>
          {ACTIVE_CAMPAIGN.rewards.length > 0 && (
            <View style={styles.rewardsSection}>
              <Text style={styles.rewardsTitle}>Rewards</Text>
              {ACTIVE_CAMPAIGN.rewards.map((reward: CampaignReward, index: number) => (
                <View key={index} style={styles.rewardItem}>
                  <Text style={styles.rewardIcon}>
                    {reward.type === 'airdrop' ? '🎁' : reward.type === 'nft' ? '🖼️' : '✨'}
                  </Text>
                  <View style={styles.rewardInfo}>
                    <Text style={styles.rewardName}>{reward.name}</Text>
                    <Text style={styles.rewardDesc}>{reward.description}</Text>
                    {reward.requirement && (
                      <Text style={styles.rewardReq}>{reward.requirement}</Text>
                    )}
                  </View>
                </View>
              ))}
            </View>
          )}
        </View>

        {/* Current Status Card */}
        <View style={styles.statusCard}>
          <View style={styles.statusHeader}>
            <Text style={styles.statusIcon}>{tier.icon}</Text>
            <View style={styles.statusInfo}>
              <Text style={styles.statusTierName}>{tier.name}</Text>
              <Text style={styles.statusLevel}>Level {tier.level} of {FEE_TIERS.length}</Text>
            </View>
            <View style={styles.statusFeeBox}>
              <Text style={styles.statusFeeLabel}>Your Fee</Text>
              <Text style={[
                styles.statusFeeValue,
                effectiveFeeBps === 0 && styles.statusFeeFree,
              ]}>
                {formatFee(effectiveFeeBps)}
              </Text>
            </View>
          </View>

          {/* Token Balance */}
          <View style={styles.balanceRow}>
            <Text style={styles.balanceLabel}>{ACTIVE_CAMPAIGN.tokenSymbol} Balance</Text>
            <Text style={styles.balanceValue}>{skrBalance.toLocaleString()}</Text>
          </View>

          {/* Progress to Next Tier */}
          {nextTier && (
            <View style={styles.progressSection}>
              <View style={styles.progressHeader}>
                <Text style={styles.progressLabel}>Progress to {nextTier.name}</Text>
                <Text style={styles.progressPercent}>{Math.floor(tierProgress)}%</Text>
              </View>
              <View style={styles.progressBar}>
                <View style={[styles.progressFill, { width: `${tierProgress}%` }]} />
              </View>
              <Text style={styles.progressHint}>
                {skrToNextTier.toLocaleString()} {ACTIVE_CAMPAIGN.tokenSymbol} to unlock {formatFee(nextTier.feeBps)} fee
              </Text>
            </View>
          )}

          {tier.level === FEE_TIERS.length && (
            <View style={styles.maxTierBanner}>
              <Text style={styles.maxTierText}>Maximum tier reached!</Text>
              <Text style={styles.maxTierSubtext}>You enjoy zero platform fees</Text>
            </View>
          )}
        </View>

        {/* Seeker NFT Bonus */}
        <View style={[styles.bonusCard, hasSeekerNft && styles.bonusCardActive]}>
          <View style={styles.bonusHeader}>
            <Text style={styles.bonusIcon}>📱</Text>
            <View style={styles.bonusInfo}>
              <Text style={styles.bonusTitle}>Seeker Genesis Token</Text>
              <Text style={styles.bonusSubtitle}>
                {hasSeekerNft ? 'Bonus active!' : 'Not detected'}
              </Text>
            </View>
            <View style={styles.bonusValue}>
              <Text style={[styles.bonusAmount, hasSeekerNft && styles.bonusAmountActive]}>
                -{(SEEKER_NFT_BONUS_BPS / 100).toFixed(2)}%
              </Text>
            </View>
          </View>
          <Text style={styles.bonusDescription}>
            Seeker device owners get an additional fee reduction on all swaps.
            {!hasSeekerNft && ' Connect with a wallet holding a Seeker Genesis Token to activate.'}
          </Text>
        </View>

        {/* All Tiers */}
        <View style={styles.tiersSection}>
          <Text style={styles.tiersSectionTitle}>All Tiers</Text>
          <Text style={styles.tiersSectionSubtitle}>
            Hold more {ACTIVE_CAMPAIGN.tokenSymbol} to unlock lower fees
          </Text>

          {FEE_TIERS.map((t) => (
            <TierRow
              key={t.level}
              tier={t}
              isCurrentTier={t.level === tier.level}
              isUnlocked={skrBalance >= t.minSkr}
              skrBalance={skrBalance}
            />
          ))}
        </View>

        {/* Info Section */}
        <View style={styles.infoSection}>
          <Text style={styles.infoTitle}>How it works</Text>
          <View style={styles.infoItem}>
            <Text style={styles.infoBullet}>1</Text>
            <Text style={styles.infoText}>
              Hold {ACTIVE_CAMPAIGN.tokenSymbol} tokens in your connected wallet
            </Text>
          </View>
          <View style={styles.infoItem}>
            <Text style={styles.infoBullet}>2</Text>
            <Text style={styles.infoText}>
              Your tier is automatically determined by your balance
            </Text>
          </View>
          <View style={styles.infoItem}>
            <Text style={styles.infoBullet}>3</Text>
            <Text style={styles.infoText}>
              Higher tiers = lower fees on every swap
            </Text>
          </View>
          <View style={styles.infoItem}>
            <Text style={styles.infoBullet}>4</Text>
            <Text style={styles.infoText}>
              Campaigns change - new tokens, new rewards!
            </Text>
          </View>
        </View>
      </ScrollView>
    </View>
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
  scroll: {
    flex: 1,
  },
  scrollContent: {
    padding: spacing.lg,
    paddingBottom: spacing.xl * 2,
  },
  // Campaign Card
  campaignCard: {
    backgroundColor: colors.bg.card,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    marginBottom: spacing.lg,
    borderWidth: 1,
    borderColor: colors.accent.purple,
    borderStyle: 'dashed',
  },
  campaignHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  campaignBadge: {
    backgroundColor: colors.accent.green,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.sm,
  },
  campaignBadgeText: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.bold,
    color: colors.bg.primary,
  },
  campaignTime: {
    fontSize: fontSize.sm,
    color: colors.text.tertiary,
  },
  campaignDescription: {
    fontSize: fontSize.sm,
    color: colors.text.secondary,
    lineHeight: 20,
    marginBottom: spacing.md,
  },
  campaignSponsor: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginBottom: spacing.md,
  },
  campaignSponsorLabel: {
    fontSize: fontSize.xs,
    color: colors.text.tertiary,
  },
  campaignSponsorName: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
    color: colors.text.primary,
  },
  rewardsSection: {
    borderTopWidth: 1,
    borderTopColor: colors.border.primary,
    paddingTop: spacing.md,
  },
  rewardsTitle: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
    color: colors.text.primary,
    marginBottom: spacing.sm,
  },
  rewardItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: spacing.sm,
  },
  rewardIcon: {
    fontSize: 16,
    marginRight: spacing.sm,
    marginTop: 2,
  },
  rewardInfo: {
    flex: 1,
  },
  rewardName: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
    color: colors.text.primary,
  },
  rewardDesc: {
    fontSize: fontSize.xs,
    color: colors.text.tertiary,
    marginTop: 2,
  },
  rewardReq: {
    fontSize: fontSize.xs,
    color: colors.accent.purple,
    marginTop: 2,
  },
  // Status Card
  statusCard: {
    backgroundColor: colors.bg.card,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    marginBottom: spacing.lg,
    borderWidth: 1,
    borderColor: colors.accent.purple,
  },
  statusHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  statusIcon: {
    fontSize: 40,
    marginRight: spacing.md,
  },
  statusInfo: {
    flex: 1,
  },
  statusTierName: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.bold,
    color: colors.text.primary,
  },
  statusLevel: {
    fontSize: fontSize.sm,
    color: colors.text.tertiary,
    marginTop: 2,
  },
  statusFeeBox: {
    alignItems: 'flex-end',
  },
  statusFeeLabel: {
    fontSize: fontSize.xs,
    color: colors.text.tertiary,
  },
  statusFeeValue: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.bold,
    color: colors.accent.green,
  },
  statusFeeFree: {
    color: colors.accent.purple,
  },
  balanceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border.primary,
  },
  balanceLabel: {
    fontSize: fontSize.md,
    color: colors.text.secondary,
  },
  balanceValue: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.semibold,
    color: colors.text.primary,
  },
  progressSection: {
    marginTop: spacing.md,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border.primary,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.xs,
  },
  progressLabel: {
    fontSize: fontSize.sm,
    color: colors.text.secondary,
  },
  progressPercent: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
    color: colors.accent.purple,
  },
  progressBar: {
    height: 8,
    backgroundColor: colors.bg.tertiary,
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: colors.accent.purple,
    borderRadius: 4,
  },
  progressHint: {
    fontSize: fontSize.xs,
    color: colors.text.tertiary,
    marginTop: spacing.xs,
  },
  maxTierBanner: {
    marginTop: spacing.md,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border.primary,
    alignItems: 'center',
  },
  maxTierText: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
    color: colors.accent.green,
  },
  maxTierSubtext: {
    fontSize: fontSize.sm,
    color: colors.text.tertiary,
    marginTop: 2,
  },
  // Bonus Card
  bonusCard: {
    backgroundColor: colors.bg.card,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginBottom: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border.primary,
  },
  bonusCardActive: {
    borderColor: colors.accent.green,
    backgroundColor: colors.overlay.greenSubtle,
  },
  bonusHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  bonusIcon: {
    fontSize: 24,
    marginRight: spacing.sm,
  },
  bonusInfo: {
    flex: 1,
  },
  bonusTitle: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
    color: colors.text.primary,
  },
  bonusSubtitle: {
    fontSize: fontSize.xs,
    color: colors.text.tertiary,
  },
  bonusValue: {
    alignItems: 'flex-end',
  },
  bonusAmount: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.bold,
    color: colors.text.tertiary,
  },
  bonusAmountActive: {
    color: colors.accent.green,
  },
  bonusDescription: {
    fontSize: fontSize.sm,
    color: colors.text.tertiary,
    lineHeight: 20,
  },
  // Tiers Section
  tiersSection: {
    marginBottom: spacing.lg,
  },
  tiersSectionTitle: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.semibold,
    color: colors.text.primary,
    marginBottom: spacing.xs,
  },
  tiersSectionSubtitle: {
    fontSize: fontSize.sm,
    color: colors.text.tertiary,
    marginBottom: spacing.md,
  },
  tierRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.bg.card,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border.primary,
  },
  tierRowCurrent: {
    borderColor: colors.accent.purple,
    backgroundColor: colors.overlay.purpleSubtle,
  },
  tierRowLocked: {
    opacity: 0.6,
  },
  tierRowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  tierIcon: {
    fontSize: 20,
    marginRight: spacing.sm,
    width: 28,
    textAlign: 'center',
  },
  tierNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  tierName: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.medium,
    color: colors.text.primary,
  },
  tierNameLocked: {
    color: colors.text.secondary,
  },
  tierRequirement: {
    fontSize: fontSize.xs,
    color: colors.text.tertiary,
    marginTop: 2,
  },
  currentBadge: {
    backgroundColor: colors.accent.purple,
    paddingHorizontal: spacing.xs,
    paddingVertical: 2,
    borderRadius: 4,
  },
  currentBadgeText: {
    fontSize: 10,
    fontWeight: fontWeight.bold,
    color: colors.text.primary,
  },
  tierRowRight: {
    alignItems: 'flex-end',
  },
  tierFee: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
    color: colors.accent.green,
  },
  tierFeeFree: {
    color: colors.accent.purple,
  },
  tierSkrNeeded: {
    fontSize: fontSize.xs,
    color: colors.text.tertiary,
    marginTop: 2,
  },
  // Info Section
  infoSection: {
    backgroundColor: colors.bg.secondary,
    borderRadius: borderRadius.md,
    padding: spacing.md,
  },
  infoTitle: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
    color: colors.text.primary,
    marginBottom: spacing.md,
  },
  infoItem: {
    flexDirection: 'row',
    marginBottom: spacing.sm,
  },
  infoBullet: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: colors.accent.purple,
    color: colors.text.primary,
    fontSize: fontSize.xs,
    fontWeight: fontWeight.bold,
    textAlign: 'center',
    lineHeight: 20,
    marginRight: spacing.sm,
  },
  infoText: {
    flex: 1,
    fontSize: fontSize.sm,
    color: colors.text.secondary,
    lineHeight: 20,
  },
});
