import { create } from 'zustand';
import { storeTokens, clearTokens } from './api';

export type UserRole = 'APPLICANT' | 'EMPLOYER' | 'ADMIN' | 'SUPER_ADMIN' | 'FINANCE';

export interface AuthUser {
  id: string;
  email: string;
  phone: string;
  role: UserRole;
  status: string;
}

interface AuthState {
  user: AuthUser | null;
  isLoading: boolean;
  setAuth: (user: AuthUser, accessToken: string, refreshToken: string) => Promise<void>;
  clearAuth: () => Promise<void>;
  setLoading: (loading: boolean) => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isLoading: true,

  setAuth: async (user, accessToken, refreshToken) => {
    await storeTokens(accessToken, refreshToken);
    set({ user, isLoading: false });
  },

  clearAuth: async () => {
    await clearTokens();
    set({ user: null, isLoading: false });
  },

  setLoading: (loading) => set({ isLoading: loading }),
}));
