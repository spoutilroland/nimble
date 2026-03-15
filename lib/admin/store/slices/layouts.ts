import type { StateCreator } from 'zustand';
import type { Layout, LayoutBlock } from '@/lib/schemas/layouts';

export interface LayoutsSlice {
  layouts: Layout[];
  layoutsLoading: boolean;

  loadLayouts: () => Promise<void>;
  createLayout: (id: string, label: string, blocks: LayoutBlock[], description?: string) => Promise<boolean>;
  updateLayout: (id: string, label: string, blocks: LayoutBlock[], description?: string) => Promise<boolean>;
  deleteLayout: (id: string) => Promise<{ ok: boolean; error?: string }>;
}

export const createLayoutsSlice: StateCreator<LayoutsSlice, [], [], LayoutsSlice> = (set, get) => ({
  layouts: [],
  layoutsLoading: false,

  loadLayouts: async () => {
    set({ layoutsLoading: true });
    try {
      const res = await fetch('/api/layouts');
      if (!res.ok) throw new Error('Failed to load layouts');
      const data = await res.json();
      set({ layouts: Object.values(data.layouts || {}) });
    } finally {
      set({ layoutsLoading: false });
    }
  },

  createLayout: async (id, label, blocks, description) => {
    try {
      const res = await fetch('/api/admin/layouts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, label, blocks, description }),
      });
      if (!res.ok) return false;
      await get().loadLayouts();
      return true;
    } catch {
      return false;
    }
  },

  updateLayout: async (id, label, blocks, description) => {
    try {
      const res = await fetch(`/api/admin/layouts/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ label, blocks, description }),
      });
      if (!res.ok) return false;
      await get().loadLayouts();
      return true;
    } catch {
      return false;
    }
  },

  deleteLayout: async (id) => {
    try {
      const res = await fetch(`/api/admin/layouts/${id}`, { method: 'DELETE' });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        return { ok: false, error: data.error || 'Delete failed' };
      }
      await get().loadLayouts();
      return { ok: true };
    } catch {
      return { ok: false, error: 'Network error' };
    }
  },
});
