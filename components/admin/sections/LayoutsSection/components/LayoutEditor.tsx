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
    <div className="mt-4 p-4 bg-[rgba(255,255,255,0.03)] border border-[rgba(255,255,255,0.1)] rounded-lg">
      <h3 className="font-['Plus_Jakarta_Sans',sans-serif] text-[0.8rem] tracking-[0.12em] uppercase text-[var(--bo-green)] m-0 mb-4 mt-4">
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
          <div className="text-[0.8rem] font-semibold text-[var(--bo-text-dim)] uppercase tracking-[0.05em] mb-[0.6rem]">{t('layouts.paletteTitle')}</div>
          {LAYOUT_BLOCK_TYPES.map(bt => (
            <div key={bt.type} className="flex items-center gap-2 py-2 px-[0.7rem] bg-[var(--bo-card)] border border-[var(--bo-border)] rounded-md mb-[0.4rem] cursor-grab text-[var(--bo-text)] text-[0.85rem] transition-colors duration-150 hover:bg-[var(--bo-border)]" onClick={() => addBlock(bt.type)}>
              <span className="text-base w-5 text-center">{bt.icon}</span> {t(bt.labelKey)}
              <button className="ml-auto bg-[var(--bo-card)] border border-[var(--bo-border)] text-[var(--bo-text)] w-[22px] h-[22px] rounded cursor-pointer text-[0.9rem] leading-none flex items-center justify-center hover:bg-[var(--primary)] hover:text-white" title={t('block.addTitle')}>+</button>
            </div>
          ))}
        </div>

        <div className="flex-1 min-w-0">
          <div className="text-[0.8rem] font-semibold text-[var(--bo-text-dim)] uppercase tracking-[0.05em] mb-[0.6rem]">{t('layouts.canvasTitle')}</div>
          <div className="min-h-[120px] p-[0.6rem] bg-[var(--bo-bg)] border-2 border-dashed border-[var(--bo-border)] rounded-lg">
            {blocks.length === 0 && (
              <div className="text-center text-[var(--text-muted)] italic py-8 px-4">{t('layouts.canvasHint')}</div>
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
            <div className="mt-2 py-2 px-[0.8rem] bg-[rgba(229,57,53,0.15)] border border-[rgba(229,57,53,0.4)] rounded-md text-[#ef9a9a] text-[0.85rem]">
              {t('layouts.overlapWarning')}
            </div>
          )}
        </div>
      </div>

      <LayoutPreview blocks={blocks} />

      {/* Actions */}
      <div className="border-t border-[var(--bo-border)] mt-2 pt-6 flex justify-between items-center">
        <button className="btn btn-secondary" onClick={onCancel}>{t('layouts.btnCancel')}</button>
        <div className="flex items-center gap-[0.8rem]">
          {message && <span className={`form-message ${message.type}`}>{message.text}</span>}
          <button className="btn btn-success" onClick={save}>{t('layouts.btnSave')}</button>
        </div>
      </div>
    </div>
  );
}
