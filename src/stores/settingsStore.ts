import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

export type ThemePreference = 'dark' | 'light' | 'system';
export type Language = 'pt-BR' | 'en-US';

interface SettingsState {
  theme: ThemePreference;
  language: Language;
  notificationsEnabled: boolean;
  remindersEnabled: boolean;
  soundEnabled: boolean;
  autoSync: boolean;
  backupEnabled: boolean;
  setTheme: (theme: ThemePreference) => void;
  setLanguage: (language: Language) => void;
  toggle: (
    key: 'notificationsEnabled' | 'remindersEnabled' | 'soundEnabled' | 'autoSync' | 'backupEnabled',
  ) => void;
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      theme: 'dark',
      language: 'pt-BR',
      notificationsEnabled: true,
      remindersEnabled: true,
      soundEnabled: true,
      autoSync: true,
      backupEnabled: true,
      setTheme: (theme) => set({ theme }),
      setLanguage: (language) => set({ language }),
      toggle: (key) => set((s) => ({ [key]: !s[key] }) as Partial<SettingsState>),
    }),
    {
      name: 'foco-a-dois/settings',
      storage: createJSONStorage(() => AsyncStorage),
    },
  ),
);
