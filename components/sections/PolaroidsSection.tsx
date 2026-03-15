'use client';

import { useEffect, useState } from 'react';
import type { Section } from '@/lib/types';

interface PolaroidItem { title: string; tag: string; tagColor: string; imageUrl?: string; }

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

const PLACEHOLDER = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';

export function PolaroidsSection({ section }: Props) {
  const [images, setImages] = useState<string[]>([]);

  const sectionTag = (section.props?.tag as string | undefined) || DEFAULT_TAG;
  const sectionTitle = (section.props?.title as string | undefined) || DEFAULT_TITLE;
  const items: PolaroidItem[] = (section.props?.items as PolaroidItem[] | undefined) || DEFAULT_ITEMS;

  useEffect(() => {
    if (!section.carouselId) return;
    fetch(`/api/carousel/${section.carouselId}/images`)
      .then((r) => r.json())
      .then((data) => {
        if (data.images?.length > 0) {
          setImages(data.images.map((img: { webpUrl?: string; url: string }) => img.webpUrl || img.url));
        }
      })
      .catch(() => {});
  }, [section.carouselId]);

  return (
    <section className="s3">
      <div className="max-w-[1200px] mx-auto px-5">
        <div className="section-header text-center mb-6 reveal">
          <span className="section-tag inline-block font-['Oswald',sans-serif] text-[0.75rem] tracking-[5px] uppercase text-[var(--accent)] mb-4" data-content-key="s3-tag">
            &mdash; {sectionTag} &mdash;
          </span>
          <h2 className="section-title" data-content-key="s3-title">
            {sectionTitle}
          </h2>
        </div>

        <div className="polaroid-grid flex flex-wrap justify-center gap-x-10 gap-y-12 py-8 reveal">
          {items.map((item, i) => (
            <div key={i} className="polaroid">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                className="polaroid-img w-full h-[200px] object-cover block"
                src={item.imageUrl || images[i] || PLACEHOLDER}
                alt={item.title}
              />
              <div className="polaroid-caption text-center pt-4">
                <span className="title font-['Raleway',sans-serif] italic font-semibold text-base text-[var(--text)] block mb-2">{item.title}</span>
                <span className={`polaroid-tag ${item.tagColor}`}>{item.tag}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
