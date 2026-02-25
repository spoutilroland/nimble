'use client';

import { useEffect, useRef } from 'react';
import type { Section } from '@/lib/types';

interface Props {
  section: Section;
}

export function BentoGridSection({ section }: Props) {
  const sectionRef = useRef<HTMLElement>(null);

  // Count-up animation
  useEffect(() => {
    const statsBar = sectionRef.current?.querySelector('.stats-bar');
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

  // Charger les images depuis l'API
  useEffect(() => {
    fetch(`/api/carousel/${section.carouselId}/images`)
      .then((r) => r.json())
      .then((data) => {
        if (data.images?.length > 0 && sectionRef.current) {
          const allImgs = sectionRef.current.querySelectorAll<HTMLImageElement>(
            '.bento-hero img, .bento-card img'
          );
          data.images.forEach((img: { webpUrl?: string; url: string }, i: number) => {
            if (allImgs[i]) allImgs[i].src = img.webpUrl || img.url;
          });
        }
      })
      .catch(() => {});
  }, [section.carouselId]);

  return (
    <section className="s1" ref={sectionRef}>
      <div className="container">
        <div className="section-header reveal">
          <span className="section-tag" data-content-key="s1-tag">
            &mdash; Solidite &amp; Fondations &mdash;
          </span>
          <h2
            className="section-title"
            style={{ color: 'var(--primary-dark)' }}
            data-content-key="s1-title"
          >
            Maconnerie &amp; Gros Oeuvre
          </h2>
        </div>

        <div className="bento reveal" id={`bento-${section.carouselId}`}>
          <div className="bento-hero">
            <img
              src="https://images.unsplash.com/photo-1590012314607-cda9d9b699ae?w=900&h=700&fit=crop&q=80"
              alt="Maconnerie gros oeuvre"
            />
            <div className="bento-hero-text">
              <span className="tag-pill">Projet phare</span>
              <h3 data-content-key="bento-hero-title">
                Fondation &amp; Soubassement
                <br />
                Chalet Belledonne
              </h3>
              <p data-content-key="bento-hero-desc">
                Dalles beton arme, reprises en sous-oeuvre, maconnerie traditionnelle pierre
              </p>
            </div>
          </div>
          <div className="bento-card">
            <img
              src="https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=600&h=350&fit=crop&q=80"
              alt="Mur porteur"
            />
            <div className="bento-card-info">
              <span className="tag-pill slate">Murs porteurs</span>
              <h4>Parpaing &amp; Beton arme</h4>
            </div>
            <div className="bento-card-overlay">
              <span className="tag-pill slate">Murs porteurs</span>
              <p>
                Creation de murs porteurs en parpaing enduit, renforcement de structure existante,
                coulage poteaux beton arme.
              </p>
            </div>
          </div>
          <div className="bento-card">
            <img
              src="https://images.unsplash.com/photo-1581094794329-c8112a89af12?w=600&h=350&fit=crop&q=80"
              alt="Dalle beton"
            />
            <div className="bento-card-info">
              <span className="tag-pill green">Dalles</span>
              <h4>Dalle beton avec chauffage</h4>
            </div>
            <div className="bento-card-overlay">
              <span className="tag-pill green">Dalles beton</span>
              <p>
                Pose de dalle chauffante, isolation sous-dalle, chape ciment lissee, compatible
                plancher bois massif.
              </p>
            </div>
          </div>
        </div>

        <div className="stats-bar reveal">
          <div className="stat-item">
            <span className="stat-number" data-count="23">
              <span>0</span>
            </span>
            <span className="stat-label">Fondations realisees</span>
          </div>
          <div className="stat-item">
            <span className="stat-number" data-count="47">
              <span>0</span>
            </span>
            <span className="stat-label">Murs porteurs</span>
          </div>
          <div className="stat-item">
            <span className="stat-number" data-count="12">
              <span>0</span>
            </span>
            <span className="stat-label">Dalles beton</span>
          </div>
        </div>
      </div>
    </section>
  );
}
