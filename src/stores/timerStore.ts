import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

/**
 * Cronômetro global: sobrevive à navegação e ao fechamento do app
 * (o tempo é calculado a partir de timestamps, não de ticks).
 */
interface TimerState {
  activeTaskId: string | null;
  startedAt: number | null;
  accumulatedSeconds: number;
  running: boolean;
  start: (taskId: string) => void;
  pause: () => void;
  resume: () => void;
  /** Encerra e devolve o total de segundos medidos. */
  stop: () => number;
  elapsed: () => number;
}

export const useTimerStore = create<TimerState>()(
  persist(
    (set, get) => ({
      activeTaskId: null,
      startedAt: null,
      accumulatedSeconds: 0,
      running: false,

      start: (taskId) =>
        set({ activeTaskId: taskId, startedAt: Date.now(), accumulatedSeconds: 0, running: true }),

      pause: () => {
        const { startedAt, accumulatedSeconds, running } = get();
        if (!running || !startedAt) return;
        set({
          accumulatedSeconds: accumulatedSeconds + (Date.now() - startedAt) / 1000,
          startedAt: null,
          running: false,
        });
      },

      resume: () => {
        if (get().running) return;
        set({ startedAt: Date.now(), running: true });
      },

      stop: () => {
        const total = get().elapsed();
        set({ activeTaskId: null, startedAt: null, accumulatedSeconds: 0, running: false });
        return Math.round(total);
      },

      elapsed: () => {
        const { startedAt, accumulatedSeconds, running } = get();
        if (running && startedAt) return accumulatedSeconds + (Date.now() - startedAt) / 1000;
        return accumulatedSeconds;
      },
    }),
    {
      name: 'foco-a-dois/timer',
      storage: createJSONStorage(() => AsyncStorage),
    },
  ),
);
