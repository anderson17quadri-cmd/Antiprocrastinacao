import React from 'react';
import { StyleSheet, View } from 'react-native';
import { AppText } from '@/components/ui/AppText';
import { Card } from '@/components/ui/Card';
import { spacing } from '@/theme';

interface Props {
  emoji: string;
  label: string;
  value: string;
  detail?: string;
  index?: number;
}

/** Card compacto de estatística (🔥 Sequência, 🏆 Pontuação, ❤️ Produtividade). */
export function StatCard({ emoji, label, value, detail, index = 0 }: Props) {
  return (
    <View style={styles.wrapper}>
      <Card index={index} style={styles.card}>
        <AppText style={styles.emoji}>{emoji}</AppText>
        <AppText variant="heading" weight="extrabold" numberOfLines={1} adjustsFontSizeToFit>
          {value}
        </AppText>
        <AppText variant="caption" tone="secondary" numberOfLines={1}>
          {label}
        </AppText>
        {detail ? (
          <AppText variant="caption" tone="muted" numberOfLines={1}>
            {detail}
          </AppText>
        ) : null}
      </Card>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
  },
  card: {
    alignItems: 'flex-start',
    gap: 2,
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.md,
  },
  emoji: {
    fontSize: 20,
    marginBottom: 4,
  },
});
