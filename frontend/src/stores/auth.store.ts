import { create } from 'zustand';
import type { SafeUser, RegisterInput } from '@/types';
import { loginApi, registerApi, logoutApi, getErrorMessage } from '@/api';
import {
  getAccessToken,
  setAccessToken,
  getStoredUser,
  setStoredUser,
  clearAllAuth,
} from '@/lib/storage';

interface AuthState {
  user: SafeUser | null;
  isAuthenticated: boolean;
  isHydrated: boolean;

  hydrate: () => void;
  login: (username: string, password: string) => Promise<void>;
  register: (input: RegisterInput) => Promise<void>;
  logout: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isAuthenticated: false,
  isHydrated: false,

  hydrate: () => {
    try {
      const accessToken = getAccessToken();
      const user = getStoredUser() as SafeUser | null;
      set({
        user,
        isAuthenticated: !!accessToken && !!user,
        isHydrated: true,
      });
    } catch {
      set({ user: null, isAuthenticated: false, isHydrated: true });
    }
  },

  login: async (username, password) => {
    const { accessToken, user } = await loginApi(username, password);
    setAccessToken(accessToken);
    setStoredUser(user);
    set({ user, isAuthenticated: true });
  },

  register: async (input) => {
    await registerApi(input);
  },

  logout: async () => {
    try {
      await logoutApi();
    } catch {
      // Ignore errors on logout
    }
    clearAllAuth();
    set({ user: null, isAuthenticated: false });
  },
}));

export { getErrorMessage };
