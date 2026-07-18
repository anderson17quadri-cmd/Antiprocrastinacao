import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import * as Haptics from 'expo-haptics';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { AppText } from '@/components/ui/AppText';
import { EmojiBadge } from '@/components/ui/EmojiBadge';
import { CATEGORIES, TASK_TYPES } from '@/constants/categories';
import { Task } from '@/domain/entities';
import { canComplete, isDoneFor } from '@/domain/taskRules';
import { cardShadow, radius, spacing, useTheme } from '@/theme';
import { formatMinutes } from '@/utils/format';

interface Props {
  task: Task;
  assigneeName?: string;
  /** Nome de quem concluiu (placar do casal). */
  completedByName?: string;
  /** Usuário atual — define conclusão individual e permissão de casa. */
  currentUserId?: string;
  onPress: () => void;
  onAction: () => void;
  index?: number;
}

/** Linha de tarefa da lista: ícone, nome, horário, responsável e ação. */
export function TaskListItem({ task, assigneeName, completedByName, currentUserId, onPress, onAction, index = 0 }: Props) {
  const { colors, dark } = useTheme();
  const category = CATEGORIES[task.category];
  const tint = task.color ?? category.color;
  const done = currentUserId ? isDoneFor(task, currentUserId) : task.status === 'done';
  const cancelled = task.status === 'cancelled';
  const inProgress = task.status === 'in_progress' && !done;
  const locked = Boolean(
    currentUserId &&
      !done &&
      !cancelled &&
      !canComplete(task, currentUserId) &&
      task.assigneeId &&
      task.assigneeId !== currentUserId,
  );
  const typeMeta = TASK_TYPES[task.type];

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
        <EmojiBadge emoji={task.emoji} tint={tint} />
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
            <View style={[styles.dot, { backgroundColor: tint }]} />
            <AppText variant="caption" tone="muted">
              {typeMeta.emoji} {category.label}
            </AppText>
            <View style={[styles.dot, { backgroundColor: colors.textMuted }]} />
            <AppText variant="caption" tone="muted" numberOfLines={1}>
              {task.type === 'compartilhada'
                ? 'A dois'
                : task.assigneeId
                  ? (assigneeName ?? 'Par')
                  : task.type === 'casa'
                    ? 'Ambos'
                    : 'Cada um'}
            </AppText>
          </View>
          <AppText variant="caption" tone="muted">
            {task.status === 'done' && completedByName
              ? `✅ feita por ${completedByName}`
              : `⏱ ${formatMinutes(task.estimatedMinutes)}${
                  task.type === 'individual' && task.completedBy?.length === 1 && !done
                    ? ' · par já concluiu 👀'
                    : ''
                }`}
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
                  : locked
                    ? colors.glass
                    : colors.primarySoft,
            },
          ]}
        >
          <Ionicons
            name={
              done
                ? 'checkmark'
                : cancelled
                  ? 'close'
                  : locked
                    ? 'lock-closed'
                    : inProgress
                      ? 'pause'
                      : 'play'
            }
            size={18}
            color={done ? colors.success : cancelled ? colors.danger : locked ? colors.textMuted : colors.primary}
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
