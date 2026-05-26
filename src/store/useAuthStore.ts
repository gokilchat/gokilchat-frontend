import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { User } from '@/types/chat';

interface AuthState {
  user: User | null;
  token: string | null;
  setAuth: (user: User, token: string) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      setAuth: (user, token) => set({ user, token }),
      logout: () => {
        localStorage.removeItem('supabase_jwt');
        document.cookie = 'supabase_jwt=; path=/; max-age=0; SameSite=Lax; Secure';
        set({ user: null, token: null });
      },
    }),
    {
      name: 'gokilchat-auth',
    }
  )
);
