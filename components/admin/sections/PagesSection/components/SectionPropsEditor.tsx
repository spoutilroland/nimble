'use client';

import { useState } from 'react';
import { useI18n } from '@/lib/i18n/context';
import { MediaSourcePicker } from '@/components/admin/shared/MediaSourcePicker';
import type { Section } from '@/lib/types';

interface StatItem { count: number; label: string; }
interface PolaroidItem { title: string; tag: string; tagColor: string; imageUrl?: string; }
interface CinematicProject { tags: string[]; metaItems: string[]; imageUrl?: string; }

interface Props {
  section: Section;
  onUpdate: (updates: Partial<Section>) => void;
}

const TAG_COLORS = ['bois', 'green', 'slate'] as const;

/* Compteur de caractères inline, affiché juste après le champ */
function CharCount({ len, max }: { len: number; max: number }) {
  const remaining = max - len;
  const color =
    remaining === 0 ? 'text-[#f87171]' :
    remaining <= 5  ? 'text-[#fb923c]' :
                      'text-[var(--bo-text-dim)]';
  return (
    <span className={`shrink-0 text-[0.6rem] tabular-nums leading-none ${color}`}>
      {len}/{max}
    </span>
  );
}

export function SectionPropsEditor({ section, onUpdate }: Props) {
  const { t } = useI18n();
  const [uploading, setUploading] = useState<Record<number, boolean>>({});
  const [pickerOpenFor, setPickerOpenFor] = useState<number | null>(null);

  const updateProps = (patch: Record<string, unknown>) => {
    onUpdate({ props: { ...(section.props || {}), ...patch } });
  };

  /* ── Statistiques ─────────────────────────────────── */
  if (section.type === 'stats') {
    const items: StatItem[] = (section.props?.items as StatItem[] | undefined) || [
      { count: 150, label: 'Chantiers réalisés' },
      { count: 15, label: "Années d'expérience" },
      { count: 98, label: 'Clients satisfaits %' },
      { count: 3, label: 'Départements' },
    ];

    const setItems = (next: StatItem[]) => updateProps({ items: next });

    return (
      <div className="border-t border-dashed border-[rgba(255,255,255,0.1)] mt-[0.4rem] pt-2 flex flex-col gap-[0.35rem]">
        <div className="text-[0.68rem] uppercase tracking-[0.1em] text-[var(--bo-text-dim)] mb-[0.1rem]">{t('sectionProps.configTitle')}</div>
        {items.map((item, i) => (
          <div key={i} className="flex gap-[0.35rem] items-center">
            <input
              type="number"
              className="flex-[0_0_80px] py-[0.2rem] px-[0.4rem] text-[0.78rem] bg-[var(--bo-input-bg,rgba(255,255,255,0.06))] border border-[var(--bo-border)] text-[var(--bo-text)] text-center"
              value={item.count}
              min={0}
              max={9999999}
              placeholder={t('sectionProps.statsCountPlaceholder')}
              onChange={(e) => {
                const val = parseInt(e.target.value) || 0;
                const next = [...items];
                next[i] = { ...next[i], count: Math.min(val, 9999999) };
                setItems(next);
              }}
            />
            <input
              type="text"
              className="flex-[1_1_0%] min-w-0 py-[0.2rem] px-[0.4rem] text-[0.78rem] bg-[var(--bo-input-bg,rgba(255,255,255,0.06))] border border-[var(--bo-border)] text-[var(--bo-text)]"
              value={item.label}
              maxLength={35}
              placeholder={t('sectionProps.statsLabelPlaceholder')}
              onChange={(e) => {
                const next = [...items];
                next[i] = { ...next[i], label: e.target.value };
                setItems(next);
              }}
            />
            <CharCount len={item.label.length} max={35} />
            <button
              className="shrink-0 py-[0.15rem] px-[0.35rem] bg-[rgba(229,90,42,0.08)] border border-[rgba(229,90,42,0.25)] text-[#e55a2a] cursor-pointer text-[0.8rem] leading-none hover:bg-[rgba(229,90,42,0.18)]"
              onClick={() => setItems(items.filter((_, j) => j !== i))}
            >×</button>
          </div>
        ))}
        {items.length < 6 ? (
          <button
            className="text-[0.72rem] text-[var(--bo-green)] bg-transparent border border-dashed border-[var(--bo-green)] py-[0.2rem] px-2 cursor-pointer self-start hover:bg-[rgba(52,211,153,0.07)]"
            onClick={() => setItems([...items, { count: 0, label: '' }])}
          >
            {t('sectionProps.statsAddItem')}
          </button>
        ) : (
          <span className="text-[0.68rem] text-[var(--bo-text-dim)] italic">{t('sectionProps.statsMaxReached')}</span>
        )}
      </div>
    );
  }

  /* ── Polaroids ────────────────────────────────────── */
  if (section.type === 'polaroids') {
    const items: PolaroidItem[] = (section.props?.items as PolaroidItem[] | undefined) || [
      { title: 'Terrasse mélèze', tag: 'Terrasse', tagColor: 'bois' },
      { title: 'Muret en pierres sèches', tag: 'Maçonnerie', tagColor: 'green' },
      { title: 'Allée en dalles granit', tag: 'Allée', tagColor: 'slate' },
      { title: 'Bardage vieux bois', tag: 'Bardage', tagColor: 'bois' },
    ];

    const setItems = (next: PolaroidItem[]) => updateProps({ items: next });

    const uploadPolaroidImage = async (i: number, file: File) => {
      if (!section.carouselId) return;
      setUploading(prev => ({ ...prev, [i]: true }));
      const formData = new FormData();
      formData.append('image', file);
      try {
        const res = await fetch(`/api/admin/upload/${section.carouselId}`, { method: 'POST', body: formData });
        const data = await res.json();
        if (data.url) {
          const next = [...items];
          next[i] = { ...next[i], imageUrl: data.url };
          setItems(next);
        }
      } finally {
        setUploading(prev => ({ ...prev, [i]: false }));
      }
    };

    return (
      <div className="border-t border-dashed border-[rgba(255,255,255,0.1)] mt-[0.4rem] pt-2 flex flex-col gap-[0.4rem]">
        <div className="text-[0.68rem] uppercase tracking-[0.1em] text-[var(--bo-text-dim)] mb-[0.1rem]">{t('sectionProps.configTitle')}</div>

        {items.map((item, i) => (
          <div key={i} className="flex flex-col gap-[0.2rem]">
            <div className="flex gap-[0.35rem] items-center">
              {/* Aperçu image */}
              <button
                type="button"
                className="shrink-0 w-[38px] h-[38px] border border-dashed border-[var(--bo-border)] cursor-pointer flex items-center justify-center overflow-hidden bg-[rgba(255,255,255,0.04)] hover:border-[var(--bo-text-dim)] transition-colors p-0"
                title="Changer l'image"
                onClick={() => setPickerOpenFor(i)}
                disabled={uploading[i]}
              >
                {uploading[i] ? (
                  <span className="text-[0.6rem] text-[var(--bo-text-dim)]">…</span>
                ) : item.imageUrl ? (
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img src={item.imageUrl} alt="" className="w-full h-full object-cover" />
                ) : (
                  <span className="text-[var(--bo-text-dim)] text-[1rem] leading-none">+</span>
                )}
              </button>

              {/* Titre */}
              <input
                type="text"
                className="flex-[2_1_0%] min-w-0 py-[0.2rem] px-[0.4rem] text-[0.78rem] bg-[var(--bo-input-bg,rgba(255,255,255,0.06))] border border-[var(--bo-border)] text-[var(--bo-text)]"
                value={item.title}
                maxLength={45}
                placeholder={t('sectionProps.polaroidItemTitle')}
                onChange={(e) => {
                  const next = [...items];
                  next[i] = { ...next[i], title: e.target.value };
                  setItems(next);
                }}
              />
              <CharCount len={item.title.length} max={45} />

              {/* Tag */}
              <input
                type="text"
                className="flex-[0_0_70px] min-w-0 py-[0.2rem] px-[0.4rem] text-[0.78rem] bg-[var(--bo-input-bg,rgba(255,255,255,0.06))] border border-[var(--bo-border)] text-[var(--bo-text)]"
                value={item.tag}
                maxLength={15}
                placeholder={t('sectionProps.polaroidItemTag')}
                onChange={(e) => {
                  const next = [...items];
                  next[i] = { ...next[i], tag: e.target.value };
                  setItems(next);
                }}
              />
              <CharCount len={item.tag.length} max={15} />

              {/* Couleur */}
              <select
                className="shrink-0 py-[0.2rem] px-[0.3rem] text-[0.78rem] bg-[var(--bo-bg,#0b0d12)] border border-[var(--bo-border)] text-[var(--bo-text)]"
                value={item.tagColor}
                onChange={(e) => {
                  const next = [...items];
                  next[i] = { ...next[i], tagColor: e.target.value };
                  setItems(next);
                }}
              >
                {TAG_COLORS.map((c) => (
                  <option key={c} value={c}>{t(`sectionProps.tagColor_${c}`)}</option>
                ))}
              </select>

              {/* Supprimer */}
              <button
                className="shrink-0 py-[0.15rem] px-[0.35rem] bg-[rgba(229,90,42,0.08)] border border-[rgba(229,90,42,0.25)] text-[#e55a2a] cursor-pointer text-[0.8rem] leading-none hover:bg-[rgba(229,90,42,0.18)]"
                onClick={() => setItems(items.filter((_, j) => j !== i))}
              >×</button>
            </div>
          </div>
        ))}

        {items.length < 12 ? (
          <button
            className="text-[0.72rem] text-[var(--bo-green)] bg-transparent border border-dashed border-[var(--bo-green)] py-[0.2rem] px-2 cursor-pointer self-start hover:bg-[rgba(52,211,153,0.07)]"
            onClick={() => setItems([...items, { title: '', tag: '', tagColor: 'bois' }])}
          >
            {t('sectionProps.polaroidAddItem')}
          </button>
        ) : (
          <span className="text-[0.65rem] text-[var(--bo-text-dim)]">Maximum 12 polaroids</span>
        )}

        {section.carouselId && pickerOpenFor !== null && (
          <MediaSourcePicker
            carouselId={section.carouselId}
            isOpen={pickerOpenFor !== null}
            onClose={() => setPickerOpenFor(null)}
            onFileUpload={(files) => {
              const file = files[0];
              if (file && pickerOpenFor !== null) uploadPolaroidImage(pickerOpenFor, file);
            }}
            onSuccess={() => {}}
            onPickFromLibrary={(url) => {
              if (pickerOpenFor !== null) {
                const next = [...items];
                next[pickerOpenFor] = { ...next[pickerOpenFor], imageUrl: url };
                setItems(next);
                setPickerOpenFor(null);
              }
            }}
          />
        )}
      </div>
    );
  }


  /* ── Cinematic Split ─────────────────────────────────────── */
  if (section.type === 'cinematic-split') {
    const DEFAULTS: CinematicProject[] = [
      { tags: ['Cuisine', 'Bois massif'], metaItems: ['Savoie 73', '6 semaines'] },
      { tags: ['Salle de bain', 'Carrelage'], metaItems: ['Haute-Savoie 74', '4 semaines'] },
      { tags: ['Parquet', 'Salon'], metaItems: ['Isère 38', '8 semaines'] },
    ];

    const projects: CinematicProject[] =
      (section.props?.projects as CinematicProject[] | undefined) || DEFAULTS;

    const setProjects = (next: CinematicProject[]) => updateProps({ projects: next });

    const uploadCinematicImage = async (pi: number, file: File) => {
      if (!section.carouselId) return;
      setUploading(prev => ({ ...prev, [pi]: true }));
      const formData = new FormData();
      formData.append('image', file);
      try {
        const res = await fetch(`/api/admin/upload/${section.carouselId}`, { method: 'POST', body: formData });
        const data = await res.json();
        if (data.url) {
          setProjects(projects.map((p, i) => i === pi ? { ...p, imageUrl: data.url } : p));
        }
      } finally {
        setUploading(prev => ({ ...prev, [pi]: false }));
      }
    };

    /* max: 20 pour les tags, 25 pour les metaItems */
    const renderItemGroup = (
      pi: number,
      field: 'tags' | 'metaItems',
      fieldItems: string[],
      label: string,
      placeholder: string,
      addLabel: string,
      maxLabel: string,
      maxLen: number,
    ) => {
      const atMax = fieldItems.length >= 3;
      return (
        <div className="flex flex-col gap-[0.25rem]">
          <div className="text-[0.65rem] uppercase tracking-[0.08em] text-[var(--bo-text-dim)]">{label}</div>
          {fieldItems.map((item, ti) => (
            <div key={ti} className="flex gap-[0.3rem] items-center">
              <input
                type="text"
                className="flex-1 min-w-0 py-[0.2rem] px-[0.4rem] text-[0.78rem] bg-[var(--bo-input-bg,rgba(255,255,255,0.06))] border border-[var(--bo-border)] text-[var(--bo-text)]"
                value={item}
                maxLength={maxLen}
                placeholder={placeholder}
                onChange={(e) => {
                  const next = [...fieldItems];
                  next[ti] = e.target.value;
                  setProjects(projects.map((p, i) => i === pi ? { ...p, [field]: next } : p));
                }}
              />
              <CharCount len={item.length} max={maxLen} />
              <button
                className="shrink-0 py-[0.15rem] px-[0.35rem] bg-[rgba(229,90,42,0.08)] border border-[rgba(229,90,42,0.25)] text-[#e55a2a] cursor-pointer text-[0.8rem] leading-none hover:bg-[rgba(229,90,42,0.18)]"
                onClick={() => setProjects(projects.map((p, i) => i === pi ? { ...p, [field]: fieldItems.filter((_, j) => j !== ti) } : p))}
              >×</button>
            </div>
          ))}
          {!atMax ? (
            <button
              className="text-[0.68rem] text-[var(--bo-green)] bg-transparent border border-dashed border-[var(--bo-green)] py-[0.15rem] px-2 cursor-pointer self-start hover:bg-[rgba(52,211,153,0.07)]"
              onClick={() => setProjects(projects.map((p, i) => i === pi ? { ...p, [field]: [...fieldItems, ''] } : p))}
            >{addLabel}</button>
          ) : (
            <span className="text-[0.65rem] text-[var(--bo-text-dim)]">{maxLabel}</span>
          )}
        </div>
      );
    };

    return (
      <div className="border-t border-dashed border-[rgba(255,255,255,0.1)] mt-[0.4rem] pt-2 flex flex-col gap-[0.7rem]">
        <div className="text-[0.68rem] uppercase tracking-[0.1em] text-[var(--bo-text-dim)]">{t('sectionProps.configTitle')}</div>
        {projects.map((proj, pi) => {
          const tags: string[] = proj.tags ?? (proj as unknown as { tagsAbove?: string[] }).tagsAbove ?? [];
          const metaItems: string[] = proj.metaItems ?? [];
          return (
            <div key={pi} className="flex gap-[0.6rem] pl-2 border-l border-[rgba(255,255,255,0.08)]">
              {/* Aperçu image */}
              <button
                type="button"
                className="shrink-0 w-[46px] h-[46px] self-start border border-dashed border-[var(--bo-border)] cursor-pointer flex items-center justify-center overflow-hidden bg-[rgba(255,255,255,0.04)] hover:border-[var(--bo-text-dim)] transition-colors p-0 mt-[0.1rem]"
                title="Changer l'image"
                onClick={() => setPickerOpenFor(pi)}
                disabled={uploading[pi]}
              >
                {uploading[pi] ? (
                  <span className="text-[0.6rem] text-[var(--bo-text-dim)]">…</span>
                ) : proj.imageUrl ? (
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img src={proj.imageUrl} alt="" className="w-full h-full object-cover" />
                ) : (
                  <span className="text-[var(--bo-text-dim)] text-[1rem] leading-none">+</span>
                )}
              </button>

              {/* Tags + méta */}
              <div className="flex-1 flex flex-col gap-[0.4rem]">
                <div className="text-[0.72rem] text-[var(--bo-text)] font-semibold">{t('sectionProps.cinematicProject')} {pi + 1}</div>
                {renderItemGroup(pi, 'tags', tags, t('sectionProps.cinematicTags'), t('sectionProps.cinematicTagPlaceholder'), t('sectionProps.cinematicAddTag'), t('sectionProps.cinematicTagsMax'), 20)}
                {renderItemGroup(pi, 'metaItems', metaItems, t('sectionProps.cinematicMeta'), t('sectionProps.cinematicMetaPlaceholder'), t('sectionProps.cinematicAddMeta'), t('sectionProps.cinematicMetaMax'), 25)}
              </div>
            </div>
          );
        })}

        {section.carouselId && pickerOpenFor !== null && (
          <MediaSourcePicker
            carouselId={section.carouselId}
            isOpen={pickerOpenFor !== null}
            onClose={() => setPickerOpenFor(null)}
            onFileUpload={(files) => {
              const file = files[0];
              if (file && pickerOpenFor !== null) uploadCinematicImage(pickerOpenFor, file);
            }}
            onSuccess={() => {}}
            onPickFromLibrary={(url) => {
              if (pickerOpenFor !== null) {
                setProjects(projects.map((p, i) => i === pickerOpenFor ? { ...p, imageUrl: url } : p));
                setPickerOpenFor(null);
              }
            }}
          />
        )}
      </div>
    );
  }

  return null;
}
