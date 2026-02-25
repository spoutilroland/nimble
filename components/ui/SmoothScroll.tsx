'use client';

import { useEffect } from 'react';

export function SmoothScroll() {
  useEffect(() => {
    const handleClick = (e: Event) => {
      const anchor = (e.currentTarget as HTMLAnchorElement).getAttribute('href');
      if (!anchor) return;
      e.preventDefault();
      const target = document.querySelector(anchor);
      if (target) target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    };

    const links = document.querySelectorAll('a[href^="#"]');
    links.forEach((link) => link.addEventListener('click', handleClick));
    return () => links.forEach((link) => link.removeEventListener('click', handleClick));
  }, []);

  return null;
}
