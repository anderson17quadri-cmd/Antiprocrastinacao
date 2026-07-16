import React from 'react';
import { Pressable, ScrollView, StyleSheet, Switch, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Controller, useForm } from 'react-hook-form';
import { Ionicons } from '@expo/vector-icons';
import { AppText } from '@/components/ui/AppText';
import { EmojiBadge } from '@/components/ui/EmojiBadge';
import { PrimaryButton } from '@/components/ui/PrimaryButton';
import { Screen } from '@/components/ui/Screen';
import { TextField } from '@/components/ui/TextField';
import { CATEGORIES, CATEGORY_KEYS, PRIORITIES } from '@/constants/categories';
import { TaskCategory, TaskDifficulty, TaskPriority, TaskRepeat } from '@/domain/entities';
import { scheduleTaskReminder } from '@/services/notifications';
import { useAuthStore } from '@/stores/authStore';
import { useTaskStore } from '@/stores/taskStore';
import { radius, spacing, useTheme } from '@/theme';
import { todayKey } from '@/utils/date';

interface FormValues {
  title: string;
  description: string;
  category: TaskCategory;
  estimatedMinutes: string;
  time: string;
  assigneeId: string;
  priority: TaskPriority;
  difficulty: TaskDifficulty;
  repeat: TaskRepeat;
  remind: boolean;
}

const REPEATS: { value: TaskRepeat; label: string }[] = [
  { value: 'nunca', label: 'Nunca' },
  { value: 'diariamente', label: 'Diário' },
  { value: 'semanalmente', label: 'Semanal' },
  { value: 'mensalmente', label: 'Mensal' },
];

const DIFFICULTIES: { value: TaskDifficulty; label: string; emoji: string }[] = [
  { value: 'facil', label: 'Fácil', emoji: '🙂' },
  { value: 'media', label: 'Média', emoji: '😅' },
  { value: 'dificil', label: 'Difícil', emoji: '🥵' },
];

/** Formulário de nova tarefa (React Hook Form). */
export default function NewTaskScreen() {
  const { colors } = useTheme();
  const params = useLocalSearchParams<{
    title?: string;
    emoji?: string;
    category?: TaskCategory;
    minutes?: string;
    difficulty?: TaskDifficulty;
  }>();
  const user = useAuthStore((s) => s.user);
  const partner = useAuthStore((s) => s.partner);
  const addTask = useTaskStore((s) => s.addTask);

  const { control, handleSubmit, watch, setValue } = useForm<FormValues>({
    defaultValues: {
      title: params.title ?? '',
      description: '',
      category: params.category ?? 'casa',
      estimatedMinutes: params.minutes ?? '40',
      time: '16:00',
      assigneeId: user?.id ?? '',
      priority: 'media',
      difficulty: params.difficulty ?? 'media',
      repeat: 'nunca',
      remind: true,
    },
  });

  const category = watch('category');
  const emoji = params.emoji ?? CATEGORIES[category].emoji;

  const onSubmit = handleSubmit(async (values) => {
    const task = addTask({
      title: values.title,
      description: values.description || undefined,
      emoji,
      category: values.category,
      date: todayKey(),
      time: values.time || undefined,
      estimatedMinutes: Math.max(5, parseInt(values.estimatedMinutes, 10) || 30),
      assigneeId: values.assigneeId || undefined,
      priority: values.priority,
      difficulty: values.difficulty,
      repeat: values.repeat,
    });

    if (values.remind && values.time) {
      const [h, m] = values.time.split(':').map(Number);
      const when = new Date();
      when.setHours(h, m, 0, 0);
      await scheduleTaskReminder(task.title, when);
    }
    router.back();
  });

  const chip = (active: boolean) => [
    styles.chip,
    {
      backgroundColor: active ? colors.primary : colors.glass,
      borderColor: active ? colors.primary : colors.border,
    },
  ];

  const chipText = (active: boolean) => ({
    color: active ? '#FFFFFF' : colors.textSecondary,
  });

  return (
    <Screen bottomInset={20}>
      <View style={styles.nav}>
        <Pressable onPress={() => router.back()} hitSlop={12}>
          <Ionicons name="chevron-back" size={24} color={colors.text} />
        </Pressable>
        <AppText variant="subheading" weight="semibold">
          Adicionar tarefa
        </AppText>
        <Pressable onPress={onSubmit} hitSlop={12}>
          <AppText variant="subheading" tone="accent" weight="semibold">
            Salvar
          </AppText>
        </Pressable>
      </View>

      <View style={styles.hero}>
        <EmojiBadge emoji={emoji} tint={CATEGORIES[category].color} size={72} />
      </View>

      <Controller
        control={control}
        name="title"
        rules={{ required: 'Dê um nome à tarefa' }}
        render={({ field, fieldState }) => (
          <TextField
            label="Nome da tarefa"
            placeholder="Aspirar a casa"
            value={field.value}
            onChangeText={field.onChange}
            error={fieldState.error?.message}
          />
        )}
      />

      <Controller
        control={control}
        name="description"
        render={({ field }) => (
          <TextField
            label="Descrição (opcional)"
            placeholder="Detalhes da tarefa…"
            value={field.value}
            onChangeText={field.onChange}
          />
        )}
      />

      <AppText variant="caption" tone="secondary" style={styles.groupLabel}>
        Categoria
      </AppText>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipRow}>
        {CATEGORY_KEYS.map((key) => (
          <Pressable key={key} onPress={() => setValue('category', key)} style={chip(category === key)}>
            <AppText variant="caption" weight="semibold" style={chipText(category === key)}>
              {CATEGORIES[key].emoji} {CATEGORIES[key].label}
            </AppText>
          </Pressable>
        ))}
      </ScrollView>

      <View style={styles.rowFields}>
        <View style={{ flex: 1 }}>
          <Controller
            control={control}
            name="estimatedMinutes"
            render={({ field }) => (
              <TextField
                label="Duração (min)"
                placeholder="40"
                keyboardType="number-pad"
                value={field.value}
                onChangeText={field.onChange}
              />
            )}
          />
        </View>
        <View style={{ flex: 1 }}>
          <Controller
            control={control}
            name="time"
            render={({ field }) => (
              <TextField
                label="Horário"
                placeholder="16:00"
                value={field.value}
                onChangeText={field.onChange}
              />
            )}
          />
        </View>
      </View>

      <AppText variant="caption" tone="secondary" style={styles.groupLabel}>
        Responsável
      </AppText>
      <Controller
        control={control}
        name="assigneeId"
        render={({ field }) => (
          <View style={styles.chipRow}>
            {[user, partner].filter(Boolean).map((member) => (
              <Pressable
                key={member!.id}
                onPress={() => field.onChange(member!.id)}
                style={chip(field.value === member!.id)}
              >
                <AppText variant="caption" weight="semibold" style={chipText(field.value === member!.id)}>
                  {member!.name}
                </AppText>
              </Pressable>
            ))}
          </View>
        )}
      />

      <AppText variant="caption" tone="secondary" style={styles.groupLabel}>
        Dificuldade
      </AppText>
      <Controller
        control={control}
        name="difficulty"
        render={({ field }) => (
          <View style={styles.chipRow}>
            {DIFFICULTIES.map((d) => (
              <Pressable key={d.value} onPress={() => field.onChange(d.value)} style={chip(field.value === d.value)}>
                <AppText variant="caption" weight="semibold" style={chipText(field.value === d.value)}>
                  {d.emoji} {d.label}
                </AppText>
              </Pressable>
            ))}
          </View>
        )}
      />

      <AppText variant="caption" tone="secondary" style={styles.groupLabel}>
        Prioridade
      </AppText>
      <Controller
        control={control}
        name="priority"
        render={({ field }) => (
          <View style={styles.chipRow}>
            {(Object.keys(PRIORITIES) as TaskPriority[]).map((p) => (
              <Pressable key={p} onPress={() => field.onChange(p)} style={chip(field.value === p)}>
                <AppText variant="caption" weight="semibold" style={chipText(field.value === p)}>
                  {PRIORITIES[p].label}
                </AppText>
              </Pressable>
            ))}
          </View>
        )}
      />

      <AppText variant="caption" tone="secondary" style={styles.groupLabel}>
        Repetir
      </AppText>
      <Controller
        control={control}
        name="repeat"
        render={({ field }) => (
          <View style={styles.chipRow}>
            {REPEATS.map((r) => (
              <Pressable key={r.value} onPress={() => field.onChange(r.value)} style={chip(field.value === r.value)}>
                <AppText variant="caption" weight="semibold" style={chipText(field.value === r.value)}>
                  {r.label}
                </AppText>
              </Pressable>
            ))}
          </View>
        )}
      />

      <Controller
        control={control}
        name="remind"
        render={({ field }) => (
          <View style={styles.remindRow}>
            <AppText variant="subheading" weight="semibold">
              Lembrar
            </AppText>
            <Switch
              value={field.value}
              onValueChange={field.onChange}
              trackColor={{ true: colors.primary, false: colors.glass }}
              thumbColor="#FFFFFF"
            />
          </View>
        )}
      />

      <PrimaryButton label="Salvar tarefa" icon="checkmark" onPress={onSubmit} style={styles.save} />
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
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  groupLabel: {
    marginTop: spacing.md,
    marginBottom: spacing.sm,
    marginLeft: 4,
  },
  chipRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    flexWrap: 'wrap',
  },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: radius.full,
    borderWidth: 1,
  },
  rowFields: {
    flexDirection: 'row',
    gap: spacing.md,
    marginTop: spacing.md,
  },
  remindRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: spacing.xl,
  },
  save: {
    marginTop: spacing.xl,
  },
});
