'use client';

import { useI18n } from '@/lib/i18n/context';
import type { Section } from '@/lib/types';

interface StatItem { count: number; label: string; }
interface PolaroidItem { title: string; tag: string; tagColor: string; }

interface Props {
  section: Section;
  onUpdate: (updates: Partial<Section>) => void;
}

const TAG_COLORS = ['bois', 'green', 'slate'] as const;

export function SectionPropsEditor({ section, onUpdate }: Props) {
  const { t } = useI18n();

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
              className="flex-[0_0_100px] py-[0.2rem] px-[0.4rem] text-[0.78rem] bg-[var(--bo-input-bg,rgba(255,255,255,0.06))] border border-[var(--bo-border)] text-[var(--bo-text)] text-center"
              value={item.count}
              min={0}
              placeholder={t('sectionProps.statsCountPlaceholder')}
              onChange={(e) => {
                const next = [...items];
                next[i] = { ...next[i], count: parseInt(e.target.value) || 0 };
                setItems(next);
              }}
            />
            <input
              type="text"
              className="flex-[1_1_0%] min-w-0 py-[0.2rem] px-[0.4rem] text-[0.78rem] bg-[var(--bo-input-bg,rgba(255,255,255,0.06))] border border-[var(--bo-border)] text-[var(--bo-text)]"
              value={item.label}
              placeholder={t('sectionProps.statsLabelPlaceholder')}
              onChange={(e) => {
                const next = [...items];
                next[i] = { ...next[i], label: e.target.value };
                setItems(next);
              }}
            />
            <button
              className="shrink-0 py-[0.15rem] px-[0.35rem] bg-[rgba(229,90,42,0.08)] border border-[rgba(229,90,42,0.25)] text-[#e55a2a] cursor-pointer text-[0.8rem] leading-none hover:bg-[rgba(229,90,42,0.18)]"
              onClick={() => setItems(items.filter((_, j) => j !== i))}
            >×</button>
          </div>
        ))}
        <button
          className="text-[0.72rem] text-[var(--bo-green)] bg-transparent border border-dashed border-[var(--bo-green)] py-[0.2rem] px-2 cursor-pointer self-start hover:bg-[rgba(52,211,153,0.07)]"
          onClick={() => setItems([...items, { count: 0, label: '' }])}
        >
          {t('sectionProps.statsAddItem')}
        </button>
      </div>
    );
  }

  /* ── Polaroids ────────────────────────────────────── */
  if (section.type === 'polaroids') {
    const sectionTag = (section.props?.tag as string | undefined) || '';
    const sectionTitle = (section.props?.title as string | undefined) || '';
    const items: PolaroidItem[] = (section.props?.items as PolaroidItem[] | undefined) || [
      { title: 'Terrasse mélèze', tag: 'Terrasse', tagColor: 'bois' },
      { title: 'Muret en pierres sèches', tag: 'Maçonnerie', tagColor: 'green' },
      { title: 'Allée en dalles granit', tag: 'Allée', tagColor: 'slate' },
      { title: 'Bardage vieux bois', tag: 'Bardage', tagColor: 'bois' },
    ];

    const setItems = (next: PolaroidItem[]) => updateProps({ items: next });

    return (
      <div className="border-t border-dashed border-[rgba(255,255,255,0.1)] mt-[0.4rem] pt-2 flex flex-col gap-[0.35rem]">
        <div className="text-[0.68rem] uppercase tracking-[0.1em] text-[var(--bo-text-dim)] mb-[0.1rem]">{t('sectionProps.configTitle')}</div>

        {/* Titre et tag de la section */}
        <div className="flex gap-[0.35rem] items-center">
          <input
            type="text"
            className="flex-[1_1_0%] min-w-0 py-[0.2rem] px-[0.4rem] text-[0.78rem] bg-[var(--bo-input-bg,rgba(255,255,255,0.06))] border border-[var(--bo-border)] text-[var(--bo-text)]"
            value={sectionTag}
            placeholder={t('sectionProps.polaroidTagPlaceholder')}
            onChange={(e) => updateProps({ tag: e.target.value })}
          />
          <input
            type="text"
            className="flex-[1_1_0%] min-w-0 py-[0.2rem] px-[0.4rem] text-[0.78rem] bg-[var(--bo-input-bg,rgba(255,255,255,0.06))] border border-[var(--bo-border)] text-[var(--bo-text)]"
            value={sectionTitle}
            placeholder={t('sectionProps.polaroidTitlePlaceholder')}
            onChange={(e) => updateProps({ title: e.target.value })}
          />
        </div>

        {/* Cartes polaroid */}
        {items.map((item, i) => (
          <div key={i} className="flex gap-[0.35rem] items-center">
            <input
              type="text"
              className="flex-[1_1_0%] min-w-0 py-[0.2rem] px-[0.4rem] text-[0.78rem] bg-[var(--bo-input-bg,rgba(255,255,255,0.06))] border border-[var(--bo-border)] text-[var(--bo-text)]"
              value={item.title}
              placeholder={t('sectionProps.polaroidItemTitle')}
              onChange={(e) => {
                const next = [...items];
                next[i] = { ...next[i], title: e.target.value };
                setItems(next);
              }}
            />
            <input
              type="text"
              className="flex-[1_1_0%] min-w-0 max-w-[90px] py-[0.2rem] px-[0.4rem] text-[0.78rem] bg-[var(--bo-input-bg,rgba(255,255,255,0.06))] border border-[var(--bo-border)] text-[var(--bo-text)]"
              value={item.tag}
              placeholder={t('sectionProps.polaroidItemTag')}
              onChange={(e) => {
                const next = [...items];
                next[i] = { ...next[i], tag: e.target.value };
                setItems(next);
              }}
            />
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
            <button
              className="shrink-0 py-[0.15rem] px-[0.35rem] bg-[rgba(229,90,42,0.08)] border border-[rgba(229,90,42,0.25)] text-[#e55a2a] cursor-pointer text-[0.8rem] leading-none hover:bg-[rgba(229,90,42,0.18)]"
              onClick={() => setItems(items.filter((_, j) => j !== i))}
            >×</button>
          </div>
        ))}
        <button
          className="text-[0.72rem] text-[var(--bo-green)] bg-transparent border border-dashed border-[var(--bo-green)] py-[0.2rem] px-2 cursor-pointer self-start hover:bg-[rgba(52,211,153,0.07)]"
          onClick={() => setItems([...items, { title: '', tag: '', tagColor: 'bois' }])}
        >
          {t('sectionProps.polaroidAddItem')}
        </button>
      </div>
    );
  }

  return null;
}
