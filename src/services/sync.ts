/**
 * Sincronização em tempo real com o Cloud Firestore.
 *
 * Arquitetura offline-first:
 *  - O estado local (Zustand + AsyncStorage) é a fonte de verdade imediata;
 *  - Cada mutação é espelhada no Firestore quando há configuração/conexão;
 *  - Mutações offline entram numa fila persistida e são reenviadas
 *    automaticamente quando a conexão volta;
 *  - `subscribeToCouple` escuta as tarefas do casal e `subscribeToUser`
 *    escuta o perfil do parceiro (XP, moedas, sequência) em tempo real.
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ActivityEvent, Couple, Task, UserProfile } from '@/domain/entities';
import { firestore, isFirebaseConfigured } from './firebase';

const QUEUE_KEY = 'foco-a-dois/sync-queue';

interface QueuedOp {
  kind: 'task' | 'activity';
  payload: Task | ActivityEvent;
}

let coupleId: string | null = null;
let unsubscribeTasks: (() => void) | null = null;

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
  unsubscribeTasks?.();
  unsubscribeTasks = onSnapshot(collection(db, 'couples', id, 'tasks'), (snap) => {
    onTasks(snap.docs.map((d) => d.data() as Task));
  });
  void flushQueue();
  return unsubscribeTasks;
}

/* ------------------------------------------------------------------ */
/* Perfis de usuário e casal (conta, pareamento)                       */
/* ------------------------------------------------------------------ */

export async function fetchUserProfile(uid: string): Promise<UserProfile | null> {
  const db = firestore();
  if (!db) return null;
  const { doc, getDoc } = await import('firebase/firestore');
  const snap = await getDoc(doc(db, 'users', uid));
  return snap.exists() ? (snap.data() as UserProfile) : null;
}

export async function saveUserProfile(profile: UserProfile & { coupleId?: string }): Promise<void> {
  const db = firestore();
  if (!db) return;
  const { doc, setDoc } = await import('firebase/firestore');
  await setDoc(doc(db, 'users', profile.id), profile, { merge: true });
}

export async function createCoupleDoc(couple: Couple): Promise<void> {
  const db = firestore();
  if (!db) return;
  const { doc, setDoc } = await import('firebase/firestore');
  await setDoc(doc(db, 'couples', couple.id), couple);
}

export async function fetchCoupleDoc(id: string): Promise<Couple | null> {
  const db = firestore();
  if (!db) return null;
  const { doc, getDoc } = await import('firebase/firestore');
  const snap = await getDoc(doc(db, 'couples', id));
  return snap.exists() ? (snap.data() as Couple) : null;
}

/** Busca um casal pelo código de convite (para pareamento). */
export async function findCoupleByInviteCode(code: string): Promise<Couple | null> {
  const db = firestore();
  if (!db) return null;
  const { collection, query, where, getDocs, limit } = await import('firebase/firestore');
  const q = query(collection(db, 'couples'), where('inviteCode', '==', code), limit(1));
  const snap = await getDocs(q);
  return snap.empty ? null : (snap.docs[0].data() as Couple);
}

export async function addMemberToCouple(coupleId: string, userId: string): Promise<Couple> {
  const db = firestore();
  if (!db) throw new Error('Firestore indisponível');
  const { doc, getDoc, updateDoc, arrayUnion } = await import('firebase/firestore');
  const ref = doc(db, 'couples', coupleId);
  const current = await getDoc(ref);
  if (!current.exists()) throw new Error('Casal não encontrado');
  const data = current.data() as Couple;
  if (data.memberIds.length >= 2 && !data.memberIds.includes(userId)) {
    throw new Error('Este casal já está completo');
  }
  await updateDoc(ref, { memberIds: arrayUnion(userId) });
  return { ...data, memberIds: [...new Set([...data.memberIds, userId])] };
}

/** Escuta o perfil de um usuário (usado para ver o parceiro em tempo real). */
export async function subscribeToUser(
  uid: string,
  onUser: (user: UserProfile) => void,
): Promise<() => void> {
  if (!isFirebaseConfigured()) return () => {};
  const db = firestore();
  if (!db) return () => {};
  const { doc, onSnapshot } = await import('firebase/firestore');
  return onSnapshot(doc(db, 'users', uid), (snap) => {
    if (snap.exists()) onUser(snap.data() as UserProfile);
  });
}
