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
  const [collapsed, setCollapsed] = useState(true);
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
        <div className="flex items-center gap-[0.8rem]">
          <button
            className="btn-collapse"
            title={t('layouts.collapseTitle')}
            onClick={() => setCollapsed(!collapsed)}
          >
            {collapsed ? '\u25B6' : '\u25BC'}
          </button>
          <div>
            <h2>{t('layouts.sectionTitle')}</h2>
            <div className="carousel-info">
              {layouts.length} layout{layouts.length !== 1 ? 's' : ''} — {t('layouts.sectionInfo')}
            </div>
          </div>
        </div>
        <button className="btn btn-success" onClick={() => { setCollapsed(false); setEditingLayout('new'); }}>
          {t('layouts.btnNew')}
        </button>
      </div>

      {!collapsed && (
        <div>
          {layouts.length === 0 ? (
            <p className="text-[var(--text-muted)] p-4">{t('layouts.empty')}</p>
          ) : (
            layouts.map(layout => (
              <div key={layout.id} className="layout-card">
                <div className="layout-card-info">
                  <span className="layout-card-name">{layout.label}</span>
                  <span className="layout-card-meta">
                    {tp('layouts.blockCount', layout.blocks.length)} — {t('layouts.idPrefix')} {layout.id}
                  </span>
                </div>
                <div className="layout-card-actions">
                  <button className="btn btn-secondary btn-sm" onClick={() => setEditingLayout(layout)}>
                    {t('layouts.btnEdit')}
                  </button>
                  <button className="btn btn-danger btn-sm" onClick={() => deleteLayout(layout.id)}>
                    {t('layouts.btnDelete')}
                  </button>
                </div>
              </div>
            ))
          )}

          {editingLayout !== null && (
            <LayoutEditor
              existingLayout={editingLayout === 'new' ? null : editingLayout}
              onCancel={() => setEditingLayout(null)}
              onSaved={handleSaved}
            />
          )}

          {message && <div className={`form-message ${message.type}`}>{message.text}</div>}
        </div>
      )}
    </div>
  );
}
