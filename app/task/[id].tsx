import React from 'react';
import { Alert, Pressable, StyleSheet, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import Ionicons from '@expo/vector-icons/Ionicons';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { AppText } from '@/components/ui/AppText';
import { Card } from '@/components/ui/Card';
import { EmojiBadge } from '@/components/ui/EmojiBadge';
import { PrimaryButton } from '@/components/ui/PrimaryButton';
import { ProgressRing } from '@/components/ui/ProgressRing';
import { Screen } from '@/components/ui/Screen';
import { CATEGORIES, TASK_TYPES } from '@/constants/categories';
import { completionBlockReason, isDoneFor } from '@/domain/taskRules';
import { useNow } from '@/hooks/useNow';
import { useAuthStore } from '@/stores/authStore';
import { useTaskStore } from '@/stores/taskStore';
import { useTimerStore } from '@/stores/timerStore';
import { spacing, font, useTheme } from '@/theme';
import { formatClock, formatMinutes, timeRange } from '@/utils/format';

/** Detalhe da tarefa + cronômetro. */
export default function TaskDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { colors } = useTheme();
  const user = useAuthStore((s) => s.user);
  const partner = useAuthStore((s) => s.partner);
  const task = useTaskStore((s) => (id ? s.tasks[id] : undefined));
  const startTask = useTaskStore((s) => s.startTask);
  const completeTask = useTaskStore((s) => s.completeTask);
  const cancelTask = useTaskStore((s) => s.cancelTask);
  const timer = useTimerStore();

  useNow(1000);

  if (!task || !user) {
    return (
      <Screen scroll={false} style={styles.missing}>
        <AppText variant="subheading" tone="secondary">
          Tarefa não encontrada.
        </AppText>
        <PrimaryButton label="Voltar" variant="ghost" onPress={() => router.back()} />
      </Screen>
    );
  }

  const category = CATEGORIES[task.category];
  const tint = task.color ?? category.color;
  const typeMeta = TASK_TYPES[task.type];
  const isActive = timer.activeTaskId === task.id;
  const elapsed = isActive ? timer.elapsed() : task.spentSeconds;
  const estimatedSeconds = task.estimatedMinutes * 60;
  const ringProgress = estimatedSeconds > 0 ? Math.min(1, elapsed / estimatedSeconds) : 0;
  const assigneeName =
    task.assigneeId === user.id ? user.name : task.assigneeId === partner?.id ? partner?.name : 'Ambos';
  const doneForMe = isDoneFor(task, user.id);
  const blockReason = completionBlockReason(task, user.id, assigneeName);

  const handleStart = () => {
    if (blockReason) {
      Alert.alert('Tarefa bloqueada', blockReason);
      return;
    }
    startTask(task.id, user);
    timer.start(task.id);
  };

  const handlePauseResume = () => {
    if (timer.running) timer.pause();
    else timer.resume();
  };

  const handleComplete = () => {
    if (blockReason) {
      Alert.alert('Tarefa bloqueada', blockReason);
      return;
    }
    const spent = isActive ? timer.stop() : task.spentSeconds;
    if (completeTask(task.id, user, spent)) {
      router.back();
    }
  };

  const handleCancel = () => {
    Alert.alert('Cancelar tarefa', `Deseja cancelar "${task.title}"?`, [
      { text: 'Voltar', style: 'cancel' },
      {
        text: 'Cancelar tarefa',
        style: 'destructive',
        onPress: () => {
          if (isActive) timer.stop();
          cancelTask(task.id, user);
          router.back();
        },
      },
    ]);
  };

  const statusLabel =
    task.status === 'done'
      ? 'Concluída ✅'
      : doneForMe
        ? 'Sua parte concluída ✅ — o par ainda está pendente'
        : task.status === 'cancelled'
          ? 'Cancelada'
          : isActive && timer.running
            ? 'Em andamento…'
            : isActive
              ? 'Pausada'
              : 'Pendente';

  return (
    <Screen bottomInset={20}>
      <View style={styles.nav}>
        <Pressable onPress={() => router.back()} hitSlop={12}>
          <Ionicons name="chevron-back" size={24} color={colors.text} />
        </Pressable>
        <AppText variant="subheading" weight="semibold">
          Detalhes da Tarefa
        </AppText>
        <Pressable onPress={handleCancel} hitSlop={12}>
          <Ionicons name="trash-outline" size={20} color={colors.danger} />
        </Pressable>
      </View>

      <Animated.View entering={FadeInDown.duration(500)} style={styles.hero}>
        <EmojiBadge emoji={task.emoji} tint={tint} size={88} />
        <AppText variant="title" style={styles.title}>
          {task.title}
        </AppText>
        <AppText variant="subheading" tone="secondary">
          {timeRange(task.time, task.estimatedMinutes)}
        </AppText>
        {task.description ? (
          <AppText variant="body" tone="secondary" style={styles.description}>
            {task.description}
          </AppText>
        ) : null}
      </Animated.View>

      <Card index={1} style={styles.metaCard}>
        <View style={styles.metaRow}>
          <AppText variant="body" tone="secondary">
            Tipo
          </AppText>
          <AppText variant="subheading" weight="semibold">
            {typeMeta.emoji} {typeMeta.label}
          </AppText>
        </View>
        <View style={[styles.metaDivider, { backgroundColor: colors.border }]} />
        <View style={styles.metaRow}>
          <AppText variant="body" tone="secondary">
            Responsável
          </AppText>
          <AppText variant="subheading" weight="semibold">
            {task.type === 'individual' ? 'Cada um' : task.type === 'compartilhada' ? 'A dois' : assigneeName}
          </AppText>
        </View>
        <View style={[styles.metaDivider, { backgroundColor: colors.border }]} />
        <View style={styles.metaRow}>
          <AppText variant="body" tone="secondary">
            Duração estimada
          </AppText>
          <AppText variant="subheading" weight="semibold">
            {formatMinutes(task.estimatedMinutes)}
          </AppText>
        </View>
        <View style={[styles.metaDivider, { backgroundColor: colors.border }]} />
        <View style={styles.metaRow}>
          <AppText variant="body" tone="secondary">
            Categoria
          </AppText>
          <AppText variant="subheading" weight="semibold" style={{ color: category.color }}>
            {category.emoji} {category.label}
          </AppText>
        </View>
        {task.notes ? (
          <>
            <View style={[styles.metaDivider, { backgroundColor: colors.border }]} />
            <View style={{ gap: 4 }}>
              <AppText variant="body" tone="secondary">
                Notas
              </AppText>
              <AppText variant="body">{task.notes}</AppText>
            </View>
          </>
        ) : null}
      </Card>

      {/* Cronômetro */}
      <Card index={2} style={styles.timerCard}>
        <AppText variant="label" tone="secondary">
          Timer
        </AppText>
        <ProgressRing progress={ringProgress} size={190} strokeWidth={11}>
          <View style={styles.timerInner}>
            <AppText style={[styles.clock, { color: colors.text }]}>{formatClock(elapsed)}</AppText>
            <AppText variant="caption" tone="muted">
              {statusLabel}
            </AppText>
          </View>
        </ProgressRing>

        {doneForMe && task.status !== 'done' ? (
          <AppText variant="body" tone="success" weight="semibold" style={{ textAlign: 'center' }}>
            Você já concluiu a sua parte 🎉{'\n'}Aguardando {partner?.name ?? 'seu par'}…
          </AppText>
        ) : task.status === 'pending' || task.status === 'cancelled' ? (
          <PrimaryButton label="Iniciar" icon="play" onPress={handleStart} style={styles.fullWidth} />
        ) : task.status === 'in_progress' ? (
          <View style={styles.timerActions}>
            <PrimaryButton
              label={timer.running || !isActive ? 'Pausar' : 'Retomar'}
              icon={timer.running || !isActive ? 'pause' : 'play'}
              variant="ghost"
              onPress={handlePauseResume}
              style={styles.actionButton}
            />
            <PrimaryButton
              label="Concluir"
              icon="checkmark"
              onPress={handleComplete}
              style={styles.actionButton}
            />
          </View>
        ) : (
          <AppText variant="body" tone="success" weight="semibold">
            Tempo registrado: {formatClock(task.spentSeconds)} 🎉
          </AppText>
        )}
      </Card>
    </Screen>
  );
}

const styles = StyleSheet.create({
  nav: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.xl,
  },
  hero: {
    alignItems: 'center',
    gap: 6,
    marginBottom: spacing.xl,
  },
  title: {
    textAlign: 'center',
    marginTop: spacing.sm,
  },
  description: {
    textAlign: 'center',
    marginTop: 4,
    paddingHorizontal: spacing.xl,
  },
  metaCard: {
    gap: spacing.md,
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  metaDivider: {
    height: StyleSheet.hairlineWidth * 2,
  },
  timerCard: {
    alignItems: 'center',
    gap: spacing.lg,
    marginTop: spacing.md,
    paddingVertical: spacing.xl,
  },
  timerInner: {
    alignItems: 'center',
    gap: 4,
  },
  clock: {
    fontSize: 36,
    lineHeight: 46,
    fontFamily: font.extrabold,
    fontVariant: ['tabular-nums'],
  },
  timerActions: {
    flexDirection: 'row',
    gap: spacing.md,
    width: '100%',
  },
  actionButton: {
    flex: 1,
  },
  fullWidth: {
    alignSelf: 'stretch',
  },
  missing: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.lg,
  },
});
