import { TaskCategory, TaskPriority, TaskType } from '@/domain/entities';

export interface CategoryMeta {
  label: string;
  color: string;
  emoji: string;
}

export const CATEGORIES: Record<TaskCategory, CategoryMeta> = {
  rotina: { label: 'Rotina', color: '#6C63FF', emoji: '⏰' },
  casa: { label: 'Casa', color: '#F59E0B', emoji: '🏠' },
  casal: { label: 'Casal', color: '#F472B6', emoji: '❤️' },
  pessoal: { label: 'Pessoais', color: '#A78BFA', emoji: '👤' },
  saude: { label: 'Saúde', color: '#34D399', emoji: '💪' },
  cozinha: { label: 'Cozinha', color: '#F97316', emoji: '🍳' },
  lavandaria: { label: 'Lavandaria', color: '#38BDF8', emoji: '🧺' },
  trabalho: { label: 'Trabalho', color: '#3B82F6', emoji: '💼' },
  estudos: { label: 'Estudos', color: '#8B5CF6', emoji: '📚' },
  financas: { label: 'Finanças', color: '#10B981', emoji: '💰' },
  carro: { label: 'Carro', color: '#64748B', emoji: '🚗' },
  pets: { label: 'Pets', color: '#FB923C', emoji: '🐶' },
  jardim: { label: 'Jardim', color: '#22C55E', emoji: '🌱' },
  compras: { label: 'Compras', color: '#22D3EE', emoji: '🛒' },
  produtividade: { label: 'Produtividade', color: '#EAB308', emoji: '🎯' },
};

export const CATEGORY_KEYS = Object.keys(CATEGORIES) as TaskCategory[];

export const PRIORITIES: Record<TaskPriority, { label: string; color: string }> = {
  baixa: { label: 'Baixa', color: '#34D399' },
  media: { label: 'Média', color: '#FBBF24' },
  alta: { label: 'Alta', color: '#F87171' },
};

export const TASK_TYPES: Record<TaskType, { label: string; emoji: string; description: string }> = {
  individual: {
    label: 'Individual',
    emoji: '👤',
    description: 'Cada um conclui a sua parte — a do par continua pendente.',
  },
  compartilhada: {
    label: 'Compartilhada',
    emoji: '❤️',
    description: 'Feita a dois: quando um conclui, vale para ambos.',
  },
  casa: {
    label: 'Casa',
    emoji: '🏠',
    description: 'Doméstica, com responsável: um de vocês ou ambos.',
  },
};

/** Cores disponíveis para personalizar o card da tarefa. */
export const TASK_COLORS = [
  '#6C63FF',
  '#7E57FF',
  '#A78BFA',
  '#F472B6',
  '#F97316',
  '#F59E0B',
  '#34D399',
  '#22D3EE',
  '#3B82F6',
  '#EF4444',
];
