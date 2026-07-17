import React, { useMemo, useState } from 'react';
import { FlatList, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { router } from 'expo-router';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AppText } from '@/components/ui/AppText';
import { EmojiBadge } from '@/components/ui/EmojiBadge';
import { TextField } from '@/components/ui/TextField';
import { CATEGORIES, CATEGORY_KEYS, TASK_TYPES } from '@/constants/categories';
import { LIBRARY, LibraryTask } from '@/constants/library';
import { TaskCategory } from '@/domain/entities';
import { cardShadow, radius, spacing, useTheme } from '@/theme';
import { formatMinutes } from '@/utils/format';

/** Biblioteca inicial: 250+ tarefas prontas, organizadas por categoria. */
export default function LibraryScreen() {
  const { colors, dark } = useTheme();
  const insets = useSafeAreaInsets();
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState<TaskCategory | 'todas'>('todas');

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    return LIBRARY.filter(
      (t) =>
        (category === 'todas' || t.category === category) &&
        (q === '' || t.title.toLowerCase().includes(q)),
    );
  }, [query, category]);

  const openTemplate = (tpl: LibraryTask) => {
    router.push({
      pathname: '/task/new',
      params: {
        title: tpl.title,
        emoji: tpl.emoji,
        category: tpl.category,
        minutes: String(tpl.estimatedMinutes),
        difficulty: tpl.difficulty,
        type: tpl.type,
        xp: String(tpl.xp),
        coins: String(tpl.coins),
      },
    });
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.background, paddingTop: insets.top + spacing.md }}>
      <View style={styles.nav}>
        <Pressable onPress={() => router.back()} hitSlop={12}>
          <Ionicons name="chevron-back" size={24} color={colors.text} />
        </Pressable>
        <AppText variant="subheading" weight="semibold">
          Biblioteca de tarefas
        </AppText>
        <AppText variant="caption" tone="accent" weight="semibold">
          {LIBRARY.length}+
        </AppText>
      </View>

      <View style={styles.search}>
        <TextField icon="search-outline" placeholder="Buscar tarefa…" value={query} onChangeText={setQuery} />
      </View>

      <View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filters}>
          <Pressable
            onPress={() => setCategory('todas')}
            style={[
              styles.filter,
              {
                backgroundColor: category === 'todas' ? colors.primary : colors.glass,
                borderColor: category === 'todas' ? colors.primary : colors.border,
              },
            ]}
          >
            <AppText
              variant="caption"
              weight="semibold"
              style={{ color: category === 'todas' ? '#FFFFFF' : colors.textSecondary }}
            >
              ✨ Todas
            </AppText>
          </Pressable>
          {CATEGORY_KEYS.filter((k) => k !== 'rotina').map((key) => {
            const active = category === key;
            return (
              <Pressable
                key={key}
                onPress={() => setCategory(key)}
                style={[
                  styles.filter,
                  {
                    backgroundColor: active ? colors.primary : colors.glass,
                    borderColor: active ? colors.primary : colors.border,
                  },
                ]}
              >
                <AppText
                  variant="caption"
                  weight="semibold"
                  style={{ color: active ? '#FFFFFF' : colors.textSecondary }}
                >
                  {CATEGORIES[key].emoji} {CATEGORIES[key].label}
                </AppText>
              </Pressable>
            );
          })}
        </ScrollView>
      </View>

      <FlatList
        data={results}
        keyExtractor={(item) => `${item.category}-${item.title}`}
        contentContainerStyle={{ paddingHorizontal: spacing.xl, paddingBottom: insets.bottom + spacing.xxl }}
        showsVerticalScrollIndicator={false}
        renderItem={({ item }) => {
          const meta = CATEGORIES[item.category];
          const typeMeta = TASK_TYPES[item.type];
          return (
            <Pressable
              onPress={() => openTemplate(item)}
              android_ripple={{ color: colors.primarySoft, foreground: true }}
              style={[styles.row, { backgroundColor: colors.surface, borderColor: colors.border }, cardShadow(dark)]}
            >
              <EmojiBadge emoji={item.emoji} tint={meta.color} />
              <View style={{ flex: 1, gap: 3 }}>
                <AppText variant="subheading" weight="semibold" numberOfLines={1}>
                  {item.title}
                </AppText>
                <AppText variant="caption" tone="muted">
                  {typeMeta.emoji} {typeMeta.label} · {meta.label} · {formatMinutes(item.estimatedMinutes)}
                </AppText>
              </View>
              <View style={[styles.xpBadge, { backgroundColor: colors.primarySoft }]}>
                <AppText variant="caption" weight="bold" tone="accent">
                  +{item.xp} XP
                </AppText>
              </View>
            </Pressable>
          );
        }}
        ListEmptyComponent={
          <View style={styles.empty}>
            <AppText style={{ fontSize: 36 }}>🔍</AppText>
            <AppText variant="body" tone="secondary">
              Nenhuma tarefa encontrada.
            </AppText>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  nav: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.xl,
    marginBottom: spacing.md,
  },
  search: {
    paddingHorizontal: spacing.xl,
  },
  filters: {
    gap: spacing.sm,
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.md,
  },
  filter: {
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: radius.full,
    borderWidth: 1,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    borderRadius: radius.lg,
    borderWidth: 1,
    padding: spacing.md,
    marginBottom: spacing.sm + 2,
  },
  xpBadge: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: radius.full,
  },
  empty: {
    alignItems: 'center',
    gap: 10,
    paddingVertical: spacing.xxl * 2,
  },
});
