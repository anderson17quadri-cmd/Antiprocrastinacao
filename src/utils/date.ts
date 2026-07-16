import dayjs from 'dayjs';
import 'dayjs/locale/pt-br';
import relativeTime from 'dayjs/plugin/relativeTime';
import isoWeek from 'dayjs/plugin/isoWeek';

dayjs.extend(relativeTime);
dayjs.extend(isoWeek);
dayjs.locale('pt-br');

export { dayjs };

export const DATE_KEY = 'YYYY-MM-DD';

export function todayKey(): string {
  return dayjs().format(DATE_KEY);
}

export function capitalize(value: string): string {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

/** "Terça-feira, 15 de Julho" */
export function fullDate(date = dayjs()): string {
  return capitalize(date.format('dddd, D [de] MMMM'));
}

/** Saudação conforme a hora do dia. */
export function greeting(date = dayjs()): { text: string; emoji: string } {
  const hour = date.hour();
  if (hour < 12) return { text: 'Bom dia', emoji: '☀️' };
  if (hour < 18) return { text: 'Boa tarde', emoji: '🌤️' };
  return { text: 'Boa noite', emoji: '🌙' };
}

/** Semana (7 dias) começando na segunda-feira da data informada. */
export function weekDays(anchor = dayjs()) {
  const start = anchor.startOf('isoWeek');
  return Array.from({ length: 7 }, (_, i) => start.add(i, 'day'));
}
