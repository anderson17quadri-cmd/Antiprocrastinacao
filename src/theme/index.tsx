import React, { createContext, useContext, useMemo } from 'react';
import { useColorScheme } from 'react-native';
import { useSettingsStore } from '@/stores/settingsStore';

/** Paleta da marca Foco a Dois. */
export const brand = {
  primary: '#6C63FF',
  secondary: '#7E57FF',
  accent: '#A78BFA',
  light: '#F5F5F5',
  white: '#FFFFFF',
  black: '#101010',
  success: '#34D399',
  warning: '#FBBF24',
  danger: '#F87171',
  pink: '#F472B6',
};

export interface ThemeColors {
  background: string;
  surface: string;
  surfaceElevated: string;
  glass: string;
  border: string;
  text: string;
  textSecondary: string;
  textMuted: string;
  primary: string;
  primarySoft: string;
  accent: string;
  success: string;
  successSoft: string;
  warning: string;
  danger: string;
  dangerSoft: string;
  tabBar: string;
  gradient: readonly [string, string];
}

export interface Theme {
  dark: boolean;
  colors: ThemeColors;
}

const darkColors: ThemeColors = {
  background: brand.black,
  surface: '#17171C',
  surfaceElevated: '#1F1F26',
  glass: 'rgba(255,255,255,0.06)',
  border: 'rgba(255,255,255,0.08)',
  text: brand.white,
  textSecondary: 'rgba(255,255,255,0.64)',
  textMuted: 'rgba(255,255,255,0.38)',
  primary: brand.primary,
  primarySoft: 'rgba(108,99,255,0.16)',
  accent: brand.accent,
  success: brand.success,
  successSoft: 'rgba(52,211,153,0.14)',
  warning: brand.warning,
  danger: brand.danger,
  dangerSoft: 'rgba(248,113,113,0.14)',
  tabBar: 'rgba(16,16,16,0.98)',
  gradient: [brand.primary, brand.secondary] as const,
};

const lightColors: ThemeColors = {
  background: brand.light,
  surface: brand.white,
  surfaceElevated: brand.white,
  glass: 'rgba(16,16,16,0.04)',
  border: 'rgba(16,16,16,0.08)',
  text: brand.black,
  textSecondary: 'rgba(16,16,16,0.62)',
  textMuted: 'rgba(16,16,16,0.38)',
  primary: brand.primary,
  primarySoft: 'rgba(108,99,255,0.10)',
  accent: brand.secondary,
  success: '#10B981',
  successSoft: 'rgba(16,185,129,0.12)',
  warning: '#F59E0B',
  danger: '#EF4444',
  dangerSoft: 'rgba(239,68,68,0.10)',
  tabBar: 'rgba(255,255,255,0.98)',
  gradient: [brand.primary, brand.secondary] as const,
};

export const darkTheme: Theme = { dark: true, colors: darkColors };
export const lightTheme: Theme = { dark: false, colors: lightColors };

const ThemeContext = createContext<Theme>(darkTheme);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const system = useColorScheme();
  const preference = useSettingsStore((s) => s.theme);

  const theme = useMemo(() => {
    const mode = preference === 'system' ? (system ?? 'dark') : preference;
    return mode === 'dark' ? darkTheme : lightTheme;
  }, [preference, system]);

  return <ThemeContext.Provider value={theme}>{children}</ThemeContext.Provider>;
}

export function useTheme(): Theme {
  return useContext(ThemeContext);
}

/** Sombra suave padrão dos cards. */
export function cardShadow(dark: boolean) {
  return {
    shadowColor: dark ? '#000000' : '#6C63FF',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: dark ? 0.35 : 0.08,
    shadowRadius: 16,
    elevation: 4,
  } as const;
}

export const font = {
  regular: 'Inter_400Regular',
  medium: 'Inter_500Medium',
  semibold: 'Inter_600SemiBold',
  bold: 'Inter_700Bold',
  extrabold: 'Inter_800ExtraBold',
} as const;

export const radius = {
  sm: 10,
  md: 16,
  lg: 20,
  xl: 28,
  full: 999,
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 28,
} as const;
