import React, { useState } from 'react';
import { Alert, Share, StyleSheet, View } from 'react-native';
import { router } from 'expo-router';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { AppText } from '@/components/ui/AppText';
import { Card } from '@/components/ui/Card';
import { PrimaryButton } from '@/components/ui/PrimaryButton';
import { Screen } from '@/components/ui/Screen';
import { TextField } from '@/components/ui/TextField';
import { useAuthStore } from '@/stores/authStore';
import { font, spacing, useTheme } from '@/theme';

/** Pareamento do casal por código de convite. */
export default function PairScreen() {
  const { colors } = useTheme();
  const couple = useAuthStore((s) => s.couple);
  const joinCouple = useAuthStore((s) => s.joinCouple);
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);

  const share = () => {
    void Share.share({
      message: `Vem organizar a nossa rotina comigo no Foco a Dois! 💜 Use o código ${couple?.inviteCode} para entrar no nosso casal.`,
    }).catch(() => undefined);
  };

  const join = async () => {
    if (code.trim().length < 4) return;
    setLoading(true);
    try {
      await joinCouple(code.trim());
      router.replace('/(tabs)');
    } catch (error) {
      Alert.alert('Não foi possível entrar', error instanceof Error ? error.message : 'Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Screen style={styles.content}>
      <Animated.View entering={FadeInDown.duration(500)}>
        <AppText style={styles.emoji}>💑</AppText>
        <AppText variant="title" style={styles.center}>
          Conecte seu par
        </AppText>
        <AppText variant="body" tone="secondary" style={[styles.center, styles.subtitle]}>
          Cada conta do Foco a Dois é feita para exatamente duas pessoas. Compartilhe seu código ou
          insira o código do seu par — vocês verão as mesmas tarefas em tempo real.
        </AppText>

        <Card style={styles.codeCard}>
          <AppText variant="label" tone="secondary">
            Seu código de convite
          </AppText>
          <AppText style={[styles.code, { color: colors.primary }]}>{couple?.inviteCode ?? 'FOCO-....'}</AppText>
          <PrimaryButton label="Compartilhar código" icon="share-social-outline" variant="ghost" onPress={share} />
        </Card>

        <View style={styles.dividerRow}>
          <View style={[styles.divider, { backgroundColor: colors.border }]} />
          <AppText variant="caption" tone="muted">
            ou entre com um código
          </AppText>
          <View style={[styles.divider, { backgroundColor: colors.border }]} />
        </View>

        <TextField
          icon="key-outline"
          placeholder="FOCO-XXXX"
          autoCapitalize="characters"
          value={code}
          onChangeText={setCode}
        />
        <PrimaryButton label="Entrar no casal" onPress={join} loading={loading} />

        <PrimaryButton
          label="Fazer isso depois"
          variant="outline"
          onPress={() => router.replace('/(tabs)')}
          style={styles.skip}
        />
      </Animated.View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: {
    justifyContent: 'center',
    flexGrow: 1,
  },
  emoji: {
    fontSize: 56,
    textAlign: 'center',
    marginBottom: spacing.md,
  },
  center: {
    textAlign: 'center',
  },
  subtitle: {
    marginTop: 8,
    marginBottom: spacing.xl,
  },
  codeCard: {
    alignItems: 'center',
    gap: spacing.md,
  },
  code: {
    fontSize: 32,
    fontFamily: font.extrabold,
    letterSpacing: 4,
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginVertical: spacing.xl,
  },
  divider: {
    flex: 1,
    height: StyleSheet.hairlineWidth * 2,
  },
  skip: {
    marginTop: spacing.md,
  },
});
