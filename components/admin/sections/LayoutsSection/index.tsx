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
          <div className="carousel-info">{tp('layouts.blockCount', layouts.length)}</div>
        </div>
        <button className="btn btn-success" onClick={() => setEditingLayout('new')}>
          {t('layouts.btnNew')}
        </button>
      </div>

      {layouts.length === 0 ? (
        <p className="text-[var(--bo-text-dim)] p-4">{t('layouts.empty')}</p>
      ) : (
        layouts.map(layout => (
          <LayoutCard
            key={layout.id}
            layout={layout}
            isEditing={editingLayout !== 'new' && editingLayout?.id === layout.id}
            onEdit={() => setEditingLayout(editingLayout?.id === layout.id ? null : layout)}
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
    <div className="page-card">
      <div className="page-card-header">
        <div className="page-card-info">
          <span className="page-card-title">{layout.label}</span>
          <span className="page-card-slug">{layout.id} — {tp('layouts.blockCount', layout.blocks.length)}</span>
        </div>
        <div className="page-card-actions">
          <button className="btn btn-secondary btn-sm" onClick={onEdit}>
            {isEditing ? t('layouts.btnCancel') : t('layouts.btnEdit')}
          </button>
          <button className="btn btn-danger btn-sm" onClick={onDelete}>
            {t('layouts.btnDelete')}
          </button>
        </div>
      </div>

      {isEditing && (
        <div className="page-card-edit">
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
