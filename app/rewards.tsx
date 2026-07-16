import React, { useEffect, useMemo, useState } from 'react';
import { Alert, Modal, Pressable, StyleSheet, View } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import Animated, { FadeInDown, ZoomIn } from 'react-native-reanimated';
import { AppText } from '@/components/ui/AppText';
import { Card } from '@/components/ui/Card';
import { Confetti } from '@/components/ui/Confetti';
import { EmojiBadge } from '@/components/ui/EmojiBadge';
import { PrimaryButton } from '@/components/ui/PrimaryButton';
import { Screen } from '@/components/ui/Screen';
import { SegmentedControl } from '@/components/ui/SegmentedControl';
import { TextField } from '@/components/ui/TextField';
import { Reward, RewardCategory } from '@/domain/entities';
import { useAuthStore } from '@/stores/authStore';
import { useRewardsStore } from '@/stores/rewardsStore';
import { radius, spacing, useTheme } from '@/theme';
import { dayjs } from '@/utils/date';

type Tab = 'loja' | 'historico';

const REWARD_CATEGORIES: { value: RewardCategory; label: string }[] = [
  { value: 'comida', label: '🍕 Comida' },
  { value: 'lazer', label: '🎬 Lazer' },
  { value: 'romance', label: '❤️ Romance' },
  { value: 'descanso', label: '💤 Descanso' },
  { value: 'presente', label: '🎁 Presente' },
  { value: 'outro', label: '✨ Outro' },
];

/** Loja de recompensas do casal: resgate, criação e histórico. */
export default function RewardsScreen() {
  const { colors } = useTheme();
  const user = useAuthStore((s) => s.user);
  const partner = useAuthStore((s) => s.partner);
  const rewards = useRewardsStore((s) => s.rewards);
  const redemptions = useRewardsStore((s) => s.redemptions);
  const ensureSeeded = useRewardsStore((s) => s.ensureSeeded);
  const addReward = useRewardsStore((s) => s.addReward);
  const redeem = useRewardsStore((s) => s.redeem);
  const markUsed = useRewardsStore((s) => s.markUsed);

  const [tab, setTab] = useState<Tab>('loja');
  const [celebrating, setCelebrating] = useState<Reward | null>(null);
  const [creating, setCreating] = useState(false);
  const [name, setName] = useState('');
  const [emoji, setEmoji] = useState('🎁');
  const [cost, setCost] = useState('100');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<RewardCategory>('outro');

  useEffect(() => {
    ensureSeeded();
  }, [ensureSeeded]);

  const list = useMemo(
    () => Object.values(rewards).sort((a, b) => a.cost - b.cost),
    [rewards],
  );

  const coins = user?.coins ?? 0;

  const handleRedeem = (reward: Reward) => {
    if (!user) return;
    if (coins < reward.cost) {
      Alert.alert(
        'Moedas insuficientes',
        `Você tem 🪙 ${coins} e precisa de 🪙 ${reward.cost}. Conclua mais tarefas para ganhar moedas!`,
      );
      return;
    }
    Alert.alert('Resgatar recompensa', `${reward.emoji} ${reward.name} por 🪙 ${reward.cost}?`, [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Resgatar',
        onPress: () => {
          if (redeem(reward.id, user) === 'ok') {
            void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => undefined);
            setCelebrating(reward);
            setTimeout(() => setCelebrating(null), 2600);
          }
        },
      },
    ]);
  };

  const handleCreate = () => {
    const parsedCost = parseInt(cost, 10);
    if (!name.trim() || !parsedCost) return;
    addReward({
      name: name.trim(),
      emoji: emoji.trim() || '🎁',
      cost: parsedCost,
      description: description.trim() || undefined,
      category,
    });
    setCreating(false);
    setName('');
    setEmoji('🎁');
    setCost('100');
    setDescription('');
  };

  const creatorName = (id: string) =>
    id === user?.id ? user?.name : id === partner?.id ? partner?.name : 'Casal';

  return (
    <View style={{ flex: 1 }}>
      <Screen bottomInset={20}>
        <View style={styles.nav}>
          <Pressable onPress={() => router.back()} hitSlop={12}>
            <Ionicons name="chevron-back" size={24} color={colors.text} />
          </Pressable>
          <AppText variant="subheading" weight="semibold">
            Loja de Recompensas
          </AppText>
          <Pressable onPress={() => setCreating(true)} hitSlop={12}>
            <Ionicons name="add-circle-outline" size={24} color={colors.primary} />
          </Pressable>
        </View>

        {/* Saldo */}
        <Card index={0} style={styles.balanceCard}>
          <AppText style={{ fontSize: 32 }}>🪙</AppText>
          <View style={{ flex: 1 }}>
            <AppText variant="caption" tone="secondary">
              Suas moedas
            </AppText>
            <AppText variant="title" weight="extrabold">
              {coins}
            </AppText>
          </View>
          <AppText variant="caption" tone="muted" style={{ maxWidth: 120, textAlign: 'right' }}>
            Conclua tarefas para ganhar moedas
          </AppText>
        </Card>

        <View style={{ marginTop: spacing.lg }}>
          <SegmentedControl<Tab>
            options={[
              { value: 'loja', label: 'Loja' },
              { value: 'historico', label: 'Histórico' },
            ]}
            value={tab}
            onChange={setTab}
          />
        </View>

        {tab === 'loja' ? (
          <View style={{ marginTop: spacing.lg }}>
            {list.map((reward, index) => {
              const affordable = coins >= reward.cost;
              return (
                <Card key={reward.id} index={index} style={styles.rewardCard}>
                  <EmojiBadge emoji={reward.emoji} tint={affordable ? '#6C63FF' : '#888888'} size={52} />
                  <View style={{ flex: 1, gap: 2 }}>
                    <AppText variant="subheading" weight="semibold">
                      {reward.name}
                    </AppText>
                    {reward.description ? (
                      <AppText variant="caption" tone="secondary" numberOfLines={2}>
                        {reward.description}
                      </AppText>
                    ) : null}
                    <AppText variant="caption" tone="muted">
                      criada por {creatorName(reward.createdBy)}
                    </AppText>
                  </View>
                  <Pressable
                    onPress={() => handleRedeem(reward)}
                    style={[
                      styles.costPill,
                      { backgroundColor: affordable ? colors.primary : colors.glass },
                    ]}
                  >
                    <AppText
                      variant="caption"
                      weight="bold"
                      style={{ color: affordable ? '#FFFFFF' : colors.textMuted }}
                    >
                      🪙 {reward.cost}
                    </AppText>
                  </Pressable>
                </Card>
              );
            })}
          </View>
        ) : (
          <View style={{ marginTop: spacing.lg }}>
            {redemptions.length === 0 ? (
              <Card animated={false} style={styles.empty}>
                <AppText style={{ fontSize: 36 }}>🎁</AppText>
                <AppText variant="body" tone="secondary" style={{ textAlign: 'center' }}>
                  Nenhuma recompensa resgatada ainda. Vocês estão a poucas tarefas de merecer uma!
                </AppText>
              </Card>
            ) : (
              redemptions.map((r, index) => (
                <Card key={r.id} index={index} style={styles.rewardCard}>
                  <EmojiBadge emoji={r.rewardEmoji} tint="#F472B6" size={48} />
                  <View style={{ flex: 1, gap: 2 }}>
                    <AppText variant="subheading" weight="semibold">
                      {r.rewardName}
                    </AppText>
                    <AppText variant="caption" tone="muted">
                      {r.userName} · {dayjs(r.at).format('D MMM, HH:mm')} · 🪙 {r.cost}
                    </AppText>
                  </View>
                  <Pressable
                    onPress={() => markUsed(r.id)}
                    disabled={r.used}
                    style={[
                      styles.usedPill,
                      { backgroundColor: r.used ? colors.successSoft : colors.primarySoft },
                    ]}
                  >
                    <AppText
                      variant="caption"
                      weight="semibold"
                      style={{ color: r.used ? colors.success : colors.primary }}
                    >
                      {r.used ? 'Utilizada ✓' : 'Marcar usada'}
                    </AppText>
                  </Pressable>
                </Card>
              ))
            )}
          </View>
        )}
      </Screen>

      {/* Celebração de resgate */}
      {celebrating ? (
        <View style={styles.celebration} pointerEvents="none">
          <Confetti visible />
          <Animated.View
            entering={ZoomIn.springify().damping(14)}
            style={[styles.celebrationCard, { backgroundColor: colors.surfaceElevated, borderColor: colors.border }]}
          >
            <AppText style={{ fontSize: 52 }}>{celebrating.emoji}</AppText>
            <AppText variant="heading" style={{ textAlign: 'center' }}>
              Recompensa resgatada!
            </AppText>
            <AppText variant="body" tone="secondary" style={{ textAlign: 'center' }}>
              {celebrating.name} — aproveite, vocês merecem 💜
            </AppText>
          </Animated.View>
        </View>
      ) : null}

      {/* Criar recompensa */}
      <Modal visible={creating} transparent animationType="slide" onRequestClose={() => setCreating(false)}>
        <View style={styles.modalBackdrop}>
          <View style={[styles.modalSheet, { backgroundColor: colors.surfaceElevated, borderColor: colors.border }]}>
            <AppText variant="heading" style={{ marginBottom: spacing.lg }}>
              Nova recompensa
            </AppText>
            <TextField label="Nome" placeholder="Noite de pizza" value={name} onChangeText={setName} />
            <View style={styles.modalRow}>
              <View style={{ width: 90 }}>
                <TextField label="Emoji" placeholder="🎁" value={emoji} onChangeText={setEmoji} />
              </View>
              <View style={{ flex: 1 }}>
                <TextField label="Custo (moedas)" placeholder="100" keyboardType="number-pad" value={cost} onChangeText={setCost} />
              </View>
            </View>
            <TextField label="Descrição (opcional)" placeholder="Detalhes…" value={description} onChangeText={setDescription} />
            <View style={styles.categoryRow}>
              {REWARD_CATEGORIES.map((c) => (
                <Pressable
                  key={c.value}
                  onPress={() => setCategory(c.value)}
                  style={[
                    styles.categoryChip,
                    {
                      backgroundColor: category === c.value ? colors.primary : colors.glass,
                      borderColor: category === c.value ? colors.primary : colors.border,
                    },
                  ]}
                >
                  <AppText
                    variant="caption"
                    weight="semibold"
                    style={{ color: category === c.value ? '#FFFFFF' : colors.textSecondary }}
                  >
                    {c.label}
                  </AppText>
                </Pressable>
              ))}
            </View>
            <PrimaryButton label="Criar recompensa" onPress={handleCreate} style={{ marginTop: spacing.md }} />
            <PrimaryButton label="Cancelar" variant="ghost" onPress={() => setCreating(false)} style={{ marginTop: spacing.sm }} />
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  nav: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.lg,
  },
  balanceCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.lg,
  },
  rewardCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginBottom: spacing.sm + 2,
  },
  costPill: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: radius.full,
  },
  usedPill: {
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: radius.full,
  },
  empty: {
    alignItems: 'center',
    gap: 10,
    paddingVertical: spacing.xxl,
  },
  celebration: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
  },
  celebrationCard: {
    borderRadius: radius.xl,
    borderWidth: 1,
    padding: spacing.xxl,
    alignItems: 'center',
    gap: spacing.sm,
    marginHorizontal: spacing.xxl,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.55)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    borderWidth: 1,
    padding: spacing.xl,
    paddingBottom: spacing.xxl,
  },
  modalRow: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  categoryRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginTop: spacing.xs,
  },
  categoryChip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: radius.full,
    borderWidth: 1,
  },
});
