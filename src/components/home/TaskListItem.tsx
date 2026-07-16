import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { AppText } from '@/components/ui/AppText';
import { EmojiBadge } from '@/components/ui/EmojiBadge';
import { CATEGORIES } from '@/constants/categories';
import { Task } from '@/domain/entities';
import { cardShadow, radius, spacing, useTheme } from '@/theme';
import { formatMinutes } from '@/utils/format';

interface Props {
  task: Task;
  assigneeName?: string;
  onPress: () => void;
  onAction: () => void;
  index?: number;
}

/** Linha de tarefa da lista: ícone, nome, horário, responsável e ação. */
export function TaskListItem({ task, assigneeName, onPress, onAction, index = 0 }: Props) {
  const { colors, dark } = useTheme();
  const category = CATEGORIES[task.category];
  const done = task.status === 'done';
  const cancelled = task.status === 'cancelled';
  const inProgress = task.status === 'in_progress';

  const handleAction = () => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => undefined);
    onAction();
  };

  return (
    <Animated.View entering={FadeInDown.delay(index * 50).springify().damping(18)}>
      <Pressable
        onPress={onPress}
        android_ripple={{ color: colors.primarySoft, foreground: true }}
        style={[
          styles.row,
          { backgroundColor: colors.surface, borderColor: colors.border },
          cardShadow(dark),
          (done || cancelled) && { opacity: 0.62 },
        ]}
      >
        <EmojiBadge emoji={task.emoji} tint={category.color} />
        <View style={styles.info}>
          <AppText
            variant="subheading"
            weight="semibold"
            numberOfLines={1}
            style={done || cancelled ? styles.struck : undefined}
          >
            {task.title}
          </AppText>
          <View style={styles.meta}>
            {task.time ? (
              <AppText variant="caption" tone="muted">
                {task.time}
              </AppText>
            ) : null}
            <View style={[styles.dot, { backgroundColor: category.color }]} />
            <AppText variant="caption" tone="muted">
              {category.label}
            </AppText>
            {assigneeName ? (
              <>
                <View style={[styles.dot, { backgroundColor: colors.textMuted }]} />
                <AppText variant="caption" tone="muted" numberOfLines={1}>
                  {assigneeName}
                </AppText>
              </>
            ) : null}
          </View>
          <AppText variant="caption" tone="muted">
            ⏱ {formatMinutes(task.estimatedMinutes)}
          </AppText>
        </View>

        <Pressable
          onPress={handleAction}
          hitSlop={10}
          style={[
            styles.action,
            {
              backgroundColor: done
                ? colors.successSoft
                : cancelled
                  ? colors.dangerSoft
                  : colors.primarySoft,
            },
          ]}
        >
          <Ionicons
            name={done ? 'checkmark' : cancelled ? 'close' : inProgress ? 'pause' : 'play'}
            size={18}
            color={done ? colors.success : cancelled ? colors.danger : colors.primary}
          />
        </Pressable>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
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
    gap: 3,
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
  struck: {
    textDecorationLine: 'line-through',
  },
  action: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
