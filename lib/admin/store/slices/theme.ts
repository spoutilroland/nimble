import type { StateCreator } from 'zustand';
import type { ThemeConfig, ThemeVars, CustomTheme } from '@/lib/schemas/theme';

// La réponse API inclut `vars` (les CSS vars du thème actif) quand c'est un custom theme
export type ThemeData = ThemeConfig & { vars?: ThemeVars };

export interface ThemeSlice {
  theme: ThemeData | null;
  themeLoading: boolean;

  loadTheme: () => Promise<void>;
  saveTheme: (themeId: string) => Promise<boolean>;
  createCustomTheme: (id: string, theme: CustomTheme) => Promise<boolean>;
  deleteCustomTheme: (id: string) => Promise<boolean>;
}

export const createThemeSlice: StateCreator<ThemeSlice, [], [], ThemeSlice> = (set, get) => ({
  theme: null,
  themeLoading: false,

  loadTheme: async () => {
    set({ themeLoading: true });
    try {
      const res = await fetch('/api/theme');
      if (!res.ok) throw new Error('Failed to load theme');
      const data = await res.json();
      set({ theme: data });
    } finally {
      set({ themeLoading: false });
    }
  },

  saveTheme: async (themeId) => {
    try {
      const res = await fetch('/api/admin/theme', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ theme: themeId }),
      });
      if (!res.ok) return false;
      // Recharger pour avoir les vars CSS mises à jour
      await get().loadTheme();
      return true;
    } catch {
      return false;
    }
  },

  createCustomTheme: async (id, theme) => {
    try {
      const res = await fetch('/api/admin/theme/custom', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, ...theme }),
      });
      if (!res.ok) return false;
      await get().loadTheme();
      return true;
    } catch {
      return false;
    }
  },

  deleteCustomTheme: async (id) => {
    try {
      const res = await fetch(`/api/admin/theme/custom/${id}`, { method: 'DELETE' });
      if (!res.ok) return false;
      await get().loadTheme();
      return true;
    } catch {
      return false;
    }
  },
});
