import React, { useMemo } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { AppText } from '@/components/ui/AppText';
import { Card } from '@/components/ui/Card';
import { EmojiBadge } from '@/components/ui/EmojiBadge';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { Screen } from '@/components/ui/Screen';
import { ACHIEVEMENTS, CHALLENGES } from '@/constants/seed';
import { Challenge } from '@/domain/entities';
import { useAuthStore } from '@/stores/authStore';
import { useTaskStore } from '@/stores/taskStore';
import { spacing, useTheme } from '@/theme';

/** Conquistas (medalhas) + Desafios automáticos do casal. */
export default function AchievementsScreen() {
  const { colors } = useTheme();
  const user = useAuthStore((s) => s.user);
  const tasks = useTaskStore((s) => s.tasks);

  const streak = user?.streakDays ?? 0;

  const doneTasks = useMemo(
    () => Object.values(tasks).filter((t) => t.status === 'done'),
    [tasks],
  );

  const challengeProgress = (challenge: Challenge): number => {
    switch (challenge.kind) {
      case 'tasks_total':
        return doneTasks.length;
      case 'task_title':
        return doneTasks.filter((t) => t.title === challenge.taskTitle).length;
      case 'streak':
      default:
        return streak;
    }
  };

  return (
    <Screen bottomInset={20}>
      <View style={styles.nav}>
        <Pressable onPress={() => router.back()} hitSlop={12}>
          <Ionicons name="chevron-back" size={24} color={colors.text} />
        </Pressable>
        <AppText variant="subheading" weight="semibold">
          Conquistas
        </AppText>
        <View style={{ width: 24 }} />
      </View>

      {ACHIEVEMENTS.map((achievement, index) => {
        const unlocked = streak >= achievement.target;
        const progress = Math.min(streak, achievement.target);
        return (
          <Card key={achievement.id} index={index} style={[styles.row, !unlocked && styles.locked]}>
            <EmojiBadge emoji={achievement.emoji} tint={achievement.tint} size={54} />
            <View style={{ flex: 1, gap: 4 }}>
              <AppText variant="subheading" weight="semibold">
                {achievement.title}
              </AppText>
              <AppText variant="caption" tone="secondary">
                {achievement.description}
              </AppText>
              {!unlocked ? (
                <>
                  <ProgressBar progress={progress / achievement.target} height={6} />
                  <AppText variant="caption" tone="muted">
                    {progress} / {achievement.target} dias
                  </AppText>
                </>
              ) : null}
            </View>
            {unlocked ? (
              <Ionicons name="checkmark-circle" size={24} color={colors.success} />
            ) : (
              <Ionicons name="lock-closed" size={18} color={colors.textMuted} />
            )}
          </Card>
        );
      })}

      <AppText variant="heading" style={styles.sectionTitle}>
        Desafios 🎯
      </AppText>
      <AppText variant="body" tone="secondary" style={{ marginBottom: spacing.md }}>
        Desafios automáticos que rendem XP e moedas extras ao serem concluídos.
      </AppText>

      {CHALLENGES.map((challenge, index) => {
        const progress = challengeProgress(challenge);
        const completed = progress >= challenge.target;
        return (
          <Card key={challenge.id} index={index} style={[styles.row, !completed && progress === 0 && styles.locked]}>
            <EmojiBadge emoji={challenge.emoji} tint={challenge.tint} size={54} />
            <View style={{ flex: 1, gap: 4 }}>
              <AppText variant="subheading" weight="semibold">
                {challenge.title}
              </AppText>
              <AppText variant="caption" tone="secondary">
                {challenge.description}
              </AppText>
              <ProgressBar progress={Math.min(1, progress / challenge.target)} height={6} />
              <View style={styles.rewardRow}>
                <AppText variant="caption" tone="muted">
                  {Math.min(progress, challenge.target)} / {challenge.target}
                </AppText>
                <AppText variant="caption" tone="accent" weight="semibold">
                  +{challenge.rewardXp} XP · 🪙 {challenge.rewardCoins}
                </AppText>
              </View>
            </View>
            {completed ? <Ionicons name="checkmark-circle" size={24} color={colors.success} /> : null}
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
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginBottom: spacing.sm + 2,
  },
  locked: {
    opacity: 0.55,
  },
  sectionTitle: {
    marginTop: spacing.xl,
    marginBottom: spacing.xs,
  },
  rewardRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
});
