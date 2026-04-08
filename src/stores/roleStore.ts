import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = '@bonyfit:lastRole';

interface RoleState {
  currentRole: string | null;
  lastUsedRole: string | null;
  userRoles: string[];
  resolved: boolean; // true after role selection logic runs

  setCurrentRole: (role: string) => void;
  setUserRoles: (roles: string[]) => void;
  loadLastRole: () => Promise<void>;
  reset: () => void;
}

export const useRoleStore = create<RoleState>((set) => ({
  currentRole: null,
  lastUsedRole: null,
  userRoles: [],
  resolved: false,

  setCurrentRole: (role) => {
    set({ currentRole: role, lastUsedRole: role, resolved: true });
    AsyncStorage.setItem(STORAGE_KEY, role).catch(() => {});
  },

  setUserRoles: (roles) => set({ userRoles: roles }),

  loadLastRole: async () => {
    try {
      const saved = await AsyncStorage.getItem(STORAGE_KEY);
      if (saved) set({ lastUsedRole: saved });
    } catch {}
  },

  reset: () => set({ currentRole: null, resolved: false }),
}));
