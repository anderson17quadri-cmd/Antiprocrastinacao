import React, { useEffect, useMemo, useState } from 'react';
import { Alert, Pressable, StyleSheet, View } from 'react-native';
import { router } from 'expo-router';
import Ionicons from '@expo/vector-icons/Ionicons';
import { AppText } from '@/components/ui/AppText';
import { Avatar } from '@/components/ui/Avatar';
import { Card } from '@/components/ui/Card';
import { Confetti } from '@/components/ui/Confetti';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { Screen } from '@/components/ui/Screen';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { StatCard } from '@/components/home/StatCard';
import { TaskListItem } from '@/components/home/TaskListItem';
import { WeekStrip } from '@/components/home/WeekStrip';
import { coupleScore } from '@/domain/gamification';
import { completionBlockReason, isDoneFor } from '@/domain/taskRules';
import { completionRatio, tasksForDate } from '@/domain/stats';
import { useAuthStore } from '@/stores/authStore';
import { useTaskStore } from '@/stores/taskStore';
import { useTimerStore } from '@/stores/timerStore';
import { spacing, useTheme } from '@/theme';
import { fullDate, greeting, todayKey, dayjs } from '@/utils/date';
import { formatPoints } from '@/utils/format';

export default function HomeScreen() {
  const { colors } = useTheme();
  const user = useAuthStore((s) => s.user);
  const partner = useAuthStore((s) => s.partner);
  const couple = useAuthStore((s) => s.couple);
  const tasks = useTaskStore((s) => s.tasks);
  const ensureSeeded = useTaskStore((s) => s.ensureSeeded);
  const startTask = useTaskStore((s) => s.startTask);
  const completeTask = useTaskStore((s) => s.completeTask);
  const timer = useTimerStore();

  const [selectedDate, setSelectedDate] = useState(todayKey());

  useEffect(() => {
    ensureSeeded(todayKey());
  }, [ensureSeeded]);

  const dayTasks = useMemo(
    () => tasksForDate(Object.values(tasks), selectedDate),
    [tasks, selectedDate],
  );

  const progress = completionRatio(dayTasks);
  const doneCount = dayTasks.filter((t) => t.status === 'done').length;
  const totalCount = dayTasks.filter((t) => t.status !== 'cancelled').length;
  const allDone = totalCount > 0 && doneCount === totalCount;

  const hello = greeting();
  const totalXp = (user?.xp ?? 0) + (partner?.xp ?? 0);
  const score = couple ? coupleScore(totalXp, user?.streakDays ?? 0) : totalXp;
  const productivity = Math.round(progress * 100);

  const nameFor = (id?: string) =>
    id === user?.id ? user?.name : id === partner?.id ? partner?.name : undefined;

  const handleAction = (taskId: string) => {
    if (!user) return;
    const task = tasks[taskId];
    if (!task) return;

    const blocked = completionBlockReason(task, user.id, nameFor(task.assigneeId));
    if (blocked) {
      Alert.alert('Tarefa bloqueada', blocked);
      return;
    }

    if (task.status === 'pending' && !isDoneFor(task, user.id)) {
      startTask(taskId, user);
      timer.start(taskId);
      router.push({ pathname: '/task/[id]', params: { id: taskId } });
    } else if (task.status === 'in_progress') {
      const spent = timer.activeTaskId === taskId ? timer.stop() : task.spentSeconds;
      completeTask(taskId, user, spent);
    }
  };

  return (
    <View style={{ flex: 1 }}>
      <Screen bottomInset={40}>
        {/* Cabeçalho */}
        <View style={styles.header}>
          <View style={{ flex: 1 }}>
            <AppText variant="body" tone="secondary">
              {hello.text},
            </AppText>
            <AppText variant="title" numberOfLines={1} adjustsFontSizeToFit>
              {user?.name?.split(' ')[0] ?? 'Casal'} {hello.emoji}
            </AppText>
            <AppText variant="caption" tone="muted" style={{ marginTop: 3 }}>
              {fullDate(dayjs(selectedDate))}
            </AppText>
          </View>
          <Pressable onPress={() => router.push('/notifications')} hitSlop={8} style={styles.bell}>
            <Ionicons name="notifications-outline" size={22} color={colors.text} />
            <View style={[styles.bellDot, { backgroundColor: colors.primary }]} />
          </Pressable>
          <View style={styles.avatars}>
            <Avatar name={user?.name ?? '?'} size={34} />
            {partner ? (
              <View style={styles.partnerAvatar}>
                <Avatar name={partner.name} size={34} />
              </View>
            ) : null}
          </View>
        </View>

        {/* Semana */}
        <View style={styles.week}>
          <WeekStrip selected={selectedDate} onSelect={setSelectedDate} />
        </View>

        {/* Progresso do dia */}
        <Card index={0}>
          <View style={styles.progressHeader}>
            <AppText variant="subheading" weight="semibold">
              Progresso do dia
            </AppText>
            <AppText variant="heading" weight="extrabold" tone="accent">
              {productivity}%
            </AppText>
          </View>
          <ProgressBar progress={progress} />
          <AppText variant="caption" tone="secondary" style={{ marginTop: 8 }}>
            {doneCount} de {totalCount} tarefas concluídas
          </AppText>
        </Card>

        {/* Estatísticas */}
        <View style={styles.stats}>
          <StatCard emoji="🔥" tint="#F97316" value={`${user?.streakDays ?? 0} dias`} label="Sequência" index={1} />
          <StatCard emoji="🏆" tint="#FBBF24" value={formatPoints(score)} label="Pontuação" index={2} />
          <StatCard emoji="❤️" tint="#F472B6" value={`${productivity}%`} label="Produtividade" detail={productivity >= 80 ? 'ótimo' : productivity >= 50 ? 'bom' : 'vamos lá'} index={3} />
        </View>

        {/* Tarefas de hoje */}
        <SectionHeader
          title={selectedDate === todayKey() ? 'Tarefas de hoje' : 'Tarefas do dia'}
          actionLabel="Biblioteca 📚"
          onAction={() => router.push('/library')}
        />
        {dayTasks.length === 0 ? (
          <Card animated={false} style={styles.empty}>
            <AppText style={{ fontSize: 40 }}>🌿</AppText>
            <AppText variant="subheading" weight="semibold">
              Nenhuma tarefa neste dia
            </AppText>
            <AppText variant="body" tone="secondary" style={{ textAlign: 'center' }}>
              Toque no botão + para planejar o dia de vocês.
            </AppText>
          </Card>
        ) : (
          dayTasks.map((task, index) => (
            <TaskListItem
              key={task.id}
              task={task}
              index={index}
              currentUserId={user?.id}
              assigneeName={nameFor(task.assigneeId)}
              onPress={() => router.push({ pathname: '/task/[id]', params: { id: task.id } })}
              onAction={() => handleAction(task.id)}
            />
          ))
        )}
      </Screen>
      <Confetti visible={allDone} />
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginBottom: spacing.lg,
  },
  bell: {
    padding: 4,
  },
  bellDot: {
    position: 'absolute',
    top: 4,
    right: 4,
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  avatars: {
    flexDirection: 'row',
  },
  partnerAvatar: {
    marginLeft: -10,
  },
  week: {
    marginBottom: spacing.lg,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  stats: {
    flexDirection: 'row',
    gap: spacing.sm + 2,
    marginTop: spacing.lg,
  },
  empty: {
    alignItems: 'center',
    gap: 8,
    paddingVertical: spacing.xxl,
  },
});
