'use client';

import { useEffect, useRef } from 'react';

interface Props {
  provider?: string;
  address?: string;
  embedUrl?: string;
  height?: number;
}

export function FooterMap({ provider = 'leaflet', address = '', embedUrl = '', height = 300 }: Props) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    if (provider === 'google-embed') {
      if (!embedUrl) return;
      const iframe = document.createElement('iframe');
      iframe.src = embedUrl;
      iframe.setAttribute('style', 'width:100%;height:100%;border:0;display:block;');
      iframe.setAttribute('allowfullscreen', '');
      iframe.setAttribute('loading', 'lazy');
      el.appendChild(iframe);
    } else {
      // Leaflet — chargement dynamique du script
      const initLeaflet = () => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const L = (window as any).L;
        if (!L) return;
        const mapId = 'lmap-' + Math.random().toString(36).slice(2, 7);
        const inner = document.createElement('div');
        inner.id = mapId;
        inner.style.cssText = 'width:100%;height:100%;min-height:inherit;';
        el.appendChild(inner);
        const lmap = L.map(mapId).setView([48.8566, 2.3522], 13);
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
        }).addTo(lmap);

        if (address) {
          fetch(`https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${encodeURIComponent(address)}`, {
            headers: { 'Accept-Language': 'fr' },
          })
            .then((r) => r.json())
            .then((data) => {
              if (data[0]) {
                const ll: [number, number] = [parseFloat(data[0].lat), parseFloat(data[0].lon)];
                lmap.setView(ll, 15);
                L.marker(ll).addTo(lmap);
              }
            })
            .catch(() => {});
        }
      };

      // Charger Leaflet CSS + JS si pas déjà chargé
      if (!(window as unknown as Record<string, unknown>).L) {
        const link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
        link.integrity = 'sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY=';
        link.crossOrigin = '';
        document.head.appendChild(link);

        const script = document.createElement('script');
        script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
        script.integrity = 'sha256-20nQCchB9co0qIjJZRGuk2/Z9VM+kNiyxNV/XN/WLcE=';
        script.crossOrigin = '';
        script.onload = initLeaflet;
        document.head.appendChild(script);
      } else {
        initLeaflet();
      }
    }
  }, [provider, address, embedUrl]);

  return (
    <div
      ref={ref}
      className="layout-map"
      style={{ minHeight: `${height}px` }}
    />
  );
}
