'use client';

import { useEffect, useState } from 'react';
import type { Section } from '@/lib/types';
import { ck } from '@/lib/content-key';

interface CarouselImage {
  url: string;
  webpUrl?: string;
}

interface Props {
  section: Section;
}

const GALLERY_FALLBACKS = [
  'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&h=600&fit=crop&q=80',
  'https://images.unsplash.com/photo-1542273917363-3b1817f69a2d?w=800&h=600&fit=crop&q=80',
  'https://images.unsplash.com/photo-1519681393784-d120267933ba?w=800&h=600&fit=crop&q=80',
  'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&h=600&fit=crop&q=80',
];

const DESKTOP_INITIAL = 9;
const DESKTOP_STEP = 9;
const MOBILE_INITIAL = 6;
const MOBILE_STEP = 3;

export function GallerySection({ section }: Props) {
  const [images, setImages] = useState<string[]>(GALLERY_FALLBACKS);
  const [isMobile, setIsMobile] = useState(false);
  const [visibleCount, setVisibleCount] = useState(DESKTOP_INITIAL);

  // Détecte mobile et ajuste le nombre d'images visibles
  useEffect(() => {
    const mq = window.matchMedia('(max-width: 768px)');
    const update = (e: MediaQueryListEvent | MediaQueryList) => {
      const mobile = e.matches;
      setIsMobile(mobile);
      setVisibleCount(mobile ? MOBILE_INITIAL : DESKTOP_INITIAL);
    };
    update(mq);
    mq.addEventListener('change', update);
    return () => mq.removeEventListener('change', update);
  }, []);

  useEffect(() => {
    fetch(`/api/carousel/${section.carouselId}/images`)
      .then((r) => r.json())
      .then((data) => {
        if (data.images?.length > 0) {
          setImages(data.images.map((img: CarouselImage) => img.webpUrl || img.url));
        }
      })
      .catch(() => {});
  }, [section.carouselId]);

  const step = isMobile ? MOBILE_STEP : DESKTOP_STEP;
  const hasMore = visibleCount < images.length;
  return (
    <section className="section section-gallery" id="realisations">
      <div className="max-w-[1200px] mx-auto px-5">
        <h2 className="section-title" data-content-key={ck(section.contentId, 'gallery-title')}>
          Nos Dernieres Realisations
        </h2>
        <div className="gallery-grid grid grid-cols-[repeat(auto-fit,minmax(280px,1fr))] gap-10 mb-4">
          {images.slice(0, visibleCount).map((src, i) => (
            <div key={i} className="gallery-item">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={src} alt={`Realisation ${i + 1}`} />
            </div>
          ))}
        </div>
        {hasMore && (
          <div className="text-center mb-8">
            <button
              onClick={() => setVisibleCount((c) => c + step)}
              className="btn btn-secondary"
            >
              Voir plus
            </button>
          </div>
        )}
      </div>
    </section>
  );
}
