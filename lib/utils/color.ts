import type { ThemeVars } from '@/lib/types';

// ============================================================
//  MOTEUR DE COULEURS (HSL pur — zéro dépendance npm)
// ============================================================

export function hexToHsl(hex: string): [number, number, number] {
  let r = parseInt(hex.slice(1, 3), 16) / 255;
  let g = parseInt(hex.slice(3, 5), 16) / 255;
  let b = parseInt(hex.slice(5, 7), 16) / 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h = 0, s = 0;
  const l = (max + min) / 2;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
      case g: h = ((b - r) / d + 2) / 6; break;
      default: h = ((r - g) / d + 4) / 6;
    }
  }
  return [h * 360, s, l];
}

export function hslToHex(h: number, s: number, l: number): string {
  h = ((h % 360) + 360) % 360;
  s = Math.max(0, Math.min(1, s));
  l = Math.max(0, Math.min(1, l));
  const a = s * Math.min(l, 1 - l);
  const f = (n: number) => {
    const k = (n + h / 30) % 12;
    const c = l - a * Math.max(-1, Math.min(k - 3, 9 - k, 1));
    return Math.round(255 * c).toString(16).padStart(2, '0');
  };
  return '#' + f(0) + f(8) + f(4);
}

export function darken(hex: string, amount: number): string {
  const [h, s, l] = hexToHsl(hex);
  return hslToHex(h, s, Math.max(0, l - amount));
}

export function lighten(hex: string, amount: number): string {
  const [h, s, l] = hexToHsl(hex);
  return hslToHex(h, s, Math.min(1, l + amount));
}

export function relativeLuminance(hex: string): number {
  const r = parseInt(hex.slice(1, 3), 16) / 255;
  const g = parseInt(hex.slice(3, 5), 16) / 255;
  const b = parseInt(hex.slice(5, 7), 16) / 255;
  const lin = (c: number) => c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  return 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
}

export function autoTextColor(fondHex: string): string {
  return relativeLuminance(fondHex) > 0.35 ? '#1a2332' : '#f0f4f8';
}

export function computeVars(primary: string, secondary: string, accent: string, fond: string): ThemeVars {
  const texte = autoTextColor(fond);
  return {
    '--primary': primary,
    '--primary-dark': darken(primary, 0.18),
    '--primary-light': lighten(primary, 0.15),
    '--secondary': secondary,
    '--secondary-dark': darken(secondary, 0.18),
    '--accent': accent,
    '--accent-dark': darken(accent, 0.18),
    '--bg': fond,
    '--bg-light': lighten(fond, 0.03),
    '--text': texte,
    '--text-muted': lighten(texte, 0.25),
  };
}

export function hexToShort(hex: string): string | null {
  const r = hex.slice(1, 3), g = hex.slice(3, 5), b = hex.slice(5, 7);
  return (r[0] === r[1] && g[0] === g[1] && b[0] === b[1])
    ? '#' + r[0] + g[0] + b[0]
    : null;
}

export function hexToRgbStr(hex: string): string {
  return `rgb(${parseInt(hex.slice(1, 3), 16)}, ${parseInt(hex.slice(3, 5), 16)}, ${parseInt(hex.slice(5, 7), 16)})`;
}

export function hexToHslStr(hex: string): string {
  const [h, s, l] = hexToHsl(hex);
  return `hsl(${Math.round(h)}, ${Math.round(s * 100)}%, ${Math.round(l * 100)}%)`;
}
