'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import type { Section } from '@/lib/types';
import { ck } from '@/lib/content-key';

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
            data-content-key={ck(section.contentId, 's2-tag')}
          >
            &mdash; Expertise &amp; Savoir-faire &mdash;
          </span>
          <h2 className="section-title" data-content-key={ck(section.contentId, 's2-title')}>
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
            <div className="relative overflow-hidden">
              <Image
                src={proj.imageUrl || images[i]}
                alt={imgAlt}
                fill
                className="object-cover block transition-transform duration-700 ease-[cubic-bezier(0.4,0,0.2,1)] group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-br from-black/15 to-transparent pointer-events-none" />
            </div>
          );

          const textPanel = (
            <div
              className={`relative flex flex-col justify-center px-9 py-12 ${
                isDark
                  ? 'bg-[var(--secondary)] text-[var(--bg-light)]'
                  : 'bg-[var(--bg-light)] text-[var(--text)]'
              } ${
                reversed
                  ? '[clip-path:polygon(0_0,calc(100%-25px)_0,100%_100%,0_100%)]'
                  : '[clip-path:polygon(25px_0,100%_0,100%_100%,0_100%)]'
              }`}
            >
              {/* Numéro en filigrane */}
              <span className="absolute top-6 right-8 font-['Oswald',sans-serif] text-[4rem] font-bold leading-none opacity-[0.07] pointer-events-none">
                {num}
              </span>

              {/* Accent bar */}
              <div className="w-10 h-[3px] bg-[var(--accent)] mb-5" />

              {/* Tags */}
              <div className={`flex flex-wrap gap-2 ${proj.tags.filter(Boolean).length > 0 ? 'mb-3' : ''}`} data-cinematic-tags={i}>
                {proj.tags.filter(Boolean).map((tag, ti) => (
                  <span
                    key={ti}
                    className={`inline-block px-3 py-1 text-[0.7rem] font-bold tracking-[1.5px] uppercase border-[1.5px] [clip-path:polygon(4px_0,100%_0,calc(100%-4px)_100%,0_100%)] ${
                      isDark
                        ? 'border-[var(--primary-light)] text-[var(--primary-light)]'
                        : 'border-[var(--primary)] text-[var(--primary)]'
                    }`}
                  >
                    {tag}
                  </span>
                ))}
              </div>

              {/* Titre */}
              <h3
                className="font-['Oswald',sans-serif] text-[1.75rem] font-bold leading-tight uppercase tracking-[1px] mb-4"
                data-content-key={ck(section.contentId, keys.title)}
              >
                {def.title.split('\n').map((line, j) => (
                  <span key={j}>{line}{j === 0 && <br />}</span>
                ))}
              </h3>

              {/* Description */}
              <p className="text-[0.92rem] leading-relaxed opacity-85 mb-5" data-content-key={ck(section.contentId, keys.desc)}>
                {def.desc}
              </p>

              {/* Méta */}
              <div className={`flex items-center gap-1.5 text-[0.78rem] font-semibold tracking-[0.5px] uppercase opacity-65`} data-cinematic-meta={i}>
                {proj.metaItems.filter(Boolean).map((item, mi) => (
                  <span key={mi}>
                    {mi > 0 && <span className="mx-1">·</span>}
                    {item}
                  </span>
                ))}
              </div>
            </div>
          );

          return (
            <div
              key={i}
              className={`group grid grid-cols-1 md:grid-cols-2 max-w-[1200px] mx-auto mb-10 min-h-[360px] overflow-hidden ${
                reversed ? 'md:[direction:rtl] [&>*]:md:[direction:ltr]' : ''
              } reveal`}
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
