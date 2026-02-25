'use client';

import { useLayoutEditor } from '../hooks/useLayoutEditor';
import { CanvasBlock } from './CanvasBlock';
import { LayoutPreview } from './LayoutPreview';
import { LAYOUT_BLOCK_TYPES } from '@/lib/admin/constants/blocks';
import type { Layout } from '@/lib/schemas/layouts';

interface LayoutEditorProps {
  existingLayout: Layout | null;
  onCancel: () => void;
  onSaved: () => void;
}

export function LayoutEditor({ existingLayout, onCancel, onSaved }: LayoutEditorProps) {
  const {
    isNew,
    label,
    id,
    setId,
    blocks,
    message,
    hasOverlap,
    handleLabelChange,
    addBlock,
    removeBlock,
    updateBlock,
    save,
    t,
  } = useLayoutEditor({ existingLayout, onSaved });

  return (
    <div className="layout-editor">
      <h3 className="site-form-category mt-4">
        {isNew ? t('layouts.editorTitleNew') : t('layouts.editorTitleEdit', { name: label })}
      </h3>

      <div className="grid grid-cols-2 gap-4">
        <div className="form-group">
          <label>{t('layouts.nameLabel')}</label>
          <input
            type="text"
            value={label}
            placeholder={t('layouts.namePlaceholder')}
            onChange={(e) => handleLabelChange(e.target.value)}
          />
        </div>
        <div className="form-group">
          <label>{t('layouts.idAutoLabel')}</label>
          <input
            type="text"
            value={id}
            placeholder={t('layouts.idPlaceholder')}
            readOnly={!isNew}
            onChange={(e) => setId(e.target.value)}
          />
        </div>
      </div>

      {/* Builder : palette + canvas */}
      <div className="flex gap-4 mt-4">
        <div className="w-48 shrink-0">
          <div className="layout-palette-title">{t('layouts.paletteTitle')}</div>
          {LAYOUT_BLOCK_TYPES.map(bt => (
            <div key={bt.type} className="palette-block" onClick={() => addBlock(bt.type)}>
              <span className="palette-icon">{bt.icon}</span> {t(bt.labelKey)}
              <button className="palette-add-btn" title={t('block.addTitle')}>+</button>
            </div>
          ))}
        </div>

        <div className="flex-1 min-w-0">
          <div className="layout-canvas-title">{t('layouts.canvasTitle')}</div>
          <div className="layout-canvas">
            {blocks.length === 0 && (
              <div className="layout-canvas-drop-hint">{t('layouts.canvasHint')}</div>
            )}
            {blocks.map(block => (
              <CanvasBlock
                key={block.blockId}
                block={block}
                onUpdate={(updates) => updateBlock(block.blockId, updates)}
                onRemove={() => removeBlock(block.blockId)}
              />
            ))}
          </div>
          {hasOverlap && (
            <div className="layout-overlap-warning">
              {t('layouts.overlapWarning')}
            </div>
          )}
        </div>
      </div>

      <LayoutPreview blocks={blocks} />

      {/* Actions */}
      <div className="flex justify-between items-center mt-4">
        <button className="btn btn-secondary" onClick={onCancel}>{t('layouts.btnCancel')}</button>
        <div className="flex items-center gap-[0.8rem]">
          {message && <span className={`form-message ${message.type}`}>{message.text}</span>}
          <button className="btn btn-success" onClick={save}>{t('layouts.btnSave')}</button>
        </div>
      </div>
    </div>
  );
}
