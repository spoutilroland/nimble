'use client';

import { useEffect, useRef } from 'react';
import type { Section } from '@/lib/types';

interface StatItem { count: number; label: string; }

interface Props {
  section: Section;
}

const DEFAULT_ITEMS: StatItem[] = [
  { count: 150, label: 'Chantiers realises' },
  { count: 15, label: "Annees d'experience" },
  { count: 98, label: 'Clients satisfaits %' },
  { count: 3, label: 'Departements' },
];

export function StatsSection({ section }: Props) {
  const barRef = useRef<HTMLDivElement>(null);
  const items: StatItem[] = (section.props?.items as StatItem[] | undefined) || DEFAULT_ITEMS;

  useEffect(() => {
    const statsBar = barRef.current;
    if (!statsBar) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.querySelectorAll('[data-count]').forEach((el) => {
              const target = parseInt((el as HTMLElement).dataset.count || '0');
              const span = el.querySelector('span');
              if (!span) return;
              let start = 0;
              const step = target / (1600 / 16);
              const timer = setInterval(() => {
                start = Math.min(start + step, target);
                span.textContent = String(Math.floor(start));
                if (start >= target) clearInterval(timer);
              }, 16);
            });
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.5 }
    );
    observer.observe(statsBar);
    return () => observer.disconnect();
  }, []);

  return (
    <div className="stats-bar bg-[var(--primary-dark)] py-8 px-4 sm:py-10 sm:px-12 flex flex-wrap justify-center gap-y-6 reveal" ref={barRef}>
      {items.map((item, i) => (
        <div key={i} className="stat-item text-center relative px-4 sm:px-8 min-w-[140px]">
          <span className="stat-number font-['Oswald',sans-serif] text-[2.5rem] sm:text-[3.5rem] font-bold text-white leading-none block" data-count={item.count}>
            <span>0</span>
          </span>
          <span className="stat-label text-[0.7rem] sm:text-[0.8rem] tracking-[2px] sm:tracking-[3px] uppercase text-white/60 mt-[0.4rem] block font-semibold">{item.label}</span>
        </div>
      ))}
    </div>
  );
}
