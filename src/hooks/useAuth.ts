import { create } from 'zustand';
import { supabase } from '../services/supabase';
import * as authService from '../services/auth';
import type { User } from '../types/user';

interface AuthState {
  user: User | null;
  loading: boolean;
  isAuthenticated: boolean;

  signIn: (email: string, password: string) => Promise<void>;
  signUp: (
    email: string,
    password: string,
    userData: Partial<User>,
  ) => Promise<void>;
  signOut: () => Promise<void>;
  loadUser: () => Promise<void>;
  updateProfile: (
    data: Partial<Pick<User, 'name' | 'phone' | 'avatar_url' | 'is_private'>>,
  ) => Promise<void>;
}

export const useAuth = create<AuthState>((set, get) => ({
  user: null,
  loading: true,
  isAuthenticated: false,

  signIn: async (email: string, password: string) => {
    set({ loading: true });
    try {
      await authService.signIn(email, password);
      const user = await authService.getCurrentUser();
      set({ user, isAuthenticated: !!user, loading: false });
    } catch (error) {
      set({ loading: false });
      throw error;
    }
  },

  signUp: async (
    email: string,
    password: string,
    userData: Partial<User>,
  ) => {
    set({ loading: true });
    try {
      const { user: authUser } = await authService.signUp(email, password);

      if (authUser) {
        const { error } = await supabase.from('users').insert({
          id: authUser.id,
          email,
          ...userData,
        });
        if (error) throw error;

        const user = await authService.getCurrentUser();
        set({ user, isAuthenticated: !!user, loading: false });
      } else {
        set({ loading: false });
      }
    } catch (error) {
      set({ loading: false });
      throw error;
    }
  },

  signOut: async () => {
    set({ loading: true });
    try {
      await authService.signOut();
      set({ user: null, isAuthenticated: false, loading: false });
    } catch (error) {
      set({ loading: false });
      throw error;
    }
  },

  loadUser: async () => {
    set({ loading: true });
    try {
      const user = await authService.getCurrentUser();
      set({ user, isAuthenticated: !!user, loading: false });
    } catch {
      set({ user: null, isAuthenticated: false, loading: false });
    }
  },

  updateProfile: async (
    data: Partial<Pick<User, 'name' | 'phone' | 'avatar_url' | 'is_private'>>,
  ) => {
    try {
      await authService.updateProfile(data);
      const currentUser = get().user;
      if (currentUser) {
        set({ user: { ...currentUser, ...data } });
      }
    } catch (error) {
      throw error;
    }
  },
}));

// Listen for auth state changes on module load
supabase.auth.onAuthStateChange((_event, session) => {
  if (session?.user) {
    useAuth.getState().loadUser();
  } else {
    useAuth.setState({ user: null, isAuthenticated: false, loading: false });
  }
});
