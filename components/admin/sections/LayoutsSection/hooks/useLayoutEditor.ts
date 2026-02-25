'use client';

import { useState, useCallback, useRef } from 'react';
import { useI18n } from '@/lib/i18n/context';
import { useAdminStore } from '@/lib/admin/store';
import { slugifyId } from '@/lib/utils/slug';
import type { Layout, LayoutBlock, BlockType } from '@/lib/schemas/layouts';

interface UseLayoutEditorArgs {
  existingLayout: Layout | null;
  onSaved: () => void;
}

export function useLayoutEditor({ existingLayout, onSaved }: UseLayoutEditorArgs) {
  const { t } = useI18n();
  const storeCreateLayout = useAdminStore((s) => s.createLayout);
  const storeUpdateLayout = useAdminStore((s) => s.updateLayout);
  const isNew = !existingLayout;
  const [label, setLabel] = useState(existingLayout?.label || '');
  const [id, setId] = useState(existingLayout?.id || '');
  const [blocks, setBlocks] = useState<LayoutBlock[]>(() => {
    if (!existingLayout) return [];
    return existingLayout.blocks.map(b => ({ ...b }));
  });
  const [message, setMessage] = useState<{ text: string; type: string } | null>(null);
  const blockCounterRef = useRef(existingLayout?.blocks.length || 0);

  const handleLabelChange = (name: string) => {
    setLabel(name);
    if (isNew) setId(slugifyId(name));
  };

  const findNextFreePosition = useCallback((): { row: number; col: number } => {
    if (blocks.length === 0) return { row: 1, col: 1 };
    const occupied = new Set<string>();
    blocks.forEach(b => {
      for (let c = b.col; c < b.col + b.colSpan && c <= 3; c++) {
        occupied.add(b.row + '-' + c);
      }
    });
    for (let r = 1; r <= 20; r++) {
      for (let c = 1; c <= 3; c++) {
        if (!occupied.has(r + '-' + c)) return { row: r, col: c };
      }
    }
    return { row: 1, col: 1 };
  }, [blocks]);

  const checkOverlaps = useCallback((): boolean => {
    const cells: Record<string, string> = {};
    for (const b of blocks) {
      for (let c = b.col; c < b.col + b.colSpan && c <= 3; c++) {
        const key = b.row + '-' + c;
        if (cells[key]) return true;
        cells[key] = b.blockId;
      }
    }
    return false;
  }, [blocks]);

  const addBlock = (type: BlockType) => {
    blockCounterRef.current++;
    const pos = findNextFreePosition();
    const newBlock: LayoutBlock = {
      blockId: 'b' + blockCounterRef.current,
      type,
      row: pos.row,
      col: type === 'title' ? 1 : pos.col,
      colSpan: type === 'title' ? 3 : 1,
    };
    if (type === 'title') newBlock.tag = 'h2';
    if (type === 'image') newBlock.display = 'column';
    if (type === 'social-links') { newBlock.shape = 'round'; newBlock.direction = 'horizontal'; newBlock.size = 'md'; }
    if (type === 'map') { newBlock.provider = 'leaflet'; newBlock.height = '300'; }
    setBlocks(prev => [...prev, newBlock]);
  };

  const removeBlock = (blockId: string) => {
    setBlocks(prev => prev.filter(b => b.blockId !== blockId));
  };

  const updateBlock = (blockId: string, updates: Partial<LayoutBlock>) => {
    setBlocks(prev => prev.map(b => {
      if (b.blockId !== blockId) return b;
      const updated = { ...b, ...updates };
      if (updated.col + updated.colSpan - 1 > 3) {
        updated.colSpan = 3 - updated.col + 1;
      }
      return updated;
    }));
  };

  const save = async () => {
    if (!label.trim() || !id.trim()) {
      setMessage({ text: t('layouts.validationNameId'), type: 'error' });
      return;
    }
    if (blocks.length === 0) {
      setMessage({ text: t('layouts.validationNoBlocks'), type: 'error' });
      return;
    }
    if (checkOverlaps()) {
      setMessage({ text: t('layouts.validationOverlap'), type: 'error' });
      return;
    }

    const ok = isNew
      ? await storeCreateLayout(id.trim(), label.trim(), blocks)
      : await storeUpdateLayout(existingLayout!.id, label.trim(), blocks);

    if (ok) {
      setMessage({ text: t('layouts.saved'), type: 'success' });
      setTimeout(() => onSaved(), 800);
    } else {
      setMessage({ text: t('layouts.saveError'), type: 'error' });
    }
  };

  return {
    isNew,
    label,
    id,
    setId,
    blocks,
    message,
    hasOverlap: checkOverlaps(),
    handleLabelChange,
    addBlock,
    removeBlock,
    updateBlock,
    save,
    t,
  };
}
