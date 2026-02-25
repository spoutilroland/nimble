import type { StateCreator } from 'zustand';
import type { PageData } from '@/lib/schemas/pages';

export interface PagesSlice {
  pages: PageData[];
  pagesLoading: boolean;

  loadPages: () => Promise<void>;
  savePages: (pages: PageData[]) => Promise<boolean>;
  createPage: (page: PageData) => Promise<boolean>;
  deletePage: (pageId: string) => Promise<boolean>;
  updatePage: (pageId: string, updated: PageData) => Promise<boolean>;
}

export const createPagesSlice: StateCreator<PagesSlice, [], [], PagesSlice> = (set, get) => ({
  pages: [],
  pagesLoading: false,

  loadPages: async () => {
    set({ pagesLoading: true });
    try {
      const res = await fetch('/api/pages');
      if (!res.ok) throw new Error('Failed to load pages');
      const data = await res.json();
      set({ pages: data.pages || [] });
    } finally {
      set({ pagesLoading: false });
    }
  },

  savePages: async (pages) => {
    try {
      const res = await fetch('/api/admin/pages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pages }),
      });
      if (!res.ok) return false;
      await get().loadPages();
      return true;
    } catch {
      return false;
    }
  },

  createPage: async (page) => {
    const current = get().pages;
    return get().savePages([...current, page]);
  },

  deletePage: async (pageId) => {
    const current = get().pages;
    return get().savePages(current.filter((p) => p.id !== pageId));
  },

  updatePage: async (pageId, updated) => {
    const current = get().pages;
    return get().savePages(current.map((p) => (p.id === pageId ? updated : p)));
  },
});
