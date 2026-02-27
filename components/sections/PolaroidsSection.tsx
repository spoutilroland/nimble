'use client';

import { useEffect, useRef } from 'react';
import type { Section } from '@/lib/types';

interface PolaroidItem { title: string; tag: string; tagColor: string; }

interface Props {
  section: Section;
}

const DEFAULT_TAG = 'Exterieur & Paysage';
const DEFAULT_TITLE = 'Amenagements Exterieurs';
const DEFAULT_ITEMS: PolaroidItem[] = [
  { title: 'Terrasse meleze', tag: 'Terrasse', tagColor: 'bois' },
  { title: 'Muret en pierres seches', tag: 'Maconnerie', tagColor: 'green' },
  { title: 'Allee en dalles granit', tag: 'Allee', tagColor: 'slate' },
  { title: 'Bardage vieux bois', tag: 'Bardage', tagColor: 'bois' },
];

export function PolaroidsSection({ section }: Props) {
  const gridRef = useRef<HTMLDivElement>(null);

  const sectionTag = (section.props?.tag as string | undefined) || DEFAULT_TAG;
  const sectionTitle = (section.props?.title as string | undefined) || DEFAULT_TITLE;
  const items: PolaroidItem[] = (section.props?.items as PolaroidItem[] | undefined) || DEFAULT_ITEMS;

  useEffect(() => {
    if (!section.carouselId) return;
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
          <span className="section-tag">
            &mdash; {sectionTag} &mdash;
          </span>
          <h2 className="section-title">
            {sectionTitle}
          </h2>
        </div>

        <div className="polaroid-grid reveal" ref={gridRef}>
          {items.map((item, i) => (
            <div key={i} className="polaroid">
              <img
                className="polaroid-img"
                src=""
                alt={item.title}
              />
              <div className="polaroid-caption">
                <span className="title">{item.title}</span>
                <span className={`polaroid-tag ${item.tagColor}`}>{item.tag}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
