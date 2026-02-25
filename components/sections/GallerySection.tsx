'use client';

import { useEffect, useState } from 'react';
import type { Section } from '@/lib/types';

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

export function GallerySection({ section }: Props) {
  const [images, setImages] = useState<string[]>(GALLERY_FALLBACKS);

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

  return (
    <section className="section section-gallery" id="realisations">
      <div className="container">
        <h2 className="section-title" data-content-key="gallery-title">
          Nos Dernieres Realisations
        </h2>
        <div className="gallery-grid">
          {images.map((src, i) => (
            <div key={i} className="gallery-item">
              <img src={src} alt={`Realisation ${i + 1}`} />
            </div>
          ))}
        </div>
        <div className="text-center">
          <a href="/nos-travaux" className="btn btn-secondary" data-content-key="gallery-cta">
            Voir toutes nos realisations
          </a>
        </div>
      </div>
    </section>
  );
}
