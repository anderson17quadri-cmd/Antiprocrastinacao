import React from 'react';
import { StyleSheet, View } from 'react-native';
import { AppText } from '@/components/ui/AppText';
import { Card } from '@/components/ui/Card';
import { radius, spacing } from '@/theme';

interface Props {
  emoji: string;
  label: string;
  value: string;
  detail?: string;
  /** Cor de destaque do chip do emoji. */
  tint?: string;
  index?: number;
}

/** Card compacto de estatística (🔥 Sequência, 🏆 Pontuação, ❤️ Produtividade). */
export function StatCard({ emoji, label, value, detail, tint = '#6C63FF', index = 0 }: Props) {
  return (
    <Card index={index} style={styles.card}>
      <View style={[styles.chip, { backgroundColor: `${tint}22` }]}>
        <AppText style={styles.emoji}>{emoji}</AppText>
      </View>
      <AppText variant="heading" weight="extrabold" numberOfLines={1} adjustsFontSizeToFit>
        {value}
      </AppText>
      <AppText variant="caption" tone="secondary" numberOfLines={1}>
        {label}
      </AppText>
      {detail ? (
        <AppText variant="caption" tone="muted" numberOfLines={1} style={{ fontSize: 10 }}>
          {detail}
        </AppText>
      ) : null}
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    alignItems: 'flex-start',
    gap: 3,
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.md,
  },
  chip: {
    width: 36,
    height: 36,
    borderRadius: radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  emoji: {
    fontSize: 18,
  },
});
