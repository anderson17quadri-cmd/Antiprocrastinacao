import dayjs from 'dayjs';
import { Task } from './entities';

export interface DayStat {
  /** YYYY-MM-DD */
  date: string;
  /** Rótulo curto (Seg, Ter…) */
  label: string;
  completed: number;
}

export function tasksForDate(tasks: Task[], date: string): Task[] {
  return tasks
    .filter((t) => t.date === date)
    .sort((a, b) => (a.time ?? '99:99').localeCompare(b.time ?? '99:99'));
}

export function completionRatio(tasks: Task[]): number {
  const relevant = tasks.filter((t) => t.status !== 'cancelled');
  if (relevant.length === 0) return 0;
  const done = relevant.filter((t) => t.status === 'done').length;
  return done / relevant.length;
}

export function completedByDay(tasks: Task[], start: dayjs.Dayjs, days: number): DayStat[] {
  const stats: DayStat[] = [];
  for (let i = 0; i < days; i += 1) {
    const d = start.add(i, 'day');
    const key = d.format('YYYY-MM-DD');
    stats.push({
      date: key,
      label: d.format('ddd').replace('.', ''),
      completed: tasks.filter((t) => t.date === key && t.status === 'done').length,
    });
  }
  return stats;
}

/** Segundos produtivos (tempo real registrado em tarefas concluídas). */
export function productiveSeconds(tasks: Task[]): number {
  return tasks
    .filter((t) => t.status === 'done')
    .reduce((acc, t) => acc + (t.spentSeconds || t.estimatedMinutes * 60), 0);
}

/** Segundos "desperdiçados": estimativa das tarefas canceladas. */
export function wastedSeconds(tasks: Task[]): number {
  return tasks
    .filter((t) => t.status === 'cancelled')
    .reduce((acc, t) => acc + t.estimatedMinutes * 60, 0);
}

export function inRange(tasks: Task[], start: dayjs.Dayjs, end: dayjs.Dayjs): Task[] {
  const s = start.format('YYYY-MM-DD');
  const e = end.format('YYYY-MM-DD');
  return tasks.filter((t) => t.date >= s && t.date <= e);
}
