import React, { useMemo } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { router } from 'expo-router';
import Ionicons from '@expo/vector-icons/Ionicons';
import { AppText } from '@/components/ui/AppText';
import { Avatar } from '@/components/ui/Avatar';
import { Card } from '@/components/ui/Card';
import { EmojiBadge } from '@/components/ui/EmojiBadge';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { Screen } from '@/components/ui/Screen';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { ACHIEVEMENTS } from '@/constants/seed';
import { leagueForXp, levelForXp, nextLeague } from '@/domain/gamification';
import { useAuthStore } from '@/stores/authStore';
import { spacing, useTheme } from '@/theme';

export default function CoupleScreen() {
  const { colors } = useTheme();
  const user = useAuthStore((s) => s.user);
  const partner = useAuthStore((s) => s.partner);
  const couple = useAuthStore((s) => s.couple);

  const streak = user?.streakDays ?? 0;
  const unlockedCount = useMemo(
    () => ACHIEVEMENTS.filter((a) => streak >= a.target).length,
    [streak],
  );

  const goalProgress = couple ? couple.goal.currentDays / couple.goal.targetDays : 0;

  const totalXp = (user?.xp ?? 0) + (partner?.xp ?? 0);
  const league = leagueForXp(totalXp);
  const upcoming = nextLeague(totalXp);
  const leagueProgress = upcoming
    ? (totalXp - league.minXp) / (upcoming.minXp - league.minXp)
    : 1;

  const renderMember = (name?: string, xp = 0, coins = 0) => (
    <View style={styles.member}>
      <Avatar name={name ?? 'Convide seu par'} size={72} ring />
      <AppText variant="subheading" weight="bold" style={{ marginTop: 10 }}>
        {name ?? 'Seu par'}
      </AppText>
      <AppText variant="caption" tone="secondary">
        Nível {levelForXp(xp)}
      </AppText>
      <AppText variant="caption" tone="accent" weight="semibold">
        {xp} XP · 🪙 {coins}
      </AppText>
    </View>
  );

  return (
    <Screen bottomInset={40}>
      <View style={styles.header}>
        <AppText variant="title">Nosso Casal</AppText>
        <Pressable onPress={() => router.push('/settings')} hitSlop={8}>
          <Ionicons name="settings-outline" size={22} color={colors.text} />
        </Pressable>
      </View>

      {/* Membros */}
      <Card index={0} style={styles.membersCard}>
        {renderMember(user?.name, user?.xp, user?.coins)}
        <View style={styles.heart}>
          <AppText style={{ fontSize: 22 }}>💜</AppText>
        </View>
        {partner ? (
          renderMember(partner.name, partner.xp, partner.coins)
        ) : (
          <Pressable style={styles.member} onPress={() => router.push('/(auth)/pair')}>
            <View style={[styles.invite, { borderColor: colors.primary }]}>
              <Ionicons name="add" size={28} color={colors.primary} />
            </View>
            <AppText variant="caption" tone="accent" weight="semibold" style={{ marginTop: 10 }}>
              Convidar par
            </AppText>
          </Pressable>
        )}
      </Card>

      {/* Liga do casal */}
      <Card index={1} style={styles.leagueCard}>
        <EmojiBadge emoji={league.emoji} tint={league.color} size={54} />
        <View style={{ flex: 1, gap: 4 }}>
          <AppText variant="caption" tone="secondary">
            Liga do casal
          </AppText>
          <AppText variant="heading" weight="extrabold" style={{ color: league.color }}>
            {league.name}
          </AppText>
          <ProgressBar progress={leagueProgress} height={6} />
          <AppText variant="caption" tone="muted">
            {upcoming
              ? `${totalXp} / ${upcoming.minXp} XP para ${upcoming.name} ${upcoming.emoji}`
              : 'Liga máxima alcançada! 🏆'}
          </AppText>
          <AppText variant="caption" tone="accent">
            Desbloqueia: {league.unlocks}
          </AppText>
        </View>
      </Card>

      {/* Atalhos */}
      <View style={styles.shortcuts}>
        {(
          [
            ['🎁', 'Loja', '/rewards'],
            ['🎯', 'Desafios', '/achievements'],
            ['🤖', 'Assistente', '/insights'],
          ] as const
        ).map(([emoji, label, path]) => (
          <Card key={path} animated={false} style={styles.shortcut} onPress={() => router.push(path)}>
            <AppText style={{ fontSize: 24 }}>{emoji}</AppText>
            <AppText variant="caption" weight="semibold">
              {label}
            </AppText>
          </Card>
        ))}
      </View>

      {/* Conquistas */}
      <SectionHeader
        title="Conquistas"
        actionLabel="Ver todas"
        onAction={() => router.push('/achievements')}
      />
      <View style={styles.achievements}>
        {ACHIEVEMENTS.map((achievement) => {
          const unlocked = streak >= achievement.target;
          return (
            <View key={achievement.id} style={[styles.medal, !unlocked && { opacity: 0.35 }]}>
              <EmojiBadge emoji={achievement.emoji} tint={achievement.tint} size={54} />
            </View>
          );
        })}
      </View>
      <AppText variant="caption" tone="secondary" style={{ marginTop: 4 }}>
        {unlockedCount} de {ACHIEVEMENTS.length} conquistas desbloqueadas
      </AppText>

      {/* Sequência */}
      <Card index={2} style={styles.streakCard}>
        <EmojiBadge emoji="🔥" tint="#F97316" size={54} />
        <View style={{ flex: 1 }}>
          <AppText variant="caption" tone="secondary">
            Sequência atual
          </AppText>
          <AppText variant="heading" weight="extrabold">
            {streak} dias
          </AppText>
          <AppText variant="caption" tone="muted">
            Melhor sequência: {user?.bestStreak ?? 0} dias
          </AppText>
        </View>
      </Card>

      {/* Objetivo do casal */}
      <Card index={3} style={styles.goalCard}>
        <View style={styles.goalHeader}>
          <AppText variant="subheading" weight="semibold">
            Objetivo do casal
          </AppText>
          <AppText variant="caption" tone="accent" weight="semibold">
            {couple?.goal.currentDays ?? 0} / {couple?.goal.targetDays ?? 14} dias
          </AppText>
        </View>
        <AppText variant="body" tone="secondary" style={{ marginBottom: spacing.md }}>
          {couple?.goal.title ?? 'Manter 14 dias de sequência'}
        </AppText>
        <ProgressBar progress={goalProgress} />
      </Card>

      {/* Código do casal */}
      <Card index={4} style={styles.codeCard} onPress={() => router.push('/(auth)/pair')}>
        <Ionicons name="key-outline" size={20} color={colors.primary} />
        <View style={{ flex: 1 }}>
          <AppText variant="caption" tone="secondary">
            Código do casal
          </AppText>
          <AppText variant="subheading" weight="bold" tone="accent">
            {couple?.inviteCode ?? '—'}
          </AppText>
        </View>
        <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
      </Card>
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
  membersCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingVertical: spacing.xl,
  },
  member: {
    alignItems: 'center',
    flex: 1,
  },
  heart: {
    paddingHorizontal: 4,
  },
  invite: {
    width: 72,
    height: 72,
    borderRadius: 36,
    borderWidth: 2,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
  },
  leagueCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.lg,
    marginTop: spacing.md,
  },
  shortcuts: {
    flexDirection: 'row',
    gap: spacing.sm + 2,
    marginTop: spacing.md,
  },
  shortcut: {
    flex: 1,
    alignItems: 'center',
    gap: 6,
    paddingVertical: spacing.md,
  },
  achievements: {
    flexDirection: 'row',
    gap: spacing.md,
    flexWrap: 'wrap',
  },
  medal: {
    alignItems: 'center',
  },
  streakCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.lg,
    marginTop: spacing.xl,
  },
  goalCard: {
    marginTop: spacing.md,
  },
  goalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  codeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginTop: spacing.md,
  },
});
