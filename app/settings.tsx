import React from 'react';
import { Alert, Pressable, Share, StyleSheet, Switch, View } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { AppText } from '@/components/ui/AppText';
import { Card } from '@/components/ui/Card';
import { Screen } from '@/components/ui/Screen';
import { useAuthStore } from '@/stores/authStore';
import { useSettingsStore, ThemePreference } from '@/stores/settingsStore';
import { useTaskStore } from '@/stores/taskStore';
import { radius, spacing, useTheme } from '@/theme';

const THEME_LABELS: Record<ThemePreference, string> = {
  dark: 'Escuro',
  light: 'Claro',
  system: 'Sistema',
};

export default function SettingsScreen() {
  const { colors } = useTheme();
  const settings = useSettingsStore();
  const signOut = useAuthStore((s) => s.signOut);
  const deleteAccount = useAuthStore((s) => s.deleteAccount);
  const tasks = useTaskStore((s) => s.tasks);
  const activity = useTaskStore((s) => s.activity);

  const cycleTheme = () => {
    const order: ThemePreference[] = ['dark', 'light', 'system'];
    const next = order[(order.indexOf(settings.theme) + 1) % order.length];
    settings.setTheme(next);
  };

  const cycleLanguage = () => {
    settings.setLanguage(settings.language === 'pt-BR' ? 'en-US' : 'pt-BR');
  };

  const exportData = () => {
    const payload = JSON.stringify({ tasks: Object.values(tasks), activity }, null, 2);
    void Share.share({ message: payload, title: 'Foco a Dois — Exportação de dados' }).catch(
      () => undefined,
    );
  };

  const confirmSignOut = () => {
    Alert.alert('Sair', 'Deseja sair da sua conta?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Sair',
        style: 'destructive',
        onPress: () => {
          signOut();
          router.replace('/(auth)/login');
        },
      },
    ]);
  };

  const confirmDelete = () => {
    Alert.alert(
      'Excluir conta',
      'Essa ação é permanente e apaga todos os dados do casal. Deseja continuar?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Excluir conta',
          style: 'destructive',
          onPress: () => {
            deleteAccount();
            router.replace('/(auth)/login');
          },
        },
      ],
    );
  };

  const Row = ({
    icon,
    label,
    value,
    onPress,
    toggle,
    onToggle,
    danger,
  }: {
    icon: keyof typeof Ionicons.glyphMap;
    label: string;
    value?: string;
    onPress?: () => void;
    toggle?: boolean;
    onToggle?: (value: boolean) => void;
    danger?: boolean;
  }) => (
    <Pressable
      onPress={onPress}
      disabled={!onPress}
      android_ripple={onPress ? { color: colors.primarySoft } : undefined}
      style={styles.row}
    >
      <View style={[styles.rowIcon, { backgroundColor: danger ? colors.dangerSoft : colors.primarySoft }]}>
        <Ionicons name={icon} size={17} color={danger ? colors.danger : colors.primary} />
      </View>
      <AppText variant="subheading" weight="medium" tone={danger ? 'danger' : 'primary'} style={{ flex: 1 }}>
        {label}
      </AppText>
      {toggle !== undefined && onToggle ? (
        <Switch
          value={toggle}
          onValueChange={onToggle}
          trackColor={{ true: colors.primary, false: colors.glass }}
          thumbColor="#FFFFFF"
        />
      ) : (
        <>
          {value ? (
            <AppText variant="caption" tone="secondary">
              {value}
            </AppText>
          ) : null}
          {onPress ? <Ionicons name="chevron-forward" size={16} color={colors.textMuted} /> : null}
        </>
      )}
    </Pressable>
  );

  return (
    <Screen bottomInset={20}>
      <View style={styles.nav}>
        <Pressable onPress={() => router.back()} hitSlop={12}>
          <Ionicons name="chevron-back" size={24} color={colors.text} />
        </Pressable>
        <AppText variant="subheading" weight="semibold">
          Configurações
        </AppText>
        <View style={{ width: 24 }} />
      </View>

      <Card animated={false} style={styles.group}>
        <Row icon="moon-outline" label="Tema" value={THEME_LABELS[settings.theme]} onPress={cycleTheme} />
        <Row
          icon="language-outline"
          label="Idioma"
          value={settings.language === 'pt-BR' ? 'Português' : 'English'}
          onPress={cycleLanguage}
        />
      </Card>

      <Card animated={false} style={styles.group}>
        <Row
          icon="notifications-outline"
          label="Notificações"
          toggle={settings.notificationsEnabled}
          onToggle={() => settings.toggle('notificationsEnabled')}
        />
        <Row
          icon="alarm-outline"
          label="Lembretes"
          toggle={settings.remindersEnabled}
          onToggle={() => settings.toggle('remindersEnabled')}
        />
        <Row
          icon="sync-outline"
          label="Sincronização automática"
          toggle={settings.autoSync}
          onToggle={() => settings.toggle('autoSync')}
        />
        <Row
          icon="cloud-upload-outline"
          label="Backup"
          toggle={settings.backupEnabled}
          onToggle={() => settings.toggle('backupEnabled')}
        />
      </Card>

      <Card animated={false} style={styles.group}>
        <Row icon="download-outline" label="Exportar dados" onPress={exportData} />
        <Row icon="shield-checkmark-outline" label="Privacidade" onPress={() => Alert.alert('Privacidade', 'Seus dados pertencem ao casal: ficam no dispositivo e, com sincronização ativa, no Firestore do seu projeto Firebase.')} />
      </Card>

      <Card animated={false} style={styles.group}>
        <Row icon="log-out-outline" label="Sair" onPress={confirmSignOut} />
        <Row icon="trash-outline" label="Excluir conta" onPress={confirmDelete} danger />
      </Card>

      <AppText variant="caption" tone="muted" style={styles.version}>
        Foco a Dois v1.0.0 — Juntos contra a procrastinação 💜
      </AppText>
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
  group: {
    marginBottom: spacing.md,
    paddingVertical: spacing.xs,
    gap: 0,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: 12,
  },
  rowIcon: {
    width: 32,
    height: 32,
    borderRadius: radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  version: {
    textAlign: 'center',
    marginTop: spacing.lg,
  },
});
