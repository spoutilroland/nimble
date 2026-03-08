// Port de _old/views/partials/footer.ejs
import type { SiteConfig } from '@/lib/types';
import { t } from '@/lib/i18n';
import { sanitizeRichText } from '@/lib/data';
import { FooterSocial } from './FooterSocial';
import { FooterMap } from './FooterMap';

interface Props {
  site: SiteConfig;
  logoUrl: string | null;
  lang: string;
}

export function SiteFooter({ site, logoUrl, lang }: Props) {
  const footerCols = site.footer?.cols || 3;
  const footerBlocks = site.footer?.blocks || [
    { blockId: 'f1', type: 'logo-desc' as const, row: 1, col: 1, colSpan: 1 },
    { blockId: 'f2', type: 'contact' as const, row: 1, col: 2, colSpan: 1 },
    { blockId: 'f3', type: 'hours' as const, row: 1, col: 3, colSpan: 1 },
    { blockId: 'f4', type: 'legal' as const, row: 2, col: 1, colSpan: 3 },
  ];
  const b = site.business || ({} as typeof site.business);
  const h = b.hours || { weekdays: '', saturday: '', note: '' };
  const l = b.legal || { siret: '', certifications: '', copyright: '' };

  return (
    <footer className="footer">
      <div className="footer-grid" style={{ '--footer-cols': footerCols } as React.CSSProperties}>
        {footerBlocks.map((block) => (
          <div
            key={block.blockId}
            className="footer-block text-white/[0.82]"
            style={{
              gridRow: block.row,
              gridColumn: `${block.col} / span ${block.colSpan || 1}`,
            }}
          >
            {block.type === 'logo-desc' && (
              <>
                {logoUrl ? (
                  <img src={logoUrl} alt={b.name} className="footer-logo max-h-[55px] max-w-[170px] object-contain mb-4 block brightness-0 invert opacity-90" />
                ) : (
                  <h3 className="text-[1.25rem] font-bold uppercase tracking-[1.5px] text-white mb-[1.1rem]">{b.name}</h3>
                )}
                {b.description && <p className="mb-[0.55rem] leading-[1.75] text-[0.9rem]">{b.description}</p>}
              </>
            )}

            {block.type === 'contact' && (
              <>
                <h4 className="text-[0.7rem] font-bold uppercase tracking-[2.5px] text-[var(--primary-light)] mb-[1.1rem] pb-[0.65rem] border-b border-white/[0.12]">{t(lang, 'footer.contact')}</h4>
                {b.phone && (
                  <p className="mb-[0.55rem] leading-[1.75] text-[0.9rem]">
                    <a href={`tel:${b.phone}`} className="text-inherit no-underline opacity-80 hover:opacity-100 hover:text-[var(--primary-light)] hover:underline hover:underline-offset-[3px] transition-[opacity,color]">{b.phone}</a>
                  </p>
                )}
                {b.email && (
                  <p className="mb-[0.55rem] leading-[1.75] text-[0.9rem]">
                    <a href={`mailto:${b.email}`} className="text-inherit no-underline opacity-80 hover:opacity-100 hover:text-[var(--primary-light)] hover:underline hover:underline-offset-[3px] transition-[opacity,color]">{b.email}</a>
                  </p>
                )}
                {b.address && <p className="mb-[0.55rem] leading-[1.75] text-[0.9rem]">{b.address}</p>}
              </>
            )}

            {block.type === 'hours' && (
              <>
                <h4 className="text-[0.7rem] font-bold uppercase tracking-[2.5px] text-[var(--primary-light)] mb-[1.1rem] pb-[0.65rem] border-b border-white/[0.12]">{t(lang, 'footer.hours')}</h4>
                {h.weekdays && <p className="mb-[0.55rem] leading-[1.75] text-[0.9rem]">{h.weekdays}</p>}
                {h.saturday && <p className="mb-[0.55rem] leading-[1.75] text-[0.9rem]">{h.saturday}</p>}
                {h.note && (
                  <p className="mt-[0.4rem] italic text-[0.9em] mb-[0.55rem] leading-[1.75]">
                    {h.note}
                  </p>
                )}
              </>
            )}

            {block.type === 'legal' && (
              <p className="text-[0.78rem] opacity-50 text-center m-0 pt-[1.8rem] border-t border-white/[0.08]">
                &copy; {l.copyright} &mdash; {t(lang, 'footer.allRightsReserved')}
                {l.siret && <> | SIRET {l.siret}</>}
                {l.certifications && <> | {l.certifications}</>}
              </p>
            )}

            {(() => {
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              const b = block as any;
              if (b.type === 'richtext') {
                return <div dangerouslySetInnerHTML={{ __html: sanitizeRichText(b.content || '') }} />;
              }
              if (b.type === 'social-links') {
                return (
                  <FooterSocial
                    direction={b.direction || 'horizontal'}
                    shape={b.shape || 'round'}
                    size={b.size || 'md'}
                  />
                );
              }
              if (b.type === 'map') {
                return (
                  <FooterMap
                    provider={b.provider || 'leaflet'}
                    address={b.address || ''}
                    embedUrl={b.embedUrl || ''}
                    height={b.height || 300}
                  />
                );
              }
              return null;
            })()}
          </div>
        ))}
      </div>
    </footer>
  );
}
