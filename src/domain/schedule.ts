import { TaskCategory, TaskDifficulty, TaskType } from './entities';
import { DEFAULT_ROUTINE, ROUTINE_HABITS, RoutineConfig } from '@/constants/routine';
import { dayjs } from '@/utils/date';

/** Item de agenda gerado a partir da rotina (antes de virar Task). */
export interface ScheduleItem {
  time: string;
  title: string;
  emoji: string;
  category: TaskCategory;
  type: TaskType;
  estimatedMinutes: number;
  difficulty: TaskDifficulty;
  xp: number;
  /** undefined = do casal (Ambos); senão, do membro dono da rotina. */
  ownerId?: string;
}

function addMinutes(time: string, minutes: number): string {
  const [h, m] = time.split(':').map(Number);
  const d = new Date(2000, 0, 1, h, m + minutes);
  const pad = (n: number) => n.toString().padStart(2, '0');
  return `${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

/**
 * Agenda pessoal de um membro para uma data: acordar/dormir, bloco de
 * trabalho nos dias configurados e os hábitos escolhidos no onboarding.
 */
export function buildPersonalSchedule(
  ownerId: string,
  routine: RoutineConfig | undefined,
  dateKey: string,
): ScheduleItem[] {
  const r = routine ?? DEFAULT_ROUTINE;
  const isoWeekday = dayjs(dateKey).isoWeekday();
  const items: ScheduleItem[] = [];

  items.push({
    time: r.wakeTime,
    title: 'Acordar',
    emoji: '⏰',
    category: 'rotina',
    type: 'individual',
    estimatedMinutes: 15,
    difficulty: 'facil',
    xp: 10,
    ownerId,
  });

  if (r.workEnabled && r.workDays.includes(isoWeekday)) {
    const [sh, sm] = r.workStart.split(':').map(Number);
    const [eh, em] = r.workEnd.split(':').map(Number);
    const minutes = Math.max(30, eh * 60 + em - (sh * 60 + sm));
    items.push({
      time: r.workStart,
      title: r.workLabel || 'Trabalho',
      emoji: '💼',
      category: 'trabalho',
      type: 'individual',
      estimatedMinutes: minutes,
      difficulty: 'dificil',
      xp: 60,
      ownerId,
    });
  }

  for (const habitId of r.habits) {
    const habit = ROUTINE_HABITS.find((h) => h.id === habitId);
    if (!habit) continue;
    items.push({
      time: habit.defaultTime,
      title: habit.title,
      emoji: habit.emoji,
      category: habit.category,
      type: 'individual',
      estimatedMinutes: habit.estimatedMinutes,
      difficulty: 'facil',
      xp: habit.xp,
      ownerId,
    });
  }

  items.push({
    time: r.sleepTime,
    title: 'Dormir',
    emoji: '🌙',
    category: 'rotina',
    type: 'individual',
    estimatedMinutes: 15,
    difficulty: 'facil',
    xp: 10,
    ownerId,
  });

  return items;
}

/** Parte compartilhada do dia do casal (refeições, casa e tempo a dois). */
export function buildSharedSchedule(wakeTime = '07:00'): ScheduleItem[] {
  return [
    { time: addMinutes(wakeTime, 60), title: 'Pequeno-almoço', emoji: '☕', category: 'cozinha', type: 'casa', estimatedMinutes: 30, difficulty: 'facil', xp: 15 },
    { time: '12:30', title: 'Almoço', emoji: '🍽️', category: 'cozinha', type: 'casa', estimatedMinutes: 60, difficulty: 'media', xp: 30 },
    { time: '14:00', title: 'Limpeza rápida', emoji: '🧹', category: 'casa', type: 'casa', estimatedMinutes: 30, difficulty: 'facil', xp: 20 },
    { time: '18:30', title: 'Jantar', emoji: '🍲', category: 'cozinha', type: 'casa', estimatedMinutes: 60, difficulty: 'media', xp: 30 },
    { time: '20:00', title: 'Organizar casa', emoji: '🏠', category: 'casa', type: 'casa', estimatedMinutes: 45, difficulty: 'media', xp: 80 },
    { time: '21:00', title: 'Tempo do casal', emoji: '❤️', category: 'casal', type: 'compartilhada', estimatedMinutes: 90, difficulty: 'facil', xp: 25 },
  ];
}
