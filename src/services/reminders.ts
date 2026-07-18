/**
 * Lembretes locais de tarefas (expo-notifications).
 *
 * Cada aparelho agenda notificações para as tarefas que O PRÓPRIO usuário
 * ainda pode concluir (as do par chegam no aparelho dele via sync). Sempre
 * que as tarefas mudam, a agenda de notificações é refeita do zero —
 * simples e sem duplicatas.
 */
import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import { Task } from '@/domain/entities';
import { canComplete } from '@/domain/taskRules';

const CHANNEL_ID = 'tarefas';
const MAX_SCHEDULED = 32;

let handlerInstalled = false;
let permissionGranted: boolean | null = null;

function installHandler(): void {
  if (handlerInstalled) return;
  handlerInstalled = true;
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
    }),
  });
}

async function ensurePermission(): Promise<boolean> {
  if (permissionGranted !== null) return permissionGranted;
  try {
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync(CHANNEL_ID, {
        name: 'Lembretes de tarefas',
        importance: Notifications.AndroidImportance.HIGH,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#6C63FF',
      });
    }
    const current = await Notifications.getPermissionsAsync();
    const status = current.granted
      ? current
      : await Notifications.requestPermissionsAsync();
    permissionGranted = status.granted;
  } catch {
    permissionGranted = false;
  }
  return permissionGranted;
}

function taskDateTime(task: Task): Date | null {
  if (!task.time) return null;
  const [h, m] = task.time.split(':').map(Number);
  if (Number.isNaN(h) || Number.isNaN(m)) return null;
  const [y, mo, d] = task.date.split('-').map(Number);
  if (!y || !mo || !d) return null;
  return new Date(y, mo - 1, d, h, m, 0);
}

/**
 * Reagenda todas as notificações a partir do estado atual das tarefas.
 * Chamar sempre que as tarefas mudarem (com debounce de quem chama).
 */
export async function syncTaskReminders(
  tasks: Task[],
  userId: string,
  enabled: boolean,
): Promise<void> {
  if (Platform.OS === 'web') return;
  try {
    installHandler();
    await Notifications.cancelAllScheduledNotificationsAsync();
    if (!enabled) return;
    if (!(await ensurePermission())) return;

    const now = Date.now();
    const horizon = now + 7 * 24 * 60 * 60 * 1000;
    const upcoming = tasks
      .map((task) => ({ task, when: taskDateTime(task) }))
      .filter(
        (
          entry,
        ): entry is { task: Task; when: Date } =>
          entry.when !== null &&
          entry.when.getTime() > now &&
          entry.when.getTime() <= horizon &&
          (entry.task.status === 'pending' || entry.task.status === 'in_progress') &&
          canComplete(entry.task, userId),
      )
      .sort((a, b) => a.when.getTime() - b.when.getTime())
      .slice(0, MAX_SCHEDULED);

    for (const { task, when } of upcoming) {
      await Notifications.scheduleNotificationAsync({
        content: {
          title: `${task.emoji} ${task.title}`,
          body:
            task.type === 'compartilhada'
              ? `Hora de vocês dois: ${task.time} — vale ${task.xp ?? 0} XP!`
              : `Sua tarefa das ${task.time} — vale ${task.xp ?? 0} XP!`,
          sound: true,
          data: { taskId: task.id },
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.DATE,
          date: when,
          channelId: Platform.OS === 'android' ? CHANNEL_ID : undefined,
        },
      });
    }
  } catch {
    // Lembretes são melhoria, nunca podem quebrar o app.
  }
}
