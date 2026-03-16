'use client';

import type { Section } from '@/lib/types';
import type { BentoCell } from '@/lib/types/pages';

interface Props { section: Section; }

export function BentoGridSection({ section }: Props) {
  const cells = (section.props?.cells as BentoCell[]) || [];
  const gridCols = (section.props?.gridCols as number) || 6;
  const maxRow = cells.reduce((m, c) => Math.max(m, c.row + c.rowSpan - 1), 1);

  if (!cells.length) return null;

  return (
    <section className="s1">
      <style>{`
        .bento-cell:hover .bento-overlay { opacity: 1 !important; }
        .bento-cell:hover .bento-slide { opacity: 1 !important; transform: translate(0, 0) !important; }
      `}</style>
      <div className="max-w-[1200px] mx-auto px-5">
        <div
          className="visible"
          style={{
            display: 'grid',
            gridTemplateColumns: `repeat(${gridCols}, 1fr)`,
            gridTemplateRows: `repeat(${maxRow}, clamp(80px, 10vw, 120px))`,
            gap: '2rem',
          }}
        >
          {cells.map(cell => {
            if (!cell.content) return null;
            const hasImage = !!cell.content.imageUrl;
            const hasOverlay = !!cell.content.overlay;
            if (!hasImage && !hasOverlay) return null;

            const overlayPos = cell.content.overlay?.position;
            const textAlign = cell.content.overlay?.textAlign || 'left';
            const vAlign = cell.content.overlay?.verticalAlign || 'center';
            const isHorizontal = overlayPos === 'top' || overlayPos === 'bottom';

            let titleFrom = 'translate(0,0)';
            let bodyFrom = 'translate(0,0)';
            if (hasOverlay) {
              if (isHorizontal) {
                titleFrom = textAlign === 'right' ? 'translateX(60px)' : 'translateX(-60px)';
                bodyFrom = textAlign === 'right' ? 'translateX(-60px)' : 'translateX(60px)';
              } else {
                titleFrom = vAlign === 'bottom' ? 'translateY(-60px)' : 'translateY(60px)';
                bodyFrom = vAlign === 'bottom' ? 'translateY(60px)' : 'translateY(-60px)';
              }
            }

            return (
              <div
                key={cell.id}
                className={`bento-cell overflow-hidden rounded-xl relative h-full transition-all duration-300 ease-out border border-transparent hover:-translate-y-[5px] hover:shadow-[0_20px_40px_rgba(0,0,0,0.12)] hover:border-[rgba(255,255,255,0.4)]${!hasImage ? ' bento-cell-text' : ''}`}
                style={{
                  gridColumn: `${cell.col} / span ${cell.colSpan}`,
                  gridRow: `${cell.row} / span ${cell.rowSpan}`,
                  minHeight: 0,
                }}
              >
                {hasImage && (
                  <img src={cell.content.imageUrl} alt="" loading="lazy" className="w-full h-full object-cover" />
                )}
                {hasOverlay && cell.content.overlay && (
                  <div
                    className={`bento-overlay absolute flex flex-col ${
                      (vAlign === 'top' ? 'justify-start' :
                       vAlign === 'bottom' ? 'justify-end' : 'justify-center')
                    } ${(overlayPos === 'left' || overlayPos === 'right') ? 'py-6' : 'py-3'} px-5 ${
                      textAlign === 'center' ? 'text-center' :
                      textAlign === 'right' ? 'text-right' : 'text-left'
                    } ${hasImage ? 'bg-[color-mix(in_srgb,var(--primary-dark)_50%,transparent)]' : ''}`}
                    style={{
                      opacity: 0,
                      transition: 'opacity 0.2s ease-out',
                      ...(
                        !hasImage
                          ? { inset: 0 }
                          : overlayPos === 'top'
                          ? { top: 0, left: 0, right: 0 }
                          : overlayPos === 'bottom'
                          ? { bottom: 0, left: 0, right: 0 }
                          : overlayPos === 'left'
                          ? { top: 0, bottom: 0, left: 0, width: '45%' }
                          : { top: 0, bottom: 0, right: 0, width: '45%' }
                      ),
                    }}
                  >
                    {cell.content.overlay.title && (
                      <strong
                        className="bento-slide block text-[clamp(0.9rem,1.5vw,1.3rem)] font-bold mb-2 text-[var(--text-heading,#fff)] break-words"
                        style={{ opacity: 0, transform: titleFrom, transition: 'opacity 0.35s ease-out, transform 0.35s ease-out', transitionDelay: '0.05s' }}
                      >
                        {cell.content.overlay.title}
                      </strong>
                    )}
                    {cell.content.overlay.body && (
                      <p
                        className="bento-slide text-[clamp(0.75rem,1.1vw,1rem)] text-[var(--text-body,rgba(255,255,255,0.8))] leading-[1.5] m-0 break-words"
                        style={{ opacity: 0, transform: bodyFrom, transition: 'opacity 0.35s ease-out, transform 0.35s ease-out', transitionDelay: '0.12s' }}
                      >
                        {cell.content.overlay.body}
                      </p>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
