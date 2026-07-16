/**
 * Sincronização em tempo real com o Cloud Firestore.
 *
 * Arquitetura offline-first:
 *  - O estado local (Zustand + AsyncStorage) é a fonte de verdade imediata;
 *  - Cada mutação é espelhada no Firestore quando há configuração/conexão;
 *  - Mutações offline entram numa fila persistida e são reenviadas
 *    automaticamente quando a conexão volta;
 *  - `subscribeToCouple` escuta snapshots do casal e aplica as mudanças
 *    do parceiro no estado local em tempo real.
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ActivityEvent, Task } from '@/domain/entities';
import { firestore, isFirebaseConfigured } from './firebase';

const QUEUE_KEY = 'foco-a-dois/sync-queue';

interface QueuedOp {
  kind: 'task' | 'activity';
  payload: Task | ActivityEvent;
}

let coupleId: string | null = null;
let unsubscribe: (() => void) | null = null;

export function setSyncCouple(id: string | null): void {
  coupleId = id;
}

async function enqueue(op: QueuedOp): Promise<void> {
  const raw = await AsyncStorage.getItem(QUEUE_KEY);
  const queue: QueuedOp[] = raw ? JSON.parse(raw) : [];
  queue.push(op);
  await AsyncStorage.setItem(QUEUE_KEY, JSON.stringify(queue.slice(-500)));
}

async function writeOp(op: QueuedOp): Promise<void> {
  const db = firestore();
  if (!db || !coupleId) throw new Error('sync unavailable');
  const { doc, setDoc } = await import('firebase/firestore');
  const collection = op.kind === 'task' ? 'tasks' : 'activity';
  await setDoc(doc(db, 'couples', coupleId, collection, op.payload.id), op.payload, { merge: true });
}

async function push(op: QueuedOp): Promise<void> {
  if (!isFirebaseConfigured() || !coupleId) return;
  try {
    await writeOp(op);
  } catch {
    await enqueue(op);
  }
}

export function pushTask(task: Task): void {
  void push({ kind: 'task', payload: task });
}

export function pushActivity(event: ActivityEvent): void {
  void push({ kind: 'activity', payload: event });
}

/** Reenvia a fila offline; chamar quando a conectividade voltar. */
export async function flushQueue(): Promise<void> {
  if (!isFirebaseConfigured() || !coupleId) return;
  const raw = await AsyncStorage.getItem(QUEUE_KEY);
  if (!raw) return;
  const queue: QueuedOp[] = JSON.parse(raw);
  const failed: QueuedOp[] = [];
  for (const op of queue) {
    try {
      await writeOp(op);
    } catch {
      failed.push(op);
    }
  }
  await AsyncStorage.setItem(QUEUE_KEY, JSON.stringify(failed));
}

/** Escuta as tarefas do casal em tempo real e aplica no estado local. */
export async function subscribeToCouple(
  id: string,
  onTasks: (tasks: Task[]) => void,
): Promise<() => void> {
  setSyncCouple(id);
  if (!isFirebaseConfigured()) return () => {};
  const db = firestore();
  if (!db) return () => {};
  const { collection, onSnapshot } = await import('firebase/firestore');
  unsubscribe?.();
  unsubscribe = onSnapshot(collection(db, 'couples', id, 'tasks'), (snap) => {
    onTasks(snap.docs.map((d) => d.data() as Task));
  });
  void flushQueue();
  return unsubscribe;
}
