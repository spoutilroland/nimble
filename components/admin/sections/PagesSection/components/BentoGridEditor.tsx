'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { useI18n } from '@/lib/i18n/context';
import { MediaSourcePicker } from '@/components/admin/shared/MediaSourcePicker';
import type { Section } from '@/lib/types';
import type { BentoCell, BentoCellContent, BentoCellOverlay } from '@/lib/types/pages';

interface Props {
  section: Section;
  onUpdate: (updates: Partial<Section>) => void;
  onSave?: () => void;
}

const DEFAULT_COLS = 6;
const MIN_COLS = 1;
const MAX_COLS = 9;
const DEFAULT_ROWS = 3;
const MIN_ROWS = 1;
const MAX_ROWS = 9;
const MAX_CELLS = 81;
const MAX_SPAN = 6;
const ROW_H = 80;
const GAP = 3;
const MAX_TITLE = 40;
const MAX_BODY = 120;

type HandleDir = 'right' | 'left' | 'bottom' | 'top' | 'corner-br' | 'corner-tl';
type OverlayPosition = 'top' | 'bottom' | 'left' | 'right';

interface ResizeInfo {
  cellId: string;
  handle: HandleDir;
  origCol: number;
  origRow: number;
  origColSpan: number;
  origRowSpan: number;
}

interface ResizePreview {
  cellId: string;
  col: number;
  row: number;
  colSpan: number;
  rowSpan: number;
  valid: boolean;
}

type TextAlign = 'left' | 'center' | 'right';
type VerticalAlign = 'top' | 'center' | 'bottom';

interface TextEditState {
  cellId: string;
  position: OverlayPosition;
  title: string;
  body: string;
  textAlign: TextAlign;
  verticalAlign: VerticalAlign;
}

const genId = () => Math.random().toString(36).slice(2, 8);

function getOccupiedSet(cells: BentoCell[], excludeId?: string): Set<string> {
  const set = new Set<string>();
  for (const cell of cells) {
    if (cell.id === excludeId) continue;
    for (let c = cell.col; c < cell.col + cell.colSpan; c++) {
      for (let r = cell.row; r < cell.row + cell.rowSpan; r++) {
        set.add(`${c},${r}`);
      }
    }
  }
  return set;
}

function checkCollision(
  cells: BentoCell[],
  col: number, row: number,
  colSpan: number, rowSpan: number,
  excludeId: string,
): boolean {
  const others = getOccupiedSet(cells, excludeId);
  for (let c = col; c < col + colSpan; c++) {
    for (let r = row; r < row + rowSpan; r++) {
      if (others.has(`${c},${r}`)) return true;
    }
  }
  return false;
}

function computeMinRows(cells: BentoCell[]): number {
  if (!cells.length) return MIN_ROWS;
  let maxRow = 0;
  for (const cell of cells) {
    const end = cell.row + cell.rowSpan - 1;
    if (end > maxRow) maxRow = end;
  }
  return Math.max(MIN_ROWS, maxRow);
}

function cursorToGrid(
  clientX: number, clientY: number,
  gridRect: DOMRect, colCount: number, rowCount: number,
): { col: number; row: number } {
  const cellW = (gridRect.width - (colCount - 1) * GAP) / colCount;
  const relX = clientX - gridRect.left;
  const relY = clientY - gridRect.top;
  const col = Math.min(colCount, Math.max(1, Math.floor(relX / (cellW + GAP)) + 1));
  const row = Math.min(rowCount, Math.max(1, Math.floor(relY / (ROW_H + GAP)) + 1));
  return { col, row };
}

export function BentoGridEditor({ section, onUpdate, onSave }: Props) {
  const { t } = useI18n();

  const cells: BentoCell[] = (section.props?.cells as BentoCell[]) || [];
  const [colCount, setColCount] = useState(() => (section.props?.gridCols as number) || DEFAULT_COLS);
  const [rowCount, setRowCount] = useState(() => Math.max(MIN_ROWS, (section.props?.gridRows as number) || DEFAULT_ROWS, computeMinRows(cells)));
  const [selectedCellId, setSelectedCellId] = useState<string | null>(null);
  const [resizePreview, setResizePreview] = useState<ResizePreview | null>(null);
  const [uploadedImages, setUploadedImages] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [dragOverCellId, setDragOverCellId] = useState<string | null>(null);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [textEdit, setTextEdit] = useState<TextEditState | null>(null);
  const [hoveredZone, setHoveredZone] = useState<{ cellId: string; zone: OverlayPosition } | null>(null);

  const gridRef = useRef<HTMLDivElement>(null);
  const resizeRef = useRef<ResizeInfo | null>(null);
  const pendingSaveRef = useRef(false);

  const carouselId = section.carouselId || '';

  // Sauvegarder après que le state parent a été mis à jour (re-render)
  useEffect(() => {
    if (pendingSaveRef.current) {
      pendingSaveRef.current = false;
      onSave?.();
    }
  }, [cells, onSave]);

  const updateCells = useCallback((newCells: BentoCell[]) => {
    onUpdate({ props: { ...(section.props || {}), cells: newCells } });
  }, [section.props, onUpdate]);

  const occupied = getOccupiedSet(cells);

  // ── Upload images (multi-fichier) ──────────────────

  const handleUploadFiles = async (files: FileList | File[]) => {
    if (!carouselId || uploading) return;
    setUploading(true);
    const newUrls: string[] = [];
    for (const file of Array.from(files)) {
      if (!file.type.startsWith('image/')) continue;
      const formData = new FormData();
      formData.append('image', file);
      try {
        const res = await fetch(`/api/admin/upload/${carouselId}`, { method: 'POST', body: formData });
        const data = await res.json();
        if (data.url) newUrls.push(data.url);
      } catch { /* skip */ }
    }
    if (newUrls.length) setUploadedImages(prev => [...prev, ...newUrls]);
    setUploading(false);
  };

  const loadCarouselImages = useCallback(async () => {
    if (!carouselId) return;
    try {
      const res = await fetch(`/api/carousel/${carouselId}/images`);
      const data = await res.json();
      const urls = (data.images || []).map((img: { url: string }) => img.url);
      setUploadedImages(prev => {
        const existing = new Set(prev);
        const toAdd = urls.filter((u: string) => !existing.has(u));
        return toAdd.length ? [...prev, ...toAdd] : prev;
      });
    } catch { /* skip */ }
  }, [carouselId]);

  // Charger les images au montage
  useEffect(() => { loadCarouselImages(); }, [loadCarouselImages]);

  const handleUploadAreaDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files.length) handleUploadFiles(e.dataTransfer.files);
  };

  const removeUploadedImage = (url: string) => {
    setUploadedImages(prev => prev.filter(u => u !== url));
  };

  // ── CRUD cellules ──────────────────────────────────

  const handleAddCell = (col: number, row: number) => {
    if (occupied.has(`${col},${row}`)) return;
    if (cells.length >= MAX_CELLS) return;
    const newCell: BentoCell = { id: genId(), col, row, colSpan: 1, rowSpan: 1, content: null };
    updateCells([...cells, newCell]);
  };

  const handleRemoveCell = (cellId: string) => {
    const cell = cells.find(c => c.id === cellId);
    // Remettre l'image dans la barre d'images uploadées
    if (cell?.content?.imageUrl) {
      const url = cell.content.imageUrl;
      setUploadedImages(prev => prev.includes(url) ? prev : [...prev, url]);
    }
    updateCells(cells.filter(c => c.id !== cellId));
    if (selectedCellId === cellId) setSelectedCellId(null);
    if (textEdit?.cellId === cellId) setTextEdit(null);
  };

  const handleColChange = (delta: number) => {
    const next = colCount + delta;
    if (next < MIN_COLS || next > MAX_COLS) return;
    if (delta < 0 && cells.some(c => c.col + c.colSpan - 1 > next)) return;
    setColCount(next);
    onUpdate({ props: { ...(section.props || {}), gridCols: next } });
  };

  const handleRowChange = (delta: number) => {
    const next = rowCount + delta;
    if (next < MIN_ROWS || next > MAX_ROWS) return;
    if (delta < 0 && cells.some(c => c.row + c.rowSpan - 1 > next)) return;
    setRowCount(next);
    onUpdate({ props: { ...(section.props || {}), gridRows: next } });
  };

  // ── Contenu cellule ────────────────────────────────

  const updateCellContent = (cellId: string, content: BentoCellContent | null) => {
    updateCells(cells.map(c => c.id === cellId ? { ...c, content } : c));
  };

  // ── Overlay texte ──────────────────────────────────

  const handleStartTextEdit = (cellId: string, position: OverlayPosition) => {
    const cell = cells.find(c => c.id === cellId);
    const existing = cell?.content?.overlay;
    setTextEdit({
      cellId,
      position,
      title: existing?.position === position ? existing.title : '',
      body: existing?.position === position ? existing.body : '',
      textAlign: existing?.position === position ? (existing.textAlign || 'left') : 'left',
      verticalAlign: existing?.position === position ? (existing.verticalAlign || 'center') : 'center',
    });
  };

  const handleSaveTextOverlay = () => {
    if (!textEdit) return;
    const cell = cells.find(c => c.id === textEdit.cellId);
    if (!cell) return;
    const overlay: BentoCellOverlay = {
      position: textEdit.position,
      textAlign: textEdit.textAlign,
      verticalAlign: textEdit.verticalAlign,
      title: textEdit.title.slice(0, MAX_TITLE),
      body: textEdit.body.slice(0, MAX_BODY),
    };
    const newContent: BentoCellContent = {
      ...cell.content,
      overlay,
    };
    updateCellContent(textEdit.cellId, newContent);
    setTextEdit(null);
    pendingSaveRef.current = true;
  };

  const handleRemoveOverlay = (cellId: string) => {
    const cell = cells.find(c => c.id === cellId);
    if (!cell?.content) return;
    const { overlay: _, ...rest } = cell.content;
    const newContent = Object.keys(rest).length > 0 ? rest as BentoCellContent : null;
    updateCellContent(cellId, newContent);
  };

  // ── Drag & drop image sur cellule ──────────────────

  const handleCellDragOver = (e: React.DragEvent, cellId: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
    setDragOverCellId(cellId);
  };

  const handleCellDragLeave = () => {
    setDragOverCellId(null);
  };

  const handleCellDrop = (e: React.DragEvent, cellId: string) => {
    e.preventDefault();
    setDragOverCellId(null);

    const imageUrl = e.dataTransfer.getData('text/bento-image');
    if (imageUrl) {
      const cell = cells.find(c => c.id === cellId);
      const newContent: BentoCellContent = {
        ...(cell?.content || {}),
        imageUrl,
      };
      updateCellContent(cellId, newContent);
    }
  };

  // ── Resize (toutes directions) ─────────────────────

  const handleResizeStart = (e: React.PointerEvent, cellId: string, handle: HandleDir) => {
    e.stopPropagation();
    e.preventDefault();
    const cell = cells.find(c => c.id === cellId);
    if (!cell) return;

    resizeRef.current = {
      cellId, handle,
      origCol: cell.col, origRow: cell.row,
      origColSpan: cell.colSpan, origRowSpan: cell.rowSpan,
    };
    setResizePreview({ cellId, col: cell.col, row: cell.row, colSpan: cell.colSpan, rowSpan: cell.rowSpan, valid: true });
  };

  const handleResizeMoveNative = useCallback((e: PointerEvent) => {
    const info = resizeRef.current;
    if (!info || !gridRef.current) return;

    const gridRect = gridRef.current.getBoundingClientRect();
    const { col: targetCol, row: targetRow } = cursorToGrid(e.clientX, e.clientY, gridRect, colCount, rowCount);

    const rightEdge = info.origCol + info.origColSpan - 1;
    const bottomEdge = info.origRow + info.origRowSpan - 1;

    let newCol = info.origCol;
    let newRow = info.origRow;
    let newColSpan = info.origColSpan;
    let newRowSpan = info.origRowSpan;

    const h = info.handle;

    if (h === 'right' || h === 'corner-br') {
      newColSpan = Math.max(1, targetCol - newCol + 1);
    } else if (h === 'left' || h === 'corner-tl') {
      newCol = Math.min(targetCol, rightEdge);
      newColSpan = rightEdge - newCol + 1;
    }

    if (h === 'bottom' || h === 'corner-br') {
      newRowSpan = Math.max(1, targetRow - newRow + 1);
    } else if (h === 'top' || h === 'corner-tl') {
      newRow = Math.min(targetRow, bottomEdge);
      newRowSpan = bottomEdge - newRow + 1;
    }

    newCol = Math.max(1, newCol);
    newRow = Math.max(1, newRow);
    newColSpan = Math.min(MAX_SPAN, newColSpan);
    newRowSpan = Math.min(MAX_SPAN, newRowSpan);
    if (newCol + newColSpan - 1 > colCount) newColSpan = colCount - newCol + 1;
    if (newRow + newRowSpan - 1 > rowCount) newRowSpan = rowCount - newRow + 1;

    if (h === 'left' || h === 'corner-tl') {
      if (newColSpan > MAX_SPAN) { newCol = rightEdge - MAX_SPAN + 1; newColSpan = MAX_SPAN; }
      if (newCol < 1) { newCol = 1; newColSpan = rightEdge; }
    }
    if (h === 'top' || h === 'corner-tl') {
      if (newRowSpan > MAX_SPAN) { newRow = bottomEdge - MAX_SPAN + 1; newRowSpan = MAX_SPAN; }
      if (newRow < 1) { newRow = 1; newRowSpan = bottomEdge; }
    }

    const hasCollision = checkCollision(cells, newCol, newRow, newColSpan, newRowSpan, info.cellId);

    setResizePreview(prev => {
      if (prev && prev.col === newCol && prev.row === newRow && prev.colSpan === newColSpan && prev.rowSpan === newRowSpan && prev.valid === !hasCollision) return prev;
      return { cellId: info.cellId, col: newCol, row: newRow, colSpan: newColSpan, rowSpan: newRowSpan, valid: !hasCollision };
    });
  }, [cells, colCount, rowCount]);

  const resizePreviewRef = useRef<ResizePreview | null>(null);
  resizePreviewRef.current = resizePreview;

  const handleResizeEnd = useCallback(() => {
    const info = resizeRef.current;
    const preview = resizePreviewRef.current;
    resizeRef.current = null;
    setResizePreview(null);

    if (!info || !preview || !preview.valid) return;
    updateCells(cells.map(c =>
      c.id === info.cellId
        ? { ...c, col: preview.col, row: preview.row, colSpan: preview.colSpan, rowSpan: preview.rowSpan }
        : c
    ));
  }, [cells, updateCells]);

  useEffect(() => {
    document.addEventListener('pointermove', handleResizeMoveNative);
    document.addEventListener('pointerup', handleResizeEnd);
    return () => {
      document.removeEventListener('pointermove', handleResizeMoveNative);
      document.removeEventListener('pointerup', handleResizeEnd);
    };
  }, [handleResizeMoveNative, handleResizeEnd]);

  const getDisplaySpans = (cell: BentoCell) => {
    if (resizePreview && resizePreview.cellId === cell.id) {
      return { col: resizePreview.col, row: resizePreview.row, colSpan: resizePreview.colSpan, rowSpan: resizePreview.rowSpan, resizing: true, valid: resizePreview.valid };
    }
    return { col: cell.col, row: cell.row, colSpan: cell.colSpan, rowSpan: cell.rowSpan, resizing: false, valid: true };
  };

  const Handle = ({ cellId, dir, style, isVisible }: { cellId: string; dir: HandleDir; style: React.CSSProperties; isVisible: boolean }) => (
    <div
      style={{ position: 'absolute', background: isVisible ? 'var(--bo-accent, #6366f1)' : 'transparent', transition: 'background 0.15s, opacity 0.15s', zIndex: 4, ...style }}
      className="opacity-0 group-hover:opacity-100"
      onPointerDown={(e) => handleResizeStart(e, cellId, dir)}
    />
  );

  // ── Zones de texte overlay (4 positions) ───────────

  const ZONE_STYLES: Record<OverlayPosition, string> = {
    top: 'top-0 left-0 right-0 h-1/2',
    bottom: 'bottom-0 left-0 right-0 h-1/2',
    left: 'top-0 left-0 bottom-0 w-1/2',
    right: 'top-0 right-0 bottom-0 w-1/2',
  };

  // Détecter dans quelle zone de la cellule se trouve le curseur
  // Bande de 30% sur chaque bord, zone morte au centre
  const detectZone = (e: React.MouseEvent, cellEl: HTMLElement): OverlayPosition | null => {
    const rect = cellEl.getBoundingClientRect();
    const rx = (e.clientX - rect.left) / rect.width;
    const ry = (e.clientY - rect.top) / rect.height;
    // Zone morte au centre (30%-70% sur chaque axe)
    const inCenterX = rx > 0.3 && rx < 0.7;
    const inCenterY = ry > 0.3 && ry < 0.7;
    if (inCenterX && inCenterY) return null;
    // Déterminer la zone dominante
    const dTop = ry;
    const dBottom = 1 - ry;
    const dLeft = rx;
    const dRight = 1 - rx;
    const min = Math.min(dTop, dBottom, dLeft, dRight);
    if (min === dTop) return 'top';
    if (min === dBottom) return 'bottom';
    if (min === dLeft) return 'left';
    return 'right';
  };

  return (
    <div className="border-t border-dashed border-[rgba(255,255,255,0.1)] mt-[0.4rem] pt-2">
      {/* ── Zone d'upload images (thumbnails draggables — plus grosses) ── */}
      <div
        className="mb-2 border border-dashed border-[var(--bo-border)] rounded-[6px] p-[0.5rem] bg-[rgba(255,255,255,0.03)] hover:border-[var(--bo-text-dim)] transition-colors"
        onDragOver={(e) => { e.preventDefault(); e.dataTransfer.dropEffect = 'copy'; }}
        onDrop={handleUploadAreaDrop}
      >
        <div className="flex items-center gap-3 flex-wrap min-h-[80px]">
          {uploadedImages.map((url, i) => (
            <div
              key={`${url}-${i}`}
              className="relative w-[80px] h-[80px] rounded-[6px] overflow-hidden border border-[var(--bo-border)] cursor-grab shrink-0 group/thumb"
              draggable
              onDragStart={(e) => {
                e.dataTransfer.setData('text/bento-image', url);
                e.dataTransfer.effectAllowed = 'copy';
              }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={url} alt="" className="w-full h-full object-cover" draggable={false} />
              <button
                className="absolute top-0 right-0 w-[18px] h-[18px] bg-[rgba(229,90,42,0.9)] text-white border-none text-[0.6rem] cursor-pointer opacity-0 group-hover/thumb:opacity-100 transition-opacity flex items-center justify-center leading-none rounded-bl-[4px]"
                onClick={() => removeUploadedImage(url)}
              >×</button>
            </div>
          ))}

          <button
            className="w-[80px] h-[80px] border border-dashed border-[var(--bo-border)] rounded-[6px] bg-transparent text-[var(--bo-text-dim)] cursor-pointer text-[1.5rem] leading-none hover:border-[var(--bo-text-dim)] hover:text-[var(--bo-text)] transition-colors shrink-0 flex items-center justify-center"
            onClick={() => setPickerOpen(true)}
            disabled={uploading}
          >
            {uploading ? '...' : '+'}
          </button>

          {uploadedImages.length === 0 && !uploading && (
            <span className="text-[0.75rem] text-[var(--bo-text-dim)]">
              {t('bentoEditor.dropImages')}
            </span>
          )}
          {uploadedImages.length > 0 && (
            <span className="text-[0.7rem] text-[var(--bo-text-dim)] ml-1">
              {t('bentoEditor.dragHint')}
            </span>
          )}
        </div>
      </div>

      {/* ── Controles colonnes + lignes ── */}
      <div className="flex items-center gap-4 mb-2">
        <span className="text-[0.68rem] uppercase tracking-[0.1em] text-[var(--bo-text-dim)]">
          {t('bentoEditor.title')}
        </span>
        <div className="flex items-center gap-4 ml-auto">
          <div className="flex items-center gap-1">
            <span className="text-[0.72rem] text-[var(--bo-text)] tabular-nums px-1">
              {colCount} col
            </span>
            <button
              className="w-[24px] h-[24px] text-[0.75rem] bg-[rgba(255,255,255,0.05)] border border-[var(--bo-border)] text-[var(--bo-text)] cursor-pointer leading-none disabled:opacity-30 disabled:cursor-default"
              onClick={() => handleColChange(-1)}
              disabled={colCount <= MIN_COLS}
            >−</button>
            <button
              className="w-[24px] h-[24px] text-[0.75rem] bg-[rgba(255,255,255,0.05)] border border-[var(--bo-border)] text-[var(--bo-text)] cursor-pointer leading-none disabled:opacity-30 disabled:cursor-default"
              onClick={() => handleColChange(1)}
              disabled={colCount >= MAX_COLS}
            >+</button>
          </div>
          <div className="flex items-center gap-1">
            <span className="text-[0.72rem] text-[var(--bo-text)] tabular-nums px-1">
              {rowCount} {t('bentoEditor.rowCount')}
            </span>
            <button
              className="w-[24px] h-[24px] text-[0.75rem] bg-[rgba(255,255,255,0.05)] border border-[var(--bo-border)] text-[var(--bo-text)] cursor-pointer leading-none disabled:opacity-30 disabled:cursor-default"
              onClick={() => handleRowChange(-1)}
              disabled={rowCount <= MIN_ROWS}
            >−</button>
            <button
              className="w-[24px] h-[24px] text-[0.75rem] bg-[rgba(255,255,255,0.05)] border border-[var(--bo-border)] text-[var(--bo-text)] cursor-pointer leading-none disabled:opacity-30 disabled:cursor-default"
              onClick={() => handleRowChange(1)}
              disabled={rowCount >= MAX_ROWS}
            >+</button>
          </div>
        </div>
      </div>

      {/* ── Grille ── */}
      <div
        ref={gridRef}
        style={{
          display: 'grid',
          gridTemplateColumns: `repeat(${colCount}, 1fr)`,
          gridTemplateRows: `repeat(${rowCount}, ${ROW_H}px)`,
          gap: '0px',
          position: 'relative',
          borderRadius: '4px',
          overflow: 'visible',
          border: '1px solid var(--bo-border)',
        }}
      >
        {/* Cellules de fond */}
        {Array.from({ length: colCount * rowCount }, (_, i) => {
          const col = (i % colCount) + 1;
          const row = Math.floor(i / colCount) + 1;
          const isOcc = occupied.has(`${col},${row}`);
          return (
            <div
              key={`bg-${col}-${row}`}
              style={{
                gridColumn: col,
                gridRow: row,
                border: '1px solid var(--bo-border)',
                cursor: isOcc ? 'default' : 'pointer',
                transition: 'background 0.15s',
                zIndex: 0,
              }}
              className={isOcc ? '' : 'hover:bg-[rgba(99,102,241,0.12)]'}
              onClick={() => !isOcc && handleAddCell(col, row)}
            />
          );
        })}

        {/* Cellules positionnees */}
        {cells.map(cell => {
          const isSelected = selectedCellId === cell.id;
          const { col, row, colSpan, rowSpan, resizing, valid } = getDisplaySpans(cell);
          const isDragOver = dragOverCellId === cell.id;
          const hasOverlay = !!cell.content?.overlay;
          const hasImage = !!cell.content?.imageUrl;
          const isEmpty = !hasImage && !hasOverlay;

          let borderColor = isSelected ? 'var(--bo-green, #34d399)' : 'var(--bo-accent, #6366f1)';
          let bgColor = isSelected ? 'rgba(52, 211, 153, 0.15)' : 'rgba(99, 102, 241, 0.12)';
          if (resizing) {
            borderColor = valid ? '#34d399' : '#e55a2a';
            bgColor = valid ? 'rgba(52, 211, 153, 0.15)' : 'rgba(229, 90, 42, 0.15)';
          }
          if (isDragOver) {
            borderColor = '#34d399';
            bgColor = 'rgba(52, 211, 153, 0.2)';
          }
          const handleVisible = isSelected || resizing;

          return (
            <div
              key={cell.id}
              className="group/cell"
              style={{
                gridColumn: `${col} / span ${colSpan}`,
                gridRow: `${row} / span ${rowSpan}`,
                position: 'relative',
                border: `2px solid ${borderColor}`,
                borderRadius: '4px',
                background: bgColor,
                overflow: 'visible',
                cursor: 'pointer',
                transition: resizing ? 'none' : 'border-color 0.15s, background 0.15s',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: resizing ? 5 : 2,
              }}
              onClick={(e) => {
                e.stopPropagation();
                if (!resizeRef.current) setSelectedCellId(cell.id === selectedCellId ? null : cell.id);
              }}
              onDoubleClick={(e) => {
                e.stopPropagation();
                if (hasOverlay && cell.content?.overlay) {
                  const ov = cell.content.overlay;
                  setTextEdit({ cellId: cell.id, position: ov.position, title: ov.title, body: ov.body, textAlign: ov.textAlign || 'left', verticalAlign: ov.verticalAlign || 'center' });
                }
              }}
              onDragOver={(e) => handleCellDragOver(e, cell.id)}
              onDragLeave={handleCellDragLeave}
              onDrop={(e) => handleCellDrop(e, cell.id)}
              onMouseMove={(e) => {
                if (hasOverlay || textEdit) return;
                const zone = detectZone(e, e.currentTarget);
                setHoveredZone(prev => {
                  if (prev?.cellId === cell.id && prev?.zone === zone) return prev;
                  if (!zone) return prev?.cellId === cell.id ? null : prev;
                  return { cellId: cell.id, zone };
                });
              }}
              onMouseLeave={() => {
                if (hoveredZone?.cellId === cell.id) setHoveredZone(null);
              }}
            >
              {/* Contenu clippé */}
              <div className="absolute inset-0 overflow-hidden rounded-[2px] flex items-center justify-center">
                {/* Image de fond */}
                {hasImage && cell.content?.imageUrl && (
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img src={cell.content.imageUrl} alt="" className="absolute inset-0 w-full h-full object-cover" />
                )}

                {/* Aperçu overlay texte existant */}
                {hasOverlay && cell.content?.overlay && (
                  <>
                    <div
                      className={`absolute z-[2] flex flex-col ${
                        cell.content.overlay.verticalAlign === 'top' ? 'justify-start' :
                        cell.content.overlay.verticalAlign === 'bottom' ? 'justify-end' : 'justify-center'
                      } ${
                        cell.content.overlay.textAlign === 'center' ? 'text-center' :
                        cell.content.overlay.textAlign === 'right' ? 'text-right' : 'text-left'
                      } bg-[rgba(0,0,0,0.6)] p-[0.3rem] ${ZONE_STYLES[cell.content.overlay.position]}`}
                    >
                      <strong className="block text-[0.65rem] text-white truncate">{cell.content.overlay.title}</strong>
                      <span className="text-[0.55rem] text-[rgba(255,255,255,0.8)] line-clamp-2">{cell.content.overlay.body}</span>
                    </div>
                    <button
                      className="absolute top-[2px] left-[2px] z-[10] px-[0.5rem] py-[0.3rem] bg-[rgba(229,90,42,0.85)] text-white border-none rounded-[4px] text-[0.7rem] cursor-pointer opacity-0 group-hover/cell:opacity-100 transition-opacity leading-none whitespace-nowrap"
                      onClick={(e) => { e.stopPropagation(); handleRemoveOverlay(cell.id); }}
                    >Supprimer le texte</button>
                  </>
                )}

                {/* Cellule vide */}
                {isEmpty && !isDragOver && (
                  <span className="text-[var(--bo-text-dim)] text-[0.65rem] select-none opacity-50">
                    {t('bentoEditor.cellEmpty')}
                  </span>
                )}
                {isDragOver && isEmpty && (
                  <span className="text-[#34d399] text-[1.2rem] leading-none select-none animate-pulse">+</span>
                )}

                {/* 4 zones texte — apparaissent au hover, la zone active est highlightée */}
                {!hasOverlay && !textEdit && hoveredZone?.cellId === cell.id && (
                <>
                  {(['top', 'bottom', 'left', 'right'] as OverlayPosition[]).map(pos => {
                    const isActive = hoveredZone.zone === pos;
                    const icons: Record<OverlayPosition, string> = { top: '↑', bottom: '↓', left: '←', right: '→' };
                    const c = { bg: 'rgba(99,102,241,0.35)', border: 'rgba(99,102,241,0.6)', icon: icons[pos] };
                    // Zones non-overlappantes : bandes de 30% sur les bords
                    const zoneClass = pos === 'top'    ? 'top-0 left-0 right-0 h-[30%]' :
                                      pos === 'bottom' ? 'bottom-0 left-0 right-0 h-[30%]' :
                                      pos === 'left'   ? 'top-[30%] left-0 bottom-[30%] w-[30%]' :
                                                         'top-[30%] right-0 bottom-[30%] w-[30%]';
                    return (
                      <button
                        key={pos}
                        className={`absolute z-[6] ${zoneClass} flex items-center justify-center border-none cursor-pointer transition-all duration-150`}
                        style={{
                          background: isActive ? c.bg : 'transparent',
                          borderLeft:   pos === 'right'  && !isActive ? `1px dashed ${c.border}` : undefined,
                          borderRight:  pos === 'left'   && !isActive ? `1px dashed ${c.border}` : undefined,
                          borderTop:    pos === 'bottom'  && !isActive ? `1px dashed ${c.border}` : undefined,
                          borderBottom: pos === 'top'    && !isActive ? `1px dashed ${c.border}` : undefined,
                        }}
                        onClick={(e) => { e.stopPropagation(); handleStartTextEdit(cell.id, pos); }}
                      >
                        {isActive && (
                          <span className="text-[0.6rem] text-white bg-[rgba(0,0,0,0.65)] px-[0.35rem] py-[0.15rem] rounded-[3px] whitespace-nowrap flex items-center gap-[0.2rem]">
                            <span className="text-[0.7rem]">{c.icon}</span> + Texte
                          </span>
                        )}
                        {!isActive && (
                          <span className="text-[0.7rem] opacity-40" style={{ color: c.border }}>{c.icon}</span>
                        )}
                      </button>
                    );
                  })}
                </>
              )}

              {/* Formulaire inline d'édition texte */}
              {/* formulaire texte déplacé dans un modal global */}
              </div>{/* fin contenu clippé */}

              {/* Bouton supprimer cellule */}
              <button
                className="absolute top-[2px] right-[2px] w-[26px] h-[26px] bg-[rgba(229,90,42,0.85)] text-white border-none rounded-full text-[0.85rem] cursor-pointer opacity-0 group-hover/cell:opacity-100 transition-opacity z-[10] flex items-center justify-center leading-none"
                onClick={(e) => { e.stopPropagation(); handleRemoveCell(cell.id); }}
                title={t('bentoEditor.removeCell')}
              >×</button>

              {/* 6 poignees de resize */}
              <Handle cellId={cell.id} dir="right" isVisible={handleVisible}
                style={{ right: -4, top: '25%', width: 8, height: '50%', cursor: 'ew-resize', borderRadius: '0 4px 4px 0' }} />
              <Handle cellId={cell.id} dir="left" isVisible={handleVisible}
                style={{ left: -4, top: '25%', width: 8, height: '50%', cursor: 'ew-resize', borderRadius: '4px 0 0 4px' }} />
              <Handle cellId={cell.id} dir="bottom" isVisible={handleVisible}
                style={{ bottom: -4, left: '25%', height: 8, width: '50%', cursor: 'ns-resize', borderRadius: '0 0 4px 4px' }} />
              <Handle cellId={cell.id} dir="top" isVisible={handleVisible}
                style={{ top: -4, left: '25%', height: 8, width: '50%', cursor: 'ns-resize', borderRadius: '4px 4px 0 0' }} />
              <Handle cellId={cell.id} dir="corner-br" isVisible={handleVisible}
                style={{ right: -4, bottom: -4, width: 14, height: 14, cursor: 'nwse-resize', borderRadius: '0 0 6px 0' }} />
              <Handle cellId={cell.id} dir="corner-tl" isVisible={handleVisible}
                style={{ left: -4, top: -4, width: 14, height: 14, cursor: 'nwse-resize', borderRadius: '6px 0 0 0' }} />
            </div>
          );
        })}
      </div>

      {/* Indication */}
      <div className="text-[0.65rem] text-[var(--bo-text-dim)] mt-1">
        {cells.length < MAX_CELLS ? t('bentoEditor.clickToAdd') : t('bentoEditor.maxCells')}
        {' · '}{cells.length}/{MAX_CELLS}
      </div>

      {/* MediaSourcePicker */}
      {carouselId && (
        <MediaSourcePicker
          carouselId={carouselId}
          isOpen={pickerOpen}
          onClose={() => setPickerOpen(false)}
          onFileUpload={(files) => {
            handleUploadFiles(files);
            setPickerOpen(false);
          }}
          onSuccess={() => {
            loadCarouselImages();
            setPickerOpen(false);
          }}
          maxSelection={MAX_CELLS - uploadedImages.length}
        />
      )}

      {/* Modal édition texte overlay */}
      {textEdit && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center"
        >
          <div className="absolute inset-0 bg-[rgba(0,0,0,0.6)]" />
          <div
            className="relative z-[1] bg-[var(--bo-bg,#1a1a2e)] border border-[var(--bo-border)] rounded-lg p-5 w-[380px] max-w-[90vw] shadow-xl"
          >
            <h3 className="text-[0.85rem] font-semibold text-[var(--bo-text)] mb-3 flex items-center gap-2">
              <span className="text-[0.75rem] opacity-60">
                {textEdit.position === 'top' ? '↑' : textEdit.position === 'bottom' ? '↓' : textEdit.position === 'left' ? '←' : '→'}
              </span>
              Texte overlay
            </h3>

            {/* Alignement horizontal */}
            <div className="flex items-center gap-3 mb-3">
              <div className="flex items-center gap-1">
                <span className="text-[0.65rem] text-[var(--bo-text-dim)] mr-1">Horizontal</span>
                {(['left', 'center', 'right'] as TextAlign[]).map(align => {
                  const labels: Record<TextAlign, string> = { left: 'Gauche', center: 'Centre', right: 'Droite' };
                  const isActive = textEdit.textAlign === align;
                  const lines: Record<TextAlign, [number, number, number, number][]> = {
                    left:   [[2,3,14,3],[2,7,11,7],[2,11,14,11],[2,15,9,15]],
                    center: [[3,3,15,3],[5,7,13,7],[3,11,15,11],[5,15,13,15]],
                    right:  [[4,3,16,3],[7,7,16,7],[4,11,16,11],[9,15,16,15]],
                  };
                  return (
                    <button
                      key={align}
                      title={labels[align]}
                      className={`px-2 py-1.5 border rounded cursor-pointer transition-colors ${
                        isActive
                          ? 'bg-[var(--bo-accent,#6366f1)] text-white border-[var(--bo-accent,#6366f1)]'
                          : 'bg-transparent text-[var(--bo-text-dim)] border-[var(--bo-border)] hover:bg-[rgba(255,255,255,0.06)]'
                      }`}
                      onClick={() => setTextEdit({ ...textEdit, textAlign: align })}
                    >
                      <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                        {lines[align].map(([x1,y1,x2,y2], i) => (
                          <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                        ))}
                      </svg>
                    </button>
                  );
                })}
              </div>

              {(textEdit.position === 'left' || textEdit.position === 'right') && <div className="flex items-center gap-1">
                <span className="text-[0.65rem] text-[var(--bo-text-dim)] mr-1">Vertical</span>
                {(['top', 'center', 'bottom'] as VerticalAlign[]).map(va => {
                  const icons: Record<VerticalAlign, string> = { top: '↑', center: '−', bottom: '↓' };
                  const labels: Record<VerticalAlign, string> = { top: 'Haut', center: 'Centre', bottom: 'Bas' };
                  const isActive = textEdit.verticalAlign === va;
                  return (
                    <button
                      key={va}
                      title={labels[va]}
                      className={`px-3 py-1.5 text-[0.75rem] border rounded cursor-pointer transition-colors ${
                        isActive
                          ? 'bg-[var(--bo-accent,#6366f1)] text-white border-[var(--bo-accent,#6366f1)]'
                          : 'bg-transparent text-[var(--bo-text-dim)] border-[var(--bo-border)] hover:bg-[rgba(255,255,255,0.06)]'
                      }`}
                      onClick={() => setTextEdit({ ...textEdit, verticalAlign: va })}
                    >
                      {icons[va]}
                    </button>
                  );
                })}
              </div>}
            </div>

            <div className="flex flex-col gap-3">
              {/* Titre */}
              <div>
                <input
                  type="text"
                  placeholder="Titre"
                  value={textEdit.title}
                  maxLength={MAX_TITLE}
                  onChange={(e) => setTextEdit({ ...textEdit, title: e.target.value })}
                  className="w-full px-3 py-2 text-[0.85rem] bg-[rgba(255,255,255,0.06)] border border-[var(--bo-border)] rounded text-[var(--bo-text)] outline-none focus:border-[var(--bo-accent)]"
                  autoFocus
                />
                <div className="text-right mt-[2px]">
                  <span className={`text-[0.65rem] tabular-nums ${
                    MAX_TITLE - textEdit.title.length <= 0 ? 'text-[#e55a2a]' :
                    MAX_TITLE - textEdit.title.length <= 5 ? 'text-[#f59e0b]' :
                    'text-[var(--bo-text-dim)]'
                  }`}>
                    {textEdit.title.length}/{MAX_TITLE}
                  </span>
                </div>
              </div>

              {/* Body */}
              <div>
                <textarea
                  placeholder="Description"
                  value={textEdit.body}
                  maxLength={MAX_BODY}
                  onChange={(e) => setTextEdit({ ...textEdit, body: e.target.value })}
                  rows={3}
                  className="w-full px-3 py-2 text-[0.85rem] bg-[rgba(255,255,255,0.06)] border border-[var(--bo-border)] rounded text-[var(--bo-text)] outline-none focus:border-[var(--bo-accent)] resize-none"
                />
                <div className="text-right mt-[2px]">
                  <span className={`text-[0.65rem] tabular-nums ${
                    MAX_BODY - textEdit.body.length <= 0 ? 'text-[#e55a2a]' :
                    MAX_BODY - textEdit.body.length <= 5 ? 'text-[#f59e0b]' :
                    'text-[var(--bo-text-dim)]'
                  }`}>
                    {textEdit.body.length}/{MAX_BODY}
                  </span>
                </div>
              </div>
            </div>

            {/* Boutons */}
            <div className="flex justify-end gap-2 mt-4">
              <button
                className="px-4 py-2 text-[0.8rem] bg-transparent border border-[var(--bo-border)] text-[var(--bo-text)] rounded cursor-pointer hover:bg-[rgba(255,255,255,0.06)] transition-colors"
                onClick={() => setTextEdit(null)}
              >
                Annuler
              </button>
              <button
                className="px-4 py-2 text-[0.8rem] bg-[var(--bo-accent,#6366f1)] text-white border-none rounded cursor-pointer hover:brightness-110 transition-all"
                onClick={handleSaveTextOverlay}
              >
                Valider
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
