import React, { useMemo } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { AppText } from '@/components/ui/AppText';
import { Card } from '@/components/ui/Card';
import { EmojiBadge } from '@/components/ui/EmojiBadge';
import { Screen } from '@/components/ui/Screen';
import { CATEGORIES, TASK_TYPES } from '@/constants/categories';
import { generateInsights, suggestTasks } from '@/services/insights';
import { useAuthStore } from '@/stores/authStore';
import { useTaskStore } from '@/stores/taskStore';
import { radius, spacing, useTheme } from '@/theme';
import { formatMinutes } from '@/utils/format';

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

  const suggestions = useMemo(() => suggestTasks(Object.values(tasks)), [tasks]);

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

      {/* Sugestões automáticas baseadas na rotina */}
      <AppText variant="heading" style={styles.sectionTitle}>
        Sugestões para vocês ✨
      </AppText>
      <AppText variant="body" tone="secondary" style={{ marginBottom: spacing.md }}>
        Escolhidas a partir das categorias que vocês mais concluem. Toque para adicionar.
      </AppText>
      {suggestions.map((tpl, index) => {
        const meta = CATEGORIES[tpl.category];
        return (
          <Card
            key={`${tpl.category}-${tpl.title}`}
            index={index}
            style={styles.insightCard}
            onPress={() =>
              router.push({
                pathname: '/task/new',
                params: {
                  title: tpl.title,
                  emoji: tpl.emoji,
                  category: tpl.category,
                  minutes: String(tpl.estimatedMinutes),
                  difficulty: tpl.difficulty,
                  type: tpl.type,
                  xp: String(tpl.xp),
                  coins: String(tpl.coins),
                },
              })
            }
          >
            <EmojiBadge emoji={tpl.emoji} tint={meta.color} />
            <View style={{ flex: 1, gap: 2 }}>
              <AppText variant="subheading" weight="semibold">
                {tpl.title}
              </AppText>
              <AppText variant="caption" tone="muted">
                {TASK_TYPES[tpl.type].emoji} {TASK_TYPES[tpl.type].label} · {meta.label} ·{' '}
                {formatMinutes(tpl.estimatedMinutes)} · +{tpl.xp} XP
              </AppText>
            </View>
            <Ionicons name="add-circle" size={26} color={colors.primary} />
          </Card>
        );
      })}
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
    alignItems: 'center',
    gap: spacing.md,
    marginBottom: spacing.sm + 2,
  },
  sectionTitle: {
    marginTop: spacing.xl,
    marginBottom: spacing.xs,
  },
  iconWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
