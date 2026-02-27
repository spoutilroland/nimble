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
      <div className="section-props-editor">
        <div className="section-props-title">{t('sectionProps.configTitle')}</div>
        {items.map((item, i) => (
          <div key={i} className="section-props-item">
            <input
              type="number"
              className="section-props-count"
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
              className="section-props-input"
              value={item.label}
              placeholder={t('sectionProps.statsLabelPlaceholder')}
              onChange={(e) => {
                const next = [...items];
                next[i] = { ...next[i], label: e.target.value };
                setItems(next);
              }}
            />
            <button
              className="section-props-remove"
              onClick={() => setItems(items.filter((_, j) => j !== i))}
            >×</button>
          </div>
        ))}
        <button
          className="section-props-add"
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
      <div className="section-props-editor">
        <div className="section-props-title">{t('sectionProps.configTitle')}</div>

        {/* Titre et tag de la section */}
        <div className="section-props-item">
          <input
            type="text"
            className="section-props-input"
            value={sectionTag}
            placeholder={t('sectionProps.polaroidTagPlaceholder')}
            onChange={(e) => updateProps({ tag: e.target.value })}
          />
          <input
            type="text"
            className="section-props-input"
            value={sectionTitle}
            placeholder={t('sectionProps.polaroidTitlePlaceholder')}
            onChange={(e) => updateProps({ title: e.target.value })}
          />
        </div>

        {/* Cartes polaroid */}
        {items.map((item, i) => (
          <div key={i} className="section-props-item">
            <input
              type="text"
              className="section-props-input"
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
              className="section-props-input"
              style={{ maxWidth: '90px' }}
              value={item.tag}
              placeholder={t('sectionProps.polaroidItemTag')}
              onChange={(e) => {
                const next = [...items];
                next[i] = { ...next[i], tag: e.target.value };
                setItems(next);
              }}
            />
            <select
              className="section-props-select"
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
              className="section-props-remove"
              onClick={() => setItems(items.filter((_, j) => j !== i))}
            >×</button>
          </div>
        ))}
        <button
          className="section-props-add"
          onClick={() => setItems([...items, { title: '', tag: '', tagColor: 'bois' }])}
        >
          {t('sectionProps.polaroidAddItem')}
        </button>
      </div>
    );
  }

  return null;
}
