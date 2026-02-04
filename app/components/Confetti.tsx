import { useEffect, useMemo } from 'react';
import { Dimensions, StyleSheet, View } from 'react-native';
import Animated, {
  Easing,
  runOnJS,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withDelay,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { colors } from '../theme';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

const CONFETTI_COLORS = [
  colors.accent.purple,      // #9945FF
  colors.accent.green,       // #14F195
  colors.status.warning,     // #FFD166 (replaces Gold)
  colors.status.error,       // #FF6B6B
  colors.accent.purpleLight, // #B77DFF (replaces Cyan)
  colors.accent.greenDark,   // #0EA66E (replaces Orange)
];

const CONFETTI_COUNT = 50;

type ConfettiPiece = {
  id: number;
  x: number;
  delay: number;
  color: string;
  size: number;
  rotation: number;
};

function generateConfetti(): ConfettiPiece[] {
  return Array.from({ length: CONFETTI_COUNT }, (_, i) => ({
    id: i,
    x: Math.random() * SCREEN_WIDTH,
    delay: Math.random() * 500,
    color: CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)],
    size: 8 + Math.random() * 8,
    rotation: Math.random() * 360,
  }));
}

type ConfettiPieceProps = {
  piece: ConfettiPiece;
  onComplete: () => void;
  isLast: boolean;
};

function ConfettiPieceComponent({ piece, onComplete, isLast }: ConfettiPieceProps) {
  const translateY = useSharedValue(-50);
  const translateX = useSharedValue(0);
  const rotate = useSharedValue(piece.rotation);
  const opacity = useSharedValue(1);

  // Animation runs once on mount - deps are stable or intentionally excluded
  useEffect(() => {
    const horizontalDrift = (Math.random() - 0.5) * 100;

    translateY.value = withDelay(
      piece.delay,
      withTiming(SCREEN_HEIGHT + 100, {
        duration: 2500 + Math.random() * 1000,
        easing: Easing.out(Easing.quad),
      }),
    );

    translateX.value = withDelay(
      piece.delay,
      withSequence(
        withTiming(horizontalDrift, { duration: 1000 }),
        withTiming(horizontalDrift * 0.5, { duration: 1000 }),
        withTiming(horizontalDrift * 0.8, { duration: 500 }),
      ),
    );

    rotate.value = withDelay(
      piece.delay,
      withTiming(piece.rotation + 720, {
        duration: 3000,
        easing: Easing.linear,
      }),
    );

    opacity.value = withDelay(
      piece.delay + 2000,
      withTiming(0, { duration: 500 }, finished => {
        if (finished && isLast) {
          runOnJS(onComplete)();
        }
      }),
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value },
      { translateY: translateY.value },
      { rotate: `${rotate.value}deg` },
    ],
    opacity: opacity.value,
  }));

  return (
    <Animated.View
      style={[
        styles.confettiPiece,
        animatedStyle,
        {
          left: piece.x,
          width: piece.size,
          height: piece.size * 1.5,
          backgroundColor: piece.color,
          borderRadius: piece.size / 4,
        },
      ]}
    />
  );
}

type ConfettiProps = {
  visible: boolean;
  onComplete: () => void;
};

export function Confetti({ visible, onComplete }: ConfettiProps) {
  const reduceMotion = useReducedMotion();
  const confettiPieces = useMemo(() => (visible ? generateConfetti() : []), [visible]);

  // Skip confetti animation if reduced motion is enabled (WCAG 2.3.3)
  useEffect(() => {
    if (visible && reduceMotion) {
      // Immediately complete without animation
      onComplete();
    }
  }, [visible, reduceMotion, onComplete]);

  if (!visible || confettiPieces.length === 0 || reduceMotion) {
    return null;
  }

  return (
    <View style={styles.container} pointerEvents="none">
      {confettiPieces.map((piece, index) => (
        <ConfettiPieceComponent
          key={piece.id}
          piece={piece}
          onComplete={onComplete}
          isLast={index === confettiPieces.length - 1}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 1000,
  },
  confettiPiece: {
    position: 'absolute',
    top: -50,
  },
});
