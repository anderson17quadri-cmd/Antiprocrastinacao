import React from 'react';
import { StyleSheet, View } from 'react-native';
import { AppText } from './AppText';
import { radius } from '@/theme';

interface Props {
  emoji: string;
  /** Cor de destaque; o fundo usa a cor com transparência. */
  tint: string;
  size?: number;
}

/** Ícone quadrado arredondado com emoji, no estilo do mockup. */
export function EmojiBadge({ emoji, tint, size = 44 }: Props) {
  return (
    <View
      style={[
        styles.badge,
        {
          width: size,
          height: size,
          borderRadius: size >= 60 ? radius.lg : radius.sm + 2,
          backgroundColor: `${tint}26`,
        },
      ]}
    >
      <AppText style={{ fontSize: size * 0.45 }}>{emoji}</AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
