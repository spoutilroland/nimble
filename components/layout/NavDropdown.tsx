'use client';

import { useEffect, useRef, useState } from 'react';
import type { PageData } from '@/lib/types';

interface Props {
  pages: PageData[];
  currentPath: string;
}

export function NavDropdown({ pages, currentPath }: Props) {
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const close = () => setOpen(false);
    document.addEventListener('click', close);
    return () => document.removeEventListener('click', close);
  }, []);

  if (pages.length === 0) return null;

  return (
    <div className="nav-dropdown">
      <button
        className="nav-link nav-dropdown-toggle"
        onClick={(e) => {
          e.stopPropagation();
          setOpen(!open);
        }}
      >
        Plus ▾
      </button>
      <div ref={menuRef} className={`nav-dropdown-menu${open ? ' dropdown-open' : ''}`}>
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
