import { LinearGradient } from 'expo-linear-gradient';
import { useState } from 'react';
import {
  ActivityIndicator,
  Dimensions,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { borderRadius, colors, fontSize, fontWeight, spacing } from '../theme';
import { wallet } from '../wallet/wallet';

const { width } = Dimensions.get('window');

export default function Home({ navigation }: { navigation: any }) {
  const [connecting, setConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const connect = async () => {
    setConnecting(true);
    setError(null);
    try {
      await wallet.authorize();
      navigation.navigate('Swap');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Connection failed');
    } finally {
      setConnecting(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      {/* Background Gradient Orbs */}
      <View style={styles.orbContainer}>
        <LinearGradient
          colors={[colors.overlay.purpleMedium, 'transparent']}
          style={[styles.orb, styles.orbPurple]}
        />
        <LinearGradient
          colors={[colors.overlay.greenLight, 'transparent']}
          style={[styles.orb, styles.orbGreen]}
        />
      </View>

      <View style={styles.content}>
        {/* Logo Area */}
        <View style={styles.logoContainer}>
          <LinearGradient
            colors={colors.accent.gradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.logoGradient}
          >
            <Text style={styles.logoIcon}>⚡</Text>
          </LinearGradient>
        </View>

        {/* Title */}
        <Text style={styles.title}>Smart Swap</Text>
        <Text style={styles.subtitle}>
          Lightning-fast token swaps{'\n'}powered by Jupiter
        </Text>

        {/* Features */}
        <View style={styles.features}>
          <FeatureItem icon="🔐" text="Seed Vault Security" />
          <FeatureItem icon="⚡" text="Best Rates via Jupiter" />
          <FeatureItem icon="👆" text="Double-Tap Confirm" />
        </View>

        {/* Error */}
        {error && (
          <View style={styles.errorCard}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        {/* Connect Button */}
        <Pressable
          onPress={connect}
          disabled={connecting}
          accessibilityLabel={connecting ? 'Connecting to wallet' : 'Connect wallet'}
          accessibilityRole="button"
          accessibilityState={{ disabled: connecting }}
          style={({ pressed }) => pressed && { opacity: 0.8 }}
          android_ripple={{ color: 'rgba(255,255,255,0.2)' }}
        >
          <LinearGradient
            colors={connecting ? [colors.bg.tertiary, colors.bg.tertiary] : colors.accent.gradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.button}
          >
            {connecting ? (
              <ActivityIndicator color={colors.text.primary} />
            ) : (
              <>
                <Text style={styles.buttonText}>Connect Wallet</Text>
                <Text style={styles.buttonArrow}>→</Text>
              </>
            )}
          </LinearGradient>
        </Pressable>

        {/* Footer */}
        <View style={styles.footerContainer}>
          <Text style={styles.footer}>Built for Solana Seeker</Text>
          <View style={styles.legalLinks}>
            <Pressable
              onPress={() => navigation.navigate('PrivacyPolicy')}
              accessibilityLabel="Privacy Policy"
              accessibilityRole="link"
              style={({ pressed }) => pressed && { opacity: 0.7 }}
              android_ripple={{ color: 'rgba(255,255,255,0.1)' }}
            >
              <Text style={styles.legalLink}>Privacy</Text>
            </Pressable>
            <Text style={styles.legalSeparator}>·</Text>
            <Pressable
              onPress={() => navigation.navigate('TermsOfService')}
              accessibilityLabel="Terms of Service"
              accessibilityRole="link"
              style={({ pressed }) => pressed && { opacity: 0.7 }}
              android_ripple={{ color: 'rgba(255,255,255,0.1)' }}
            >
              <Text style={styles.legalLink}>Terms</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
}

function FeatureItem({ icon, text }: { icon: string; text: string }) {
  return (
    <View style={styles.featureItem} accessibilityLabel={text}>
      <Text style={styles.featureIcon} accessibilityElementsHidden>{icon}</Text>
      <Text style={styles.featureText}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg.primary,
  },
  orbContainer: {
    ...StyleSheet.absoluteFillObject,
    overflow: 'hidden',
  },
  orb: {
    position: 'absolute',
    width: width * 1.5,
    height: width * 1.5,
    borderRadius: width,
  },
  orbPurple: {
    top: -width * 0.5,
    left: -width * 0.5,
  },
  orbGreen: {
    bottom: -width * 0.7,
    right: -width * 0.5,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.lg,
  },
  logoContainer: {
    marginBottom: spacing.xl,
  },
  logoGradient: {
    width: 80,
    height: 80,
    borderRadius: borderRadius.xl,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoIcon: {
    fontSize: 40,
  },
  title: {
    fontSize: fontSize.hero,
    fontWeight: fontWeight.bold,
    color: colors.text.primary,
    marginBottom: spacing.sm,
  },
  subtitle: {
    fontSize: fontSize.md,
    color: colors.text.secondary,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: spacing.xxl,
  },
  features: {
    width: '100%',
    marginBottom: spacing.xxl,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.bg.card,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border.primary,
  },
  featureIcon: {
    fontSize: 20,
    marginRight: spacing.md,
  },
  featureText: {
    fontSize: fontSize.sm,
    color: colors.text.secondary,
  },
  errorCard: {
    width: '100%',
    backgroundColor: colors.status.errorBg,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginBottom: spacing.lg,
    borderWidth: 1,
    borderColor: colors.status.error,
  },
  errorText: {
    color: colors.status.error,
    textAlign: 'center',
    fontSize: fontSize.sm,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xl,
    borderRadius: borderRadius.lg,
    minWidth: 220,
  },
  buttonText: {
    color: colors.text.primary,
    fontSize: fontSize.lg,
    fontWeight: fontWeight.semibold,
  },
  buttonArrow: {
    color: colors.text.primary,
    fontSize: fontSize.lg,
    marginLeft: spacing.sm,
  },
  footerContainer: {
    position: 'absolute',
    bottom: spacing.xl,
    alignItems: 'center',
  },
  footer: {
    color: colors.text.tertiary,
    fontSize: fontSize.xs,
  },
  legalLinks: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.xs,
  },
  legalLink: {
    color: colors.text.tertiary,
    fontSize: fontSize.xs,
    textDecorationLine: 'underline',
    minHeight: 44,
    minWidth: 44,
    textAlignVertical: 'center',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.sm,
  },
  legalSeparator: {
    color: colors.text.tertiary,
    fontSize: fontSize.xs,
    marginHorizontal: spacing.sm,
  },
});
