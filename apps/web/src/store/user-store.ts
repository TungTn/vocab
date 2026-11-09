import { create } from "zustand";
import { LeagueTier } from "@linguaflow/shared-types";

interface UserState {
  userId: string;
  username: string;
  email: string;
  hearts: number;
  gems: number;
  streak: number;
  xp: number;
  league: LeagueTier;
  soundEnabled: boolean;

  // Actions
  setProfile: (data: Partial<UserState>) => void;
  decrementHeart: () => void;
  refillHearts: () => void;
  addXp: (amount: number) => void;
  addGems: (amount: number) => void;
  deductGems: (amount: number) => boolean;
  toggleSound: () => void;
}

export const useUserStore = create<UserState>((set, get) => ({
  userId: "user-default-1",
  username: "Learner",
  email: "learner@linguaflow.com",
  hearts: 5,
  gems: 150,
  streak: 5,
  xp: 320,
  league: LeagueTier.BRONZE,
  soundEnabled: true,

  setProfile: (data) => set((state) => ({ ...state, ...data })),

  decrementHeart: () =>
    set((state) => ({
      hearts: Math.max(0, state.hearts - 1)
    })),

  refillHearts: () => set({ hearts: 5 }),

  addXp: (amount) => set((state) => ({ xp: state.xp + amount })),

  addGems: (amount) => set((state) => ({ gems: state.gems + amount })),

  deductGems: (amount) => {
    const current = get().gems;
    if (current >= amount) {
      set({ gems: current - amount });
      return true;
    }
    return false;
  },

  toggleSound: () => set((state) => ({ soundEnabled: !state.soundEnabled }))
}));
