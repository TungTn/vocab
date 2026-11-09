import { create } from "zustand";
import { LeagueTier } from "@linguaflow/shared-types";

interface UserState {
  userId: string;
  username: string;
  email: string;
  avatarUrl?: string | null;
  role: string;
  hearts: number;
  gems: number;
  streak: number;
  xp: number;
  league: LeagueTier;
  soundEnabled: boolean;
  isAuthenticated: boolean;

  // Modal UI states
  authModalOpen: boolean;
  authModalTab: "login" | "register";
  profileModalOpen: boolean;

  // Actions
  setProfile: (data: Partial<UserState>) => void;
  openAuthModal: (tab?: "login" | "register") => void;
  closeAuthModal: () => void;
  openProfileModal: () => void;
  closeProfileModal: () => void;
  loginUser: (userData: any, token: string) => void;
  logoutUser: () => void;
  decrementHeart: () => void;
  refillHearts: () => void;
  addXp: (amount: number) => void;
  addGems: (amount: number) => void;
  deductGems: (amount: number) => boolean;
  toggleSound: () => void;
}

export const useUserStore = create<UserState>((set, get) => ({
  userId: "user-default-1",
  username: "Guest Learner",
  email: "guest@linguaflow.com",
  avatarUrl: null,
  role: "USER",
  hearts: 5,
  gems: 100,
  streak: 0,
  xp: 0,
  league: LeagueTier.BRONZE,
  soundEnabled: true,
  isAuthenticated: false,

  authModalOpen: false,
  authModalTab: "login",
  profileModalOpen: false,

  openAuthModal: (tab = "login") => set({ authModalOpen: true, authModalTab: tab }),
  closeAuthModal: () => set({ authModalOpen: false }),
  openProfileModal: () => set({ profileModalOpen: true }),
  closeProfileModal: () => set({ profileModalOpen: false }),

  loginUser: (userData: any, token: string) => {
    if (typeof window !== "undefined") {
      localStorage.setItem("lf_access_token", token);
    }
    set({
      isAuthenticated: true,
      authModalOpen: false,
      userId: userData.id || userData.userId || get().userId,
      username: userData.username || userData.profile?.displayName || "Learner",
      email: userData.email || get().email,
      avatarUrl: userData.avatarUrl || null,
      role: userData.role || "USER",
      hearts: userData.hearts !== undefined ? userData.hearts : get().hearts,
      gems: userData.gems !== undefined ? userData.gems : get().gems,
      streak: userData.streak !== undefined ? userData.streak : get().streak,
      xp: userData.xp !== undefined ? userData.xp : get().xp,
      league: userData.league || LeagueTier.BRONZE
    });
  },

  logoutUser: () => {
    if (typeof window !== "undefined") {
      localStorage.removeItem("lf_access_token");
    }
    set({
      isAuthenticated: false,
      profileModalOpen: false,
      userId: "user-default-1",
      username: "Guest Learner",
      email: "guest@linguaflow.com",
      avatarUrl: null,
      role: "USER",
      hearts: 5,
      gems: 100,
      streak: 0,
      xp: 0,
      league: LeagueTier.BRONZE
    });
  },

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
