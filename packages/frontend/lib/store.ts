import { create } from 'zustand';
import { setAccessToken } from './api';

export type UserRole = 'APPLICANT' | 'EMPLOYER' | 'ADMIN' | 'SUPER_ADMIN' | 'FINANCE';

export interface AuthUser {
  id: string;
  email: string;
  phone: string;
  role: UserRole;
  status: string;
  twoFAEnabled?: boolean;
}

interface AuthState {
  user: AuthUser | null;
  accessToken: string | null;
  isLoading: boolean;

  setAuth: (user: AuthUser, token: string) => void;
  clearAuth: () => void;
  setLoading: (loading: boolean) => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  accessToken: null,
  isLoading: true,

  setAuth: (user, token) => {
    setAccessToken(token);
    set({ user, accessToken: token, isLoading: false });
  },

  clearAuth: () => {
    setAccessToken(null);
    set({ user: null, accessToken: null, isLoading: false });
  },

  setLoading: (loading) => set({ isLoading: loading }),
}));

// ── Notification toast store ──────────────────────────────────────────────
export interface Toast {
  id: string;
  type: 'success' | 'error' | 'info' | 'warning';
  title: string;
  description?: string;
}

interface ToastState {
  toasts: Toast[];
  addToast: (toast: Omit<Toast, 'id'>) => void;
  removeToast: (id: string) => void;
}

export const useToastStore = create<ToastState>((set) => ({
  toasts: [],

  addToast: (toast) => {
    const id = Math.random().toString(36).slice(2);
    set((s) => ({ toasts: [...s.toasts, { ...toast, id }] }));
    // Auto-remove after 5s
    setTimeout(() => {
      set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) }));
    }, 5000);
  },

  removeToast: (id) => set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),
}));
