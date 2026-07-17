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
import { DEFAULT_SCHEDULE } from '@/constants/seed';
import { newId } from '@/utils/id';
import { notifyPartner } from '@/services/notifications';
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
  /** Semeia o cronograma padrão para um dia ainda sem tarefas. */
  ensureSeeded: (dateKey: string) => void;
  addTask: (input: NewTaskInput) => Task;
  updateTask: (id: string, patch: Partial<Task>) => void;
  removeTask: (id: string) => void;
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
        const now = Date.now();
        const seeded: Record<string, Task> = { ...state.tasks };
        DEFAULT_SCHEDULE.forEach((tpl, index) => {
          // Individuais e compartilhadas pertencem aos dois; tarefas da casa
          // alternam o responsável entre os membros do casal.
          const assigneeId =
            tpl.type === 'casa' && members.length
              ? members[index % members.length].id
              : undefined;
          const task: Task = {
            id: newId('task'),
            title: tpl.title,
            emoji: tpl.emoji,
            type: tpl.type,
            category: tpl.category,
            date: dateKey,
            time: tpl.time,
            estimatedMinutes: tpl.estimatedMinutes,
            assigneeId,
            completedBy: tpl.type === 'individual' ? [] : undefined,
            status: 'pending',
            priority: 'media',
            difficulty: tpl.difficulty,
            xp: tpl.xp,
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
