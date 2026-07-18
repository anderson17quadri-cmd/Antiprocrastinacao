import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { Redemption, Reward, RewardCategory, UserProfile } from '@/domain/entities';
import { DEFAULT_REWARDS } from '@/constants/seed';
import { newId } from '@/utils/id';
import { notifyPartner } from '@/services/notifications';
import { playSound } from '@/services/sound';
import { pushRedemption, pushReward, removeRewardRemote } from '@/services/sync';
import { useAuthStore } from './authStore';

export interface NewRewardInput {
  name: string;
  description?: string;
  emoji: string;
  cost: number;
  category: RewardCategory;
  photoUrl?: string;
}

interface RewardsState {
  rewards: Record<string, Reward>;
  redemptions: Redemption[];
  seeded: boolean;
  /** Popula a loja com as recompensas sugeridas na primeira abertura. */
  ensureSeeded: () => void;
  addReward: (input: NewRewardInput) => void;
  removeReward: (id: string) => void;
  /** Resgata uma recompensa; falha se as moedas forem insuficientes. */
  redeem: (rewardId: string, user: UserProfile) => 'ok' | 'insufficient';
  markUsed: (redemptionId: string) => void;
  /** Loja recebida do Firestore (itens criados pelo par aparecem aqui). */
  applyRemoteRewards: (remote: Reward[]) => void;
  /** Resgates recebidos do Firestore. */
  applyRemoteRedemptions: (remote: Redemption[]) => void;
}

export const useRewardsStore = create<RewardsState>()(
  persist(
    (set, get) => ({
      rewards: {},
      redemptions: [],
      seeded: false,

      ensureSeeded: () => {
        if (get().seeded) return;
        const userId = useAuthStore.getState().user?.id ?? 'system';
        const rewards: Record<string, Reward> = {};
        DEFAULT_REWARDS.forEach((tpl, index) => {
          const reward: Reward = {
            // Id determinístico: os dois aparelhos semeiam a MESMA loja —
            // a sincronização funde em vez de duplicar as sugestões.
            id: `reward_seed_${index}`,
            name: tpl.name,
            description: tpl.description,
            emoji: tpl.emoji,
            cost: tpl.cost,
            category: tpl.category,
            createdBy: userId,
            createdAt: Date.now(),
          };
          rewards[reward.id] = reward;
        });
        set({ rewards, seeded: true });
      },

      addReward: (input) => {
        const userId = useAuthStore.getState().user?.id ?? 'system';
        const reward: Reward = {
          id: newId('reward'),
          createdBy: userId,
          createdAt: Date.now(),
          updatedAt: Date.now(),
          ...input,
        };
        set((s) => ({ rewards: { ...s.rewards, [reward.id]: reward } }));
        pushReward(reward);
      },

      removeReward: (id) => {
        const reward = get().rewards[id];
        set((s) => {
          const rewards = { ...s.rewards };
          delete rewards[id];
          return { rewards };
        });
        if (reward) removeRewardRemote(reward);
      },

      redeem: (rewardId, user) => {
        const reward = get().rewards[rewardId];
        if (!reward) return 'insufficient';
        const paid = useAuthStore.getState().spendCoins(reward.cost);
        if (!paid) return 'insufficient';

        const redemption: Redemption = {
          id: newId('redeem'),
          rewardId: reward.id,
          rewardName: reward.name,
          rewardEmoji: reward.emoji,
          cost: reward.cost,
          userId: user.id,
          userName: user.name,
          at: Date.now(),
          used: false,
          updatedAt: Date.now(),
        };
        set((s) => ({ redemptions: [redemption, ...s.redemptions].slice(0, 200) }));
        pushRedemption(redemption);
        playSound('fanfare');
        notifyPartner(`${user.name} resgatou a recompensa ${reward.emoji} ${reward.name}!`);
        return 'ok';
      },

      markUsed: (redemptionId) => {
        set((s) => ({
          redemptions: s.redemptions.map((r) => {
            if (r.id !== redemptionId) return r;
            const updated = { ...r, used: true, updatedAt: Date.now() };
            pushRedemption(updated);
            return updated;
          }),
        }));
      },

      applyRemoteRewards: (remote) => {
        set((s) => {
          const rewards = { ...s.rewards };
          const existingNames = new Set(
            Object.values(rewards).map((r) => `${r.name.toLowerCase()}|${r.cost}`),
          );
          for (const reward of remote) {
            const local = rewards[reward.id];
            if (local) {
              if ((reward.updatedAt ?? reward.createdAt) > (local.updatedAt ?? local.createdAt)) {
                rewards[reward.id] = reward;
              }
              continue;
            }
            // Dedupe de lojas semeadas antes desta versão (ids aleatórios):
            // ignora item novo idêntico a um que já existe localmente.
            if (existingNames.has(`${reward.name.toLowerCase()}|${reward.cost}`)) continue;
            rewards[reward.id] = reward;
          }
          return { rewards };
        });
      },

      applyRemoteRedemptions: (remote) => {
        const myId = useAuthStore.getState().user?.id;
        const recentCutoff = Date.now() - 3 * 60 * 1000;
        set((s) => {
          const byId = new Map(s.redemptions.map((r) => [r.id, r]));
          for (const redemption of remote) {
            const local = byId.get(redemption.id);
            const isNewFromPartner =
              !local && myId && redemption.userId !== myId && redemption.at >= recentCutoff;
            if (!local || (redemption.updatedAt ?? redemption.at) > (local.updatedAt ?? local.at)) {
              byId.set(redemption.id, redemption);
            }
            if (isNewFromPartner) {
              notifyPartner(`${redemption.rewardEmoji} ${redemption.userName} resgatou ${redemption.rewardName}!`);
            }
          }
          return {
            redemptions: [...byId.values()].sort((a, b) => b.at - a.at).slice(0, 200),
          };
        });
      },
    }),
    {
      name: 'foco-a-dois/rewards',
      storage: createJSONStorage(() => AsyncStorage),
    },
  ),
);
