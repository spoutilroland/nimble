export interface SectionTypeDef {
  type: string;
  needsCarousel: boolean;
  isCustomLayout?: boolean;
}

export const SECTION_TYPES: SectionTypeDef[] = [
  { type: 'hero', needsCarousel: true },
  { type: 'hero-simple', needsCarousel: true },
  { type: 'about', needsCarousel: false },
  { type: 'services', needsCarousel: false },
  { type: 'gallery', needsCarousel: true },
  { type: 'contact', needsCarousel: false },
  { type: 'bento-grid', needsCarousel: true },
  { type: 'cinematic-split', needsCarousel: true },
  { type: 'polaroids', needsCarousel: true },
  { type: 'stats', needsCarousel: false },
  { type: 'custom-layout', needsCarousel: true, isCustomLayout: true },
];

export const DIVIDER_TYPES = ['none', 'wave', 'wave-double', 'diagonal', 'curve', 'triangle', 'zigzag', 'torn'] as const;

export const DIVIDER_COLORS = [
  { value: 'var(--primary)', key: 'divider.colorPrimary' },
  { value: 'var(--primary-dark)', key: 'divider.colorPrimaryDark' },
  { value: 'var(--secondary)', key: 'divider.colorSecondary' },
  { value: 'var(--accent)', key: 'divider.colorAccent' },
  { value: 'var(--text)', key: 'divider.colorText' },
  { value: '#ffffff', key: 'divider.colorWhite' },
  { value: '#000000', key: 'divider.colorBlack' },
] as const;

export const DIVIDER_SVG_PATHS: Record<string, string> = {
  'wave':        'M0,40 C360,80 1080,0 1440,40 L1440,80 L0,80 Z',
  'wave-double': 'M0,40 C240,0 480,80 720,40 C960,0 1200,80 1440,40 L1440,80 L0,80 Z',
  'diagonal':    'M0,80 L1440,0 L1440,80 Z',
  'curve':       'M0,80 Q720,0 1440,80 Z',
  'triangle':    'M0,80 L720,0 L1440,80 Z',
  'zigzag':      'M0,40 L120,0 L240,40 L360,0 L480,40 L600,0 L720,40 L840,0 L960,40 L1080,0 L1200,40 L1320,0 L1440,40 L1440,80 L0,80 Z',
  'torn':        'M0,60 C80,40 100,70 180,50 C260,30 280,65 360,45 C440,25 460,60 540,42 C620,24 640,58 720,40 C800,22 820,55 900,37 C980,19 1000,52 1080,35 C1160,18 1180,50 1260,33 C1340,16 1380,48 1440,30 L1440,80 L0,80 Z',
};
