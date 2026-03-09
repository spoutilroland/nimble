'use client';

import { useEffect, useRef } from 'react';
import type { Section } from '@/lib/types';

interface Props {
  section: Section;
}

export function CinematicSplitSection({ section }: Props) {
  const containerRef = useRef<HTMLElement>(null);

  useEffect(() => {
    fetch(`/api/carousel/${section.carouselId}/images`)
      .then((r) => r.json())
      .then((data) => {
        if (data.images?.length > 0 && containerRef.current) {
          const allImgs = containerRef.current.querySelectorAll<HTMLImageElement>(
            '.project-image img'
          );
          data.images.forEach((img: { webpUrl?: string; url: string }, i: number) => {
            if (allImgs[i]) allImgs[i].src = img.webpUrl || img.url;
          });
        }
      })
      .catch(() => {});
  }, [section.carouselId]);

  return (
    <section className="s2" ref={containerRef}>
      <div className="max-w-full px-0 mx-auto">
        <div className="max-w-[1200px] mx-auto px-5 mb-14">
          <div className="section-header text-center mb-16 reveal">
            <span className="section-tag inline-block font-['Oswald',sans-serif] text-[0.75rem] tracking-[5px] uppercase text-[var(--accent)] mb-4" data-content-key="s2-tag">
              &mdash; Expertise &amp; Savoir-faire &mdash;
            </span>
            <h2 className="section-title" data-content-key="s2-title">
              Renovation Interieure
            </h2>
          </div>
        </div>

        <div className="project-row grid grid-cols-[60fr_40fr] min-h-[480px] mb-[3px] relative overflow-hidden reveal" id={`cinematic-${section.carouselId}`}>
          <div className="project-image relative overflow-hidden">
            <img
              src="https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=900&h=550&fit=crop&q=80"
              alt="Renovation cuisine alpine"
            />
          </div>
          <div className="project-text relative flex flex-col justify-center px-14 py-16 bg-[var(--bg)]">
            <div className="project-num absolute top-1/2 right-8 -translate-y-1/2 font-['Oswald',sans-serif] text-[10rem] font-bold leading-none text-[color-mix(in_srgb,var(--primary)_6%,transparent)] pointer-events-none select-none z-0">01</div>
            <div className="project-text-inner relative z-[1]">
              <div className="tag-row flex flex-wrap gap-2" style={{ marginBottom: '1rem' }}>
                <span className="tag-chip" data-content-key="project-1-tag1">Cuisine</span>
                <span className="tag-chip" data-content-key="project-1-tag2">Bois massif</span>
              </div>
              <h3 className="font-['Oswald',sans-serif] text-[2.2rem] font-bold uppercase tracking-[2px] leading-[1.1] mb-4 text-[var(--primary-dark)]" data-content-key="project-1-title">
                Cuisine ouverte
                <br />
                en meleze
              </h3>
              <p className="text-base leading-[1.85] text-[var(--text-muted)] mb-6" data-content-key="project-1-desc">
                Renovation complete d&apos;une cuisine avec pose de facades en meleze massif local,
                plan de travail en granit des Alpes, eclairage encastre basse consommation et
                amenagements sur mesure adaptes aux volumes du chalet.
              </p>
              <div className="tag-row flex flex-wrap gap-2">
                <span className="tag-chip" data-content-key="project-1-location">Savoie 73</span>
                <span className="tag-chip" data-content-key="project-1-duration">6 semaines</span>
              </div>
            </div>
          </div>
        </div>

        <div className="project-row reversed grid grid-cols-[40fr_60fr] min-h-[480px] mb-[3px] relative overflow-hidden reveal">
          <div className="project-image relative overflow-hidden">
            <img
              src="https://images.unsplash.com/photo-1552321554-5fefe8c9ef14?w=900&h=550&fit=crop&q=80"
              alt="Salle de bain renovee"
            />
          </div>
          <div className="project-text relative flex flex-col justify-center px-14 py-16 bg-[var(--primary-dark)] text-[var(--bg-light)] -order-1">
            <div className="project-num absolute top-1/2 left-8 -translate-y-1/2 font-['Oswald',sans-serif] text-[10rem] font-bold leading-none text-white/[0.06] pointer-events-none select-none z-0">02</div>
            <div className="project-text-inner relative z-[1]">
              <div className="tag-row flex flex-wrap gap-2" style={{ marginBottom: '1rem' }}>
                <span className="tag-chip" data-content-key="project-2-tag1">Salle de bain</span>
                <span className="tag-chip" data-content-key="project-2-tag2">Carrelage</span>
              </div>
              <h3 className="font-['Oswald',sans-serif] text-[2.2rem] font-bold uppercase tracking-[2px] leading-[1.1] mb-4 text-[var(--bg-light)]" data-content-key="project-2-title">
                Salle de bain
                <br />
                esprit spa alpin
              </h3>
              <p className="text-base leading-[1.85] text-[rgb(248,249,250,0.8)] mb-6" data-content-key="project-2-desc">
                Creation d&apos;une salle de bain haut de gamme avec douche a l&apos;italienne en
                pierre naturelle, boiseries en pin traite, double vasque sur mesure et integration
                d&apos;un seche-serviette pierre refractaire.
              </p>
              <div className="tag-row flex flex-wrap gap-2">
                <span className="tag-chip" data-content-key="project-2-location">Haute-Savoie 74</span>
                <span className="tag-chip" data-content-key="project-2-duration">4 semaines</span>
              </div>
            </div>
          </div>
        </div>

        <div className="project-row grid grid-cols-[60fr_40fr] min-h-[480px] mb-[3px] relative overflow-hidden reveal">
          <div className="project-image relative overflow-hidden">
            <img
              src="https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=900&h=550&fit=crop&q=80"
              alt="Parquet massif salon"
            />
          </div>
          <div className="project-text relative flex flex-col justify-center px-14 py-16 bg-[var(--bg)]">
            <div className="project-num absolute top-1/2 right-8 -translate-y-1/2 font-['Oswald',sans-serif] text-[10rem] font-bold leading-none text-[color-mix(in_srgb,var(--primary)_6%,transparent)] pointer-events-none select-none z-0">03</div>
            <div className="project-text-inner relative z-[1]">
              <div className="tag-row flex flex-wrap gap-2" style={{ marginBottom: '1rem' }}>
                <span className="tag-chip" data-content-key="project-3-tag1">Parquet</span>
                <span className="tag-chip" data-content-key="project-3-tag2">Salon</span>
              </div>
              <h3 className="font-['Oswald',sans-serif] text-[2.2rem] font-bold uppercase tracking-[2px] leading-[1.1] mb-4 text-[var(--primary-dark)]" data-content-key="project-3-title">
                Parquet massif
                <br />
                &amp; lambris epicea
              </h3>
              <p className="text-base leading-[1.85] text-[var(--text-muted)] mb-6" data-content-key="project-3-desc">
                Pose de parquet massif chene huile en chevron, habillage mural en lambris epicea
                vieilli, refection complete du plafond avec poutres apparentes et integration
                d&apos;une cheminee en pierre de taille.
              </p>
              <div className="tag-row flex flex-wrap gap-2">
                <span className="tag-chip" data-content-key="project-3-location">Isere 38</span>
                <span className="tag-chip" data-content-key="project-3-duration">8 semaines</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
