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
      <div className="container" style={{ maxWidth: '100%', padding: 0 }}>
        <div className="container" style={{ marginBottom: '3.5rem' }}>
          <div className="section-header reveal">
            <span className="section-tag" data-content-key="s2-tag">
              &mdash; Expertise &amp; Savoir-faire &mdash;
            </span>
            <h2 className="section-title" data-content-key="s2-title">
              Renovation Interieure
            </h2>
          </div>
        </div>

        <div className="project-row reveal" id={`cinematic-${section.carouselId}`}>
          <div className="project-image">
            <img
              src="https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=900&h=550&fit=crop&q=80"
              alt="Renovation cuisine alpine"
            />
          </div>
          <div className="project-text">
            <div className="project-num">01</div>
            <div className="project-text-inner">
              <div className="tag-row" style={{ marginBottom: '1rem' }}>
                <span className="tag-chip">Cuisine</span>
                <span className="tag-chip">Bois massif</span>
              </div>
              <h3 data-content-key="project-1-title">
                Cuisine ouverte
                <br />
                en meleze
              </h3>
              <p data-content-key="project-1-desc">
                Renovation complete d&apos;une cuisine avec pose de facades en meleze massif local,
                plan de travail en granit des Alpes, eclairage encastre basse consommation et
                amenagements sur mesure adaptes aux volumes du chalet.
              </p>
              <div className="tag-row">
                <span className="tag-chip">Savoie 73</span>
                <span className="tag-chip">6 semaines</span>
              </div>
            </div>
          </div>
        </div>

        <div className="project-row reversed reveal">
          <div className="project-image">
            <img
              src="https://images.unsplash.com/photo-1552321554-5fefe8c9ef14?w=900&h=550&fit=crop&q=80"
              alt="Salle de bain renovee"
            />
          </div>
          <div className="project-text">
            <div className="project-num">02</div>
            <div className="project-text-inner">
              <div className="tag-row" style={{ marginBottom: '1rem' }}>
                <span className="tag-chip">Salle de bain</span>
                <span className="tag-chip">Carrelage</span>
              </div>
              <h3 data-content-key="project-2-title">
                Salle de bain
                <br />
                esprit spa alpin
              </h3>
              <p data-content-key="project-2-desc">
                Creation d&apos;une salle de bain haut de gamme avec douche a l&apos;italienne en
                pierre naturelle, boiseries en pin traite, double vasque sur mesure et integration
                d&apos;un seche-serviette pierre refractaire.
              </p>
              <div className="tag-row">
                <span className="tag-chip">Haute-Savoie 74</span>
                <span className="tag-chip">4 semaines</span>
              </div>
            </div>
          </div>
        </div>

        <div className="project-row reveal">
          <div className="project-image">
            <img
              src="https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=900&h=550&fit=crop&q=80"
              alt="Parquet massif salon"
            />
          </div>
          <div className="project-text">
            <div className="project-num">03</div>
            <div className="project-text-inner">
              <div className="tag-row" style={{ marginBottom: '1rem' }}>
                <span className="tag-chip">Parquet</span>
                <span className="tag-chip">Salon</span>
              </div>
              <h3 data-content-key="project-3-title">
                Parquet massif
                <br />
                &amp; lambris epicea
              </h3>
              <p data-content-key="project-3-desc">
                Pose de parquet massif chene huile en chevron, habillage mural en lambris epicea
                vieilli, refection complete du plafond avec poutres apparentes et integration
                d&apos;une cheminee en pierre de taille.
              </p>
              <div className="tag-row">
                <span className="tag-chip">Isere 38</span>
                <span className="tag-chip">8 semaines</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
