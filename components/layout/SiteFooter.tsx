// Port de _old/views/partials/footer.ejs
import type { SiteConfig } from '@/lib/types';
import { t } from '@/lib/i18n';
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
            className="footer-block"
            style={{
              gridRow: block.row,
              gridColumn: `${block.col} / span ${block.colSpan || 1}`,
            }}
          >
            {block.type === 'logo-desc' && (
              <>
                {logoUrl ? (
                  <img src={logoUrl} alt={b.name} className="footer-logo" />
                ) : (
                  <h3>{b.name}</h3>
                )}
                {b.description && <p>{b.description}</p>}
              </>
            )}

            {block.type === 'contact' && (
              <>
                <h4>{t(lang, 'footer.contact')}</h4>
                {b.phone && (
                  <p>
                    <a href={`tel:${b.phone}`}>{b.phone}</a>
                  </p>
                )}
                {b.email && (
                  <p>
                    <a href={`mailto:${b.email}`}>{b.email}</a>
                  </p>
                )}
                {b.address && <p>{b.address}</p>}
              </>
            )}

            {block.type === 'hours' && (
              <>
                <h4>{t(lang, 'footer.hours')}</h4>
                {h.weekdays && <p>{h.weekdays}</p>}
                {h.saturday && <p>{h.saturday}</p>}
                {h.note && (
                  <p style={{ marginTop: '0.4rem', fontStyle: 'italic', fontSize: '0.9em' }}>
                    {h.note}
                  </p>
                )}
              </>
            )}

            {block.type === 'legal' && (
              <p style={{ fontSize: '0.85rem', opacity: 0.7, textAlign: 'center' }}>
                &copy; {l.copyright} &mdash; {t(lang, 'footer.allRightsReserved')}
                {l.siret && <> | SIRET {l.siret}</>}
                {l.certifications && <> | {l.certifications}</>}
              </p>
            )}

            {(() => {
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              const b = block as any;
              if (b.type === 'richtext') {
                return <div dangerouslySetInnerHTML={{ __html: b.content || '' }} />;
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
