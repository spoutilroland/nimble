'use client';

import { useEffect, useRef } from 'react';
import type { Section, Layout, LayoutBlock } from '@/lib/types';
import { FooterSocial } from '@/components/layout/FooterSocial';
import { FooterMap } from '@/components/layout/FooterMap';

const BLOCK_BORDER_WIDTH: Record<string, string> = { thin: '1px', normal: '2px', thick: '4px' };
const BLOCK_BORDER_RADIUS: Record<string, string> = { sm: '4px', md: '8px', lg: '16px', pill: '9999px' };

function blockStyle(block: LayoutBlock & Record<string, unknown>, gridStyle: string): string {
  let style = gridStyle;
  const hasBg = !!block.bg;
  const hasBorder = block.borderWidth && block.borderWidth !== 'none';
  const hasRadius = block.borderRadius && block.borderRadius !== 'none';

  if (hasBg || hasBorder || hasRadius) style += '; padding: 1rem';
  if (hasBg) style += '; background: ' + block.bg;
  if (block.color) style += '; color: ' + block.color;
  if (hasBorder) {
    const bw = BLOCK_BORDER_WIDTH[block.borderWidth as string] || '1px';
    const bc = (block.borderColor as string) || 'var(--primary)';
    style += '; border: ' + bw + ' solid ' + bc;
  }
  if (hasRadius) {
    style += '; border-radius: ' + (BLOCK_BORDER_RADIUS[block.borderRadius as string] || '0');
    style += '; overflow: hidden';
  }
  return style;
}

interface Props {
  section: Section;
  layout: Layout;
}

export function CustomLayoutSection({ section, layout }: Props) {
  const sectionRef = useRef<HTMLElement>(null);

  // Charger les images carousel/image
  useEffect(() => {
    const el = sectionRef.current;
    if (!el) return;

    el.querySelectorAll<HTMLElement>('[data-carousel-id]').forEach((blockEl) => {
      const cid = blockEl.dataset.carouselId;
      if (!cid) return;
      fetch(`/api/carousel/${cid}/images`)
        .then((r) => r.json())
        .then((data) => {
          const images = data.images || [];
          if (images.length === 0) return;

          if (blockEl.classList.contains('layout-image')) {
            const img = images[0];
            const placeholder = blockEl.querySelector('.layout-image-placeholder');
            if (placeholder) placeholder.remove();
            const imgEl = document.createElement('img');
            imgEl.src = img.webpUrl || img.url;
            imgEl.alt = '';
            imgEl.loading = 'lazy';
            blockEl.appendChild(imgEl);
          } else if (blockEl.classList.contains('layout-carousel')) {
            const container = blockEl.querySelector('.layout-carousel-container');
            if (!container) return;
            images.forEach((img: { webpUrl?: string; url: string }) => {
              const imgEl = document.createElement('img');
              imgEl.src = img.webpUrl || img.url;
              imgEl.alt = '';
              imgEl.loading = 'lazy';
              container.appendChild(imgEl);
            });
          }
        })
        .catch(() => {});
    });
  }, [section.layoutId, section.blockCarousels]);

  return (
    <section
      className="section custom-layout-section"
      id={`layout-${section.layoutId}`}
      ref={sectionRef}
    >
      <div className="container">
        <div className="custom-layout-grid">
          {layout.blocks.map((block) => {
            const contentKey = `layout-${section.layoutId}-${block.blockId}`;
            const bcId = section.blockCarousels?.[block.blockId];
            const gridStyle = `grid-row:${block.row || 1}; grid-column:${block.col || 1} / span ${block.colSpan || 1}`;
            const extBlock = block as LayoutBlock & Record<string, unknown>;

            if (block.type === 'title') {
              const Tag = (extBlock.tag as keyof React.JSX.IntrinsicElements) || 'h2';
              return (
                <Tag
                  key={block.blockId}
                  className="layout-block layout-title"
                  style={cssStringToObject(blockStyle(extBlock, gridStyle))}
                  data-content-key={contentKey}
                >
                  Titre
                </Tag>
              );
            }

            if (block.type === 'text') {
              return (
                <div
                  key={block.blockId}
                  className="layout-block layout-richtext"
                  style={cssStringToObject(blockStyle(extBlock, gridStyle))}
                  data-content-key={contentKey}
                >
                  <p>Texte a editer...</p>
                </div>
              );
            }

            if (block.type === 'image') {
              return (
                <div
                  key={block.blockId}
                  className={`layout-block layout-image layout-image-${(extBlock.display as string) || 'column'}`}
                  style={cssStringToObject(blockStyle(extBlock, gridStyle))}
                  data-carousel-id={bcId || undefined}
                >
                  <div className="layout-image-placeholder">Image</div>
                </div>
              );
            }

            if (block.type === 'social-links') {
              return (
                <div
                  key={block.blockId}
                  className="layout-block"
                  style={cssStringToObject(blockStyle(extBlock, gridStyle))}
                >
                  <FooterSocial
                    direction={(extBlock.direction as string) || 'horizontal'}
                    shape={(extBlock.shape as string) || 'round'}
                    size={(extBlock.size as string) || 'md'}
                  />
                </div>
              );
            }

            if (block.type === 'map') {
              return (
                <div
                  key={block.blockId}
                  className="layout-block"
                  style={cssStringToObject(blockStyle(extBlock, gridStyle))}
                >
                  <FooterMap
                    provider={block.provider || 'leaflet'}
                    address={block.address || ''}
                    embedUrl={block.embedUrl || ''}
                    height={parseInt(block.height || '300')}
                  />
                </div>
              );
            }

            return null;
          })}
        </div>
      </div>
    </section>
  );
}

// Convertir une string CSS inline en objet React.CSSProperties
function cssStringToObject(css: string): React.CSSProperties {
  const style: Record<string, string> = {};
  css.split(';').forEach((rule) => {
    const [key, ...valueParts] = rule.split(':');
    if (key && valueParts.length > 0) {
      const camelKey = key
        .trim()
        .replace(/-([a-z])/g, (_, c) => c.toUpperCase());
      style[camelKey] = valueParts.join(':').trim();
    }
  });
  return style as React.CSSProperties;
}
