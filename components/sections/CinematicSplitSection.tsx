'use client';

import { useEffect, useState } from 'react';
import type { Section } from '@/lib/types';

interface Props {
  section: Section;
}

interface ProjectConfig { tags: string[]; metaItems: string[]; imageUrl?: string; }

const FALLBACKS = [
  'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=900&h=550&fit=crop&q=80',
  'https://images.unsplash.com/photo-1552321554-5fefe8c9ef14?w=900&h=550&fit=crop&q=80',
  'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=900&h=550&fit=crop&q=80',
];

const ROWS = [
  { num: '01', variant: 'light', reversed: false, imgAlt: 'Rénovation cuisine alpine' },
  { num: '02', variant: 'dark',  reversed: true,  imgAlt: 'Salle de bain rénovée'    },
  { num: '03', variant: 'light', reversed: false, imgAlt: 'Parquet massif salon'      },
] as const;

const DEFAULT_PROJECTS: ProjectConfig[] = [
  { tags: ['Cuisine', 'Bois massif'], metaItems: ['Savoie 73', '6 semaines'] },
  { tags: ['Salle de bain', 'Carrelage'], metaItems: ['Haute-Savoie 74', '4 semaines'] },
  { tags: ['Parquet', 'Salon'], metaItems: ['Isère 38', '8 semaines'] },
];

const CONTENT_KEYS = [
  { title: 'project-1-title', desc: 'project-1-desc' },
  { title: 'project-2-title', desc: 'project-2-desc' },
  { title: 'project-3-title', desc: 'project-3-desc' },
];

const DEFAULTS = [
  { title: 'Cuisine ouverte\nen mélèze', desc: "Rénovation complète d'une cuisine avec pose de façades en mélèze massif local, plan de travail en granit des Alpes, éclairage encastré basse consommation." },
  { title: 'Salle de bain\nesprit spa alpin', desc: "Création d'une salle de bain haut de gamme avec douche à l'italienne en pierre naturelle, boiseries en pin traité, double vasque sur mesure." },
  { title: 'Parquet massif\n& lambris épicéa', desc: "Pose de parquet massif chêne huilé en chevron, habillage mural en lambris épicéa vieilli, réfection complète du plafond avec poutres apparentes." },
];

export function CinematicSplitSection({ section }: Props) {
  const [images, setImages] = useState<string[]>(FALLBACKS);

  useEffect(() => {
    fetch(`/api/carousel/${section.carouselId}/images`)
      .then((r) => r.json())
      .then((data) => {
        if (data.images?.length > 0) {
          setImages(data.images.map((img: { webpUrl?: string; url: string }) => img.webpUrl || img.url));
        }
      })
      .catch(() => {});
  }, [section.carouselId]);

  const projects: ProjectConfig[] =
    (section.props?.projects as ProjectConfig[] | undefined) || DEFAULT_PROJECTS;

  return (
    <section className="s2">
      {/* En-tête */}
      <div className="max-w-[1200px] mx-auto px-5 pb-14">
        <div className="section-header text-center reveal">
          <span
            className="inline-block font-['Oswald',sans-serif] text-[0.75rem] tracking-[5px] uppercase text-[var(--accent)] mb-4"
            data-content-key="s2-tag"
          >
            &mdash; Expertise &amp; Savoir-faire &mdash;
          </span>
          <h2 className="section-title" data-content-key="s2-title">
            Rénovation Intérieure
          </h2>
        </div>
      </div>

      {/* Rows */}
      <div className="px-6 overflow-hidden">
        {ROWS.map(({ num, variant, reversed, imgAlt }, i) => {
          if (i > 0 && images.length < i + 1) return null;
          const keys = CONTENT_KEYS[i];
          const def = DEFAULTS[i];
          const isDark = variant === 'dark';
          const rawProj = projects[i] || DEFAULT_PROJECTS[i];
          const proj: ProjectConfig = {
            tags: rawProj.tags ?? (rawProj as unknown as { tagsAbove?: string[] }).tagsAbove ?? [],
            metaItems: rawProj.metaItems ?? [],
            imageUrl: rawProj.imageUrl,
          };

          const imagePanel = (
            <div className="cinematic-image-panel">
              <img src={proj.imageUrl || images[i]} alt={imgAlt} />
              <div className="cinematic-image-overlay" />
            </div>
          );

          const textPanel = (
            <div className={`cinematic-text-panel${isDark ? ' cinematic-text-panel--dark' : ''}`} data-num={num}>
              <div className="cinematic-accent-bar" />

              {/* Tags au-dessus du titre */}
              {proj.tags.filter(Boolean).length > 0 && (
                <div className="cinematic-tags">
                  {proj.tags.filter(Boolean).map((tag, ti) => (
                    <span key={ti} className="cinematic-tag">{tag}</span>
                  ))}
                </div>
              )}

              {/* Titre */}
              <h3 className="cinematic-title" data-content-key={keys.title}>
                {def.title.split('\n').map((line, j) => (
                  <span key={j}>{line}{j === 0 && <br />}</span>
                ))}
              </h3>

              {/* Description */}
              <p className="cinematic-desc" data-content-key={keys.desc}>{def.desc}</p>

              {/* Méta (lieu · durée · …) */}
              {proj.metaItems.filter(Boolean).length > 0 && (
                <div className="cinematic-meta">
                  {proj.metaItems.filter(Boolean).map((item, mi) => (
                    <span key={mi} className="cinematic-meta-item">
                      {mi > 0 && <span className="cinematic-meta-sep">·</span>}
                      {item}
                    </span>
                  ))}
                </div>
              )}
            </div>
          );

          return (
            <div
              key={i}
              className={`cinematic-row${reversed ? ' cinematic-row--reversed' : ''} reveal`}
              id={i === 0 ? `cinematic-${section.carouselId}` : undefined}
            >
              {imagePanel}
              {textPanel}
            </div>
          );
        })}
      </div>
    </section>
  );
}
