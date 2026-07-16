import React, { useEffect, useMemo } from 'react';
import { Dimensions, StyleSheet, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withTiming,
} from 'react-native-reanimated';
import { brand } from '@/theme';

const COLORS = [brand.primary, brand.secondary, brand.accent, brand.success, brand.warning, brand.pink];
const PIECES = 36;
const { width, height } = Dimensions.get('window');

interface PieceProps {
  index: number;
}

function Piece({ index }: PieceProps) {
  const progress = useSharedValue(0);

  const startX = useMemo(() => Math.random() * width, []);
  const drift = useMemo(() => (Math.random() - 0.5) * 160, []);
  const rotation = useMemo(() => (Math.random() - 0.5) * 720, []);
  const size = useMemo(() => 6 + Math.random() * 8, []);
  const color = useMemo(() => COLORS[index % COLORS.length], [index]);
  const delay = useMemo(() => Math.random() * 500, []);

  useEffect(() => {
    progress.value = withDelay(
      delay,
      withTiming(1, { duration: 2400 + Math.random() * 1200, easing: Easing.out(Easing.quad) }),
    );
  }, [delay, progress]);

  const style = useAnimatedStyle(() => ({
    transform: [
      { translateX: startX + drift * progress.value },
      { translateY: -40 + (height + 80) * progress.value },
      { rotate: `${rotation * progress.value}deg` },
    ],
    opacity: progress.value > 0.85 ? (1 - progress.value) / 0.15 : 1,
  }));

  return (
    <Animated.View
      pointerEvents="none"
      style={[
        style,
        {
          position: 'absolute',
          width: size,
          height: size * 1.6,
          borderRadius: 2,
          backgroundColor: color,
        },
      ]}
    />
  );
}

/** Chuva de confetes ao concluir todas as tarefas do dia. 🎉 */
export function Confetti({ visible }: { visible: boolean }) {
  if (!visible) return null;
  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      {Array.from({ length: PIECES }, (_, i) => (
        <Piece key={i} index={i} />
      ))}
    </View>
  );
}
