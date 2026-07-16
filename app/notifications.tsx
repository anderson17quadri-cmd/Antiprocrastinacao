import React, { useMemo } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { AppText } from '@/components/ui/AppText';
import { Avatar } from '@/components/ui/Avatar';
import { Card } from '@/components/ui/Card';
import { Screen } from '@/components/ui/Screen';
import { ActivityEvent } from '@/domain/entities';
import { useTaskStore } from '@/stores/taskStore';
import { cardShadow, radius, spacing, useTheme } from '@/theme';
import { dayjs, capitalize, todayKey } from '@/utils/date';

function describe(event: ActivityEvent): { text: string; icon: string; tint: string } {
  switch (event.type) {
    case 'started':
      return { text: `iniciou a tarefa ${event.taskTitle}`, icon: '▶️', tint: '#6C63FF' };
    case 'completed':
      return { text: `concluiu ${event.taskTitle}`, icon: '✅', tint: '#34D399' };
    case 'cancelled':
      return { text: `cancelou ${event.taskTitle}`, icon: '❌', tint: '#F87171' };
    case 'reward':
      return { text: event.message ?? 'resgatou uma recompensa', icon: '🎁', tint: '#F472B6' };
    case 'milestone':
    default:
      return { text: event.message ?? 'atingiu uma meta', icon: '🎉', tint: '#FBBF24' };
  }
}

/** Feed de notificações em tempo real do casal. */
export default function NotificationsScreen() {
  const { colors, dark } = useTheme();
  const activity = useTaskStore((s) => s.activity);

  const sections = useMemo(() => {
    const today = todayKey();
    const yesterday = dayjs().subtract(1, 'day').format('YYYY-MM-DD');
    const groups: { title: string; events: ActivityEvent[] }[] = [
      { title: 'Hoje', events: [] },
      { title: 'Ontem', events: [] },
      { title: 'Anteriores', events: [] },
    ];
    activity.forEach((event) => {
      const day = dayjs(event.at).format('YYYY-MM-DD');
      if (day === today) groups[0].events.push(event);
      else if (day === yesterday) groups[1].events.push(event);
      else groups[2].events.push(event);
    });
    return groups.filter((g) => g.events.length > 0);
  }, [activity]);

  return (
    <Screen bottomInset={20}>
      <View style={styles.nav}>
        <Pressable onPress={() => router.back()} hitSlop={12}>
          <Ionicons name="chevron-back" size={24} color={colors.text} />
        </Pressable>
        <AppText variant="subheading" weight="semibold">
          Notificações
        </AppText>
        <Pressable onPress={() => router.push('/settings')} hitSlop={12}>
          <Ionicons name="settings-outline" size={20} color={colors.text} />
        </Pressable>
      </View>

      {sections.length === 0 ? (
        <Card animated={false} style={styles.empty}>
          <AppText style={{ fontSize: 40 }}>🔔</AppText>
          <AppText variant="subheading" weight="semibold">
            Tudo tranquilo por aqui
          </AppText>
          <AppText variant="body" tone="secondary" style={{ textAlign: 'center' }}>
            As atividades do casal — tarefas iniciadas, concluídas e recompensas — aparecem aqui em
            tempo real.
          </AppText>
        </Card>
      ) : (
        sections.map((section) => (
          <View key={section.title}>
            <AppText variant="caption" tone="secondary" style={styles.sectionTitle}>
              {section.title}
            </AppText>
            {section.events.map((event, index) => {
              const info = describe(event);
              const isMilestone = event.type === 'milestone' || event.type === 'reward';
              return (
                <Animated.View key={event.id} entering={FadeInDown.delay(index * 40).springify().damping(18)}>
                  <View
                    style={[
                      styles.row,
                      { backgroundColor: colors.surface, borderColor: colors.border },
                      cardShadow(dark),
                    ]}
                  >
                    {isMilestone ? (
                      <View style={[styles.milestoneIcon, { backgroundColor: `${info.tint}26` }]}>
                        <AppText style={{ fontSize: 20 }}>{info.icon}</AppText>
                      </View>
                    ) : (
                      <Avatar name={event.userName} size={42} />
                    )}
                    <View style={styles.info}>
                      <AppText variant="body">
                        {isMilestone ? (
                          info.text
                        ) : (
                          <>
                            <AppText variant="body" weight="semibold">
                              {event.userName}
                            </AppText>{' '}
                            {info.text}
                          </>
                        )}
                      </AppText>
                      <AppText variant="caption" tone="muted">
                        {section.title === 'Hoje'
                          ? capitalize(dayjs(event.at).fromNow())
                          : dayjs(event.at).format('D MMM, HH:mm')}
                      </AppText>
                    </View>
                    <View style={[styles.typeDot, { backgroundColor: info.tint }]} />
                  </View>
                </Animated.View>
              );
            })}
          </View>
        ))
      )}
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
  sectionTitle: {
    marginTop: spacing.lg,
    marginBottom: spacing.sm,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    borderRadius: radius.lg,
    borderWidth: 1,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  milestoneIcon: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
  },
  info: {
    flex: 1,
    gap: 2,
  },
  typeDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  empty: {
    alignItems: 'center',
    gap: 8,
    paddingVertical: spacing.xxl,
    marginTop: spacing.xl,
  },
});
