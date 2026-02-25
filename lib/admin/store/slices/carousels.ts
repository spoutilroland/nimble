import type { StateCreator } from 'zustand';

export interface CarouselImageData {
  filename: string;
  url: string;
  webpUrl?: string | null;
}

export interface CarouselApiEntry {
  carousel: { id: string; title: string; maxImages: number };
  images: CarouselImageData[];
}

// L'API /api/admin/images retourne Record<string, CarouselApiEntry>
export type CarouselsMap = Record<string, CarouselApiEntry>;

export interface CarouselsSlice {
  carousels: CarouselsMap;
  carouselsLoading: boolean;

  loadCarousels: () => Promise<void>;
  reorderImages: (carouselId: string, order: string[]) => Promise<boolean>;
  deleteImage: (carouselId: string, filename: string) => Promise<{ ok: boolean; error?: string }>;
}

export const createCarouselsSlice: StateCreator<CarouselsSlice, [], [], CarouselsSlice> = (set, get) => ({
  carousels: {},
  carouselsLoading: false,

  loadCarousels: async () => {
    set({ carouselsLoading: true });
    try {
      const res = await fetch('/api/admin/images');
      if (!res.ok) throw new Error('Failed to load carousels');
      const data = await res.json();
      set({ carousels: data });
    } finally {
      set({ carouselsLoading: false });
    }
  },

  reorderImages: async (carouselId, order) => {
    try {
      const res = await fetch(`/api/admin/carousel/${encodeURIComponent(carouselId)}/order`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ order }),
      });
      if (!res.ok) return false;
      await get().loadCarousels();
      return true;
    } catch {
      return false;
    }
  },

  deleteImage: async (carouselId, filename) => {
    try {
      const res = await fetch('/api/admin/image', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ carouselId, filename }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        return { ok: false, error: data.error || 'Delete failed' };
      }
      await get().loadCarousels();
      return { ok: true };
    } catch {
      return { ok: false, error: 'Network error' };
    }
  },
});
