import type { StateCreator } from 'zustand';
import type { MediaItemWithMeta } from '@/lib/types';

export interface MediaSlice {
  mediaItems: MediaItemWithMeta[];
  mediaLoading: boolean;

  loadMedia: () => Promise<void>;
  updateMediaEntry: (mediaId: string, data: { altText?: string; title?: string; tags?: string[] }) => Promise<boolean>;
  deleteMedia: (mediaId: string) => Promise<boolean>;
  bulkDeleteMedia: (mediaIds: string[]) => Promise<{ ok: boolean; deleted?: number }>;
  uploadMedia: (files: FileList | File[]) => Promise<{ ok: boolean; error?: string }>;
}

export const createMediaSlice: StateCreator<MediaSlice, [], [], MediaSlice> = (set, get) => ({
  mediaItems: [],
  mediaLoading: false,

  loadMedia: async () => {
    set({ mediaLoading: true });
    try {
      const res = await fetch('/api/admin/media');
      if (!res.ok) throw new Error('Failed to load media');
      const data = await res.json();
      set({ mediaItems: data.media ?? [] });
    } finally {
      set({ mediaLoading: false });
    }
  },

  updateMediaEntry: async (mediaId, data) => {
    try {
      const res = await fetch(`/api/admin/media/${encodeURIComponent(mediaId)}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) return false;
      await get().loadMedia();
      return true;
    } catch {
      return false;
    }
  },

  deleteMedia: async (mediaId) => {
    try {
      const res = await fetch(`/api/admin/media/${encodeURIComponent(mediaId)}`, {
        method: 'DELETE',
      });
      if (!res.ok) return false;
      await get().loadMedia();
      return true;
    } catch {
      return false;
    }
  },

  bulkDeleteMedia: async (mediaIds) => {
    try {
      const res = await fetch('/api/admin/media/bulk-delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mediaIds }),
      });
      if (!res.ok) return { ok: false };
      const data = await res.json();
      await get().loadMedia();
      return { ok: true, deleted: data.deleted };
    } catch {
      return { ok: false };
    }
  },

  uploadMedia: async (files) => {
    try {
      const formData = new FormData();
      for (const file of Array.from(files)) {
        formData.append('images', file);
      }
      const res = await fetch('/api/admin/media/upload', {
        method: 'POST',
        body: formData,
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        return { ok: false, error: data.error || 'Upload failed' };
      }
      await get().loadMedia();
      return { ok: true };
    } catch {
      return { ok: false, error: 'Network error' };
    }
  },
});
