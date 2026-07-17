import React, { useMemo, useState } from 'react';
import { StyleSheet, View, useWindowDimensions } from 'react-native';
import { VictoryAxis, VictoryBar, VictoryChart } from 'victory-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { AppText } from '@/components/ui/AppText';
import { Card } from '@/components/ui/Card';
import { ProgressRing } from '@/components/ui/ProgressRing';
import { Screen } from '@/components/ui/Screen';
import { SegmentedControl } from '@/components/ui/SegmentedControl';
import {
  completedByDay,
  completionRatio,
  inRange,
  productiveSeconds,
  wastedSeconds,
} from '@/domain/stats';
import { useAuthStore } from '@/stores/authStore';
import { useTaskStore } from '@/stores/taskStore';
import { font, spacing, useTheme } from '@/theme';
import { capitalize, dayjs } from '@/utils/date';
import { formatHours } from '@/utils/format';

type Period = 'hoje' | 'semana' | 'mes' | 'ano';

export default function ReportsScreen() {
  const { colors } = useTheme();
  const { width } = useWindowDimensions();
  const tasks = useTaskStore((s) => s.tasks);
  const user = useAuthStore((s) => s.user);
  const partner = useAuthStore((s) => s.partner);
  const [period, setPeriod] = useState<Period>('semana');

  const allTasks = useMemo(() => Object.values(tasks), [tasks]);

  const { start, days, label } = useMemo(() => {
    const now = dayjs();
    if (period === 'hoje') {
      return { start: now.startOf('day'), days: 1, label: capitalize(now.format('dddd, D [de] MMMM')) };
    }
    if (period === 'semana') {
      const s = now.startOf('isoWeek');
      return { start: s, days: 7, label: `${s.format('D')} – ${s.add(6, 'day').format('D [de] MMMM')}` };
    }
    if (period === 'mes') {
      const s = now.startOf('month');
      return { start: s, days: now.daysInMonth(), label: capitalize(now.format('MMMM [de] YYYY')) };
    }
    const s = now.startOf('year');
    return { start: s, days: 365, label: now.format('YYYY') };
  }, [period]);

  const periodTasks = useMemo(
    () => inRange(allTasks, start, start.add(days - 1, 'day')),
    [allTasks, start, days],
  );

  const completed = periodTasks.filter((t) => t.status === 'done').length;
  const productive = productiveSeconds(periodTasks);
  const wasted = wastedSeconds(periodTasks);
  const productivity = Math.round(completionRatio(periodTasks) * 100);

  const chartData = useMemo(() => {
    const stats = completedByDay(allTasks, dayjs().startOf('isoWeek'), 7);
    return stats.map((s) => ({ x: capitalize(s.label), y: s.completed }));
  }, [allTasks]);

  const userDone = periodTasks.filter((t) => t.status === 'done' && t.assigneeId === user?.id).length;
  const partnerDone = periodTasks.filter((t) => t.status === 'done' && t.assigneeId === partner?.id).length;
  const ranking = [
    {
      name: user?.name ?? 'Você',
      count: userDone,
      xp: user?.xp ?? 0,
      coins: user?.coins ?? 0,
      streak: user?.streakDays ?? 0,
    },
    {
      name: partner?.name ?? 'Seu par',
      count: partnerDone,
      xp: partner?.xp ?? 0,
      coins: partner?.coins ?? 0,
      streak: partner?.streakDays ?? 0,
    },
  ].sort((a, b) => b.count - a.count || b.xp - a.xp);

  // Estatísticas detalhadas do casal
  const detailedStats = useMemo(() => {
    const done = allTasks.filter((t) => t.status === 'done');
    const byMember = (id?: string, predicate?: (t: (typeof done)[number]) => boolean) =>
      done.filter((t) => t.assigneeId === id && (predicate ? predicate(t) : true)).length;

    const winner = (a: number, b: number) =>
      a === b ? 'Empate' : a > b ? (user?.name ?? 'Você') : (partner?.name ?? 'Seu par');

    const cooksUser = byMember(user?.id, (t) => t.category === 'cozinha');
    const cooksPartner = byMember(partner?.id, (t) => t.category === 'cozinha');
    const cleansUser = byMember(user?.id, (t) => t.category === 'casa' || t.category === 'lavandaria');
    const cleansPartner = byMember(partner?.id, (t) => t.category === 'casa' || t.category === 'lavandaria');
    const cancelledUser = allTasks.filter((t) => t.status === 'cancelled' && t.assigneeId === user?.id).length;
    const cancelledPartner = allTasks.filter((t) => t.status === 'cancelled' && t.assigneeId === partner?.id).length;

    const avgMinutes =
      done.length > 0
        ? Math.round(done.reduce((acc, t) => acc + (t.spentSeconds || t.estimatedMinutes * 60) / 60, 0) / done.length)
        : 0;

    const perDay = new Map<string, number>();
    done.forEach((t) => perDay.set(t.date, (perDay.get(t.date) ?? 0) + 1));
    const bestDay = [...perDay.entries()].sort((a, b) => b[1] - a[1])[0];

    return [
      { emoji: '🍳', label: 'Quem cozinha mais', value: winner(cooksUser, cooksPartner), detail: `${cooksUser} × ${cooksPartner}` },
      { emoji: '🧹', label: 'Quem limpa mais', value: winner(cleansUser, cleansPartner), detail: `${cleansUser} × ${cleansPartner}` },
      { emoji: '🐌', label: 'Quem procrastina mais', value: cancelledUser === cancelledPartner ? 'Empate' : cancelledUser > cancelledPartner ? (user?.name ?? 'Você') : (partner?.name ?? 'Seu par'), detail: `${cancelledUser} × ${cancelledPartner} canceladas` },
      { emoji: '⏱️', label: 'Tempo médio por tarefa', value: `${avgMinutes} min`, detail: `${done.length} tarefas medidas` },
      { emoji: '📅', label: 'Dia mais produtivo', value: bestDay ? capitalize(dayjs(bestDay[0]).format('dddd')) : '—', detail: bestDay ? `${bestDay[1]} tarefas` : 'sem dados' },
    ];
  }, [allTasks, user, partner]);

  return (
    <Screen bottomInset={40}>
      <AppText variant="title" style={styles.title}>
        Relatórios
      </AppText>

      <SegmentedControl<Period>
        options={[
          { value: 'hoje', label: 'Hoje' },
          { value: 'semana', label: 'Semana' },
          { value: 'mes', label: 'Mês' },
          { value: 'ano', label: 'Ano' },
        ]}
        value={period}
        onChange={setPeriod}
      />

      <View style={styles.summaryHeader}>
        <AppText variant="heading">Resumo</AppText>
        <AppText variant="caption" tone="secondary">
          {label}
        </AppText>
      </View>

      <View style={styles.grid}>
        <Card index={0} style={styles.tile}>
          <AppText variant="caption" tone="secondary">
            Tarefas concluídas
          </AppText>
          <AppText variant="title" weight="extrabold">
            {completed}
          </AppText>
          <View style={styles.trend}>
            <Ionicons name="trending-up" size={14} color={colors.success} />
            <AppText variant="caption" tone="success">
              constância é tudo
            </AppText>
          </View>
        </Card>
        <Card index={1} style={styles.tile}>
          <AppText variant="caption" tone="secondary">
            Horas produtivas
          </AppText>
          <AppText variant="title" weight="extrabold">
            {formatHours(productive)}
          </AppText>
          <View style={styles.trend}>
            <Ionicons name="trending-up" size={14} color={colors.success} />
            <AppText variant="caption" tone="success">
              tempo focado
            </AppText>
          </View>
        </Card>
        <Card index={2} style={styles.tile}>
          <AppText variant="caption" tone="secondary">
            Tempo desperdiçado
          </AppText>
          <AppText variant="title" weight="extrabold">
            {formatHours(wasted)}
          </AppText>
          <View style={styles.trend}>
            <Ionicons name="trending-down" size={14} color={colors.danger} />
            <AppText variant="caption" tone="danger">
              tarefas canceladas
            </AppText>
          </View>
        </Card>
        <Card index={3} style={[styles.tile, styles.ringTile]}>
          <AppText variant="caption" tone="secondary">
            Produtividade do casal
          </AppText>
          <ProgressRing progress={productivity / 100} size={96} strokeWidth={9}>
            <AppText variant="heading" weight="extrabold">
              {productivity}%
            </AppText>
          </ProgressRing>
          <AppText variant="caption" tone="accent" weight="semibold">
            {productivity >= 80 ? 'Ótimo' : productivity >= 50 ? 'Bom' : 'Continuem!'}
          </AppText>
        </Card>
      </View>

      <Card index={4} style={styles.chartCard}>
        <AppText variant="subheading" weight="semibold">
          Tarefas concluídas por dia
        </AppText>
        <AppText variant="caption" tone="muted" style={{ marginBottom: 4 }}>
          Semana atual
        </AppText>
        <VictoryChart
          height={220}
          width={width - spacing.xl * 2 - spacing.lg * 2}
          domainPadding={{ x: 18, y: 8 }}
          padding={{ top: 12, bottom: 32, left: 32, right: 12 }}
        >
          <VictoryAxis
            style={{
              axis: { stroke: 'transparent' },
              tickLabels: { fill: colors.textMuted, fontSize: 11, fontFamily: font.medium },
            }}
          />
          <VictoryAxis
            dependentAxis
            tickFormat={(t: number) => (Number.isInteger(t) ? `${t}` : '')}
            style={{
              axis: { stroke: 'transparent' },
              grid: { stroke: colors.border, strokeDasharray: '4,6' },
              tickLabels: { fill: colors.textMuted, fontSize: 10, fontFamily: font.medium },
            }}
          />
          <VictoryBar
            data={chartData}
            barWidth={16}
            cornerRadius={{ top: 6 }}
            style={{ data: { fill: colors.primary } }}
            animate={{ duration: 600, onLoad: { duration: 600 } }}
          />
        </VictoryChart>
      </Card>

      <Card index={5} style={styles.rankingCard}>
        <AppText variant="subheading" weight="semibold" style={{ marginBottom: spacing.md }}>
          Ranking do casal 🏆
        </AppText>
        {ranking.map((entry, i) => (
          <View key={entry.name} style={styles.rankRow}>
            <AppText variant="heading" weight="extrabold" tone={i === 0 ? 'accent' : 'muted'}>
              {i === 0 ? '🥇' : '🥈'}
            </AppText>
            <View style={{ flex: 1, gap: 2 }}>
              <View style={styles.rankName}>
                <AppText variant="subheading" weight="semibold">
                  {entry.name}
                </AppText>
                {i === 0 ? <AppText>👑</AppText> : null}
              </View>
              <AppText variant="caption" tone="muted">
                {entry.xp} XP · 🪙 {entry.coins} · 🔥 {entry.streak} dias
              </AppText>
            </View>
            <AppText variant="body" tone="secondary">
              {entry.count} tarefas
            </AppText>
          </View>
        ))}
      </Card>

      <Card index={6} style={styles.rankingCard}>
        <AppText variant="subheading" weight="semibold" style={{ marginBottom: spacing.md }}>
          Estatísticas detalhadas 📈
        </AppText>
        {detailedStats.map((stat) => (
          <View key={stat.label} style={styles.rankRow}>
            <AppText style={{ fontSize: 20 }}>{stat.emoji}</AppText>
            <AppText variant="body" tone="secondary" style={{ flex: 1 }}>
              {stat.label}
            </AppText>
            <View style={{ alignItems: 'flex-end' }}>
              <AppText variant="subheading" weight="semibold">
                {stat.value}
              </AppText>
              <AppText variant="caption" tone="muted">
                {stat.detail}
              </AppText>
            </View>
          </View>
        ))}
      </Card>
    </Screen>
  );
}

const styles = StyleSheet.create({
  title: {
    marginBottom: spacing.lg,
  },
  summaryHeader: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    marginTop: spacing.xl,
    marginBottom: spacing.md,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm + 2,
  },
  tile: {
    width: '48%',
    flexGrow: 1,
    gap: 4,
  },
  ringTile: {
    alignItems: 'center',
    gap: 8,
  },
  trend: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  chartCard: {
    marginTop: spacing.md,
  },
  rankingCard: {
    marginTop: spacing.md,
  },
  rankRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: 8,
  },
  rankName: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
});
