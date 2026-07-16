import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { Couple, UserProfile } from '@/domain/entities';
import { newId, newInviteCode } from '@/utils/id';
import { firebaseAuth, isFirebaseConfigured } from '@/services/firebase';

export type AuthStatus = 'loading' | 'signedOut' | 'signedIn';

interface AuthState {
  status: AuthStatus;
  user: UserProfile | null;
  partner: UserProfile | null;
  couple: Couple | null;
  hydrated: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (name: string, email: string, password: string) => Promise<void>;
  signInWithProvider: (provider: 'google' | 'apple') => Promise<void>;
  joinCouple: (code: string) => Promise<void>;
  addRewards: (xp: number, coins: number) => void;
  spendCoins: (amount: number) => boolean;
  registerStreakDay: (dateKey: string) => void;
  signOut: () => void;
  deleteAccount: () => void;
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

async function firebaseSignIn(email: string, password: string): Promise<void> {
  const { signInWithEmailAndPassword } = await import('firebase/auth');
  await signInWithEmailAndPassword(firebaseAuth()!, email, password);
}

async function firebaseSignUp(name: string, email: string, password: string): Promise<void> {
  const { createUserWithEmailAndPassword, updateProfile } = await import('firebase/auth');
  const cred = await createUserWithEmailAndPassword(firebaseAuth()!, email, password);
  await updateProfile(cred.user, { displayName: name });
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
          await firebaseSignIn(email, password);
        }
        const name = email.split('@')[0];
        const displayName = name.charAt(0).toUpperCase() + name.slice(1);
        const user = demoUser(displayName, email);
        const partner = demoPartner();
        set({ user, partner, couple: demoCouple([user.id, partner.id]), status: 'signedIn' });
      },

      signUp: async (name, email, password) => {
        if (isFirebaseConfigured()) {
          await firebaseSignUp(name, email, password);
        }
        const user: UserProfile = { id: newId('user'), name, email, xp: 0, coins: 0, streakDays: 0, bestStreak: 0 };
        set({
          user,
          partner: null,
          couple: {
            id: newId('couple'),
            inviteCode: newInviteCode(),
            memberIds: [user.id],
            score: 0,
            goal: { title: 'Manter 14 dias de sequência', targetDays: 14, currentDays: 0 },
            createdAt: Date.now(),
          },
          status: 'signedIn',
        });
      },

      // Login social: exige configuração nativa (Google/Apple). Em modo demo,
      // cria uma conta local para permitir a navegação completa do app.
      signInWithProvider: async (provider) => {
        const user = demoUser('Anderson', `anderson@${provider}.demo`);
        const partner = demoPartner();
        set({ user, partner, couple: demoCouple([user.id, partner.id]), status: 'signedIn' });
      },

      joinCouple: async (code) => {
        const { user, couple } = get();
        if (!user) return;
        const partner = demoPartner();
        set({
          partner,
          couple: {
            ...(couple ?? demoCouple([user.id])),
            inviteCode: code.toUpperCase(),
            memberIds: [user.id, partner.id],
          },
        });
      },

      addRewards: (xp, coins) => {
        const { user, couple } = get();
        if (!user) return;
        set({
          user: { ...user, xp: user.xp + xp, coins: user.coins + coins },
          couple: couple ? { ...couple, score: couple.score + xp } : couple,
        });
      },

      spendCoins: (amount) => {
        const { user } = get();
        if (!user || user.coins < amount) return false;
        set({ user: { ...user, coins: user.coins - amount } });
        return true;
      },

      registerStreakDay: (dateKey) => {
        const { user, couple } = get();
        if (!user || user.lastStreakDate === dateKey) return;
        const streakDays = user.streakDays + 1;
        set({
          user: {
            ...user,
            streakDays,
            bestStreak: Math.max(user.bestStreak, streakDays),
            lastStreakDate: dateKey,
          },
          couple: couple
            ? { ...couple, goal: { ...couple.goal, currentDays: Math.min(couple.goal.targetDays, streakDays) } }
            : couple,
        });
      },

      signOut: () => set({ user: null, partner: null, couple: null, status: 'signedOut' }),
      deleteAccount: () => set({ user: null, partner: null, couple: null, status: 'signedOut' }),
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
