import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { AppText } from '@/components/ui/AppText';
import { EmojiBadge } from '@/components/ui/EmojiBadge';
import { PrimaryButton } from '@/components/ui/PrimaryButton';
import { Screen } from '@/components/ui/Screen';
import { CATEGORIES, PRIORITIES } from '@/constants/categories';
import { HOUSE_TASKS } from '@/constants/seed';
import { cardShadow, radius, spacing, useTheme } from '@/theme';
import { formatMinutes } from '@/utils/format';

/** Tarefas da casa: lista pronta para adicionar ao dia com um toque. */
export default function HouseScreen() {
  const { colors, dark } = useTheme();

  const addFromTemplate = (index: number) => {
    const tpl = HOUSE_TASKS[index];
    router.push({
      pathname: '/task/new',
      params: {
        title: tpl.title,
        emoji: tpl.emoji,
        category: tpl.category,
        minutes: String(tpl.estimatedMinutes),
        difficulty: tpl.difficulty,
      },
    });
  };

  return (
    <Screen bottomInset={20}>
      <View style={styles.nav}>
        <Pressable onPress={() => router.back()} hitSlop={12}>
          <Ionicons name="chevron-back" size={24} color={colors.text} />
        </Pressable>
        <AppText variant="subheading" weight="semibold">
          Tarefas da casa
        </AppText>
        <View style={{ width: 24 }} />
      </View>

      <AppText variant="body" tone="secondary" style={styles.subtitle}>
        Toque em uma tarefa para adicioná-la ao dia — prioridade, tempo médio e repetição já vêm
        preenchidos.
      </AppText>

      {HOUSE_TASKS.map((tpl, index) => {
        const priority = PRIORITIES[tpl.priority];
        return (
          <Animated.View key={tpl.title} entering={FadeInDown.delay(index * 40).springify().damping(18)}>
            <Pressable
              onPress={() => addFromTemplate(index)}
              android_ripple={{ color: colors.primarySoft, foreground: true }}
              style={[styles.row, { backgroundColor: colors.surface, borderColor: colors.border }, cardShadow(dark)]}
            >
              <EmojiBadge emoji={tpl.emoji} tint={CATEGORIES[tpl.category].color} />
              <View style={styles.info}>
                <AppText variant="subheading" weight="semibold">
                  {tpl.title}
                </AppText>
                <View style={styles.meta}>
                  <AppText variant="caption" tone="muted">
                    {formatMinutes(tpl.estimatedMinutes)}
                  </AppText>
                  <View style={[styles.dot, { backgroundColor: priority.color }]} />
                  <AppText variant="caption" style={{ color: priority.color }}>
                    {priority.label}
                  </AppText>
                  <View style={[styles.dot, { backgroundColor: colors.textMuted }]} />
                  <AppText variant="caption" tone="muted">
                    {tpl.repeat === 'diariamente' ? 'Diária' : 'Semanal'}
                  </AppText>
                </View>
              </View>
              <View style={[styles.xpBadge, { backgroundColor: colors.primarySoft }]}>
                <AppText variant="caption" weight="bold" tone="accent">
                  +{tpl.xp} XP
                </AppText>
              </View>
            </Pressable>
          </Animated.View>
        );
      })}

      <PrimaryButton
        label="Adicionar tarefa personalizada"
        icon="add"
        onPress={() => router.push('/task/new')}
        style={styles.addButton}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  nav: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  subtitle: {
    marginBottom: spacing.lg,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    borderRadius: radius.lg,
    borderWidth: 1,
    padding: spacing.md,
    marginBottom: spacing.sm + 2,
  },
  info: {
    flex: 1,
    gap: 4,
  },
  meta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  dot: {
    width: 4,
    height: 4,
    borderRadius: 2,
  },
  xpBadge: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: radius.full,
  },
  addButton: {
    marginTop: spacing.lg,
  },
});
