/**
 * Assistente inteligente do casal.
 *
 * Motor de insights local que analisa o histórico de tarefas e gera
 * sugestões personalizadas: melhor horário, divisão justa, tarefas
 * esquecidas e resumo semanal. Roda 100% no dispositivo e melhora
 * conforme o histórico cresce; a mesma interface permite plugar um
 * modelo remoto (ex.: API da Anthropic) no futuro.
 */
import { Task, UserProfile } from '@/domain/entities';
import { dayjs, todayKey } from '@/utils/date';

export interface Insight {
  id: string;
  emoji: string;
  title: string;
  message: string;
  kind: 'horario' | 'divisao' | 'lembrete' | 'esquecida' | 'resumo' | 'dica';
}

function completionHourHistogram(tasks: Task[]): Map<number, number> {
  const histogram = new Map<number, number>();
  tasks
    .filter((t) => t.status === 'done' && t.completedAt)
    .forEach((t) => {
      const hour = new Date(t.completedAt!).getHours();
      histogram.set(hour, (histogram.get(hour) ?? 0) + 1);
    });
  return histogram;
}

export function generateInsights(
  tasks: Task[],
  user: UserProfile | null,
  partner: UserProfile | null,
): Insight[] {
  const insights: Insight[] = [];
  const done = tasks.filter((t) => t.status === 'done');

  // 1. Melhor horário para tarefas
  const histogram = completionHourHistogram(tasks);
  if (histogram.size > 0) {
    const [bestHour, count] = [...histogram.entries()].sort((a, b) => b[1] - a[1])[0];
    insights.push({
      id: 'best-hour',
      emoji: '⏰',
      kind: 'horario',
      title: 'Melhor horário de foco',
      message: `Vocês concluem mais tarefas por volta das ${bestHour}h (${count} tarefas). Agendem as tarefas mais difíceis nesse horário.`,
    });
  }

  // 2. Divisão mais justa
  if (user && partner) {
    const userDone = done.filter((t) => t.assigneeId === user.id).length;
    const partnerDone = done.filter((t) => t.assigneeId === partner.id).length;
    const total = userDone + partnerDone;
    if (total >= 6) {
      const userShare = Math.round((userDone / total) * 100);
      if (userShare >= 65 || userShare <= 35) {
        const overloaded = userShare >= 65 ? user.name : partner.name;
        const relaxed = userShare >= 65 ? partner.name : user.name;
        insights.push({
          id: 'fair-split',
          emoji: '⚖️',
          kind: 'divisao',
          title: 'Divisão desequilibrada',
          message: `${overloaded} concluiu ${Math.max(userShare, 100 - userShare)}% das tarefas. Que tal transferir algumas para ${relaxed} esta semana?`,
        });
      } else {
        insights.push({
          id: 'fair-split',
          emoji: '⚖️',
          kind: 'divisao',
          title: 'Divisão equilibrada',
          message: `A divisão está justa: ${userShare}% × ${100 - userShare}%. Continuem assim! 💜`,
        });
      }
    }
  }

  // 3. Tarefas esquecidas (pendentes de dias anteriores)
  const today = todayKey();
  const forgotten = tasks.filter((t) => t.status === 'pending' && t.date < today);
  if (forgotten.length > 0) {
    const sample = forgotten[0];
    insights.push({
      id: 'forgotten',
      emoji: '🔎',
      kind: 'esquecida',
      title: 'Tarefas esquecidas',
      message: `Há ${forgotten.length} tarefa(s) pendente(s) de dias anteriores, como "${sample.title}". Reagendem ou concluam para manter a sequência.`,
    });
  }

  // 4. Lembrete inteligente: categoria mais cancelada
  const cancelled = tasks.filter((t) => t.status === 'cancelled');
  if (cancelled.length >= 3) {
    const byTitle = new Map<string, number>();
    cancelled.forEach((t) => byTitle.set(t.title, (byTitle.get(t.title) ?? 0) + 1));
    const [worst] = [...byTitle.entries()].sort((a, b) => b[1] - a[1])[0];
    insights.push({
      id: 'procrastination',
      emoji: '🐌',
      kind: 'lembrete',
      title: 'Alerta de procrastinação',
      message: `"${worst}" é a tarefa mais cancelada. Experimentem dividi-la em partes menores ou trocar o responsável.`,
    });
  }

  // 5. Resumo semanal
  const weekStart = dayjs().startOf('isoWeek').format('YYYY-MM-DD');
  const weekDone = done.filter((t) => t.date >= weekStart).length;
  const weekMinutes = done
    .filter((t) => t.date >= weekStart)
    .reduce((acc, t) => acc + Math.round((t.spentSeconds || t.estimatedMinutes * 60) / 60), 0);
  insights.push({
    id: 'weekly-summary',
    emoji: '📊',
    kind: 'resumo',
    title: 'Resumo da semana',
    message:
      weekDone > 0
        ? `Esta semana vocês concluíram ${weekDone} tarefas e somaram ${Math.floor(weekMinutes / 60)}h ${weekMinutes % 60}m produtivas. Sequência atual: ${user?.streakDays ?? 0} dias 🔥`
        : 'A semana está só começando. Concluam a primeira tarefa juntos para ativar a sequência! 🔥',
  });

  // 6. Dica de produtividade
  const avgMinutes =
    done.length > 0
      ? Math.round(done.reduce((acc, t) => acc + (t.spentSeconds || 0) / 60, 0) / done.length)
      : 0;
  if (avgMinutes > 0) {
    insights.push({
      id: 'avg-time',
      emoji: '💡',
      kind: 'dica',
      title: 'Tempo médio por tarefa',
      message: `O tempo médio de vocês é de ${avgMinutes} min por tarefa. Usem o cronômetro para transformar tarefas chatas em corridas contra o relógio!`,
    });
  }

  return insights;
}
