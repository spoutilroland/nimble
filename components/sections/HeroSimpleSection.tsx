'use client';

import { useEffect, useRef } from 'react';
import type { Section } from '@/lib/types';
import { ck } from '@/lib/content-key';

interface Props {
  section: Section;
}

export function HeroSimpleSection({ section }: Props) {
  const bgRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Parallax
    const handleScroll = () => {
      if (bgRef.current && window.scrollY < window.innerHeight) {
        bgRef.current.style.transform = `translateY(${window.scrollY * 0.4}px)`;
      }
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    fetch(`/api/carousel/${section.carouselId}/images`)
      .then((r) => r.json())
      .then((data) => {
        if (data.images?.length > 0 && bgRef.current) {
          bgRef.current.style.backgroundImage = `url('${data.images[0].url}')`;
        }
      })
      .catch(() => {});
  }, [section.carouselId]);

  return (
    <section className="hero relative h-[80vh] min-h-[600px] flex items-center justify-center overflow-hidden">
      <div className="hero-bg" ref={bgRef} />
      <div className="hero-overlay" />
      <div className="hero-content text-center text-white relative z-[2] px-4">
        <p className="hero-eyebrow" data-content-key={ck(section.contentId, 'hero-eyebrow')}>
          Portfolio de realisations
        </p>
        <h1 className="hero-title" data-content-key={ck(section.contentId, 'hero-title')}>
          Nos Realisations
        </h1>
        <p className="hero-subtitle" data-content-key={ck(section.contentId, 'hero-subtitle')}>
          15 ans de savoir-faire alpin
        </p>
      </div>
    </section>
  );
}
