import React, { useState } from 'react';
import { Alert, Pressable, StyleSheet, View } from 'react-native';
import { router } from 'expo-router';
import { Controller, useForm } from 'react-hook-form';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import Ionicons from '@expo/vector-icons/Ionicons';
import { AppText } from '@/components/ui/AppText';
import { PrimaryButton } from '@/components/ui/PrimaryButton';
import { Screen } from '@/components/ui/Screen';
import { TextField } from '@/components/ui/TextField';
import { useAuthStore } from '@/stores/authStore';
import { useGoogleAuth } from '@/hooks/useGoogleAuth';
import { brand, font, radius, spacing, useTheme } from '@/theme';

interface FormValues {
  email: string;
  password: string;
}

export default function LoginScreen() {
  const { colors } = useTheme();
  const signIn = useAuthStore((s) => s.signIn);
  const signInWithProvider = useAuthStore((s) => s.signInWithProvider);
  const signInWithGoogleIdToken = useAuthStore((s) => s.signInWithGoogleIdToken);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  const google = useGoogleAuth(async (idToken) => {
    try {
      setGoogleLoading(true);
      await signInWithGoogleIdToken(idToken);
      router.replace('/(tabs)');
    } catch (error) {
      Alert.alert('Não foi possível entrar com o Google', error instanceof Error ? error.message : 'Tente novamente.');
    } finally {
      setGoogleLoading(false);
    }
  });

  const { control, handleSubmit } = useForm<FormValues>({
    defaultValues: { email: '', password: '' },
  });

  const onSubmit = handleSubmit(async ({ email, password }) => {
    try {
      setLoading(true);
      await signIn(email.trim(), password);
      router.replace('/(tabs)');
    } catch (error) {
      // O Firebase não distingue "conta não existe" de "senha errada"
      // (proteção contra enumeração) — oferece os dois caminhos.
      Alert.alert(
        'Não foi possível entrar',
        'Confira a senha — ou, se vocês ainda não têm conta, crie uma agora (leva 10 segundos).',
        [
          { text: 'Tentar de novo', style: 'cancel' },
          {
            text: 'Criar conta',
            onPress: () =>
              router.push({ pathname: '/(auth)/register', params: { email: email.trim() } }),
          },
        ],
      );
    } finally {
      setLoading(false);
    }
  });

  const onProvider = async (provider: 'google' | 'apple') => {
    await signInWithProvider(provider);
    router.replace('/(tabs)');
  };

  return (
    <Screen style={styles.content}>
      <Animated.View entering={FadeInUp.duration(600)} style={styles.header}>
        <View style={styles.logoHeart}>
          <Ionicons name="heart" size={64} color={brand.primary} />
        </View>
        <AppText variant="title">Bem-vindo(a)!</AppText>
        <AppText variant="body" tone="secondary">
          Organize sua vida em casal.
        </AppText>
      </Animated.View>

      <Animated.View entering={FadeInDown.delay(150).duration(600)}>
        <Controller
          control={control}
          name="email"
          rules={{ required: 'Informe o e-mail', pattern: { value: /.+@.+\..+/, message: 'E-mail inválido' } }}
          render={({ field, fieldState }) => (
            <TextField
              icon="person-outline"
              placeholder="E-mail"
              autoCapitalize="none"
              keyboardType="email-address"
              value={field.value}
              onChangeText={field.onChange}
              onBlur={field.onBlur}
              error={fieldState.error?.message}
            />
          )}
        />
        <Controller
          control={control}
          name="password"
          rules={{ required: 'Informe a senha', minLength: { value: 6, message: 'Mínimo de 6 caracteres' } }}
          render={({ field, fieldState }) => (
            <TextField
              icon="lock-closed-outline"
              placeholder="Senha"
              password
              value={field.value}
              onChangeText={field.onChange}
              onBlur={field.onBlur}
              error={fieldState.error?.message}
            />
          )}
        />

        <PrimaryButton label="Entrar" onPress={onSubmit} loading={loading} style={styles.submit} />

        <View style={styles.dividerRow}>
          <View style={[styles.divider, { backgroundColor: colors.border }]} />
          <AppText variant="caption" tone="muted">
            ou continuar com
          </AppText>
          <View style={[styles.divider, { backgroundColor: colors.border }]} />
        </View>

        <View style={styles.providers}>
          <Pressable
            onPress={() => (google.available ? google.promptAsync() : onProvider('google'))}
            disabled={googleLoading}
            android_ripple={{ color: colors.primarySoft }}
            style={[
              styles.provider,
              { backgroundColor: colors.glass, borderColor: colors.border },
              googleLoading && { opacity: 0.6 },
            ]}
          >
            <Ionicons name="logo-google" size={18} color={colors.text} />
            <AppText variant="subheading" weight="semibold">
              Google
            </AppText>
          </Pressable>
          <Pressable
            onPress={() => onProvider('apple')}
            android_ripple={{ color: colors.primarySoft }}
            style={[styles.provider, { backgroundColor: colors.glass, borderColor: colors.border }]}
          >
            <Ionicons name="logo-apple" size={20} color={colors.text} />
            <AppText variant="subheading" weight="semibold">
              Apple
            </AppText>
          </Pressable>
        </View>

        <View style={styles.footer}>
          <AppText variant="body" tone="secondary">
            Não tem uma conta?{' '}
          </AppText>
          <Pressable onPress={() => router.push('/(auth)/register')} hitSlop={8}>
            <AppText variant="body" tone="accent" weight="semibold">
              Criar conta
            </AppText>
          </Pressable>
        </View>
      </Animated.View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: {
    justifyContent: 'center',
    flexGrow: 1,
  },
  header: {
    alignItems: 'center',
    gap: 6,
    marginBottom: spacing.xxl,
  },
  logoHeart: {
    marginBottom: spacing.md,
  },
  submit: {
    marginTop: spacing.sm,
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
  providers: {
    flexDirection: 'row',
    gap: 12,
  },
  provider: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    minHeight: 52,
    borderRadius: radius.full,
    borderWidth: 1,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: spacing.xxl,
  },
});
