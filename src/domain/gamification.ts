import { League, Task, TaskDifficulty } from './entities';

const DIFFICULTY_XP: Record<TaskDifficulty, number> = {
  facil: 15,
  media: 30,
  dificil: 50,
};

/** XP ganho ao concluir uma tarefa: valor explícito ou base por dificuldade + bônus de duração. */
export function xpForTask(task: Task): number {
  if (task.xp != null) return task.xp;
  const base = DIFFICULTY_XP[task.difficulty] ?? DIFFICULTY_XP.media;
  const durationBonus = Math.min(30, Math.round(task.estimatedMinutes / 5));
  return base + durationBonus;
}

/** Moedas ganhas ao concluir uma tarefa. */
export function coinsForTask(task: Task): number {
  if (task.coins != null) return task.coins;
  return Math.max(5, Math.round(xpForTask(task) / 2));
}

/** XP acumulado necessário para atingir um nível. */
export function xpForLevel(level: number): number {
  return 50 * (level - 1) * level;
}

/** Nível atual a partir do XP acumulado. */
export function levelForXp(xp: number): number {
  let level = 1;
  while (xpForLevel(level + 1) <= xp) level += 1;
  return level;
}

/** Progresso (0-1) dentro do nível atual. */
export function levelProgress(xp: number): number {
  const level = levelForXp(xp);
  const current = xpForLevel(level);
  const next = xpForLevel(level + 1);
  if (next === current) return 1;
  return Math.min(1, (xp - current) / (next - current));
}

/** Pontuação do casal: XP somado + bônus por sequência. */
export function coupleScore(totalXp: number, streakDays: number): number {
  return totalXp + streakDays * 25;
}

/* ------------------------------------------------------------------ */
/* Liga do Casal                                                       */
/* ------------------------------------------------------------------ */

export const LEAGUES: League[] = [
  { id: 'bronze', name: 'Bronze', emoji: '🥉', minXp: 0, color: '#CD7F32', unlocks: 'Ícones básicos' },
  { id: 'prata', name: 'Prata', emoji: '🥈', minXp: 500, color: '#C0C0C0', unlocks: 'Novos avatares' },
  { id: 'ouro', name: 'Ouro', emoji: '🥇', minXp: 1500, color: '#FFD700', unlocks: 'Temas exclusivos' },
  { id: 'platina', name: 'Platina', emoji: '💠', minXp: 3000, color: '#7DF9FF', unlocks: 'Animações premium' },
  { id: 'diamante', name: 'Diamante', emoji: '💎', minXp: 6000, color: '#A78BFA', unlocks: 'Molduras de perfil' },
  { id: 'mestre', name: 'Mestre', emoji: '👑', minXp: 12000, color: '#7E57FF', unlocks: 'Moldura animada' },
  { id: 'lenda', name: 'Lenda', emoji: '🏆', minXp: 25000, color: '#F97316', unlocks: 'Tudo desbloqueado' },
];

/** Liga atual do casal pelo XP somado dos dois. */
export function leagueForXp(totalXp: number): League {
  let current = LEAGUES[0];
  for (const league of LEAGUES) {
    if (totalXp >= league.minXp) current = league;
  }
  return current;
}

/** Próxima liga (ou null se já é Lenda). */
export function nextLeague(totalXp: number): League | null {
  const index = LEAGUES.findIndex((l) => l.id === leagueForXp(totalXp).id);
  return LEAGUES[index + 1] ?? null;
}
