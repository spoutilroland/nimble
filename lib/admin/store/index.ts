import { create } from 'zustand';
import { createUISlice, type UISlice } from './slices/ui';
import { createThemeSlice, type ThemeSlice } from './slices/theme';
import { createSiteSlice, type SiteSlice } from './slices/site';
import { createPagesSlice, type PagesSlice } from './slices/pages';
import { createCarouselsSlice, type CarouselsSlice } from './slices/carousels';
import { createLayoutsSlice, type LayoutsSlice } from './slices/layouts';
import { createMediaSlice, type MediaSlice } from './slices/media';

export type AdminStore = UISlice & ThemeSlice & SiteSlice & PagesSlice & CarouselsSlice & LayoutsSlice & MediaSlice;

export const useAdminStore = create<AdminStore>()((...a) => ({
  ...createUISlice(...a),
  ...createThemeSlice(...a),
  ...createSiteSlice(...a),
  ...createPagesSlice(...a),
  ...createCarouselsSlice(...a),
  ...createLayoutsSlice(...a),
  ...createMediaSlice(...a),
}));

// Re-exports pour import direct
export type { TabId, FlashMessage } from './slices/ui';
export type { CarouselsMap, CarouselApiEntry, CarouselImageData } from './slices/carousels';
export type { MediaSlice } from './slices/media';
