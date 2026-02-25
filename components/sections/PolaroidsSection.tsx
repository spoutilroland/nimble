'use client';

import { useEffect, useRef } from 'react';
import type { Section } from '@/lib/types';

interface Props {
  section: Section;
}

export function PolaroidsSection({ section }: Props) {
  const gridRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch(`/api/carousel/${section.carouselId}/images`)
      .then((r) => r.json())
      .then((data) => {
        if (data.images?.length > 0 && gridRef.current) {
          const allImgs = gridRef.current.querySelectorAll<HTMLImageElement>('.polaroid-img');
          data.images.forEach((img: { webpUrl?: string; url: string }, i: number) => {
            if (allImgs[i]) allImgs[i].src = img.webpUrl || img.url;
          });
        }
      })
      .catch(() => {});
  }, [section.carouselId]);

  return (
    <section className="s3">
      <div className="container">
        <div className="section-header reveal">
          <span className="section-tag" data-content-key="s3-tag">
            &mdash; Exterieur &amp; Paysage &mdash;
          </span>
          <h2 className="section-title" data-content-key="s3-title">
            Amenagements Exterieurs
          </h2>
        </div>

        <div className="polaroid-grid reveal" ref={gridRef}>
          <div className="polaroid">
            <img
              className="polaroid-img"
              src="https://images.unsplash.com/photo-1591088398332-8a7791972843?w=400&h=300&fit=crop&q=80"
              alt="Terrasse bois"
            />
            <div className="polaroid-caption">
              <span className="title" data-content-key="polaroid-1-title">
                Terrasse meleze
              </span>
              <span className="polaroid-tag bois">Terrasse</span>
            </div>
          </div>
          <div className="polaroid">
            <img
              className="polaroid-img"
              src="https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&h=300&fit=crop&q=80"
              alt="Muret pierre"
            />
            <div className="polaroid-caption">
              <span className="title" data-content-key="polaroid-2-title">
                Muret en pierres seches
              </span>
              <span className="polaroid-tag green">Maconnerie</span>
            </div>
          </div>
          <div className="polaroid">
            <img
              className="polaroid-img"
              src="https://images.unsplash.com/photo-1600585154526-990dced4db0d?w=400&h=300&fit=crop&q=80"
              alt="Allee dalles"
            />
            <div className="polaroid-caption">
              <span className="title" data-content-key="polaroid-3-title">
                Allee en dalles granit
              </span>
              <span className="polaroid-tag slate">Allee</span>
            </div>
          </div>
          <div className="polaroid">
            <img
              className="polaroid-img"
              src="https://images.unsplash.com/photo-1580587771525-78b9dba3b914?w=400&h=300&fit=crop&q=80"
              alt="Bardage exterieur"
            />
            <div className="polaroid-caption">
              <span className="title" data-content-key="polaroid-4-title">
                Bardage vieux bois
              </span>
              <span className="polaroid-tag bois">Bardage</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
