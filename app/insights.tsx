import React, { useMemo } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { AppText } from '@/components/ui/AppText';
import { Card } from '@/components/ui/Card';
import { Screen } from '@/components/ui/Screen';
import { generateInsights } from '@/services/insights';
import { useAuthStore } from '@/stores/authStore';
import { useTaskStore } from '@/stores/taskStore';
import { radius, spacing, useTheme } from '@/theme';

/** Assistente IA: sugestões baseadas nos hábitos do casal. */
export default function InsightsScreen() {
  const { colors } = useTheme();
  const user = useAuthStore((s) => s.user);
  const partner = useAuthStore((s) => s.partner);
  const tasks = useTaskStore((s) => s.tasks);

  const insights = useMemo(
    () => generateInsights(Object.values(tasks), user, partner),
    [tasks, user, partner],
  );

  return (
    <Screen bottomInset={20}>
      <View style={styles.nav}>
        <Pressable onPress={() => router.back()} hitSlop={12}>
          <Ionicons name="chevron-back" size={24} color={colors.text} />
        </Pressable>
        <AppText variant="subheading" weight="semibold">
          Assistente IA
        </AppText>
        <View style={{ width: 24 }} />
      </View>

      <LinearGradient
        colors={[...colors.gradient]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.hero}
      >
        <AppText style={{ fontSize: 36 }}>🤖</AppText>
        <AppText variant="heading" style={{ color: '#FFFFFF' }}>
          Insights do casal
        </AppText>
        <AppText variant="body" style={{ color: 'rgba(255,255,255,0.85)', textAlign: 'center' }}>
          O assistente analisa os hábitos de vocês e aprende continuamente para sugerir horários,
          divisão justa e lembretes inteligentes.
        </AppText>
      </LinearGradient>

      {insights.map((insight, index) => (
        <Card key={insight.id} index={index} style={styles.insightCard}>
          <View style={[styles.iconWrap, { backgroundColor: colors.primarySoft }]}>
            <AppText style={{ fontSize: 22 }}>{insight.emoji}</AppText>
          </View>
          <View style={{ flex: 1, gap: 4 }}>
            <AppText variant="subheading" weight="semibold">
              {insight.title}
            </AppText>
            <AppText variant="body" tone="secondary">
              {insight.message}
            </AppText>
          </View>
        </Card>
      ))}
    </Screen>
  );
}

const styles = StyleSheet.create({
  nav: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.lg,
  },
  hero: {
    borderRadius: radius.xl,
    padding: spacing.xl,
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  insightCard: {
    flexDirection: 'row',
    gap: spacing.md,
    marginBottom: spacing.sm + 2,
  },
  iconWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
