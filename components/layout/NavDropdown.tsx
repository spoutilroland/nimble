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
    <div className="nav-dropdown" ref={containerRef}>
      <button
        className="nav-link nav-dropdown-toggle"
        onClick={() => setOpen((prev) => !prev)}
      >
        Plus ▾
      </button>
      <div className={`nav-dropdown-menu${open ? ' dropdown-open' : ''}`}>
        {pages.map((p) => (
          <a
            key={p.id}
            href={p.slug}
            className={`nav-dropdown-item${currentPath === p.slug ? ' active' : ''}`}
          >
            {p.title}
          </a>
        ))}
      </div>
    </div>
  );
}
