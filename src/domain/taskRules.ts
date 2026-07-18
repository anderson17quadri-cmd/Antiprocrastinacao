import { Task } from './entities';

/**
 * Regras de conclusão por tipo de tarefa.
 *
 * - individual: cada usuário conclui a própria parte (completedBy);
 * - compartilhada: a conclusão de um vale para os dois;
 * - casa: só o responsável pode concluir (undefined = Ambos, qualquer um).
 */

/** A tarefa está concluída na perspectiva deste usuário? */
export function isDoneFor(task: Task, userId: string): boolean {
  if (task.type === 'individual') {
    return task.status === 'done' || (task.completedBy ?? []).includes(userId);
  }
  return task.status === 'done';
}

/**
 * Tarefa individual com assigneeId é da agenda PESSOAL de um membro
 * (ex.: "Trabalho" da Juliana): só o dono conclui. Sem assigneeId,
 * é individual para os dois (cada um conclui a sua parte).
 */
export function canComplete(task: Task, userId: string): boolean {
  if (task.status === 'done' || task.status === 'cancelled') return false;
  if (task.type === 'individual') {
    if (task.assigneeId && task.assigneeId !== userId) return false;
    return !(task.completedBy ?? []).includes(userId);
  }
  if (task.type === 'casa') {
    return task.assigneeId == null || task.assigneeId === userId;
  }
  return true;
}

/** Motivo pelo qual a conclusão está bloqueada (para feedback na UI). */
export function completionBlockReason(task: Task, userId: string, assigneeName?: string): string | null {
  if (task.assigneeId && task.assigneeId !== userId && task.type !== 'compartilhada') {
    return `Esta tarefa é de ${assigneeName ?? 'seu par'} — somente essa pessoa pode concluí-la.`;
  }
  if (task.type === 'individual' && (task.completedBy ?? []).includes(userId)) {
    return 'Você já concluiu a sua parte desta tarefa.';
  }
  return null;
}

/**
 * Registra a conclusão respeitando o tipo. Devolve a tarefa atualizada,
 * ou null quando o usuário não tem permissão para concluir.
 */
export function applyCompletion(
  task: Task,
  userId: string,
  memberIds: string[],
  spentSeconds: number,
  now = Date.now(),
): Task | null {
  if (!canComplete(task, userId)) return null;

  if (task.type === 'individual') {
    const completedBy = [...new Set([...(task.completedBy ?? []), userId])];
    // Pessoal (com dono): basta o dono concluir; individual do casal: os dois.
    const relevant = task.assigneeId ? [task.assigneeId] : memberIds;
    const everyoneDone = relevant.length > 0 && relevant.every((id) => completedBy.includes(id));
    return {
      ...task,
      completedBy,
      status: everyoneDone ? 'done' : task.status === 'in_progress' ? 'pending' : task.status,
      spentSeconds: spentSeconds || task.spentSeconds,
      completedAt: everyoneDone ? now : task.completedAt,
      completedById: everyoneDone ? userId : task.completedById,
      updatedAt: now,
    };
  }

  return {
    ...task,
    status: 'done',
    spentSeconds: spentSeconds || task.spentSeconds,
    completedAt: now,
    completedById: userId,
    updatedAt: now,
  };
}
