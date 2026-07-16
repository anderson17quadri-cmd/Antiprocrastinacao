/**
 * Notificações do casal.
 *
 * Localmente usa Expo Notifications; em produção, os eventos gravados no
 * Firestore (coleção activity) disparam FCM via Cloud Function para o
 * dispositivo do parceiro — ver README para o deploy da função.
 */
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { useSettingsStore } from '@/stores/settingsStore';

let configured = false;

export async function configureNotifications(): Promise<void> {
  if (configured) return;
  configured = true;

  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: false,
      shouldSetBadge: false,
    }),
  });

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('couple', {
      name: 'Atividade do casal',
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 200, 100, 200],
      lightColor: '#6C63FF',
    });
  }

  await Notifications.requestPermissionsAsync().catch(() => undefined);
}

export function notifyPartner(message: string): void {
  if (!useSettingsStore.getState().notificationsEnabled) return;
  void Notifications.scheduleNotificationAsync({
    content: {
      title: 'Foco a Dois 💜',
      body: message,
      sound: false,
    },
    trigger: null,
  }).catch(() => undefined);
}

export async function scheduleTaskReminder(
  title: string,
  date: Date,
): Promise<string | null> {
  if (!useSettingsStore.getState().remindersEnabled) return null;
  if (date.getTime() <= Date.now()) return null;
  try {
    return await Notifications.scheduleNotificationAsync({
      content: {
        title: 'Hora de focar ⏰',
        body: `Está na hora de: ${title}`,
      },
      trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date },
    });
  } catch {
    return null;
  }
}
