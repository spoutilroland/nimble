'use client';

import { useEffect, useRef } from 'react';

export function StatsSection() {
  const barRef = useRef<HTMLDivElement>(null);

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
    <div className="stats-bar reveal" ref={barRef}>
      <div className="stat-item">
        <span className="stat-number" data-count="150">
          <span>0</span>
        </span>
        <span className="stat-label" data-content-key="stat-1-label">
          Chantiers realises
        </span>
      </div>
      <div className="stat-item">
        <span className="stat-number" data-count="15">
          <span>0</span>
        </span>
        <span className="stat-label" data-content-key="stat-2-label">
          Annees d&apos;experience
        </span>
      </div>
      <div className="stat-item">
        <span className="stat-number" data-count="98">
          <span>0</span>
        </span>
        <span className="stat-label" data-content-key="stat-3-label">
          Clients satisfaits %
        </span>
      </div>
      <div className="stat-item">
        <span className="stat-number" data-count="3">
          <span>0</span>
        </span>
        <span className="stat-label" data-content-key="stat-4-label">
          Departements
        </span>
      </div>
    </div>
  );
}
