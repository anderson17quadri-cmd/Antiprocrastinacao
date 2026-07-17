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

/** Propriedades de layout que precisam viver no contêiner externo
 *  (o wrapper animado), senão larguras percentuais e flex colapsam. */
const LAYOUT_KEYS = [
  'width',
  'minWidth',
  'maxWidth',
  'height',
  'minHeight',
  'maxHeight',
  'flex',
  'flexGrow',
  'flexShrink',
  'flexBasis',
  'alignSelf',
  'margin',
  'marginTop',
  'marginBottom',
  'marginLeft',
  'marginRight',
  'marginHorizontal',
  'marginVertical',
] as const;

function splitStyle(style?: StyleProp<ViewStyle>): { outer: ViewStyle; inner: ViewStyle } {
  const flat = StyleSheet.flatten(style) ?? {};
  const outer: Record<string, unknown> = {};
  const inner: Record<string, unknown> = { ...flat };
  for (const key of LAYOUT_KEYS) {
    if (key in inner) {
      outer[key] = inner[key];
      delete inner[key];
    }
  }
  return { outer: outer as ViewStyle, inner: inner as ViewStyle };
}

/** Card com glassmorphism leve, cantos arredondados e sombra suave. */
export function Card({ children, style, onPress, index = 0, animated = true }: Props) {
  const { colors, dark } = useTheme();
  const { outer, inner } = splitStyle(style);

  const base: ViewStyle = {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    ...cardShadow(dark),
  };

  const content = onPress ? (
    <Pressable
      onPress={onPress}
      android_ripple={{ color: colors.primarySoft, foreground: true }}
      style={({ pressed }) => [base, inner, pressed && styles.pressed]}
    >
      {children}
    </Pressable>
  ) : (
    <View style={[base, inner]}>{children}</View>
  );

  if (!animated) return <View style={outer}>{content}</View>;

  return (
    <Animated.View
      entering={FadeInDown.delay(index * 60).springify().damping(18)}
      style={outer}
    >
      {content}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  pressed: {
    opacity: 0.85,
    transform: [{ scale: 0.99 }],
  },
});
