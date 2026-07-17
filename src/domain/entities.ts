/**
 * Entidades de domínio do Foco a Dois.
 * Camada pura — sem dependência de React, Expo ou Firebase.
 */

export type TaskCategory =
  | 'rotina'
  | 'casa'
  | 'casal'
  | 'pessoal'
  | 'saude'
  | 'cozinha'
  | 'lavandaria'
  | 'trabalho'
  | 'estudos'
  | 'financas'
  | 'carro'
  | 'pets'
  | 'jardim'
  | 'compras'
  | 'produtividade';

/**
 * Tipos de tarefa:
 * - individual: cada usuário tem a própria conclusão (completedBy);
 * - compartilhada: quando um conclui, vale para os dois;
 * - casa: doméstica, com responsável (um dos dois ou ambos).
 */
export type TaskType = 'individual' | 'compartilhada' | 'casa';

export type TaskStatus = 'pending' | 'in_progress' | 'done' | 'cancelled';

export type TaskPriority = 'baixa' | 'media' | 'alta';

export type TaskDifficulty = 'facil' | 'media' | 'dificil';

export type TaskRepeat = 'nunca' | 'diariamente' | 'semanalmente' | 'mensalmente';

export interface Task {
  id: string;
  title: string;
  description?: string;
  /** Notas livres do casal sobre a tarefa. */
  notes?: string;
  emoji: string;
  /** Cor personalizada do card (hex); usa a cor da categoria se ausente. */
  color?: string;
  type: TaskType;
  category: TaskCategory;
  /** Dia da tarefa no formato YYYY-MM-DD */
  date: string;
  /** Horário no formato HH:mm */
  time?: string;
  estimatedMinutes: number;
  /** Responsável: id de um membro, ou undefined = Ambos. */
  assigneeId?: string;
  /** Tarefas individuais: ids dos usuários que já concluíram a sua parte. */
  completedBy?: string[];
  status: TaskStatus;
  priority: TaskPriority;
  difficulty: TaskDifficulty;
  repeat: TaskRepeat;
  /** XP concedido ao concluir (calculado se ausente). */
  xp?: number;
  /** Moedas concedidas ao concluir (calculado se ausente). */
  coins?: number;
  /** Segundos efetivamente gastos (cronômetro) */
  spentSeconds: number;
  startedAt?: number;
  completedAt?: number;
  cancelledAt?: number;
  createdBy: string;
  createdAt: number;
  updatedAt: number;
}

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  photoUrl?: string;
  xp: number;
  coins: number;
  streakDays: number;
  bestStreak: number;
  /** Última data (YYYY-MM-DD) em que a sequência foi computada */
  lastStreakDate?: string;
}

export interface CoupleGoal {
  title: string;
  targetDays: number;
  currentDays: number;
}

export interface Couple {
  id: string;
  /** Código de convite compartilhável (ex.: FOCO-8F3K) */
  inviteCode: string;
  memberIds: string[];
  score: number;
  goal: CoupleGoal;
  createdAt: number;
}

export type ActivityType = 'started' | 'completed' | 'cancelled' | 'milestone' | 'reward';

export interface ActivityEvent {
  id: string;
  type: ActivityType;
  taskTitle?: string;
  message?: string;
  userId: string;
  userName: string;
  at: number;
}

export interface Achievement {
  id: string;
  title: string;
  description: string;
  emoji: string;
  target: number;
  tint: string;
}

export interface AchievementProgress {
  achievement: Achievement;
  progress: number;
  unlocked: boolean;
}

/* ------------------------------------------------------------------ */
/* Recompensas                                                         */
/* ------------------------------------------------------------------ */

export type RewardCategory = 'comida' | 'lazer' | 'romance' | 'descanso' | 'presente' | 'outro';

export interface Reward {
  id: string;
  name: string;
  description?: string;
  emoji: string;
  photoUrl?: string;
  /** Moedas necessárias para resgatar. */
  cost: number;
  category: RewardCategory;
  createdBy: string;
  createdAt: number;
}

export interface Redemption {
  id: string;
  rewardId: string;
  rewardName: string;
  rewardEmoji: string;
  cost: number;
  userId: string;
  userName: string;
  at: number;
  used: boolean;
}

/* ------------------------------------------------------------------ */
/* Desafios e Liga                                                     */
/* ------------------------------------------------------------------ */

export type ChallengeKind = 'tasks_total' | 'task_title' | 'streak';

export interface Challenge {
  id: string;
  title: string;
  description: string;
  emoji: string;
  kind: ChallengeKind;
  /** Para kind = task_title: título da tarefa contabilizada. */
  taskTitle?: string;
  target: number;
  rewardXp: number;
  rewardCoins: number;
  tint: string;
}

export interface League {
  id: string;
  name: string;
  emoji: string;
  /** XP total do casal necessário para entrar na liga. */
  minXp: number;
  color: string;
  /** Desbloqueios cosméticos da liga. */
  unlocks: string;
}
