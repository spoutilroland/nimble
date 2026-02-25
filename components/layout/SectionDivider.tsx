// Port de _old/views/partials/section-divider.ejs
import type { DividerConfig } from '@/lib/types';

const DIVIDER_PATHS: Record<string, string> = {
  wave: 'M0,40 C360,80 1080,0 1440,40 L1440,80 L0,80 Z',
  'wave-double': 'M0,40 C240,0 480,80 720,40 C960,0 1200,80 1440,40 L1440,80 L0,80 Z',
  diagonal: 'M0,80 L1440,0 L1440,80 Z',
  curve: 'M0,80 Q720,0 1440,80 Z',
  triangle: 'M0,80 L720,0 L1440,80 Z',
  zigzag: 'M0,40 L120,0 L240,40 L360,0 L480,40 L600,0 L720,40 L840,0 L960,40 L1080,0 L1200,40 L1320,0 L1440,40 L1440,80 L0,80 Z',
  torn: 'M0,60 C80,40 100,70 180,50 C260,30 280,65 360,45 C440,25 460,60 540,42 C620,24 640,58 720,40 C800,22 820,55 900,37 C980,19 1000,52 1080,35 C1160,18 1180,50 1260,33 C1340,16 1380,48 1440,30 L1440,80 L0,80 Z',
};

interface Props {
  divider?: DividerConfig;
}

export function SectionDivider({ divider }: Props) {
  if (!divider?.type || !DIVIDER_PATHS[divider.type]) return null;

  const pathD = DIVIDER_PATHS[divider.type];
  const color = divider.color || 'var(--bg)';

  return (
    <div className="section-divider" aria-hidden="true" style={{ color }}>
      <svg viewBox="0 0 1440 80" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="none">
        {divider.flip ? (
          <g transform="scale(1,-1) translate(0,-80)">
            <path d={pathD} fill="currentColor" />
          </g>
        ) : (
          <path d={pathD} fill="currentColor" />
        )}
      </svg>
    </div>
  );
}
