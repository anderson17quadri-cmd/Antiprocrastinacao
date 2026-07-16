import React, { useState } from 'react';
import { Alert, Pressable, StyleSheet, View } from 'react-native';
import { router } from 'expo-router';
import { Controller, useForm } from 'react-hook-form';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { AppText } from '@/components/ui/AppText';
import { PrimaryButton } from '@/components/ui/PrimaryButton';
import { Screen } from '@/components/ui/Screen';
import { TextField } from '@/components/ui/TextField';
import { useAuthStore } from '@/stores/authStore';
import { spacing, useTheme } from '@/theme';

interface FormValues {
  name: string;
  email: string;
  password: string;
}

export default function RegisterScreen() {
  const { colors } = useTheme();
  const signUp = useAuthStore((s) => s.signUp);
  const [loading, setLoading] = useState(false);

  const { control, handleSubmit } = useForm<FormValues>({
    defaultValues: { name: '', email: '', password: '' },
  });

  const onSubmit = handleSubmit(async ({ name, email, password }) => {
    try {
      setLoading(true);
      await signUp(name.trim(), email.trim(), password);
      router.replace('/(auth)/pair');
    } catch {
      Alert.alert('Não foi possível criar a conta', 'Tente novamente em instantes.');
    } finally {
      setLoading(false);
    }
  });

  return (
    <Screen style={styles.content}>
      <Pressable onPress={() => router.back()} hitSlop={12} style={styles.back}>
        <Ionicons name="chevron-back" size={24} color={colors.text} />
      </Pressable>

      <Animated.View entering={FadeInDown.duration(500)}>
        <AppText variant="title">Criar conta</AppText>
        <AppText variant="body" tone="secondary" style={styles.subtitle}>
          Comece a organizar a rotina de vocês dois em um só lugar.
        </AppText>

        <Controller
          control={control}
          name="name"
          rules={{ required: 'Informe seu nome' }}
          render={({ field, fieldState }) => (
            <TextField
              icon="person-outline"
              placeholder="Nome"
              value={field.value}
              onChangeText={field.onChange}
              error={fieldState.error?.message}
            />
          )}
        />
        <Controller
          control={control}
          name="email"
          rules={{ required: 'Informe o e-mail', pattern: { value: /.+@.+\..+/, message: 'E-mail inválido' } }}
          render={({ field, fieldState }) => (
            <TextField
              icon="mail-outline"
              placeholder="E-mail"
              autoCapitalize="none"
              keyboardType="email-address"
              value={field.value}
              onChangeText={field.onChange}
              error={fieldState.error?.message}
            />
          )}
        />
        <Controller
          control={control}
          name="password"
          rules={{ required: 'Crie uma senha', minLength: { value: 6, message: 'Mínimo de 6 caracteres' } }}
          render={({ field, fieldState }) => (
            <TextField
              icon="lock-closed-outline"
              placeholder="Senha"
              password
              value={field.value}
              onChangeText={field.onChange}
              error={fieldState.error?.message}
            />
          )}
        />

        <PrimaryButton label="Criar conta" onPress={onSubmit} loading={loading} style={styles.submit} />

        <View style={styles.footer}>
          <AppText variant="body" tone="secondary">
            Já tem uma conta?{' '}
          </AppText>
          <Pressable onPress={() => router.back()} hitSlop={8}>
            <AppText variant="body" tone="accent" weight="semibold">
              Entrar
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
  back: {
    position: 'absolute',
    top: spacing.xl,
    left: 0,
  },
  subtitle: {
    marginTop: 6,
    marginBottom: spacing.xl,
  },
  submit: {
    marginTop: spacing.sm,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: spacing.xl,
  },
});
