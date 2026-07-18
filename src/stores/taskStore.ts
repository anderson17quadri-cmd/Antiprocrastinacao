import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import {
  ActivityEvent,
  Task,
  TaskCategory,
  TaskDifficulty,
  TaskPriority,
  TaskRepeat,
  TaskType,
  UserProfile,
} from '@/domain/entities';
import { coinsForTask, xpForTask } from '@/domain/gamification';
import { applyCompletion } from '@/domain/taskRules';
import { ScheduleItem, buildPersonalSchedule, buildSharedSchedule } from '@/domain/schedule';
import { useRoutineStore } from './routineStore';
import { newId } from '@/utils/id';
import { notifyPartner } from '@/services/notifications';
import { playSound } from '@/services/sound';
import { pushTask, pushActivity } from '@/services/sync';
import { useAuthStore } from './authStore';

export interface NewTaskInput {
  title: string;
  description?: string;
  notes?: string;
  emoji: string;
  color?: string;
  type: TaskType;
  category: TaskCategory;
  date: string;
  time?: string;
  estimatedMinutes: number;
  assigneeId?: string;
  priority: TaskPriority;
  difficulty: TaskDifficulty;
  repeat: TaskRepeat;
  xp?: number;
  coins?: number;
}

interface TaskState {
  tasks: Record<string, Task>;
  activity: ActivityEvent[];
  seededDates: string[];
  /** Semeia a agenda do dia (rotinas pessoais + parte do casal). */
  ensureSeeded: (dateKey: string) => void;
  /** Reaplica a agenda de um dia após mudança de rotina (preserva tarefas manuais e concluídas). */
  reseedDay: (dateKey: string) => void;
  addTask: (input: NewTaskInput) => Task;
  updateTask: (id: string, patch: Partial<Task>) => void;
  removeTask: (id: string) => void;
  /** Aplica tarefas recebidas do Firestore (sincronização do casal). */
  applyRemoteTasks: (remote: Task[]) => void;
  startTask: (id: string, user: UserProfile) => void;
  /** Conclui respeitando o tipo da tarefa; false se o usuário não pode concluir. */
  completeTask: (id: string, user: UserProfile, spentSeconds: number) => boolean;
  cancelTask: (id: string, user: UserProfile) => void;
  reopenTask: (id: string) => void;
}

function logActivity(
  state: TaskState,
  type: ActivityEvent['type'],
  user: UserProfile,
  taskTitle?: string,
  message?: string,
): ActivityEvent[] {
  const event: ActivityEvent = {
    id: newId('act'),
    type,
    taskTitle,
    message,
    userId: user.id,
    userName: user.name,
    at: Date.now(),
  };
  pushActivity(event);
  return [event, ...state.activity].slice(0, 200);
}

export const useTaskStore = create<TaskState>()(
  persist(
    (set, get) => ({
      tasks: {},
      activity: [],
      seededDates: [],

      ensureSeeded: (dateKey) => {
        const state = get();
        if (state.seededDates.includes(dateKey)) return;
        const auth = useAuthStore.getState();
        const members = [auth.user, auth.partner].filter(Boolean) as UserProfile[];
        const routines = useRoutineStore.getState().routines;
        const now = Date.now();
        const seeded: Record<string, Task> = { ...state.tasks };

        // Agenda enxuta: só a parte compartilhada pré-definida do casal e,
        // se o usuário configurou a rotina dele, os itens pessoais DELE.
        // O par gera os próprios itens no aparelho dele (chegam via sync) —
        // assim o app abre limpo, sem lista lotada.
        const items: ScheduleItem[] = [];
        const wake = auth.user ? routines[auth.user.id]?.wakeTime : undefined;
        items.push(...buildSharedSchedule(wake));
        if (auth.user && routines[auth.user.id]) {
          items.push(...buildPersonalSchedule(auth.user.id, routines[auth.user.id], dateKey));
        }
        items.sort((a, b) => a.time.localeCompare(b.time));

        items.forEach((item, index) => {
          const task: Task = {
            id: newId('task'),
            title: item.title,
            emoji: item.emoji,
            type: item.type,
            category: item.category,
            date: dateKey,
            time: item.time,
            estimatedMinutes: item.estimatedMinutes,
            // Casa alterna entre os dois; itens pessoais pertencem ao dono da rotina.
            assigneeId:
              item.type === 'casa'
                ? members.length
                  ? members[index % members.length].id
                  : undefined
                : item.ownerId,
            completedBy: item.type === 'individual' ? [] : undefined,
            status: 'pending',
            priority: 'media',
            difficulty: item.difficulty,
            xp: item.xp,
            repeat: 'diariamente',
            spentSeconds: 0,
            createdBy: auth.user?.id ?? 'system',
            createdAt: now,
            updatedAt: now,
          };
          seeded[task.id] = task;
        });
        set({ tasks: seeded, seededDates: [...state.seededDates, dateKey] });
      },

      reseedDay: (dateKey) => {
        // Remove só as tarefas automáticas ainda pendentes do dia;
        // concluídas, em andamento e criadas manualmente ficam.
        set((s) => {
          const tasks = { ...s.tasks };
          Object.values(tasks).forEach((t) => {
            if (t.date === dateKey && t.status === 'pending' && t.repeat === 'diariamente') {
              delete tasks[t.id];
            }
          });
          return { tasks, seededDates: s.seededDates.filter((d) => d !== dateKey) };
        });
        get().ensureSeeded(dateKey);
      },

      addTask: (input) => {
        const auth = useAuthStore.getState();
        const now = Date.now();
        const task: Task = {
          id: newId('task'),
          spentSeconds: 0,
          status: 'pending',
          completedBy: input.type === 'individual' ? [] : undefined,
          createdBy: auth.user?.id ?? 'system',
          createdAt: now,
          updatedAt: now,
          ...input,
        };
        set((s) => ({ tasks: { ...s.tasks, [task.id]: task } }));
        pushTask(task);
        return task;
      },

      updateTask: (id, patch) => {
        set((s) => {
          const task = s.tasks[id];
          if (!task) return s;
          const updated = { ...task, ...patch, updatedAt: Date.now() };
          pushTask(updated);
          return { tasks: { ...s.tasks, [id]: updated } };
        });
      },

      removeTask: (id) => {
        set((s) => {
          const tasks = { ...s.tasks };
          delete tasks[id];
          return { tasks };
        });
      },

      startTask: (id, user) => {
        set((s) => {
          const task = s.tasks[id];
          if (!task) return s;
          const updated: Task = { ...task, status: 'in_progress', startedAt: Date.now(), updatedAt: Date.now() };
          pushTask(updated);
          notifyPartner(`${user.name} iniciou a tarefa ${task.title}.`);
          return {
            tasks: { ...s.tasks, [id]: updated },
            activity: logActivity(s, 'started', user, task.title),
          };
        });
      },

      completeTask: (id, user, spentSeconds) => {
        const task = get().tasks[id];
        if (!task) return false;

        const auth = useAuthStore.getState();
        const memberIds = auth.couple?.memberIds ?? [user.id];
        const updated = applyCompletion(task, user.id, memberIds, spentSeconds);
        if (!updated) return false;

        set((s) => ({
          tasks: { ...s.tasks, [id]: updated },
          activity: logActivity(s, 'completed', user, task.title),
        }));
        pushTask(updated);
        playSound('success');

        const partnerStillPending =
          updated.type === 'individual' && updated.status !== 'done';
        notifyPartner(
          partnerStillPending
            ? `${user.name} concluiu ${task.title}. A sua ainda está pendente! +${xpForTask(updated)} XP`
            : `${user.name} concluiu ${task.title}. +${xpForTask(updated)} XP 🪙+${coinsForTask(updated)}`,
        );
        useAuthStore.getState().addRewards(xpForTask(updated), coinsForTask(updated));

        // Todas as tarefas do dia concluídas? Registra o dia na sequência.
        const dayTasks = Object.values(get().tasks).filter(
          (t) => t.date === task.date && t.status !== 'cancelled',
        );
        if (dayTasks.length > 0 && dayTasks.every((t) => t.status === 'done')) {
          useAuthStore.getState().registerStreakDay(task.date);
          playSound('fanfare');
          set((s) => ({
            activity: logActivity(s, 'milestone', user, undefined, 'Meta diária alcançada! Parabéns ao casal! 🎉'),
          }));
        }
        return true;
      },

      cancelTask: (id, user) => {
        set((s) => {
          const task = s.tasks[id];
          if (!task) return s;
          const updated: Task = { ...task, status: 'cancelled', cancelledAt: Date.now(), updatedAt: Date.now() };
          pushTask(updated);
          notifyPartner(`${user.name} cancelou ${task.title}.`);
          return {
            tasks: { ...s.tasks, [id]: updated },
            activity: logActivity(s, 'cancelled', user, task.title),
          };
        });
      },

      applyRemoteTasks: (remote) => {
        // Merge vindo do Firestore: a versão mais recente (updatedAt) vence.
        set((s) => {
          const tasks = { ...s.tasks };
          for (const task of remote) {
            const local = tasks[task.id];
            if (!local || task.updatedAt > local.updatedAt) tasks[task.id] = task;
          }
          return { tasks };
        });
      },

      reopenTask: (id) => {
        get().updateTask(id, {
          status: 'pending',
          startedAt: undefined,
          completedAt: undefined,
          cancelledAt: undefined,
        });
      },
    }),
    {
      name: 'foco-a-dois/tasks',
      storage: createJSONStorage(() => AsyncStorage),
    },
  ),
);
