import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { RoutineConfig } from '@/constants/routine';

/** Rotina pessoal de cada membro do casal, por id de usuário. */
interface RoutineState {
  routines: Record<string, RoutineConfig>;
  setRoutine: (userId: string, routine: RoutineConfig) => void;
  getRoutine: (userId?: string) => RoutineConfig | undefined;
}

export const useRoutineStore = create<RoutineState>()(
  persist(
    (set, get) => ({
      routines: {},
      setRoutine: (userId, routine) =>
        set((s) => ({ routines: { ...s.routines, [userId]: routine } })),
      getRoutine: (userId) => (userId ? get().routines[userId] : undefined),
    }),
    {
      name: 'foco-a-dois/routines',
      storage: createJSONStorage(() => AsyncStorage),
    },
  ),
);
