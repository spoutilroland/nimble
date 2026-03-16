import type { StateCreator } from 'zustand';

export type TabId = 'tab-design' | 'tab-content' | 'tab-media' | 'tab-identity' | 'tab-config' | 'tab-backup' | 'tab-security';

export interface FlashMessage {
  text: string;
  type: 'success' | 'error';
}

export interface UISlice {
  activeTab: TabId;
  isDark: boolean;
  flash: FlashMessage | null;
  _flashTimer: ReturnType<typeof setTimeout> | null;

  setActiveTab: (tab: TabId) => void;
  toggleTheme: () => void;
  initTheme: () => void;
  showFlash: (text: string, type: 'success' | 'error', duration?: number) => void;
  clearFlash: () => void;
}

export const createUISlice: StateCreator<UISlice, [], [], UISlice> = (set, get) => ({
  activeTab: 'tab-design',
  isDark: false,
  flash: null,
  _flashTimer: null,

  setActiveTab: (tab) => set({ activeTab: tab }),

  initTheme: () => {
    const dark = document.documentElement.getAttribute('data-back-theme') === 'dark';
    set({ isDark: dark });
  },

  toggleTheme: () => {
    const newDark = !get().isDark;
    set({ isDark: newDark });
    if (newDark) {
      document.documentElement.setAttribute('data-back-theme', 'dark');
      localStorage.setItem('back-theme', 'dark');
    } else {
      document.documentElement.removeAttribute('data-back-theme');
      localStorage.removeItem('back-theme');
    }
  },

  showFlash: (text, type, duration = 3000) => {
    const prev = get()._flashTimer;
    if (prev) clearTimeout(prev);
    const timer = setTimeout(() => set({ flash: null, _flashTimer: null }), duration);
    set({ flash: { text, type }, _flashTimer: timer });
  },

  clearFlash: () => {
    const prev = get()._flashTimer;
    if (prev) clearTimeout(prev);
    set({ flash: null, _flashTimer: null });
  },
});
