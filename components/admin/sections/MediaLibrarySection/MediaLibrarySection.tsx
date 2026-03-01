'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { Upload } from 'lucide-react';
import { useI18n } from '@/lib/i18n/context';
import { useAdminStore } from '@/lib/admin/store';
import { useMediaLibrary } from './hooks/useMediaLibrary';
import { MediaFilters } from './components/MediaFilters';
import { MediaGrid } from './components/MediaGrid';
import { MediaPanel } from './components/MediaPanel';
import { SelectionBar } from './components/SelectionBar';
import { DeleteConfirmModal } from './components/DeleteConfirmModal';

export function MediaLibrarySection() {
  const { t } = useI18n();
  const showFlash = useAdminStore((s) => s.showFlash);
  const {
    filtered, mediaLoading, totalCount,
    sort, setSort, filterUsage, setFilterUsage, filterType, setFilterType,
    filterDimension, setFilterDimension, availableDimensions,
    selectedIds, toggleSelect, clearSelection,
    panelMedia, openPanel, closePanel,
    handleUpload, fileInputRef,
    showDeleteModal, deleteTarget, deleteItems,
    handleDeleteSingle, handleDeleteBulk, confirmDelete, cancelDelete,
    updateMediaEntry,
  } = useMediaLibrary();

  const [isDragOver, setIsDragOver] = useState(false);
  const [uploading, setUploading] = useState(false);
  const dragCounter = useRef(0);

  // Drag & drop global
  const handleDragEnter = useCallback((e: DragEvent) => {
    e.preventDefault();
    dragCounter.current++;
    if (dragCounter.current === 1) setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: DragEvent) => {
    e.preventDefault();
    dragCounter.current--;
    if (dragCounter.current === 0) setIsDragOver(false);
  }, []);

  const handleDragOver = useCallback((e: DragEvent) => {
    e.preventDefault();
  }, []);

  const handleDrop = useCallback(async (e: DragEvent) => {
    e.preventDefault();
    dragCounter.current = 0;
    setIsDragOver(false);
    if (e.dataTransfer?.files?.length) {
      setUploading(true);
      const result = await handleUpload(e.dataTransfer.files);
      setUploading(false);
      if (result.ok) {
        const n = e.dataTransfer.files.length;
        showFlash(
          n === 1
            ? t('mediaLibrary.uploadSuccess_one')
            : t('mediaLibrary.uploadSuccess_other').replace('{n}', String(n)),
          'success'
        );
      } else {
        showFlash(result.error || t('mediaLibrary.uploadError'), 'error');
      }
    }
  }, [handleUpload, showFlash, t]);

  useEffect(() => {
    const el = document.getElementById('media-library-section');
    if (!el) return;
    el.addEventListener('dragenter', handleDragEnter);
    el.addEventListener('dragleave', handleDragLeave);
    el.addEventListener('dragover', handleDragOver);
    el.addEventListener('drop', handleDrop);
    return () => {
      el.removeEventListener('dragenter', handleDragEnter);
      el.removeEventListener('dragleave', handleDragLeave);
      el.removeEventListener('dragover', handleDragOver);
      el.removeEventListener('drop', handleDrop);
    };
  }, [handleDragEnter, handleDragLeave, handleDragOver, handleDrop]);

  const handleFileInput = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files?.length) return;
    setUploading(true);
    const result = await handleUpload(files);
    setUploading(false);
    if (result.ok) {
      const n = files.length;
      showFlash(
        n === 1
          ? t('mediaLibrary.uploadSuccess_one')
          : t('mediaLibrary.uploadSuccess_other').replace('{n}', String(n)),
        'success'
      );
    } else {
      showFlash(result.error || t('mediaLibrary.uploadError'), 'error');
    }
    // Reset pour permettre re-upload du même fichier
    e.target.value = '';
  }, [handleUpload, showFlash, t]);

  const handleSave = useCallback(async (
    id: string,
    data: { altText?: string; title?: string; tags?: string[] }
  ) => {
    const ok = await updateMediaEntry(id, data);
    if (ok) showFlash(t('mediaLibrary.panelSaved'), 'success');
    else showFlash(t('mediaLibrary.panelSaveError'), 'error');
    return ok;
  }, [updateMediaEntry, showFlash, t]);

  const handleDeleteFromPanel = useCallback((id: string) => {
    handleDeleteSingle(id);
  }, [handleDeleteSingle]);

  const handleConfirmDelete = useCallback(async () => {
    const ok = await confirmDelete();
    if (ok) {
      const n = deleteItems.length;
      showFlash(
        n === 1
          ? t('mediaLibrary.deleted')
          : t('mediaLibrary.bulkDeleted').replace('{n}', String(n)),
        'success'
      );
    } else {
      showFlash(t('mediaLibrary.deleteError'), 'error');
    }
  }, [confirmDelete, deleteItems.length, showFlash, t]);

  if (mediaLoading && totalCount === 0) {
    return (
      <div className="carousel-section media-library-section">
        <div className="carousel-section-header">
          <div>
            <h2>{t('mediaLibrary.sectionTitle')}</h2>
            <div className="carousel-info">{t('mediaLibrary.loading')}</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="carousel-section media-library-section" id="media-library-section">
      <div className="carousel-section-header">
        <div>
          <h2>{t('mediaLibrary.sectionTitle')}</h2>
          <div className="carousel-info">{t('mediaLibrary.sectionInfo')}</div>
        </div>
      </div>

      {/* Barre d'import + filtres */}
      <div className="media-library-toolbar">
        <button
          className="btn btn-primary media-import-btn"
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
        >
          <Upload size={16} />
          {uploading ? t('mediaLibrary.loading') : t('mediaLibrary.btnImport')}
        </button>
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept="image/jpeg,image/png,image/webp,image/svg+xml"
          className="hidden"
          onChange={handleFileInput}
        />
      </div>

      <MediaFilters
        sort={sort}
        setSort={setSort}
        filterUsage={filterUsage}
        setFilterUsage={setFilterUsage}
        filterType={filterType}
        setFilterType={setFilterType}
        filterDimension={filterDimension}
        setFilterDimension={setFilterDimension}
        availableDimensions={availableDimensions}
        totalCount={filtered.length}
      />

      {/* Grille */}
      <MediaGrid
        items={filtered}
        selectedIds={selectedIds}
        onToggleSelect={toggleSelect}
        onOpen={openPanel}
      />

      {/* Barre de sélection */}
      <SelectionBar
        count={selectedIds.size}
        onDeselect={clearSelection}
        onDelete={handleDeleteBulk}
      />

      {/* Panel latéral */}
      {panelMedia && (
        <MediaPanel
          media={panelMedia}
          onClose={closePanel}
          onSave={handleSave}
          onDelete={handleDeleteFromPanel}
        />
      )}

      {/* Modal confirmation suppression */}
      {showDeleteModal && deleteItems.length > 0 && (
        <DeleteConfirmModal
          items={deleteItems}
          mode={deleteTarget}
          onConfirm={handleConfirmDelete}
          onCancel={cancelDelete}
        />
      )}

      {/* Overlay drag & drop */}
      {isDragOver && (
        <div className="media-dragover-overlay">
          <div className="media-dragover-content">
            <Upload size={48} />
            <span>{t('mediaLibrary.dragOverlay')}</span>
          </div>
        </div>
      )}
    </div>
  );
}
