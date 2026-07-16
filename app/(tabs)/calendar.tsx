import React, { useMemo, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { AppText } from '@/components/ui/AppText';
import { Card } from '@/components/ui/Card';
import { Screen } from '@/components/ui/Screen';
import { SegmentedControl } from '@/components/ui/SegmentedControl';
import { WeekStrip } from '@/components/home/WeekStrip';
import { TaskListItem } from '@/components/home/TaskListItem';
import { CATEGORIES } from '@/constants/categories';
import { Task, TaskStatus } from '@/domain/entities';
import { tasksForDate } from '@/domain/stats';
import { useAuthStore } from '@/stores/authStore';
import { useTaskStore } from '@/stores/taskStore';
import { radius, spacing, useTheme } from '@/theme';
import { capitalize, dayjs, todayKey, DATE_KEY } from '@/utils/date';

type Mode = 'dia' | 'semana' | 'mes';

const STATUS_TINTS: Record<TaskStatus, string> = {
  pending: '#A78BFA',
  in_progress: '#6C63FF',
  done: '#34D399',
  cancelled: '#F87171',
};

export default function CalendarScreen() {
  const { colors } = useTheme();
  const tasks = useTaskStore((s) => s.tasks);
  const user = useAuthStore((s) => s.user);
  const partner = useAuthStore((s) => s.partner);
  const [mode, setMode] = useState<Mode>('semana');
  const [selected, setSelected] = useState(todayKey());

  const allTasks = useMemo(() => Object.values(tasks), [tasks]);
  const dayTasks = useMemo(() => tasksForDate(allTasks, selected), [allTasks, selected]);

  const anchor = dayjs(selected);
  const weekStart = anchor.startOf('isoWeek');
  const weekLabel = `${weekStart.format('D')} – ${weekStart.add(6, 'day').format('D [de] MMMM')}`;

  const nameFor = (id?: string) =>
    id === user?.id ? user?.name : id === partner?.id ? partner?.name : undefined;

  const openTask = (task: Task) =>
    router.push({ pathname: '/task/[id]', params: { id: task.id } });

  const renderMonth = () => {
    const monthStart = anchor.startOf('month');
    const gridStart = monthStart.startOf('isoWeek');
    const weeks = Array.from({ length: 6 }, (_, w) =>
      Array.from({ length: 7 }, (_, d) => gridStart.add(w * 7 + d, 'day')),
    );

    return (
      <Card animated={false} style={styles.monthCard}>
        <AppText variant="subheading" weight="semibold" style={styles.monthTitle}>
          {capitalize(anchor.format('MMMM [de] YYYY'))}
        </AppText>
        <View style={styles.monthHeader}>
          {['S', 'T', 'Q', 'Q', 'S', 'S', 'D'].map((d, i) => (
            <AppText key={i} variant="caption" tone="muted" style={styles.monthCell}>
              {d}
            </AppText>
          ))}
        </View>
        {weeks.map((week, wi) => (
          <View key={wi} style={styles.monthRow}>
            {week.map((day) => {
              const key = day.format(DATE_KEY);
              const inMonth = day.month() === anchor.month();
              const isSelected = key === selected;
              const dots = allTasks.filter((t) => t.date === key).slice(0, 3);
              return (
                <Pressable
                  key={key}
                  onPress={() => setSelected(key)}
                  style={[
                    styles.monthCell,
                    styles.monthDay,
                    isSelected && { backgroundColor: colors.primary, borderRadius: radius.sm },
                  ]}
                >
                  <AppText
                    variant="caption"
                    weight={isSelected ? 'bold' : 'medium'}
                    style={{
                      color: isSelected ? '#FFFFFF' : inMonth ? colors.text : colors.textMuted,
                    }}
                  >
                    {day.format('D')}
                  </AppText>
                  <View style={styles.dotRow}>
                    {dots.map((t) => (
                      <View
                        key={t.id}
                        style={[styles.eventDot, { backgroundColor: STATUS_TINTS[t.status] }]}
                      />
                    ))}
                  </View>
                </Pressable>
              );
            })}
          </View>
        ))}
      </Card>
    );
  };

  const renderTimeline = () => (
    <View style={styles.timeline}>
      {dayTasks.length === 0 ? (
        <Card animated={false} style={styles.empty}>
          <AppText style={{ fontSize: 36 }}>🗓️</AppText>
          <AppText variant="body" tone="secondary">
            Nada agendado para este dia.
          </AppText>
        </Card>
      ) : (
        dayTasks.map((task) => {
          const category = CATEGORIES[task.category];
          return (
            <Pressable key={task.id} onPress={() => openTask(task)} style={styles.timelineRow}>
              <AppText variant="caption" tone="muted" style={styles.timelineHour}>
                {task.time ?? '—'}
              </AppText>
              <View
                style={[
                  styles.eventBlock,
                  {
                    backgroundColor: `${category.color}22`,
                    borderLeftColor: STATUS_TINTS[task.status],
                  },
                ]}
              >
                <View style={styles.eventTitleRow}>
                  <AppText variant="caption">{task.emoji}</AppText>
                  <AppText
                    variant="subheading"
                    weight="semibold"
                    numberOfLines={1}
                    style={[
                      { flex: 1 },
                      (task.status === 'done' || task.status === 'cancelled') && styles.struck,
                    ]}
                  >
                    {task.title}
                  </AppText>
                  {task.status === 'done' ? (
                    <Ionicons name="checkmark-circle" size={16} color={colors.success} />
                  ) : task.status === 'cancelled' ? (
                    <Ionicons name="close-circle" size={16} color={colors.danger} />
                  ) : null}
                </View>
                <AppText variant="caption" tone="muted">
                  {category.label} · {nameFor(task.assigneeId) ?? 'Casal'}
                </AppText>
              </View>
            </Pressable>
          );
        })
      )}
    </View>
  );

  return (
    <Screen bottomInset={40}>
      <View style={styles.header}>
        <AppText variant="title">Calendário</AppText>
        <Pressable onPress={() => setSelected(todayKey())} hitSlop={8}>
          <Ionicons name="today-outline" size={22} color={colors.primary} />
        </Pressable>
      </View>

      <SegmentedControl<Mode>
        options={[
          { value: 'dia', label: 'Dia' },
          { value: 'semana', label: 'Semana' },
          { value: 'mes', label: 'Mês' },
        ]}
        value={mode}
        onChange={setMode}
      />

      {mode !== 'mes' ? (
        <>
          <AppText variant="subheading" weight="semibold" style={styles.weekLabel}>
            {weekLabel}
          </AppText>
          <WeekStrip selected={selected} onSelect={setSelected} />
        </>
      ) : null}

      {mode === 'mes' ? renderMonth() : null}
      {mode === 'semana' ? renderTimeline() : null}
      {mode === 'dia' ? (
        <View style={styles.dayList}>
          {dayTasks.map((task, index) => (
            <TaskListItem
              key={task.id}
              task={task}
              index={index}
              assigneeName={nameFor(task.assigneeId)}
              onPress={() => openTask(task)}
              onAction={() => openTask(task)}
            />
          ))}
        </View>
      ) : null}

      {/* Legenda */}
      <View style={styles.legend}>
        {(
          [
            ['Concluídas', STATUS_TINTS.done],
            ['Pendentes', STATUS_TINTS.pending],
            ['Canceladas', STATUS_TINTS.cancelled],
          ] as const
        ).map(([label, color]) => (
          <View key={label} style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: color }]} />
            <AppText variant="caption" tone="secondary">
              {label}
            </AppText>
          </View>
        ))}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.lg,
  },
  weekLabel: {
    marginTop: spacing.lg,
    marginBottom: spacing.sm,
  },
  timeline: {
    marginTop: spacing.lg,
    gap: spacing.sm,
  },
  timelineRow: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  timelineHour: {
    width: 44,
    paddingTop: 12,
    textAlign: 'right',
  },
  eventBlock: {
    flex: 1,
    borderLeftWidth: 3,
    borderRadius: radius.md,
    padding: spacing.md,
    gap: 4,
  },
  eventTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  struck: {
    textDecorationLine: 'line-through',
    opacity: 0.7,
  },
  monthCard: {
    marginTop: spacing.lg,
  },
  monthTitle: {
    textAlign: 'center',
    marginBottom: spacing.md,
  },
  monthHeader: {
    flexDirection: 'row',
    marginBottom: 4,
  },
  monthRow: {
    flexDirection: 'row',
  },
  monthCell: {
    flex: 1,
    textAlign: 'center',
    alignItems: 'center',
  },
  monthDay: {
    paddingVertical: 8,
    gap: 3,
  },
  dotRow: {
    flexDirection: 'row',
    gap: 2,
    height: 4,
  },
  eventDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
  },
  dayList: {
    marginTop: spacing.lg,
  },
  empty: {
    alignItems: 'center',
    gap: 8,
    paddingVertical: spacing.xxl,
  },
  legend: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: spacing.lg,
    marginTop: spacing.xl,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
});
