import React, { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Switch, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import Ionicons from '@expo/vector-icons/Ionicons';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { AppText } from '@/components/ui/AppText';
import { PrimaryButton } from '@/components/ui/PrimaryButton';
import { Screen } from '@/components/ui/Screen';
import { TextField } from '@/components/ui/TextField';
import {
  DEFAULT_ROUTINE,
  QUICK_TIMES_SLEEP,
  QUICK_TIMES_WAKE,
  ROUTINE_HABITS,
  RoutineConfig,
} from '@/constants/routine';
import { useAuthStore } from '@/stores/authStore';
import { useRoutineStore } from '@/stores/routineStore';
import { useTaskStore } from '@/stores/taskStore';
import { radius, spacing, useTheme } from '@/theme';
import { todayKey } from '@/utils/date';

const WEEK_DAYS = [
  { iso: 1, label: 'S' },
  { iso: 2, label: 'T' },
  { iso: 3, label: 'Q' },
  { iso: 4, label: 'Q' },
  { iso: 5, label: 'S' },
  { iso: 6, label: 'S' },
  { iso: 7, label: 'D' },
];

/**
 * Onboarding / edição da rotina pessoal: horários, trabalho e hábitos.
 * Gera a agenda diária individual de cada membro do casal.
 */
export default function RoutineScreen() {
  const { colors } = useTheme();
  const params = useLocalSearchParams<{ next?: string }>();
  const user = useAuthStore((s) => s.user);
  const existing = useRoutineStore((s) => (user ? s.routines[user.id] : undefined));
  const setRoutine = useRoutineStore((s) => s.setRoutine);
  const reseedDay = useTaskStore((s) => s.reseedDay);

  const [config, setConfig] = useState<RoutineConfig>(existing ?? DEFAULT_ROUTINE);

  const patch = (partial: Partial<RoutineConfig>) => setConfig((c) => ({ ...c, ...partial }));

  const toggleDay = (iso: number) =>
    patch({
      workDays: config.workDays.includes(iso)
        ? config.workDays.filter((d) => d !== iso)
        : [...config.workDays, iso].sort(),
    });

  const toggleHabit = (id: string) =>
    patch({
      habits: config.habits.includes(id)
        ? config.habits.filter((h) => h !== id)
        : [...config.habits, id],
    });

  const save = () => {
    if (!user) return;
    setRoutine(user.id, config);
    reseedDay(todayKey());
    if (params.next === 'pair') {
      router.replace('/(auth)/pair');
    } else if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/(tabs)');
    }
  };

  const timeChip = (value: string, active: boolean, onPress: () => void) => (
    <Pressable
      key={value}
      onPress={onPress}
      style={[
        styles.chip,
        {
          backgroundColor: active ? colors.primary : colors.glass,
          borderColor: active ? colors.primary : colors.border,
        },
      ]}
    >
      <AppText variant="caption" weight="semibold" style={{ color: active ? '#FFFFFF' : colors.textSecondary }}>
        {value}
      </AppText>
    </Pressable>
  );

  return (
    <Screen bottomInset={20}>
      <View style={styles.nav}>
        <Pressable onPress={() => (router.canGoBack() ? router.back() : router.replace('/(tabs)'))} hitSlop={12}>
          <Ionicons name="chevron-back" size={24} color={colors.text} />
        </Pressable>
        <AppText variant="subheading" weight="semibold">
          Minha rotina
        </AppText>
        <Pressable onPress={save} hitSlop={12}>
          <AppText variant="subheading" tone="accent" weight="semibold">
            Salvar
          </AppText>
        </Pressable>
      </View>

      <Animated.View entering={FadeInDown.duration(500)}>
        <LinearGradient
          colors={[...colors.gradient]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.hero}
        >
          <AppText style={{ fontSize: 34 }}>🗓️</AppText>
          <AppText variant="heading" style={{ color: '#FFFFFF' }}>
            Monte sua agenda
          </AppText>
          <AppText variant="body" style={{ color: 'rgba(255,255,255,0.88)', textAlign: 'center' }}>
            Seus horários, seu trabalho e seus hábitos. O app cria sua agenda do dia
            automaticamente — a do seu par é dele, e as tarefas da casa são de vocês dois.
          </AppText>
        </LinearGradient>

        {/* Horários */}
        <AppText variant="heading" style={styles.sectionTitle}>
          Horários ⏰
        </AppText>
        <AppText variant="caption" tone="secondary" style={styles.groupLabel}>
          Acordar
        </AppText>
        <View style={styles.chipRow}>
          {QUICK_TIMES_WAKE.map((t) => timeChip(t, config.wakeTime === t, () => patch({ wakeTime: t })))}
        </View>
        <AppText variant="caption" tone="secondary" style={styles.groupLabel}>
          Dormir
        </AppText>
        <View style={styles.chipRow}>
          {QUICK_TIMES_SLEEP.map((t) => timeChip(t, config.sleepTime === t, () => patch({ sleepTime: t })))}
        </View>

        {/* Trabalho */}
        <View style={styles.workHeader}>
          <AppText variant="heading">Trabalho 💼</AppText>
          <Switch
            value={config.workEnabled}
            onValueChange={(v) => patch({ workEnabled: v })}
            trackColor={{ true: colors.primary, false: colors.glass }}
            thumbColor="#FFFFFF"
          />
        </View>
        {config.workEnabled ? (
          <>
            <TextField
              label="Nome (Trabalho, Estudos, Faculdade…)"
              placeholder="Trabalho"
              value={config.workLabel}
              onChangeText={(v) => patch({ workLabel: v })}
            />
            <View style={styles.rowFields}>
              <View style={{ flex: 1 }}>
                <TextField
                  label="Início"
                  placeholder="09:00"
                  value={config.workStart}
                  onChangeText={(v) => patch({ workStart: v })}
                />
              </View>
              <View style={{ flex: 1 }}>
                <TextField
                  label="Fim"
                  placeholder="17:00"
                  value={config.workEnd}
                  onChangeText={(v) => patch({ workEnd: v })}
                />
              </View>
            </View>
            <AppText variant="caption" tone="secondary" style={styles.groupLabel}>
              Dias de trabalho
            </AppText>
            <View style={styles.chipRow}>
              {WEEK_DAYS.map((d) => {
                const active = config.workDays.includes(d.iso);
                return (
                  <Pressable
                    key={d.iso}
                    onPress={() => toggleDay(d.iso)}
                    style={[
                      styles.dayChip,
                      {
                        backgroundColor: active ? colors.primary : colors.glass,
                        borderColor: active ? colors.primary : colors.border,
                      },
                    ]}
                  >
                    <AppText variant="caption" weight="bold" style={{ color: active ? '#FFFFFF' : colors.textSecondary }}>
                      {d.label}
                    </AppText>
                  </Pressable>
                );
              })}
            </View>
          </>
        ) : null}

        {/* Hábitos */}
        <AppText variant="heading" style={styles.sectionTitle}>
          Hábitos do dia ✨
        </AppText>
        <AppText variant="body" tone="secondary" style={{ marginBottom: spacing.md }}>
          Escolha o que faz parte da sua rotina — cada um entra na sua agenda no horário sugerido.
        </AppText>
        <View style={styles.habitGrid}>
          {ROUTINE_HABITS.map((habit) => {
            const active = config.habits.includes(habit.id);
            return (
              <Pressable
                key={habit.id}
                onPress={() => toggleHabit(habit.id)}
                style={[
                  styles.habit,
                  {
                    backgroundColor: active ? colors.primarySoft : colors.surface,
                    borderColor: active ? colors.primary : colors.border,
                  },
                ]}
              >
                <AppText style={{ fontSize: 22 }}>{habit.emoji}</AppText>
                <AppText variant="caption" weight="semibold" numberOfLines={1}>
                  {habit.title}
                </AppText>
                <AppText variant="caption" tone="muted" style={{ fontSize: 10 }}>
                  {habit.defaultTime} · {habit.estimatedMinutes} min
                </AppText>
                {active ? (
                  <View style={styles.habitCheck}>
                    <Ionicons name="checkmark-circle" size={18} color={colors.primary} />
                  </View>
                ) : null}
              </Pressable>
            );
          })}
        </View>

        <PrimaryButton label="Salvar minha rotina" icon="checkmark" onPress={save} style={styles.save} />
      </Animated.View>
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
  },
  sectionTitle: {
    marginTop: spacing.xl,
    marginBottom: spacing.sm,
  },
  groupLabel: {
    marginTop: spacing.md,
    marginBottom: spacing.sm,
    marginLeft: 4,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: radius.full,
    borderWidth: 1,
  },
  dayChip: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  workHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: spacing.xl,
    marginBottom: spacing.md,
  },
  rowFields: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  habitGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm + 2,
  },
  habit: {
    width: '47.5%',
    flexGrow: 1,
    borderRadius: radius.md,
    borderWidth: 1.5,
    padding: spacing.md,
    gap: 3,
  },
  habitCheck: {
    position: 'absolute',
    top: 8,
    right: 8,
  },
  save: {
    marginTop: spacing.xl,
  },
});
