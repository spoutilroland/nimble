'use client';

import { useEffect, useRef, useState } from 'react';
import type { PageData } from '@/lib/types';

interface Props {
  pages: PageData[];
  currentPath: string;
}

export function NavDropdown({ pages, currentPath }: Props) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Ferme le menu si on clique en dehors — uniquement quand ouvert
  useEffect(() => {
    if (!open) return;
    const handleOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutside);
    return () => document.removeEventListener('mousedown', handleOutside);
  }, [open]);

  if (pages.length === 0) return null;

  return (
    <div className="nav-dropdown relative" ref={containerRef}>
      <button
        className="nav-link nav-dropdown-toggle text-[var(--text-muted)] no-underline font-bold text-[0.9rem] transition-colors duration-300 relative uppercase tracking-[1px] bg-transparent border-none cursor-pointer font-[inherit] p-0"
        onClick={() => setOpen((prev) => !prev)}
      >
        Plus ▾
      </button>
      <div className={`nav-dropdown-menu absolute top-[calc(100%+10px)] right-0 min-w-[160px] bg-[var(--bg-light)] border border-[color-mix(in_srgb,var(--primary)_25%,transparent)] shadow-[0_4px_15px_color-mix(in_srgb,var(--primary)_12%,transparent)] z-[200] flex-col${open ? ' dropdown-open' : ''}`}>
        {pages.map((p) => (
          <a
            key={p.id}
            href={p.slug}
            className={`nav-dropdown-item py-[0.7rem] px-4 text-[var(--text-muted)] no-underline text-[0.9rem] transition-[background,color] duration-200${currentPath === p.slug ? ' active' : ''}`}
          >
            {p.title}
          </a>
        ))}
      </div>
    </div>
  );
}
