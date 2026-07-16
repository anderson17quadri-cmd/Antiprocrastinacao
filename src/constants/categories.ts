import { TaskCategory, TaskPriority } from '@/domain/entities';

export interface CategoryMeta {
  label: string;
  color: string;
  emoji: string;
}

export const CATEGORIES: Record<TaskCategory, CategoryMeta> = {
  rotina: { label: 'Rotina', color: '#6C63FF', emoji: '⏰' },
  casa: { label: 'Casa', color: '#F59E0B', emoji: '🧺' },
  trabalho: { label: 'Trabalho', color: '#3B82F6', emoji: '💼' },
  refeicao: { label: 'Refeição', color: '#F97316', emoji: '🍽️' },
  saude: { label: 'Saúde', color: '#34D399', emoji: '💪' },
  casal: { label: 'Casal', color: '#F472B6', emoji: '❤️' },
  mercado: { label: 'Mercado', color: '#22D3EE', emoji: '🛒' },
  pessoal: { label: 'Pessoal', color: '#A78BFA', emoji: '✨' },
};

export const CATEGORY_KEYS = Object.keys(CATEGORIES) as TaskCategory[];

export const PRIORITIES: Record<TaskPriority, { label: string; color: string }> = {
  baixa: { label: 'Baixa', color: '#34D399' },
  media: { label: 'Média', color: '#FBBF24' },
  alta: { label: 'Alta', color: '#F87171' },
};
