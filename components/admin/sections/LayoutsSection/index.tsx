'use client';

import { useState, useEffect } from 'react';
import { useI18n } from '@/lib/i18n/context';
import { useAdminStore } from '@/lib/admin/store';
import { useFlashMessage } from '@/lib/hooks/useFlashMessage';
import { LayoutEditor } from './components/LayoutEditor';
import type { Layout } from '@/lib/schemas/layouts';

export function LayoutsSection() {
  const { t, tp } = useI18n();
  const layouts = useAdminStore((s) => s.layouts);
  const loadLayouts = useAdminStore((s) => s.loadLayouts);
  const storeDeleteLayout = useAdminStore((s) => s.deleteLayout);
  const [editingLayout, setEditingLayout] = useState<Layout | null | 'new'>(null);
  const { message, show } = useFlashMessage();

  useEffect(() => { loadLayouts(); }, [loadLayouts]);

  const deleteLayout = async (layoutId: string) => {
    if (!confirm(t('layouts.confirmDelete'))) return;
    const result = await storeDeleteLayout(layoutId);
    if (result.ok) {
      show(t('layouts.deleteSuccess'), 'success');
    } else {
      show(result.error || 'Erreur', 'error');
    }
  };

  const handleSaved = () => {
    setEditingLayout(null);
    loadLayouts();
  };

  return (
    <div className="carousel-section" id="layouts-section">
      <div className="carousel-section-header">
        <div>
          <h2>{t('layouts.sectionTitle')}</h2>
          <div className="carousel-info">{tp('layouts.count', layouts.length)}</div>
        </div>
      </div>

      {layouts.length === 0 ? (
        <p className="text-[var(--bo-text-dim)] p-4">{t('layouts.empty')}</p>
      ) : (
        layouts.map(layout => (
          <LayoutCard
            key={layout.id}
            layout={layout}
            isEditing={editingLayout !== 'new' && editingLayout?.id === layout.id}
            onEdit={() => setEditingLayout(editingLayout !== 'new' && editingLayout?.id === layout.id ? null : layout)}
            onDelete={() => deleteLayout(layout.id)}
            onSaved={handleSaved}
            onCancel={() => setEditingLayout(null)}
          />
        ))
      )}

      {editingLayout === 'new' && (
        <LayoutEditor
          existingLayout={null}
          onCancel={() => setEditingLayout(null)}
          onSaved={handleSaved}
        />
      )}

      {message && <div className={`form-message ${message.type}`}>{message.text}</div>}

      <div className="flex justify-end mt-3">
        <button className="btn btn-success" onClick={() => setEditingLayout('new')}>
          {t('layouts.btnNew')}
        </button>
      </div>
    </div>
  );
}

// ─── Carte individuelle d'un layout ───────────────────────────────────────────

interface LayoutCardProps {
  layout: Layout;
  isEditing: boolean;
  onEdit: () => void;
  onDelete: () => void;
  onSaved: () => void;
  onCancel: () => void;
}

function LayoutCard({ layout, isEditing, onEdit, onDelete, onSaved, onCancel }: LayoutCardProps) {
  const { t, tp } = useI18n();

  return (
    <div className="border border-[var(--bo-border)] rounded-2xl overflow-hidden mb-[0.8rem]">
      <div className="flex items-center justify-between p-[0.9rem_1.2rem] bg-[var(--bo-surface-2,rgba(255,255,255,0.03))]">
        <div className="flex items-center gap-[0.8rem] flex-wrap">
          <span className="font-['Plus_Jakarta_Sans',sans-serif] text-[1rem] text-[var(--bo-text)]">{layout.label}</span>
          <span className="text-[0.8rem] text-[var(--bo-text-dim)] font-mono">{layout.id} — {tp('layouts.blockCount', layout.blocks.length)}</span>
        </div>
        <div className="flex gap-[0.5rem]">
          <button className="btn btn-secondary btn-sm" onClick={onEdit}>
            {isEditing ? t('layouts.btnCancel') : t('layouts.btnEdit')}
          </button>
          <button className="btn btn-danger btn-sm" onClick={onDelete}>
            {t('layouts.btnDelete')}
          </button>
        </div>
      </div>

      {isEditing && (
        <div className="p-[1rem_1.2rem] border-t border-[var(--bo-border)]">
          <LayoutEditor
            existingLayout={layout}
            onCancel={onCancel}
            onSaved={onSaved}
          />
        </div>
      )}
    </div>
  );
}
