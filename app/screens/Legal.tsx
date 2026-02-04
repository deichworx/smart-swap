import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { RootStackParamList } from '../app';
import { colors, fontSize, fontWeight, spacing } from '../theme';

type Props = NativeStackScreenProps<RootStackParamList, 'PrivacyPolicy' | 'TermsOfService'>;

export function PrivacyPolicy({ navigation }: Props) {
  const insets = useSafeAreaInsets();

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
        <Text style={styles.title}>Privacy Policy</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.lastUpdated}>Last updated: [Date]</Text>

        <Text style={styles.sectionTitle}>1. Information We Collect</Text>
        <Text style={styles.paragraph}>
          Smart Swap collects minimal information necessary to provide our swap services.
          We do not store private keys or seed phrases. Your wallet connects through
          Mobile Wallet Adapter (MWA), and signing happens in your wallet app.
        </Text>

        <Text style={styles.sectionTitle}>2. Wallet Data</Text>
        <Text style={styles.paragraph}>
          We store your public wallet address locally on your device to enable auto-login.
          Transaction history is stored locally and never sent to our servers.
        </Text>

        <Text style={styles.sectionTitle}>3. RPC Communications</Text>
        <Text style={styles.paragraph}>
          Swap transactions are submitted through Solana RPC nodes. We use Jupiter
          aggregation API to find the best swap routes. These services may collect
          IP addresses and transaction data per their own privacy policies.
        </Text>

        <Text style={styles.sectionTitle}>4. Analytics</Text>
        <Text style={styles.paragraph}>
          [Placeholder: Describe any analytics, crash reporting, or telemetry]
        </Text>

        <Text style={styles.sectionTitle}>5. Data Retention</Text>
        <Text style={styles.paragraph}>
          All data is stored locally on your device. You can clear all data by
          uninstalling the app or clearing app data in your device settings.
        </Text>

        <Text style={styles.sectionTitle}>6. Contact</Text>
        <Text style={styles.paragraph}>
          For privacy concerns, contact: [email@example.com]
        </Text>

        <View style={styles.bottomSpacer} />
      </ScrollView>
    </View>
  );
}

export function TermsOfService({ navigation }: Props) {
  const insets = useSafeAreaInsets();

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
        <Text style={styles.title}>Terms of Service</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.lastUpdated}>Last updated: [Date]</Text>

        <Text style={styles.sectionTitle}>1. Acceptance of Terms</Text>
        <Text style={styles.paragraph}>
          By using Smart Swap, you agree to these Terms of Service. If you do not
          agree, please do not use the application.
        </Text>

        <Text style={styles.sectionTitle}>2. Service Description</Text>
        <Text style={styles.paragraph}>
          Smart Swap is a mobile application that facilitates token swaps on the
          Solana blockchain using Jupiter aggregation. We do not custody any funds
          or have access to your private keys.
        </Text>

        <Text style={styles.sectionTitle}>3. Risks</Text>
        <Text style={styles.paragraph}>
          Cryptocurrency trading involves significant risk. You may lose some or all
          of your funds. Smart Swap is not responsible for any losses incurred from
          using this application. You are solely responsible for your trading decisions.
        </Text>

        <Text style={styles.sectionTitle}>4. Platform Fees</Text>
        <Text style={styles.paragraph}>
          Smart Swap charges platform fees on swaps. Fees vary based on your SKR token
          holdings (0% to 0.25%). Seeker device owners receive an additional discount.
          Fees are subject to change.
        </Text>

        <Text style={styles.sectionTitle}>5. No Financial Advice</Text>
        <Text style={styles.paragraph}>
          Nothing in this application constitutes financial, investment, or trading
          advice. Always do your own research before making any investment decisions.
        </Text>

        <Text style={styles.sectionTitle}>6. Prohibited Use</Text>
        <Text style={styles.paragraph}>
          You may not use Smart Swap for illegal activities, money laundering, or
          any purpose that violates applicable laws or regulations.
        </Text>

        <Text style={styles.sectionTitle}>7. Disclaimer of Warranties</Text>
        <Text style={styles.paragraph}>
          Smart Swap is provided &quot;as is&quot; without warranties of any kind. We do not
          guarantee uninterrupted service or accuracy of swap quotes.
        </Text>

        <Text style={styles.sectionTitle}>8. Limitation of Liability</Text>
        <Text style={styles.paragraph}>
          To the maximum extent permitted by law, Smart Swap shall not be liable for
          any indirect, incidental, special, consequential, or punitive damages.
        </Text>

        <Text style={styles.sectionTitle}>9. Changes to Terms</Text>
        <Text style={styles.paragraph}>
          We may modify these terms at any time. Continued use of the app after
          changes constitutes acceptance of the new terms.
        </Text>

        <Text style={styles.sectionTitle}>10. Contact</Text>
        <Text style={styles.paragraph}>
          For questions about these terms, contact: [email@example.com]
        </Text>

        <View style={styles.bottomSpacer} />
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
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: spacing.lg,
  },
  lastUpdated: {
    fontSize: fontSize.xs,
    color: colors.text.tertiary,
    marginBottom: spacing.lg,
  },
  sectionTitle: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.semibold,
    color: colors.text.primary,
    marginTop: spacing.lg,
    marginBottom: spacing.sm,
  },
  paragraph: {
    fontSize: fontSize.md,
    color: colors.text.secondary,
    lineHeight: 22,
  },
  bottomSpacer: {
    height: spacing.xl,
  },
});
