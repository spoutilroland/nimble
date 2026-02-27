'use client';

import { useEffect, useRef } from 'react';

interface Props {
  direction?: string;
  shape?: string;
  size?: string;
}

export function FooterSocial({ direction = 'vertical', shape = 'round', size = 'md' }: Props) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    Promise.all([
      fetch('/api/site').then((r) => r.json()),
      fetch('/api/social-icons').then((r) => r.json()),
    ])
      .then(([site, icons]) => {
        if (!site.social || !ref.current) return;
        ref.current.innerHTML = '';
        const isVertical = direction === 'vertical';
        Object.entries(site.social as Record<string, string>).forEach(([net, url]) => {
          if (!url) return;
          const a = document.createElement('a');
          a.href = url;
          a.target = '_blank';
          a.rel = 'noopener noreferrer';
          a.title = net;

          if (isVertical) {
            // Icône seule (grille)
            a.className = 'social-btn-row';
            if (icons[net]) {
              const img = document.createElement('img');
              img.src = icons[net];
              img.alt = net;
              img.width = 22;
              img.height = 22;
              a.appendChild(img);
            } else {
              a.textContent = net.charAt(0).toUpperCase();
            }
          } else {
            // Bouton icône carré (mode horizontal)
            a.className = `social-btn ${shape} size-${size}`;
            if (icons[net]) {
              const img = document.createElement('img');
              img.src = icons[net];
              img.alt = net;
              img.width = 20;
              img.height = 20;
              img.style.objectFit = 'contain';
              a.appendChild(img);
            } else {
              a.textContent = net.charAt(0).toUpperCase();
            }
          }

          ref.current!.appendChild(a);
        });
      })
      .catch(() => {});
  }, [direction, shape, size]);

  return (
    <div
      ref={ref}
      className={`layout-social layout-social-${direction}`}
    />
  );
}
