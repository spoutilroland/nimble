export interface NativeTheme {
  id: string;
  label: string;
  colors: string[];
}

export const NATIVE_THEMES: NativeTheme[] = [
  { id: 'alpine', label: 'Alpine', colors: ['#4a7c59', '#2d5016', '#8d6e63', '#faf7f2'] },
  { id: 'pro', label: 'Pro', colors: ['#1e40af', '#1e3a8a', '#6b7280', '#ffffff'] },
  { id: 'craft', label: 'Craft', colors: ['#8b6f47', '#6b5639', '#d4a574', '#f5f1e8'] },
  { id: 'industrial', label: 'Industrial', colors: ['#ff6b35', '#e55a2a', '#f7931e', '#ffffff'] },
  { id: 'provence', label: 'Provence', colors: ['#967bb6', '#7c6ba6', '#d4a76a', '#faf8f3'] },
];

export const CSS_VAR_KEYS = [
  '--primary', '--primary-dark', '--primary-light',
  '--secondary', '--secondary-dark',
  '--accent', '--accent-dark',
  '--bg', '--bg-light', '--text', '--text-muted',
];

export type HarmonyType = 'complementaire' | 'analogue' | 'triadique' | 'split';

export const HARMONY_OFFSETS: Record<HarmonyType, Record<string, number>> = {
  complementaire: { primary: 0, secondary: 180, accent: 150, fond: 0 },
  analogue: { primary: 0, secondary: 30, accent: -30, fond: 0 },
  triadique: { primary: 0, secondary: 120, accent: 240, fond: 0 },
  split: { primary: 0, secondary: 150, accent: 210, fond: 0 },
};

export function applyThemeLive(themeId: string, vars?: Record<string, string>) {
  if (vars) {
    Object.entries(vars).forEach(([k, v]) =>
      document.documentElement.style.setProperty(k, v));
    localStorage.setItem('site-theme-vars', JSON.stringify(vars));
  } else {
    CSS_VAR_KEYS.forEach(k => document.documentElement.style.removeProperty(k));
    localStorage.removeItem('site-theme-vars');
  }
  document.documentElement.setAttribute('data-theme', themeId);
  localStorage.setItem('site-theme', themeId);
}
