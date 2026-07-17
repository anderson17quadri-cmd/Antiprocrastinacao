import { TaskCategory } from '@/domain/entities';

/** Hábito selecionável no onboarding de rotina. */
export interface RoutineHabit {
  id: string;
  title: string;
  emoji: string;
  category: TaskCategory;
  defaultTime: string;
  estimatedMinutes: number;
  xp: number;
}

export const ROUTINE_HABITS: RoutineHabit[] = [
  { id: 'agua', title: 'Beber água', emoji: '💧', category: 'saude', defaultTime: '09:30', estimatedMinutes: 5, xp: 10 },
  { id: 'exercicio', title: 'Fazer exercício', emoji: '🏋️', category: 'saude', defaultTime: '06:30', estimatedMinutes: 45, xp: 50 },
  { id: 'caminhar', title: 'Caminhar', emoji: '🚶', category: 'saude', defaultTime: '18:00', estimatedMinutes: 30, xp: 25 },
  { id: 'ler', title: 'Ler livro', emoji: '📖', category: 'pessoal', defaultTime: '21:30', estimatedMinutes: 30, xp: 25 },
  { id: 'meditar', title: 'Meditar', emoji: '🧘', category: 'saude', defaultTime: '07:15', estimatedMinutes: 15, xp: 20 },
  { id: 'estudar', title: 'Estudar', emoji: '📚', category: 'estudos', defaultTime: '19:30', estimatedMinutes: 60, xp: 45 },
  { id: 'vitaminas', title: 'Tomar vitaminas', emoji: '💊', category: 'saude', defaultTime: '08:15', estimatedMinutes: 5, xp: 10 },
  { id: 'skincare', title: 'Skincare', emoji: '🧴', category: 'pessoal', defaultTime: '22:00', estimatedMinutes: 15, xp: 15 },
  { id: 'alongar', title: 'Alongamento', emoji: '🤸', category: 'saude', defaultTime: '07:10', estimatedMinutes: 10, xp: 15 },
  { id: 'diario', title: 'Escrever diário', emoji: '📓', category: 'pessoal', defaultTime: '22:00', estimatedMinutes: 15, xp: 15 },
  { id: 'familia', title: 'Ligar para a família', emoji: '📞', category: 'pessoal', defaultTime: '18:30', estimatedMinutes: 20, xp: 15 },
  { id: 'planejar', title: 'Planejar o dia', emoji: '🗓️', category: 'produtividade', defaultTime: '08:30', estimatedMinutes: 10, xp: 15 },
];

/** Configuração de rotina de UMA pessoa (agenda pessoal). */
export interface RoutineConfig {
  wakeTime: string;
  sleepTime: string;
  workEnabled: boolean;
  workLabel: string;
  workStart: string;
  workEnd: string;
  /** Dias de trabalho (1 = segunda … 7 = domingo). */
  workDays: number[];
  /** Ids dos hábitos escolhidos (ROUTINE_HABITS). */
  habits: string[];
}

export const DEFAULT_ROUTINE: RoutineConfig = {
  wakeTime: '07:00',
  sleepTime: '22:30',
  workEnabled: true,
  workLabel: 'Trabalho',
  workStart: '09:00',
  workEnd: '17:00',
  workDays: [1, 2, 3, 4, 5],
  habits: [],
};

export const QUICK_TIMES_WAKE = ['05:30', '06:00', '06:30', '07:00', '07:30', '08:00', '09:00'];
export const QUICK_TIMES_SLEEP = ['21:30', '22:00', '22:30', '23:00', '23:30', '00:00'];
