'use client';

import { useState, useMemo, useEffect, useRef } from 'react';
import { X, Search } from 'lucide-react';
import { useI18n } from '@/lib/i18n/context';
import { SECTION_TYPES, DISABLED_SECTIONS } from '@/lib/admin/constants/pages';
import type { Layout } from '@/lib/schemas/layouts';

interface Props {
  layouts: Layout[];
  onSelect: (type: string, layoutId?: string, label?: string) => void;
  onClose: () => void;
}

/**
 * Previews SVG schématiques pour chaque type de section.
 * Chaque preview illustre la forme/structure typique du composant.
 */
function SectionPreview({ type }: { type: string }) {
  const w = 200;
  const h = 120;

  const previews: Record<string, React.ReactNode> = {
    'hero': (
      <svg viewBox={`0 0 ${w} ${h}`} className="w-full h-full">
        {/* Image plein écran */}
        <rect x="0" y="0" width={w} height={h} rx="4" fill="var(--bo-border)" opacity="0.3" />
        <rect x="0" y="0" width={w} height={h} rx="4" fill="url(#hero-grad)" opacity="0.5" />
        {/* Texte centré */}
        <rect x="50" y="38" width="100" height="8" rx="2" fill="var(--bo-text)" opacity="0.7" />
        <rect x="65" y="52" width="70" height="5" rx="2" fill="var(--bo-text)" opacity="0.35" />
        <rect x="76" y="68" width="48" height="12" rx="3" fill="var(--bo-green)" opacity="0.6" />
        <defs>
          <linearGradient id="hero-grad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="transparent" />
            <stop offset="100%" stopColor="var(--bo-bg)" stopOpacity="0.8" />
          </linearGradient>
        </defs>
      </svg>
    ),
    'hero-simple': (
      <svg viewBox={`0 0 ${w} ${h}`} className="w-full h-full">
        {/* Bandeau horizontal */}
        <rect x="0" y="25" width={w} height="70" rx="4" fill="var(--bo-border)" opacity="0.25" />
        <rect x="20" y="48" width="90" height="7" rx="2" fill="var(--bo-text)" opacity="0.6" />
        <rect x="20" y="60" width="60" height="5" rx="2" fill="var(--bo-text)" opacity="0.3" />
        {/* Image à droite */}
        <rect x="135" y="30" width="55" height="60" rx="3" fill="var(--bo-green)" opacity="0.15" />
        <circle cx="162" cy="55" r="10" fill="var(--bo-green)" opacity="0.25" />
      </svg>
    ),
    'about': (
      <svg viewBox={`0 0 ${w} ${h}`} className="w-full h-full">
        {/* Deux colonnes : texte + image */}
        <rect x="10" y="20" width="80" height="6" rx="2" fill="var(--bo-text)" opacity="0.6" />
        <rect x="10" y="32" width="75" height="4" rx="2" fill="var(--bo-text)" opacity="0.25" />
        <rect x="10" y="40" width="70" height="4" rx="2" fill="var(--bo-text)" opacity="0.25" />
        <rect x="10" y="48" width="65" height="4" rx="2" fill="var(--bo-text)" opacity="0.25" />
        <rect x="10" y="56" width="72" height="4" rx="2" fill="var(--bo-text)" opacity="0.25" />
        <rect x="10" y="70" width="45" height="10" rx="3" fill="var(--bo-green)" opacity="0.5" />
        {/* Image */}
        <rect x="110" y="15" width="78" height="90" rx="4" fill="var(--bo-green)" opacity="0.12" />
        <circle cx="149" cy="50" r="15" fill="var(--bo-green)" opacity="0.2" />
      </svg>
    ),
    'services': (
      <svg viewBox={`0 0 ${w} ${h}`} className="w-full h-full">
        {/* Titre */}
        <rect x="60" y="8" width="80" height="6" rx="2" fill="var(--bo-text)" opacity="0.6" />
        {/* 3 cartes */}
        {[0, 1, 2].map(i => (
          <g key={i} transform={`translate(${10 + i * 65}, 25)`}>
            <rect width="55" height="75" rx="4" fill="var(--bo-border)" opacity="0.2" />
            <circle cx="27" cy="22" r="10" fill="var(--bo-green)" opacity="0.2" />
            <rect x="8" y="40" width="39" height="4" rx="2" fill="var(--bo-text)" opacity="0.5" />
            <rect x="8" y="48" width="35" height="3" rx="1" fill="var(--bo-text)" opacity="0.2" />
            <rect x="8" y="54" width="30" height="3" rx="1" fill="var(--bo-text)" opacity="0.2" />
          </g>
        ))}
      </svg>
    ),
    'gallery': (
      <svg viewBox={`0 0 ${w} ${h}`} className="w-full h-full">
        {/* Grille de photos */}
        {[0, 1, 2, 3].map(i => (
          <g key={i}>
            <rect x={10 + (i % 4) * 47} y={15 + Math.floor(i / 4) * 50} width="42" height="42" rx="3" fill="var(--bo-green)" opacity={0.1 + i * 0.05} />
            <circle cx={31 + (i % 4) * 47} cy={32 + Math.floor(i / 4) * 50} r="8" fill="var(--bo-green)" opacity="0.15" />
          </g>
        ))}
        {[0, 1, 2, 3].map(i => (
          <rect key={`b${i}`} x={10 + i * 47} y={62} width="42" height="42" rx="3" fill="var(--bo-border)" opacity="0.15" />
        ))}
      </svg>
    ),
    'contact': (
      <svg viewBox={`0 0 ${w} ${h}`} className="w-full h-full">
        {/* Formulaire */}
        <rect x="25" y="10" width="150" height="100" rx="5" fill="var(--bo-border)" opacity="0.12" />
        <rect x="35" y="20" width="60" height="6" rx="2" fill="var(--bo-text)" opacity="0.5" />
        <rect x="35" y="34" width="130" height="12" rx="3" fill="var(--bo-bg)" stroke="var(--bo-border)" strokeWidth="1" />
        <rect x="35" y="52" width="130" height="12" rx="3" fill="var(--bo-bg)" stroke="var(--bo-border)" strokeWidth="1" />
        <rect x="35" y="70" width="130" height="20" rx="3" fill="var(--bo-bg)" stroke="var(--bo-border)" strokeWidth="1" />
        <rect x="115" y="94" width="50" height="10" rx="3" fill="var(--bo-green)" opacity="0.5" />
      </svg>
    ),
    'bento-grid': (
      <svg viewBox={`0 0 ${w} ${h}`} className="w-full h-full">
        {/* Grille asymétrique bento */}
        <rect x="8" y="10" width="85" height="60" rx="4" fill="var(--bo-green)" opacity="0.15" />
        <rect x="98" y="10" width="45" height="28" rx="4" fill="var(--bo-border)" opacity="0.25" />
        <rect x="148" y="10" width="45" height="28" rx="4" fill="var(--bo-green)" opacity="0.1" />
        <rect x="98" y="42" width="95" height="28" rx="4" fill="var(--bo-border)" opacity="0.18" />
        <rect x="8" y="74" width="60" height="36" rx="4" fill="var(--bo-border)" opacity="0.2" />
        <rect x="73" y="74" width="60" height="36" rx="4" fill="var(--bo-green)" opacity="0.12" />
        <rect x="138" y="74" width="55" height="36" rx="4" fill="var(--bo-border)" opacity="0.15" />
      </svg>
    ),
    'cinematic-split': (
      <svg viewBox={`0 0 ${w} ${h}`} className="w-full h-full">
        {/* Split gauche image, droite texte */}
        <rect x="5" y="10" width="95" height="100" rx="4" fill="var(--bo-green)" opacity="0.12" />
        <circle cx="52" cy="50" r="18" fill="var(--bo-green)" opacity="0.2" />
        {/* Texte à droite */}
        <rect x="110" y="25" width="40" height="4" rx="1" fill="var(--bo-green)" opacity="0.4" />
        <rect x="110" y="35" width="75" height="7" rx="2" fill="var(--bo-text)" opacity="0.6" />
        <rect x="110" y="50" width="70" height="4" rx="2" fill="var(--bo-text)" opacity="0.25" />
        <rect x="110" y="58" width="65" height="4" rx="2" fill="var(--bo-text)" opacity="0.25" />
        <rect x="110" y="66" width="60" height="4" rx="2" fill="var(--bo-text)" opacity="0.25" />
        <rect x="110" y="80" width="30" height="5" rx="1" fill="var(--bo-text-dim)" opacity="0.3" />
        <rect x="145" y="80" width="30" height="5" rx="1" fill="var(--bo-text-dim)" opacity="0.3" />
      </svg>
    ),
    'polaroids': (
      <svg viewBox={`0 0 ${w} ${h}`} className="w-full h-full">
        {/* Polaroids éparpillés */}
        {[
          { x: 20, y: 15, r: -8 },
          { x: 75, y: 10, r: 5 },
          { x: 130, y: 18, r: -3 },
          { x: 45, y: 55, r: 6 },
          { x: 110, y: 58, r: -5 },
        ].map((p, i) => (
          <g key={i} transform={`translate(${p.x}, ${p.y}) rotate(${p.r})`}>
            <rect x="-2" y="-2" width="44" height="52" rx="2" fill="var(--bo-text)" opacity="0.08" />
            <rect x="2" y="2" width="36" height="32" rx="1" fill="var(--bo-green)" opacity={0.1 + i * 0.04} />
            <rect x="6" y="38" width="28" height="3" rx="1" fill="var(--bo-text)" opacity="0.2" />
          </g>
        ))}
      </svg>
    ),
    'stats': (
      <svg viewBox={`0 0 ${w} ${h}`} className="w-full h-full">
        {/* 4 compteurs */}
        {[0, 1, 2, 3].map(i => (
          <g key={i} transform={`translate(${10 + i * 48}, 20)`}>
            <rect width="42" height="70" rx="4" fill="var(--bo-border)" opacity="0.12" />
            <text x="21" y="38" textAnchor="middle" fontSize="14" fontWeight="bold" fill="var(--bo-green)" opacity="0.6">
              {['+150', '98%', '24/7', '5K'][i]}
            </text>
            <rect x="6" y="50" width="30" height="4" rx="1" fill="var(--bo-text)" opacity="0.3" />
          </g>
        ))}
      </svg>
    ),
  };

  return (
    <div className="w-full aspect-[5/3] bg-[var(--bo-bg)] rounded-lg overflow-hidden flex items-center justify-center">
      {previews[type] ?? (
        <svg viewBox={`0 0 ${w} ${h}`} className="w-full h-full">
          <rect x="20" y="20" width="160" height="80" rx="6" fill="var(--bo-border)" opacity="0.15" />
          <rect x="60" y="50" width="80" height="6" rx="2" fill="var(--bo-text)" opacity="0.3" />
          <rect x="70" y="62" width="60" height="4" rx="2" fill="var(--bo-text)" opacity="0.15" />
        </svg>
      )}
    </div>
  );
}

/**
 * Descriptions courtes par type de section (clés i18n).
 */
const SECTION_DESCRIPTIONS: Record<string, string> = {
  'hero': 'sectionPicker.descHero',
  'hero-simple': 'sectionPicker.descHeroSimple',
  'about': 'sectionPicker.descAbout',
  'services': 'sectionPicker.descServices',
  'gallery': 'sectionPicker.descGallery',
  'contact': 'sectionPicker.descContact',
  'bento-grid': 'sectionPicker.descBentoGrid',
  'cinematic-split': 'sectionPicker.descCinematicSplit',
  'polaroids': 'sectionPicker.descPolaroids',
  'stats': 'sectionPicker.descStats',
};

const MAX_LABEL = 16;

export function SectionPickerModal({ layouts, onSelect, onClose }: Props) {
  const { t } = useI18n();
  const [search, setSearch] = useState('');
  const searchRef = useRef<HTMLInputElement>(null);
  const [naming, setNaming] = useState<{ type: string; layoutId?: string } | null>(null);
  const [nameValue, setNameValue] = useState('');
  const nameRef = useRef<HTMLInputElement>(null);

  // Focus la barre de recherche à l'ouverture
  useEffect(() => {
    searchRef.current?.focus();
  }, []);

  // Fermer avec Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  // Sections natives (sans custom-layout, sans disabled)
  const builtInTypes = SECTION_TYPES.filter(st => !st.isCustomLayout && !DISABLED_SECTIONS.includes(st.type));

  // Filtrage par recherche
  const query = search.toLowerCase().trim();
  const filteredBuiltIn = useMemo(() => {
    if (!query) return builtInTypes;
    return builtInTypes.filter(st => {
      const label = t(`sectionType.${st.type}`).toLowerCase();
      return label.includes(query) || st.type.includes(query);
    });
  }, [query, builtInTypes, t]);

  const filteredLayouts = useMemo(() => {
    if (!query) return layouts;
    return layouts.filter(l =>
      l.label.toLowerCase().includes(query) || l.id.toLowerCase().includes(query)
    );
  }, [query, layouts]);

  const hasResults = filteredBuiltIn.length > 0 || filteredLayouts.length > 0;

  return (
    <div
      className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/60 backdrop-blur-[2px]"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="bg-[var(--bo-surface)] border border-[var(--bo-border)] rounded-2xl w-[90vw] max-w-[780px] max-h-[85vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--bo-border)] shrink-0">
          <h3 className="text-[0.95rem] font-semibold text-[var(--bo-text)] m-0">
            {t('sectionPicker.title')}
          </h3>
          <div className="flex items-center gap-3">
            <div className="relative">
              <Search size={14} className="absolute left-[10px] top-1/2 -translate-y-1/2 text-[var(--bo-text-dim)]" />
              <input
                ref={searchRef}
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={t('sectionPicker.searchPlaceholder')}
                className="pl-8 pr-3 py-[0.4rem] text-[0.82rem] bg-[var(--bo-bg)] border border-[var(--bo-border)] rounded-lg text-[var(--bo-text)] w-[200px] placeholder:text-[var(--bo-text-dim)] placeholder:opacity-50"
              />
            </div>
            <button
              onClick={onClose}
              className="p-1 rounded-lg text-[var(--bo-text-dim)] hover:text-[var(--bo-text)] hover:bg-[rgba(255,255,255,0.06)] transition-colors"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Contenu scrollable */}
        <div className="flex-1 overflow-y-auto px-5 py-4">
          {!hasResults ? (
            <p className="text-center text-[var(--bo-text-dim)] text-[0.85rem] py-8 m-0">
              {t('sectionPicker.noResults')}
            </p>
          ) : (
            <>
              {/* Sections natives */}
              {filteredBuiltIn.length > 0 && (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {filteredBuiltIn.map(st => (
                    <button
                      key={st.type}
                      onClick={() => { setNaming({ type: st.type }); setNameValue(''); setTimeout(() => nameRef.current?.focus(), 50); }}
                      className="group flex flex-col bg-[var(--bo-bg)] border border-[var(--bo-border)] rounded-xl overflow-hidden text-left cursor-pointer transition-all duration-150 hover:border-[var(--bo-green)] hover:shadow-[0_0_0_1px_var(--bo-green)]"
                    >
                      <SectionPreview type={st.type} />
                      <div className="px-3 py-[0.6rem]">
                        <span className="block text-[0.82rem] font-semibold text-[var(--bo-text)] group-hover:text-[var(--bo-green)] transition-colors">
                          {t(`sectionType.${st.type}`)}
                        </span>
                        <span className="block text-[0.72rem] text-[var(--bo-text-dim)] mt-[2px] leading-snug">
                          {t(SECTION_DESCRIPTIONS[st.type] ?? 'sectionPicker.descDefault')}
                        </span>
                      </div>
                    </button>
                  ))}
                </div>
              )}

              {/* Séparateur + Sections personnalisées */}
              {filteredLayouts.length > 0 && (
                <>
                  <div className="flex items-center gap-3 my-5">
                    <div className="flex-1 h-px bg-[var(--bo-border)]" />
                    <span className="text-[0.72rem] uppercase tracking-[0.12em] text-[var(--bo-text-dim)] font-semibold shrink-0">
                      {t('sectionPicker.customLayouts')}
                    </span>
                    <div className="flex-1 h-px bg-[var(--bo-border)]" />
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {filteredLayouts.map(layout => (
                      <button
                        key={layout.id}
                        onClick={() => { setNaming({ type: 'custom-layout', layoutId: layout.id }); setNameValue(''); setTimeout(() => nameRef.current?.focus(), 50); }}
                        className="group flex flex-col bg-[var(--bo-bg)] border border-[var(--bo-border)] rounded-xl overflow-hidden text-left cursor-pointer transition-all duration-150 hover:border-[var(--bo-green)] hover:shadow-[0_0_0_1px_var(--bo-green)]"
                      >
                        {/* Preview grille du layout */}
                        <div className="w-full aspect-[5/3] bg-[var(--bo-bg)] rounded-lg overflow-hidden p-2">
                          <LayoutPreview layout={layout} />
                        </div>
                        <div className="px-3 py-[0.6rem]">
                          <span className="block text-[0.82rem] font-semibold text-[var(--bo-text)] group-hover:text-[var(--bo-green)] transition-colors">
                            {layout.label}
                          </span>
                          {layout.description && (
                            <span className="block text-[0.72rem] text-[var(--bo-text-dim)] mt-[2px] leading-snug">
                              {layout.description}
                            </span>
                          )}
                        </div>
                      </button>
                    ))}
                  </div>
                </>
              )}
            </>
          )}
        </div>

        {/* Sous-modale de nommage */}
        {naming && (
          <div
            className="absolute inset-0 z-10 flex items-center justify-center bg-black/40"
            onMouseDown={(e) => { if (e.target === e.currentTarget) setNaming(null); }}
          >
            <div className="bg-[var(--bo-surface)] border border-[var(--bo-border)] rounded-xl p-5 w-[320px] shadow-2xl">
              <h4 className="text-[0.85rem] font-semibold text-[var(--bo-text)] m-0 mb-3">
                {t('sectionPicker.namingTitle')}
              </h4>
              <p className="text-[0.75rem] text-[var(--bo-text-dim)] m-0 mb-3">
                {t('sectionPicker.namingHint')}
              </p>
              <input
                ref={nameRef}
                type="text"
                value={nameValue}
                maxLength={MAX_LABEL}
                onChange={(e) => setNameValue(e.target.value)}
                placeholder={t(`sectionType.${naming.type}`)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    onSelect(naming.type, naming.layoutId, nameValue.trim() || undefined);
                  }
                }}
                className="w-full px-3 py-2 text-[0.85rem] bg-[var(--bo-bg)] border border-[var(--bo-border)] rounded-lg text-[var(--bo-text)] outline-none focus:border-[var(--bo-accent)]"
              />
              <div className="text-right mt-1">
                <span className={`text-[0.65rem] tabular-nums ${
                  MAX_LABEL - nameValue.length <= 0 ? 'text-[#e55a2a]' :
                  MAX_LABEL - nameValue.length <= 3 ? 'text-[#f59e0b]' :
                  'text-[var(--bo-text-dim)]'
                }`}>
                  {nameValue.length}/{MAX_LABEL}
                </span>
              </div>
              <div className="flex justify-end gap-2 mt-3">
                <button
                  className="px-4 py-2 text-[0.8rem] bg-transparent border border-[var(--bo-border)] text-[var(--bo-text)] rounded-lg cursor-pointer hover:bg-[rgba(255,255,255,0.06)] transition-colors"
                  onClick={() => setNaming(null)}
                >
                  {t('common.cancel')}
                </button>
                <button
                  className="px-4 py-2 text-[0.8rem] bg-[var(--bo-green)] text-white border-none rounded-lg cursor-pointer hover:brightness-110 transition-all"
                  onClick={() => onSelect(naming.type, naming.layoutId, nameValue.trim() || undefined)}
                >
                  {t('common.add')}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * Mini preview de la grille d'un layout personnalisé.
 */
function LayoutPreview({ layout }: { layout: Layout }) {
  const maxRow = Math.max(...layout.blocks.map(b => b.row), 1);
  const maxCol = Math.max(...layout.blocks.map(b => b.col + (b.colSpan || 1) - 1), 4);

  return (
    <svg viewBox={`0 0 ${maxCol * 40} ${maxRow * 30}`} className="w-full h-full">
      {layout.blocks.map(block => (
        <rect
          key={block.blockId}
          x={(block.col - 1) * 40 + 2}
          y={(block.row - 1) * 30 + 2}
          width={(block.colSpan || 1) * 40 - 4}
          height={26}
          rx="3"
          fill="var(--bo-green)"
          opacity={0.15 + (block.type === 'image' ? 0.1 : 0)}
        />
      ))}
    </svg>
  );
}
