'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import type { Section } from '@/lib/types';

const HERO_FALLBACKS = [
  'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1920&h=1080&fit=crop&q=80',
  'https://images.unsplash.com/photo-1542273917363-3b1817f69a2d?w=1920&h=1080&fit=crop&q=80',
  'https://images.unsplash.com/photo-1519681393784-d120267933ba?w=1920&h=1080&fit=crop&q=80',
  'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=1920&h=1080&fit=crop&q=80',
  'https://images.unsplash.com/photo-1498837167922-ddd27525d352?w=1920&h=1080&fit=crop&q=80',
];

interface Props {
  section: Section;
}

export function HeroSection({ section }: Props) {
  const [images, setImages] = useState<string[]>([HERO_FALLBACKS[0]]);
  const [current, setCurrent] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    fetch(`/api/carousel/${section.carouselId}/images`)
      .then((r) => r.json())
      .then((data) => {
        const apiImages =
          data.images && data.images.length > 0
            ? data.images.map((i: { webpUrl?: string; url: string }) => i.webpUrl || i.url)
            : HERO_FALLBACKS;
        setImages(apiImages);
      })
      .catch(() => {});
  }, [section.carouselId]);

  const goToSlide = useCallback(
    (index: number) => {
      setCurrent(index);
      if (timerRef.current) clearInterval(timerRef.current);
      if (images.length > 1) {
        timerRef.current = setInterval(() => {
          setCurrent((prev) => (prev + 1) % images.length);
        }, 5000);
      }
    },
    [images.length]
  );

  useEffect(() => {
    if (images.length > 1) {
      timerRef.current = setInterval(() => {
        setCurrent((prev) => (prev + 1) % images.length);
      }, 5000);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [images.length]);

  // Parallax
  useEffect(() => {
    const handleScroll = () => {
      const scrollY = window.pageYOffset;
      if (scrollY < window.innerHeight) {
        document.querySelectorAll('#accueil .hero-image').forEach((el) => {
          (el as HTMLElement).style.transform = `translateY(${scrollY * 0.5}px)`;
        });
      }
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <section className="hero" id="accueil">
      <div className="hero-overlay">
        <div className="container">
          <div className="hero-content">
            <h2 className="hero-title" data-content-key="hero-title">
              Votre partenaire de confiance
            </h2>
            <p className="hero-subtitle" data-content-key="hero-subtitle">
              Expert en renovation alpine depuis plus de 15 ans
            </p>
            <a href="#contact" className="btn btn-primary" data-content-key="hero-cta">
              Demander un devis gratuit
            </a>
          </div>
        </div>
      </div>

      {images.length <= 1 ? (
        <div
          className="hero-image"
          style={{ backgroundImage: `url('${images[0]}')` }}
        />
      ) : (
        <>
          {images.map((url, i) => (
            <div
              key={i}
              className={`hero-image hero-slide${i === current ? ' active' : ''}`}
              style={{ backgroundImage: `url('${url}')` }}
            />
          ))}
          <div className="hero-dots">
            {images.map((_, i) => (
              <button
                key={i}
                className={`hero-dot${i === current ? ' active' : ''}`}
                aria-label={`Slide ${i + 1}`}
                onClick={() => goToSlide(i)}
              />
            ))}
          </div>
        </>
      )}
    </section>
  );
}
