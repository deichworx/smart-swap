import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useCallback, useEffect, useState } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { RootStackParamList } from '../app';
import { getAppSettings, resetAppSettings, updateAppSettings } from '../storage';
import { AppSettings } from '../storage/types';
import { borderRadius, colors, fontSize, fontWeight, spacing } from '../theme';

type Props = NativeStackScreenProps<RootStackParamList, 'Settings'>;

export default function Settings({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const [settings, setSettings] = useState<AppSettings | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getAppSettings().then(s => {
      setSettings(s);
      setLoading(false);
    });
  }, []);

  const updateSetting = useCallback(async <K extends keyof AppSettings>(
    key: K,
    value: AppSettings[K],
  ) => {
    if (!settings) return;
    const newSettings = { ...settings, [key]: value };
    setSettings(newSettings);
    await updateAppSettings({ [key]: value });
  }, [settings]);

  const handleReset = useCallback(async () => {
    await resetAppSettings();
    const fresh = await getAppSettings();
    setSettings(fresh);
  }, []);

  if (loading || !settings) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <View style={styles.header}>
          <Pressable
            onPress={() => navigation.goBack()}
            style={({ pressed }) => [styles.backButton, pressed && { opacity: 0.7 }]}
            accessibilityLabel="Go back"
            accessibilityRole="button"
          >
            <Text style={styles.backText}>{'<'} Back</Text>
          </Pressable>
          <Text style={styles.title}>Settings</Text>
          <View style={styles.placeholder} />
        </View>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Pressable
          onPress={() => navigation.goBack()}
          style={({ pressed }) => [styles.backButton, pressed && { opacity: 0.7 }]}
          accessibilityLabel="Go back"
          accessibilityRole="button"
        >
          <Text style={styles.backText}>{'<'} Back</Text>
        </Pressable>
        <Text style={styles.title}>Settings</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* Experience Section */}
        <Text style={styles.sectionTitle}>Experience</Text>
        <View style={styles.section}>
          <SettingRow
            icon="🎊"
            title="Confetti Animation"
            description="Show confetti on successful swaps"
            value={settings.confettiEnabled}
            onValueChange={v => updateSetting('confettiEnabled', v)}
          />
          <SettingRow
            icon="📳"
            title="Haptic Feedback"
            description="Vibrate on interactions"
            value={settings.hapticFeedbackEnabled}
            onValueChange={v => updateSetting('hapticFeedbackEnabled', v)}
          />
          <SettingRow
            icon="🔄"
            title="Auto-Refresh Quotes"
            description="Automatically update quotes every 10s"
            value={settings.autoRefreshQuotes}
            onValueChange={v => updateSetting('autoRefreshQuotes', v)}
          />
        </View>

        {/* Trading Section */}
        <Text style={styles.sectionTitle}>Trading</Text>
        <View style={styles.section}>
          <SlippageSelector
            value={settings.preferredSlippage}
            onValueChange={v => updateSetting('preferredSlippage', v)}
          />
        </View>

        {/* Legal Section */}
        <Text style={styles.sectionTitle}>Legal</Text>
        <View style={styles.section}>
          <Pressable
            style={({ pressed }) => [styles.linkRow, pressed && { opacity: 0.7 }]}
            onPress={() => navigation.navigate('PrivacyPolicy')}
            accessibilityLabel="Privacy Policy"
            accessibilityRole="button"
          >
            <Text style={styles.linkIcon}>🔒</Text>
            <Text style={styles.linkText}>Privacy Policy</Text>
            <Text style={styles.linkArrow}>›</Text>
          </Pressable>
          <View style={styles.separator} />
          <Pressable
            style={({ pressed }) => [styles.linkRow, pressed && { opacity: 0.7 }]}
            onPress={() => navigation.navigate('TermsOfService')}
            accessibilityLabel="Terms of Service"
            accessibilityRole="button"
          >
            <Text style={styles.linkIcon}>📜</Text>
            <Text style={styles.linkText}>Terms of Service</Text>
            <Text style={styles.linkArrow}>›</Text>
          </Pressable>
        </View>

        {/* Reset Section */}
        <View style={styles.resetSection}>
          <Pressable
            style={({ pressed }) => [styles.resetButton, pressed && { opacity: 0.7 }]}
            onPress={handleReset}
            accessibilityLabel="Reset all settings to defaults"
            accessibilityRole="button"
          >
            <Text style={styles.resetButtonText}>Reset to Defaults</Text>
          </Pressable>
        </View>

        {/* Developer Section - DEV only */}
        {__DEV__ && (
          <>
            <Text style={styles.sectionTitle}>Developer</Text>
            <View style={styles.section}>
              <Pressable
                style={({ pressed }) => [styles.linkRow, pressed && { opacity: 0.7 }]}
                onPress={() => navigation.navigate('Debug')}
                accessibilityLabel="Fee Audit Log"
                accessibilityRole="button"
              >
                <Text style={styles.linkIcon}>🔍</Text>
                <Text style={styles.linkText}>Fee Audit Log</Text>
                <Text style={styles.linkArrow}>›</Text>
              </Pressable>
            </View>
          </>
        )}

        {/* Version Info */}
        <Text style={styles.versionText}>Smart Swap v1.0.0</Text>
        <Text style={styles.versionSubtext}>Built for Solana Seeker</Text>

        <View style={styles.bottomSpacer} />
      </ScrollView>
    </View>
  );
}

function SettingRow({
  icon,
  title,
  description,
  value,
  onValueChange,
}: {
  icon: string;
  title: string;
  description: string;
  value: boolean;
  onValueChange: (value: boolean) => void;
}) {
  return (
    <>
      <View style={styles.settingRow}>
        <Text style={styles.settingIcon}>{icon}</Text>
        <View style={styles.settingContent}>
          <Text style={styles.settingTitle}>{title}</Text>
          <Text style={styles.settingDescription}>{description}</Text>
        </View>
        <Switch
          value={value}
          onValueChange={onValueChange}
          trackColor={{ false: colors.bg.tertiary, true: colors.accent.purple }}
          thumbColor={colors.text.primary}
          accessibilityLabel={`${title}: ${value ? 'enabled' : 'disabled'}`}
        />
      </View>
      <View style={styles.separator} />
    </>
  );
}

const SLIPPAGE_OPTIONS = [
  { label: '0.1%', value: 10 },
  { label: '0.5%', value: 50 },
  { label: '1.0%', value: 100 },
  { label: '3.0%', value: 300 },
];

function SlippageSelector({
  value,
  onValueChange,
}: {
  value: number;
  onValueChange: (value: number) => void;
}) {
  return (
    <View style={styles.slippageContainer}>
      <View style={styles.slippageHeader}>
        <Text style={styles.settingIcon}>⚡</Text>
        <View style={styles.settingContent}>
          <Text style={styles.settingTitle}>Slippage Tolerance</Text>
          <Text style={styles.settingDescription}>Maximum price change allowed</Text>
        </View>
      </View>
      <View style={styles.slippageOptions}>
        {SLIPPAGE_OPTIONS.map(option => (
          <Pressable
            key={option.value}
            style={({ pressed }) => [
              styles.slippageOption,
              value === option.value && styles.slippageOptionSelected,
              pressed && { opacity: 0.7 },
            ]}
            onPress={() => onValueChange(option.value)}
            accessibilityLabel={`Set slippage to ${option.label}`}
            accessibilityRole="button"
            accessibilityState={{ selected: value === option.value }}
          >
            <Text
              style={[
                styles.slippageOptionText,
                value === option.value && styles.slippageOptionTextSelected,
              ]}
            >
              {option.label}
            </Text>
          </Pressable>
        ))}
      </View>
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
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.primary,
  },
  backButton: {
    padding: spacing.xs,
  },
  backText: {
    fontSize: fontSize.md,
    color: colors.accent.purple,
  },
  title: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.bold,
    color: colors.text.primary,
  },
  placeholder: {
    width: 60,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: colors.text.secondary,
    fontSize: fontSize.md,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: spacing.lg,
  },
  sectionTitle: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
    color: colors.text.tertiary,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: spacing.sm,
    marginTop: spacing.lg,
  },
  section: {
    backgroundColor: colors.bg.card,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.border.primary,
    overflow: 'hidden',
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
  },
  settingIcon: {
    fontSize: 20,
    marginRight: spacing.md,
  },
  settingContent: {
    flex: 1,
  },
  settingTitle: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.medium,
    color: colors.text.primary,
  },
  settingDescription: {
    fontSize: fontSize.xs,
    color: colors.text.tertiary,
    marginTop: 2,
  },
  separator: {
    height: 1,
    backgroundColor: colors.border.primary,
    marginLeft: spacing.md + 20 + spacing.md, // icon + icon margin
  },
  linkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
  },
  linkIcon: {
    fontSize: 20,
    marginRight: spacing.md,
  },
  linkText: {
    flex: 1,
    fontSize: fontSize.md,
    color: colors.text.primary,
  },
  linkArrow: {
    fontSize: fontSize.xl,
    color: colors.text.tertiary,
  },
  slippageContainer: {
    padding: spacing.md,
  },
  slippageHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  slippageOptions: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  slippageOption: {
    flex: 1,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.md,
    backgroundColor: colors.bg.tertiary,
    alignItems: 'center',
  },
  slippageOptionSelected: {
    backgroundColor: colors.accent.purple,
  },
  slippageOptionText: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
    color: colors.text.secondary,
  },
  slippageOptionTextSelected: {
    color: colors.text.primary,
  },
  resetSection: {
    marginTop: spacing.xl,
    alignItems: 'center',
  },
  resetButton: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
  },
  resetButtonText: {
    fontSize: fontSize.sm,
    color: colors.status.error,
  },
  versionText: {
    textAlign: 'center',
    fontSize: fontSize.sm,
    color: colors.text.tertiary,
    marginTop: spacing.xl,
  },
  versionSubtext: {
    textAlign: 'center',
    fontSize: fontSize.xs,
    color: colors.text.tertiary,
    marginTop: spacing.xs,
  },
  bottomSpacer: {
    height: spacing.xl,
  },
});
