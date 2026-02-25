'use client';

import { useEffect, useRef } from 'react';
import type { Section } from '@/lib/types';

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
    <>
      <section className="hero">
        <div className="hero-bg" ref={bgRef} />
        <div className="hero-overlay" />
        <div className="hero-content">
          <p className="hero-eyebrow" data-content-key="hero-eyebrow">
            Portfolio de realisations
          </p>
          <h1 className="hero-title" data-content-key="hero-title">
            Nos Realisations
          </h1>
          <p className="hero-subtitle" data-content-key="hero-subtitle">
            15 ans de savoir-faire alpin
          </p>
        </div>
      </section>
      <svg
        className="block leading-none -mt-px"
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 1440 80"
        preserveAspectRatio="none"
      >
        <path
          d="M0,80 L0,50 L120,20 L240,60 L360,10 L480,55 L600,25 L720,65 L840,15 L960,50 L1080,20 L1200,60 L1320,30 L1440,50 L1440,80 Z"
          fill="#faf7f2"
        />
      </svg>
    </>
  );
}
