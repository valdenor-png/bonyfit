import { create } from 'zustand';
import { supabase } from '../services/supabase';
import * as authService from '../services/auth';
import type { User } from '../types/user';
import type { Cargo } from '../types/cargo';

interface AuthState {
  user: User | null;
  cargo: Cargo | null;
  cargoSlug: string;
  podeTrocarModo: boolean;
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
  hasPermission: (permission: string) => boolean;
}

export const useAuth = create<AuthState>((set, get) => ({
  user: null,
  cargo: null,
  cargoSlug: 'aluno',
  podeTrocarModo: false,
  loading: true,
  isAuthenticated: false,

  signIn: async (email: string, password: string) => {
    set({ loading: true });
    try {
      await authService.signIn(email, password);
      await get().loadUser();
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
        // Trigger auto-profile handles basic insert
        // Update with additional data
        const { error } = await supabase
          .from('users')
          .upsert({
            id: authUser.id,
            email,
            ...userData,
          });
        if (error) throw error;

        await get().loadUser();
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
      set({
        user: null,
        cargo: null,
        cargoSlug: 'aluno',
        podeTrocarModo: false,
        isAuthenticated: false,
        loading: false,
      });
    } catch (error) {
      set({ loading: false });
      throw error;
    }
  },

  loadUser: async () => {
    // Only show full loading spinner on initial load (not yet authenticated).
    // Background refreshes keep the app mounted to avoid resetting navigation.
    if (!get().isAuthenticated) {
      set({ loading: true });
    }
    try {
      const user = await authService.getCurrentUser();
      if (!user) {
        set({ user: null, cargo: null, cargoSlug: 'aluno', podeTrocarModo: false, isAuthenticated: false, loading: false });
        return;
      }

      // Fetch cargo data
      let cargo: Cargo | null = null;
      let cargoSlug = 'aluno';
      let podeTrocarModo = false;

      if (user.cargo_slug) {
        cargoSlug = user.cargo_slug;
      }

      const { data: cargoData } = await supabase
        .from('cargos')
        .select('*')
        .eq('slug', cargoSlug)
        .single();

      if (cargoData) {
        cargo = cargoData as Cargo;
        podeTrocarModo = cargo.pode_trocar_modo;
      }

      set({
        user,
        cargo,
        cargoSlug,
        podeTrocarModo,
        isAuthenticated: true,
        loading: false,
      });
    } catch {
      set({ user: null, cargo: null, cargoSlug: 'aluno', podeTrocarModo: false, isAuthenticated: false, loading: false });
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

  hasPermission: (permission: string) => {
    const cargo = get().cargo;
    if (!cargo) return false;
    return cargo.permissoes[permission] === true;
  },
}));

// Listen for auth state changes on module load
supabase.auth.onAuthStateChange((event, session) => {
  // TOKEN_REFRESHED and USER_UPDATED should NOT trigger navigation changes.
  // Only SIGNED_IN (real login) and SIGNED_OUT need action.
  if (event === 'TOKEN_REFRESHED') return;

  if (event === 'SIGNED_OUT' || !session?.user) {
    useAuth.setState({
      user: null,
      cargo: null,
      cargoSlug: 'aluno',
      podeTrocarModo: false,
      isAuthenticated: false,
      loading: false,
    });
    return;
  }

  // SIGNED_IN, INITIAL_SESSION, USER_UPDATED — refresh user data
  useAuth.getState().loadUser();
});
