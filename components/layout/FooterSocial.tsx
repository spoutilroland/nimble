'use client';

import { useEffect, useRef } from 'react';

const NETWORK_LABELS: Record<string, string> = {
  linkedin: 'LinkedIn',
  facebook: 'Facebook',
  instagram: 'Instagram',
  x: 'X',
  tiktok: 'TikTok',
  youtube: 'YouTube',
  pinterest: 'Pinterest',
  github: 'GitHub',
};

interface Props {
  direction?: string;
  shape?: string;
  size?: string;
}

export function FooterSocial({ direction = 'horizontal', shape = 'round', size = 'md' }: Props) {
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
        const customLabels: Record<string, string> = site.socialLabels || {};

        Object.entries(site.social as Record<string, string>).forEach(([net, url]) => {
          if (!url) return;
          const a = document.createElement('a');
          a.href = url;
          a.target = '_blank';
          a.rel = 'noopener noreferrer';
          a.title = NETWORK_LABELS[net] || net;

          if (isVertical) {
            // Mode vertical : icône + texte optionnel, empilés
            a.className = `social-btn-row size-${size}`;
            if (icons[net]) {
              const img = document.createElement('img');
              img.src = icons[net];
              img.alt = net;
              a.appendChild(img);
            }
            // Label custom > nom par défaut > rien (si custom est vide)
            const label = customLabels[net];
            // label défini et non vide → texte custom ; label non défini → nom par défaut
            if (label !== undefined && label !== '') {
              const span = document.createElement('span');
              span.textContent = label;
              a.appendChild(span);
            } else if (label === undefined) {
              const span = document.createElement('span');
              span.textContent = NETWORK_LABELS[net] || net;
              a.appendChild(span);
            }
            // label === '' → pas de texte, icône seule
          } else {
            // Mode horizontal : boutons icône carrés
            a.className = `social-btn ${shape} size-${size}`;
            if (icons[net]) {
              const img = document.createElement('img');
              img.src = icons[net];
              img.alt = net;
              a.appendChild(img);
            } else {
              a.textContent = (NETWORK_LABELS[net] || net).charAt(0).toUpperCase();
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
