import React from 'react';
import { Pressable, StyleProp, StyleSheet, View, ViewStyle } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { cardShadow, radius, spacing, useTheme } from '@/theme';

interface Props {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  onPress?: () => void;
  /** Índice para escalonar a animação de entrada. */
  index?: number;
  animated?: boolean;
}

/** Card com glassmorphism leve, cantos arredondados e sombra suave. */
export function Card({ children, style, onPress, index = 0, animated = true }: Props) {
  const { colors, dark } = useTheme();

  const base: ViewStyle = {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    ...cardShadow(dark),
  };

  const inner = onPress ? (
    <Pressable
      onPress={onPress}
      android_ripple={{ color: colors.primarySoft, foreground: true }}
      style={({ pressed }) => [base, style, pressed && styles.pressed]}
    >
      {children}
    </Pressable>
  ) : (
    <View style={[base, style]}>{children}</View>
  );

  if (!animated) return inner;

  return (
    <Animated.View entering={FadeInDown.delay(index * 60).springify().damping(18)}>
      {inner}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  pressed: {
    opacity: 0.85,
    transform: [{ scale: 0.99 }],
  },
});
