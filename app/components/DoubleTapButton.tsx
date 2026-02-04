import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Animated, Pressable, StyleSheet, Text, View } from 'react-native';
import { useReducedMotion } from '../hooks/useReducedMotion';
import { borderRadius, colors, fontSize, fontWeight, spacing } from '../theme';

type Props = {
  onConfirm: () => void;
  disabled?: boolean;
  label?: string;
  confirmLabel?: string;
};

const TAP_TIMEOUT = 2000;

export default function DoubleTapButton({
  onConfirm,
  disabled = false,
  label = 'Tap to Swap',
  confirmLabel = 'Tap again to confirm',
}: Props) {
  const reduceMotion = useReducedMotion();
  const [firstTapDone, setFirstTapDone] = useState(false);
  const progressAnim = useRef(new Animated.Value(1)).current;

  // Cleanup timeout on unmount or when firstTapDone resets
  useEffect(() => {
    if (!firstTapDone) return;

    const timeout = setTimeout(() => {
      setFirstTapDone(false);
      progressAnim.setValue(1);
    }, TAP_TIMEOUT);

    return () => clearTimeout(timeout);
  }, [firstTapDone, progressAnim]);

  const handlePress = useCallback(() => {
    if (disabled) return;

    if (!firstTapDone) {
      // First tap - light haptic
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      setFirstTapDone(true);
      progressAnim.setValue(1);
      // Skip animation if reduced motion is enabled
      if (!reduceMotion) {
        Animated.timing(progressAnim, {
          toValue: 0,
          duration: TAP_TIMEOUT,
          useNativeDriver: true,
        }).start();
      }
    } else {
      // Second tap - stronger haptic for confirmation
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
      setFirstTapDone(false);
      progressAnim.setValue(1);
      onConfirm();
    }
  }, [disabled, firstTapDone, onConfirm, progressAnim, reduceMotion]);

  const gradientColors: readonly [string, string] = disabled
    ? [colors.bg.tertiary, colors.bg.tertiary]
    : firstTapDone
    ? [colors.accent.green, colors.accent.greenDark]
    : colors.accent.gradient;

  const accessibilityLabel = disabled
    ? 'Swap button disabled'
    : firstTapDone
    ? confirmLabel
    : label;

  return (
    <Pressable
      onPress={handlePress}
      disabled={disabled}
      style={({ pressed }) => ({ opacity: pressed ? 0.8 : 1 })}
      accessibilityLabel={accessibilityLabel}
      accessibilityRole="button"
      accessibilityState={{ disabled }}
      android_ripple={{ color: 'rgba(255,255,255,0.2)' }}
    >
      <LinearGradient
        colors={gradientColors}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={styles.button}
      >
        <View style={styles.content}>
          <Text style={[styles.text, disabled && styles.textDisabled]}>
            {firstTapDone ? confirmLabel : label}
          </Text>
          {firstTapDone && <Text style={styles.hint}>⚡</Text>}
        </View>
        {firstTapDone && !reduceMotion && (
          <Animated.View
            style={[
              styles.progress,
              {
                transform: [{ scaleX: progressAnim }],
              },
            ]}
          />
        )}
      </LinearGradient>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    borderRadius: borderRadius.lg,
    padding: spacing.md + spacing.xs,
    alignItems: 'center',
    overflow: 'hidden',
    position: 'relative',
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    zIndex: 1,
  },
  text: {
    color: colors.text.primary,
    fontSize: fontSize.lg,
    fontWeight: fontWeight.semibold,
  },
  textDisabled: {
    color: colors.text.tertiary,
  },
  hint: {
    marginLeft: spacing.sm,
    fontSize: fontSize.lg,
  },
  progress: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    backgroundColor: colors.overlay.light,
    // Transform origin defaults to center, but we want it from the left
    // On RN, transformOrigin isn't directly available, so we use the full width
    // and scale from center - the visual effect is the bar shrinking toward center
    // For a right-to-left shrink, we'd need Reanimated's transformOrigin support
  },
});
