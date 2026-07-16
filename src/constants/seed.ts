import {
  Achievement,
  Challenge,
  RewardCategory,
  TaskCategory,
  TaskDifficulty,
  TaskPriority,
  TaskRepeat,
} from '@/domain/entities';

export interface ScheduleTemplate {
  time: string;
  title: string;
  emoji: string;
  category: TaskCategory;
  estimatedMinutes: number;
  difficulty: TaskDifficulty;
  xp: number;
}

/** Cronograma padrão do dia — totalmente personalizável pelo casal. */
export const DEFAULT_SCHEDULE: ScheduleTemplate[] = [
  { time: '07:00', title: 'Acordar', emoji: '⏰', category: 'rotina', estimatedMinutes: 15, difficulty: 'facil', xp: 10 },
  { time: '07:30', title: 'Arrumar cama', emoji: '🛏️', category: 'casa', estimatedMinutes: 10, difficulty: 'facil', xp: 10 },
  { time: '08:00', title: 'Pequeno-almoço', emoji: '☕', category: 'refeicao', estimatedMinutes: 30, difficulty: 'facil', xp: 15 },
  { time: '09:00', title: 'Trabalho', emoji: '💼', category: 'trabalho', estimatedMinutes: 180, difficulty: 'dificil', xp: 60 },
  { time: '12:30', title: 'Almoço', emoji: '🍽️', category: 'refeicao', estimatedMinutes: 60, difficulty: 'media', xp: 30 },
  { time: '14:00', title: 'Limpeza rápida', emoji: '🧹', category: 'casa', estimatedMinutes: 30, difficulty: 'facil', xp: 20 },
  { time: '18:30', title: 'Jantar', emoji: '🍲', category: 'refeicao', estimatedMinutes: 60, difficulty: 'media', xp: 30 },
  { time: '20:00', title: 'Organizar casa', emoji: '🏠', category: 'casa', estimatedMinutes: 45, difficulty: 'media', xp: 80 },
  { time: '21:00', title: 'Tempo do casal', emoji: '❤️', category: 'casal', estimatedMinutes: 90, difficulty: 'facil', xp: 25 },
  { time: '22:30', title: 'Dormir', emoji: '🌙', category: 'rotina', estimatedMinutes: 15, difficulty: 'facil', xp: 10 },
];

export interface HouseTaskTemplate {
  title: string;
  emoji: string;
  category: TaskCategory;
  estimatedMinutes: number;
  priority: TaskPriority;
  repeat: TaskRepeat;
  difficulty: TaskDifficulty;
  xp: number;
}

/** Lista pronta de tarefas da casa, com XP por dificuldade. */
export const HOUSE_TASKS: HouseTaskTemplate[] = [
  { title: 'Lavar roupa', emoji: '🧺', category: 'casa', estimatedMinutes: 60, priority: 'media', repeat: 'semanalmente', difficulty: 'media', xp: 40 },
  { title: 'Dobrar roupa', emoji: '👕', category: 'casa', estimatedMinutes: 25, priority: 'baixa', repeat: 'semanalmente', difficulty: 'facil', xp: 20 },
  { title: 'Passar roupa', emoji: '🔥', category: 'casa', estimatedMinutes: 40, priority: 'baixa', repeat: 'semanalmente', difficulty: 'media', xp: 35 },
  { title: 'Limpar cozinha', emoji: '🍳', category: 'casa', estimatedMinutes: 45, priority: 'alta', repeat: 'diariamente', difficulty: 'media', xp: 40 },
  { title: 'Lavar louça', emoji: '🍽️', category: 'casa', estimatedMinutes: 30, priority: 'alta', repeat: 'diariamente', difficulty: 'facil', xp: 20 },
  { title: 'Fazer almoço', emoji: '🥗', category: 'refeicao', estimatedMinutes: 60, priority: 'alta', repeat: 'diariamente', difficulty: 'media', xp: 40 },
  { title: 'Fazer jantar', emoji: '🍲', category: 'refeicao', estimatedMinutes: 60, priority: 'alta', repeat: 'diariamente', difficulty: 'media', xp: 40 },
  { title: 'Varrer', emoji: '🧹', category: 'casa', estimatedMinutes: 20, priority: 'media', repeat: 'diariamente', difficulty: 'facil', xp: 15 },
  { title: 'Passar pano', emoji: '🪣', category: 'casa', estimatedMinutes: 40, priority: 'media', repeat: 'semanalmente', difficulty: 'media', xp: 35 },
  { title: 'Limpar banheiro', emoji: '🚿', category: 'casa', estimatedMinutes: 30, priority: 'alta', repeat: 'semanalmente', difficulty: 'dificil', xp: 50 },
  { title: 'Organizar quarto', emoji: '🛏️', category: 'casa', estimatedMinutes: 30, priority: 'media', repeat: 'semanalmente', difficulty: 'facil', xp: 25 },
  { title: 'Trocar lixo', emoji: '🗑️', category: 'casa', estimatedMinutes: 5, priority: 'alta', repeat: 'diariamente', difficulty: 'facil', xp: 10 },
  { title: 'Regar plantas', emoji: '🪴', category: 'casa', estimatedMinutes: 10, priority: 'baixa', repeat: 'diariamente', difficulty: 'facil', xp: 10 },
  { title: 'Passear com cachorro', emoji: '🐶', category: 'saude', estimatedMinutes: 30, priority: 'media', repeat: 'diariamente', difficulty: 'facil', xp: 25 },
  { title: 'Mercado', emoji: '🛒', category: 'mercado', estimatedMinutes: 90, priority: 'media', repeat: 'semanalmente', difficulty: 'dificil', xp: 60 },
];

/** Conquistas / medalhas do casal (baseadas na sequência). */
export const ACHIEVEMENTS: Achievement[] = [
  { id: 'first_week', title: 'Primeira semana', description: 'Complete 7 dias de sequência', emoji: '🥇', target: 7, tint: '#F59E0B' },
  { id: 'productive', title: 'Produtivos', description: 'Complete 10 dias de sequência', emoji: '💜', target: 10, tint: '#A78BFA' },
  { id: 'unstoppable', title: 'Imparáveis', description: 'Complete 14 dias de sequência', emoji: '⭐', target: 14, tint: '#FBBF24' },
  { id: 'house_masters', title: 'Mestres da casa', description: 'Complete 30 dias de sequência', emoji: '🛡️', target: 30, tint: '#3B82F6' },
  { id: 'legend', title: 'Lenda', description: 'Complete 100 dias de sequência', emoji: '🏆', target: 100, tint: '#F97316' },
];

/** Desafios automáticos do casal. */
export const CHALLENGES: Challenge[] = [
  { id: 'tasks_20', title: '20 tarefas', description: 'Complete 20 tarefas', emoji: '✅', kind: 'tasks_total', target: 20, rewardXp: 100, rewardCoins: 50, tint: '#34D399' },
  { id: 'laundry_10', title: 'Rei/Rainha da roupa', description: 'Lave roupa 10 vezes', emoji: '🧺', kind: 'task_title', taskTitle: 'Lavar roupa', target: 10, rewardXp: 120, rewardCoins: 60, tint: '#3B82F6' },
  { id: 'streak_7', title: '7 dias seguidos', description: 'Mantenha 7 dias consecutivos', emoji: '🔥', kind: 'streak', target: 7, rewardXp: 150, rewardCoins: 80, tint: '#F97316' },
  { id: 'streak_30', title: '30 dias seguidos', description: 'Mantenha 30 dias consecutivos', emoji: '🌟', kind: 'streak', target: 30, rewardXp: 500, rewardCoins: 250, tint: '#FBBF24' },
  { id: 'tasks_100', title: '100 tarefas', description: 'Complete 100 tarefas', emoji: '💯', kind: 'tasks_total', target: 100, rewardXp: 400, rewardCoins: 200, tint: '#A78BFA' },
  { id: 'tasks_500', title: '500 tarefas', description: 'Complete 500 tarefas', emoji: '🚀', kind: 'tasks_total', target: 500, rewardXp: 1500, rewardCoins: 800, tint: '#7E57FF' },
];

export interface RewardTemplate {
  name: string;
  emoji: string;
  cost: number;
  category: RewardCategory;
  description: string;
}

/** Recompensas sugeridas — o casal pode criar quantas quiser. */
export const DEFAULT_REWARDS: RewardTemplate[] = [
  { name: 'Escolher o jantar', emoji: '🍕', cost: 80, category: 'comida', description: 'Hoje quem decide o menu é você.' },
  { name: 'Escolher o filme', emoji: '🎬', cost: 60, category: 'lazer', description: 'Sessão de cinema com o seu filme favorito.' },
  { name: '2 horas para jogar', emoji: '🎮', cost: 120, category: 'lazer', description: 'Tempo livre garantido, sem culpa.' },
  { name: 'Hambúrguer', emoji: '🍔', cost: 100, category: 'comida', description: 'Aquele hambúrguer que você merece.' },
  { name: 'Sushi', emoji: '🍣', cost: 150, category: 'comida', description: 'Rodízio ou delivery, você escolhe.' },
  { name: 'Sobremesa favorita', emoji: '🍰', cost: 70, category: 'comida', description: 'Doce preferido sem dividir com ninguém.' },
  { name: 'Massagem', emoji: '💆', cost: 130, category: 'descanso', description: '30 minutos de massagem relaxante.' },
  { name: 'Café especial', emoji: '☕', cost: 40, category: 'comida', description: 'Café da manhã preparado pelo par.' },
  { name: 'Passeio', emoji: '🚗', cost: 180, category: 'lazer', description: 'Um passeio surpresa no fim de semana.' },
  { name: 'Noite romântica', emoji: '❤️', cost: 200, category: 'romance', description: 'Noite especial planejada a dois.' },
  { name: 'Comprar algo até 20€', emoji: '🎁', cost: 250, category: 'presente', description: 'Um mimo de até 20€ pago pelo par.' },
  { name: 'Dormir até mais tarde', emoji: '💤', cost: 90, category: 'descanso', description: 'Sem despertador — o par assume a manhã.' },
];
