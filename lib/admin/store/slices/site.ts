import type { StateCreator } from 'zustand';
import type { SiteConfig } from '@/lib/schemas/site';

export interface SiteSlice {
  site: SiteConfig | null;
  siteLoading: boolean;

  loadSite: () => Promise<void>;
  saveSite: (updates: Partial<SiteConfig>) => Promise<boolean>;
}

export const createSiteSlice: StateCreator<SiteSlice, [], [], SiteSlice> = (set, get) => ({
  site: null,
  siteLoading: false,

  loadSite: async () => {
    set({ siteLoading: true });
    try {
      const res = await fetch('/api/site');
      if (!res.ok) throw new Error('Failed to load site');
      const data = await res.json();
      set({ site: data });
    } finally {
      set({ siteLoading: false });
    }
  },

  // Merge partiel : lit la config actuelle du store, merge avec les updates, sauvegarde
  saveSite: async (updates) => {
    const current = get().site;
    if (!current) return false;

    const merged = { ...current, ...updates };

    try {
      const res = await fetch('/api/admin/site', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(merged),
      });
      if (!res.ok) return false;
      // Recharger depuis le serveur pour avoir l'état confirmé
      await get().loadSite();
      return true;
    } catch {
      return false;
    }
  },
});
