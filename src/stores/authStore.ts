import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { Couple, UserProfile } from '@/domain/entities';
import { newId, newInviteCode } from '@/utils/id';
import { firebaseAuth, isFirebaseConfigured } from '@/services/firebase';
import {
  addMemberToCouple,
  createCoupleDoc,
  fetchCoupleDoc,
  fetchUserProfile,
  findCoupleByInviteCode,
  saveUserProfile,
  setSyncCouple,
} from '@/services/sync';

export type AuthStatus = 'loading' | 'signedOut' | 'signedIn';

/** Documento remoto do usuário: o perfil de domínio + o casal ao qual pertence. */
type RemoteUser = UserProfile & { coupleId?: string };

interface AuthState {
  status: AuthStatus;
  user: UserProfile | null;
  partner: UserProfile | null;
  couple: Couple | null;
  hydrated: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (name: string, email: string, password: string) => Promise<void>;
  signInWithProvider: (provider: 'google' | 'apple') => Promise<void>;
  /** Troca um id_token do Google (via expo-auth-session) por uma sessão real do Firebase. */
  signInWithGoogleIdToken: (idToken: string) => Promise<void>;
  joinCouple: (code: string) => Promise<void>;
  addRewards: (xp: number, coins: number) => void;
  spendCoins: (amount: number) => boolean;
  registerStreakDay: (dateKey: string) => void;
  /** Recarrega perfil, casal e parceiro do Firestore (chamar ao abrir o app). */
  refreshFromFirebase: () => Promise<void>;
  signOut: () => Promise<void>;
  deleteAccount: () => Promise<void>;
}

function demoUser(name: string, email: string): UserProfile {
  return { id: newId('user'), name, email, xp: 550, coins: 180, streakDays: 12, bestStreak: 28 };
}

function demoPartner(): UserProfile {
  return { id: newId('user'), name: 'Juliana', email: 'juliana@focoadois.app', xp: 500, coins: 150, streakDays: 12, bestStreak: 28 };
}

function demoCouple(memberIds: string[]): Couple {
  return {
    id: newId('couple'),
    inviteCode: newInviteCode(),
    memberIds,
    score: 1250,
    goal: { title: 'Manter 14 dias de sequência', targetDays: 14, currentDays: 12 },
    createdAt: Date.now(),
  };
}

function defaultCouple(memberIds: string[]): Couple {
  return {
    id: newId('couple'),
    inviteCode: newInviteCode(),
    memberIds,
    score: 0,
    goal: { title: 'Manter 14 dias de sequência', targetDays: 14, currentDays: 0 },
    createdAt: Date.now(),
  };
}

/** Cria a conta no Firebase e o par (usuário + casal) no Firestore. */
async function createFirebaseAccount(name: string, email: string, password: string) {
  const { createUserWithEmailAndPassword, updateProfile } = await import('firebase/auth');
  const cred = await createUserWithEmailAndPassword(firebaseAuth()!, email, password);
  await updateProfile(cred.user, { displayName: name });

  const user: UserProfile = { id: cred.user.uid, name, email, xp: 0, coins: 0, streakDays: 0, bestStreak: 0 };
  const couple = defaultCouple([user.id]);
  try {
    await Promise.all([saveUserProfile({ ...user, coupleId: couple.id }), createCoupleDoc(couple)]);
  } catch {
    // Firestore indisponível (rede/regras): a conta de Auth já existe;
    // segue localmente e o refreshFromFirebase reconcilia depois.
  }
  return { user, couple };
}

/** Carrega perfil + casal + parceiro de um usuário já autenticado. */
async function loadFirebaseSession(
  uid: string,
  fallbackName: string,
  email: string,
): Promise<{ user: UserProfile; couple: Couple | null; partner: UserProfile | null }> {
  try {
    const profile = (await fetchUserProfile(uid)) as RemoteUser | null;

    if (!profile) {
      // Conta existe no Auth mas sem documento no Firestore (ex.: criada
      // antes da integração). Cria um perfil + casal padrão agora.
      const user: UserProfile = { id: uid, name: fallbackName, email, xp: 0, coins: 0, streakDays: 0, bestStreak: 0 };
      const couple = defaultCouple([uid]);
      try {
        await Promise.all([saveUserProfile({ ...user, coupleId: couple.id }), createCoupleDoc(couple)]);
      } catch {
        // Sem acesso ao Firestore agora: segue local; reconcilia depois.
      }
      return { user, couple, partner: null };
    }

    const { coupleId, ...user } = profile;
    let couple: Couple | null = null;
    let partner: UserProfile | null = null;

    if (coupleId) {
      couple = await fetchCoupleDoc(coupleId);
      const partnerId = couple?.memberIds.find((id) => id !== uid);
      if (partnerId) partner = await fetchUserProfile(partnerId);
    }

    return { user, couple, partner };
  } catch {
    // Firestore inacessível: entra localmente com o essencial — o app
    // nunca pode bloquear o login por causa de sincronização.
    const user: UserProfile = { id: uid, name: fallbackName, email, xp: 0, coins: 0, streakDays: 0, bestStreak: 0 };
    return { user, couple: defaultCouple([uid]), partner: null };
  }
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      status: 'loading',
      user: null,
      partner: null,
      couple: null,
      hydrated: false,

      signIn: async (email, password) => {
        if (isFirebaseConfigured()) {
          const { signInWithEmailAndPassword } = await import('firebase/auth');
          const cred = await signInWithEmailAndPassword(firebaseAuth()!, email, password);
          const fallbackName = email.split('@')[0];
          const session = await loadFirebaseSession(cred.user.uid, fallbackName, email);
          setSyncCouple(session.couple?.id ?? null);
          set({ ...session, status: 'signedIn' });
          return;
        }
        const name = email.split('@')[0];
        const displayName = name.charAt(0).toUpperCase() + name.slice(1);
        const user = demoUser(displayName, email);
        const partner = demoPartner();
        set({ user, partner, couple: demoCouple([user.id, partner.id]), status: 'signedIn' });
      },

      signUp: async (name, email, password) => {
        if (isFirebaseConfigured()) {
          const { user, couple } = await createFirebaseAccount(name, email, password);
          setSyncCouple(couple.id);
          set({ user, partner: null, couple, status: 'signedIn' });
          return;
        }
        const user: UserProfile = { id: newId('user'), name, email, xp: 0, coins: 0, streakDays: 0, bestStreak: 0 };
        set({ user, partner: null, couple: defaultCouple([user.id]), status: 'signedIn' });
      },

      // Login social: exige configuração nativa (Google/Apple). Em modo demo,
      // cria uma conta local para permitir a navegação completa do app.
      signInWithProvider: async (provider) => {
        const user = demoUser('Anderson', `anderson@${provider}.demo`);
        const partner = demoPartner();
        set({ user, partner, couple: demoCouple([user.id, partner.id]), status: 'signedIn' });
      },

      signInWithGoogleIdToken: async (idToken) => {
        if (!isFirebaseConfigured()) {
          const user = demoUser('Anderson', 'anderson@google.demo');
          const partner = demoPartner();
          set({ user, partner, couple: demoCouple([user.id, partner.id]), status: 'signedIn' });
          return;
        }
        const { GoogleAuthProvider, signInWithCredential } = await import('firebase/auth');
        const credential = GoogleAuthProvider.credential(idToken);
        const cred = await signInWithCredential(firebaseAuth()!, credential);
        const fallbackName = cred.user.displayName ?? cred.user.email?.split('@')[0] ?? 'Usuário';
        const session = await loadFirebaseSession(cred.user.uid, fallbackName, cred.user.email ?? '');
        setSyncCouple(session.couple?.id ?? null);
        set({ ...session, status: 'signedIn' });
      },

      joinCouple: async (code) => {
        const { user } = get();
        if (!user) return;
        const trimmed = code.trim().toUpperCase();

        if (isFirebaseConfigured()) {
          const found = await findCoupleByInviteCode(trimmed);
          if (!found) throw new Error('Código não encontrado. Confira e tente novamente.');
          if (found.memberIds.length >= 2 && !found.memberIds.includes(user.id)) {
            throw new Error('Este casal já está completo.');
          }
          const updated = await addMemberToCouple(found.id, user.id);
          await saveUserProfile({ ...user, coupleId: updated.id });
          setSyncCouple(updated.id);
          const partnerId = updated.memberIds.find((id) => id !== user.id);
          const partner = partnerId ? await fetchUserProfile(partnerId) : null;
          set({ partner, couple: updated });
          return;
        }

        const { couple } = get();
        const partner = demoPartner();
        set({
          partner,
          couple: { ...(couple ?? demoCouple([user.id])), inviteCode: trimmed, memberIds: [user.id, partner.id] },
        });
      },

      addRewards: (xp, coins) => {
        const { user, couple } = get();
        if (!user) return;
        const updatedUser = { ...user, xp: user.xp + xp, coins: user.coins + coins };
        const updatedCouple = couple ? { ...couple, score: couple.score + xp } : couple;
        set({ user: updatedUser, couple: updatedCouple });
        if (isFirebaseConfigured()) void saveUserProfile(updatedUser);
      },

      spendCoins: (amount) => {
        const { user } = get();
        if (!user || user.coins < amount) return false;
        const updatedUser = { ...user, coins: user.coins - amount };
        set({ user: updatedUser });
        if (isFirebaseConfigured()) void saveUserProfile(updatedUser);
        return true;
      },

      registerStreakDay: (dateKey) => {
        const { user, couple } = get();
        if (!user || user.lastStreakDate === dateKey) return;
        const streakDays = user.streakDays + 1;
        const updatedUser = {
          ...user,
          streakDays,
          bestStreak: Math.max(user.bestStreak, streakDays),
          lastStreakDate: dateKey,
        };
        const updatedCouple = couple
          ? { ...couple, goal: { ...couple.goal, currentDays: Math.min(couple.goal.targetDays, streakDays) } }
          : couple;
        set({ user: updatedUser, couple: updatedCouple });
        if (isFirebaseConfigured()) void saveUserProfile(updatedUser);
      },

      refreshFromFirebase: async () => {
        const { user } = get();
        if (!user || !isFirebaseConfigured()) return;
        try {
          const session = await loadFirebaseSession(user.id, user.name, user.email);
          setSyncCouple(session.couple?.id ?? null);
          set(session);
        } catch {
          // Sem conexão: mantém os dados locais já persistidos.
        }
      },

      signOut: async () => {
        if (isFirebaseConfigured()) {
          try {
            const { signOut } = await import('firebase/auth');
            await signOut(firebaseAuth()!);
          } catch {
            // Ignora falha de rede; a sessão local é limpa de qualquer forma.
          }
        }
        setSyncCouple(null);
        set({ user: null, partner: null, couple: null, status: 'signedOut' });
      },

      deleteAccount: async () => {
        if (isFirebaseConfigured()) {
          try {
            await firebaseAuth()?.currentUser?.delete();
          } catch {
            // Exclusão remota pode exigir login recente; a conta local é limpa mesmo assim.
          }
        }
        setSyncCouple(null);
        set({ user: null, partner: null, couple: null, status: 'signedOut' });
      },
    }),
    {
      name: 'foco-a-dois/auth',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (s) => ({ user: s.user, partner: s.partner, couple: s.couple }),
      onRehydrateStorage: () => (state) => {
        useAuthStore.setState({
          hydrated: true,
          status: state?.user ? 'signedIn' : 'signedOut',
        });
      },
    },
  ),
);
