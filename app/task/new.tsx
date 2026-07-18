import React from 'react';
import { Pressable, ScrollView, StyleSheet, Switch, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Controller, useForm } from 'react-hook-form';
import Ionicons from '@expo/vector-icons/Ionicons';
import { AppText } from '@/components/ui/AppText';
import { EmojiBadge } from '@/components/ui/EmojiBadge';
import { PrimaryButton } from '@/components/ui/PrimaryButton';
import { Screen } from '@/components/ui/Screen';
import { TextField } from '@/components/ui/TextField';
import {
  CATEGORIES,
  CATEGORY_KEYS,
  PRIORITIES,
  TASK_COLORS,
  TASK_TYPES,
} from '@/constants/categories';
import { TaskCategory, TaskDifficulty, TaskPriority, TaskRepeat, TaskType } from '@/domain/entities';
import { scheduleTaskReminder } from '@/services/notifications';
import { useAuthStore } from '@/stores/authStore';
import { useTaskStore } from '@/stores/taskStore';
import { radius, spacing, useTheme } from '@/theme';
import { todayKey } from '@/utils/date';

interface FormValues {
  type: TaskType;
  title: string;
  notes: string;
  emoji: string;
  color: string;
  category: TaskCategory;
  estimatedMinutes: string;
  date: string;
  time: string;
  assigneeId: string; // '' = Ambos
  priority: TaskPriority;
  difficulty: TaskDifficulty;
  repeat: TaskRepeat;
  xp: string;
  coins: string;
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

/** Formulário de nova tarefa: primeiro o tipo, depois os detalhes. */
export default function NewTaskScreen() {
  const { colors } = useTheme();
  const params = useLocalSearchParams<{
    title?: string;
    emoji?: string;
    category?: TaskCategory;
    minutes?: string;
    difficulty?: TaskDifficulty;
    type?: TaskType;
    xp?: string;
    coins?: string;
  }>();
  const user = useAuthStore((s) => s.user);
  const partner = useAuthStore((s) => s.partner);
  const addTask = useTaskStore((s) => s.addTask);

  const { control, handleSubmit, watch, setValue } = useForm<FormValues>({
    defaultValues: {
      type: params.type ?? 'casa',
      title: params.title ?? '',
      notes: '',
      emoji: params.emoji ?? '',
      color: '',
      category: params.category ?? 'casa',
      estimatedMinutes: params.minutes ?? '40',
      date: todayKey(),
      time: '16:00',
      assigneeId: '',
      priority: 'media',
      difficulty: params.difficulty ?? 'media',
      repeat: 'nunca',
      xp: params.xp ?? '',
      coins: params.coins ?? '',
      remind: true,
    },
  });

  const type = watch('type');
  const category = watch('category');
  const emoji = watch('emoji') || CATEGORIES[category].emoji;
  const color = watch('color') || CATEGORIES[category].color;

  const onSubmit = handleSubmit(async (values) => {
    const xp = parseInt(values.xp, 10);
    const coins = parseInt(values.coins, 10);
    const task = addTask({
      type: values.type,
      title: values.title,
      notes: values.notes || undefined,
      emoji,
      color: values.color || undefined,
      category: values.category,
      date: values.date || todayKey(),
      time: values.time || undefined,
      estimatedMinutes: Math.max(5, parseInt(values.estimatedMinutes, 10) || 30),
      // Compartilhada pertence aos dois; casa e individual usam o
      // responsável escolhido ('' = Ambos / Cada um).
      assigneeId: values.type !== 'compartilhada' && values.assigneeId ? values.assigneeId : undefined,
      priority: values.priority,
      difficulty: values.difficulty,
      repeat: values.repeat,
      xp: Number.isFinite(xp) && xp > 0 ? xp : undefined,
      coins: Number.isFinite(coins) && coins > 0 ? coins : undefined,
    });

    if (values.remind && values.time) {
      const [h, m] = values.time.split(':').map(Number);
      const when = new Date(`${values.date}T00:00:00`);
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

      {/* 1. Tipo da tarefa */}
      <AppText variant="caption" tone="secondary" style={styles.groupLabel}>
        Tipo de tarefa
      </AppText>
      <Controller
        control={control}
        name="type"
        render={({ field }) => (
          <View style={{ gap: spacing.sm }}>
            {(Object.keys(TASK_TYPES) as TaskType[]).map((t) => {
              const meta = TASK_TYPES[t];
              const active = field.value === t;
              return (
                <Pressable
                  key={t}
                  onPress={() => field.onChange(t)}
                  style={[
                    styles.typeCard,
                    {
                      backgroundColor: active ? colors.primarySoft : colors.glass,
                      borderColor: active ? colors.primary : colors.border,
                    },
                  ]}
                >
                  <AppText style={{ fontSize: 22 }}>{meta.emoji}</AppText>
                  <View style={{ flex: 1 }}>
                    <AppText variant="subheading" weight="semibold">
                      {meta.label}
                    </AppText>
                    <AppText variant="caption" tone="secondary">
                      {meta.description}
                    </AppText>
                  </View>
                  <Ionicons
                    name={active ? 'radio-button-on' : 'radio-button-off'}
                    size={20}
                    color={active ? colors.primary : colors.textMuted}
                  />
                </Pressable>
              );
            })}
          </View>
        )}
      />

      <View style={styles.hero}>
        <EmojiBadge emoji={emoji} tint={color} size={72} />
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

      {/* Responsável — casa (quem faz) e individual (para quem é a tarefa) */}
      {type !== 'compartilhada' ? (
        <>
          <AppText variant="caption" tone="secondary" style={styles.groupLabel}>
            {type === 'casa' ? 'Responsável' : 'Para quem?'}
          </AppText>
          <Controller
            control={control}
            name="assigneeId"
            render={({ field }) => (
              <View style={styles.chipRow}>
                <Pressable onPress={() => field.onChange('')} style={chip(field.value === '')}>
                  <AppText variant="caption" weight="semibold" style={chipText(field.value === '')}>
                    {type === 'casa' ? '👫 Ambos' : '👫 Cada um'}
                  </AppText>
                </Pressable>
                {[user, partner].filter(Boolean).map((member) => (
                  <Pressable
                    key={member!.id}
                    onPress={() => field.onChange(member!.id)}
                    style={chip(field.value === member!.id)}
                  >
                    <AppText variant="caption" weight="semibold" style={chipText(field.value === member!.id)}>
                      {member!.id === user?.id ? `Eu (${member!.name.split(' ')[0]})` : member!.name.split(' ')[0]}
                    </AppText>
                  </Pressable>
                ))}
              </View>
            )}
          />
          <AppText variant="caption" tone="muted" style={{ marginTop: 6, marginLeft: 4 }}>
            {watch('assigneeId') === ''
              ? type === 'casa'
                ? 'Qualquer um dos dois pode concluir.'
                : 'Cada um conclui a sua própria parte.'
              : 'Somente essa pessoa poderá concluir — o par acompanha.'}
          </AppText>
        </>
      ) : null}

      <View style={styles.rowFields}>
        <View style={{ flex: 1 }}>
          <Controller
            control={control}
            name="date"
            render={({ field }) => (
              <TextField label="Data" placeholder="2026-07-16" value={field.value} onChangeText={field.onChange} />
            )}
          />
        </View>
        <View style={{ flex: 1 }}>
          <Controller
            control={control}
            name="time"
            render={({ field }) => (
              <TextField label="Horário" placeholder="16:00" value={field.value} onChangeText={field.onChange} />
            )}
          />
        </View>
      </View>

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
            name="xp"
            render={({ field }) => (
              <TextField
                label="XP (auto se vazio)"
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
            name="coins"
            render={({ field }) => (
              <TextField
                label="Moedas 🪙"
                placeholder="20"
                keyboardType="number-pad"
                value={field.value}
                onChangeText={field.onChange}
              />
            )}
          />
        </View>
      </View>

      <AppText variant="caption" tone="secondary" style={styles.groupLabel}>
        Ícone e cor
      </AppText>
      <View style={styles.rowFields}>
        <View style={{ width: 96 }}>
          <Controller
            control={control}
            name="emoji"
            render={({ field }) => (
              <TextField placeholder={CATEGORIES[category].emoji} value={field.value} onChangeText={field.onChange} />
            )}
          />
        </View>
        <Controller
          control={control}
          name="color"
          render={({ field }) => (
            <View style={styles.colorRow}>
              {TASK_COLORS.map((c) => {
                const active = field.value === c;
                return (
                  <Pressable
                    key={c}
                    onPress={() => field.onChange(active ? '' : c)}
                    style={[
                      styles.colorDot,
                      { backgroundColor: c },
                      active && { borderWidth: 3, borderColor: colors.text },
                    ]}
                  />
                );
              })}
            </View>
          )}
        />
      </View>

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
        name="notes"
        render={({ field }) => (
          <View style={{ marginTop: spacing.md }}>
            <TextField
              label="Notas"
              placeholder="Observações do casal…"
              value={field.value}
              onChangeText={field.onChange}
              multiline
            />
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
  typeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    borderWidth: 1.5,
    borderRadius: radius.md,
    padding: spacing.md,
  },
  hero: {
    alignItems: 'center',
    marginVertical: spacing.xl,
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
    alignItems: 'center',
  },
  colorRow: {
    flex: 1,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  colorDot: {
    width: 28,
    height: 28,
    borderRadius: 14,
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
