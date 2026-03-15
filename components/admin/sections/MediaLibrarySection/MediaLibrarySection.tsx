'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { Upload, FolderPlus, ArrowLeft, CheckSquare } from 'lucide-react';
import { useI18n } from '@/lib/i18n/context';
import { useAdminStore } from '@/lib/admin/store';
import { useMediaLibrary } from './hooks/useMediaLibrary';
import { MediaFilters } from './components/MediaFilters';
import { MediaGrid } from './components/MediaGrid';
import { MediaPanel } from './components/MediaPanel';
import { SelectionBar } from './components/SelectionBar';
import { DeleteConfirmModal } from './components/DeleteConfirmModal';
import { FolderCard } from './components/FolderCard';
import { MoveToFolderModal } from './components/MoveToFolderModal';

export function MediaLibrarySection() {
  const { t } = useI18n();
  const showFlash = useAdminStore((s) => s.showFlash);
  const {
    filtered, mediaLoading, totalCount,
    sort, setSort, filterUsage, setFilterUsage, filterType, setFilterType,
    filterDimension, setFilterDimension, availableDimensions,
    selectedIds, toggleSelect, clearSelection, selectMode, toggleSelectMode,
    panelMedia, openPanel, closePanel,
    handleUpload, fileInputRef,
    showDeleteModal, deleteTarget, deleteItems,
    handleDeleteSingle, handleDeleteBulk, confirmDelete, cancelDelete,
    updateMediaEntry,
    // Dossiers
    mediaFolders, folderMediaCounts,
    currentFolderId, currentFolder,
    openFolder, goToRoot,
    handleCreateFolder, handleRenameFolder, handleDeleteFolder,
    // Déplacement
    showMoveModal, openMoveModal, closeMoveModal, handleMoveMedia,
  } = useMediaLibrary();

  const [isDragOver, setIsDragOver] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [showNewFolder, setShowNewFolder] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const dragCounter = useRef(0);
  const newFolderRef = useRef<HTMLInputElement>(null);

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

  const handleCreateNewFolder = useCallback(async () => {
    const name = newFolderName.trim();
    if (!name) return;
    const folder = await handleCreateFolder(name);
    if (folder) {
      showFlash(t('mediaLibrary.folderCreated'), 'success');
      setNewFolderName('');
      setShowNewFolder(false);
    } else {
      showFlash(t('mediaLibrary.folderCreateError'), 'error');
    }
  }, [newFolderName, handleCreateFolder, showFlash, t]);

  const handleMoveConfirm = useCallback(async (folderId: string | null) => {
    const ok = await handleMoveMedia(Array.from(selectedIds), folderId);
    if (ok) {
      showFlash(t('mediaLibrary.moved'), 'success');
    } else {
      showFlash(t('mediaLibrary.moveError'), 'error');
    }
  }, [handleMoveMedia, selectedIds, showFlash, t]);

  useEffect(() => {
    if (showNewFolder) newFolderRef.current?.focus();
  }, [showNewFolder]);

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

      {/* Breadcrumb navigation */}
      {currentFolder && (
        <div className="flex items-center gap-2 mb-3">
          <button
            className="flex items-center gap-[0.3rem] bg-transparent border-none text-[var(--bo-accent,#6366f1)] cursor-pointer text-[0.85rem] p-0 hover:underline"
            onClick={goToRoot}
          >
            <ArrowLeft size={16} /> {t('mediaLibrary.sectionTitle')}
          </button>
          <span className="text-[var(--bo-text-dim)] text-[0.85rem]">/</span>
          <span className="text-[var(--bo-text)] text-[0.85rem] font-medium">{currentFolder.name}</span>
        </div>
      )}

      {/* Barre d'import + nouveau dossier */}
      <div className="flex items-center gap-[0.6rem] mb-[0.8rem]">
        <button
          className="btn btn-primary inline-flex items-center gap-[0.4rem]"
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
        >
          <Upload size={16} />
          {uploading ? t('mediaLibrary.loading') : t('mediaLibrary.btnImport')}
        </button>
        {!currentFolderId && (
          <button
            className="btn btn-secondary inline-flex items-center gap-[0.4rem]"
            onClick={() => setShowNewFolder(true)}
          >
            <FolderPlus size={16} />
            {t('mediaLibrary.btnNewFolder')}
          </button>
        )}
        <button
          className={`btn inline-flex items-center gap-[0.4rem] ${selectMode ? 'btn-primary' : 'btn-secondary'}`}
          onClick={toggleSelectMode}
        >
          <CheckSquare size={16} />
          {selectMode ? t('mediaLibrary.btnSelectModeOn') : t('mediaLibrary.btnSelectMode')}
        </button>
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept="image/jpeg,image/png,image/webp,image/svg+xml"
          style={{ display: 'none' }}
          onChange={handleFileInput}
        />
      </div>

      {/* Création nouveau dossier */}
      {showNewFolder && (
        <div className="flex items-center gap-2 mb-3 p-3 bg-[var(--bo-bg)] border border-[var(--bo-border)] rounded-[8px]">
          <input
            ref={newFolderRef}
            className="flex-1 bg-[var(--bo-surface)] border border-[var(--bo-border)] text-[var(--bo-text)] text-[0.85rem] px-3 py-[0.35rem] rounded-[4px] outline-none focus:border-[var(--bo-accent,#6366f1)]"
            placeholder={t('mediaLibrary.folderNamePlaceholder')}
            value={newFolderName}
            onChange={(e) => setNewFolderName(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') handleCreateNewFolder(); if (e.key === 'Escape') setShowNewFolder(false); }}
          />
          <button className="btn btn-primary text-[0.8rem] px-3 py-[0.3rem]" onClick={handleCreateNewFolder}>
            {t('mediaLibrary.btnCreate')}
          </button>
          <button className="btn btn-secondary text-[0.8rem] px-3 py-[0.3rem]" onClick={() => setShowNewFolder(false)}>
            {t('common.cancel')}
          </button>
        </div>
      )}

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
        totalCount={currentFolderId ? filtered.length : totalCount}
      />

      {/* Grille des dossiers (seulement à la racine) */}
      {!currentFolderId && mediaFolders.length > 0 && (
        <div className="mb-4">
          <h3 className="text-[0.8rem] font-semibold text-[var(--bo-text-dim)] uppercase tracking-wide mb-2">
            {t('mediaLibrary.foldersLabel')}
          </h3>
          <div className="grid gap-[0.6rem]" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))' }}>
            {mediaFolders.map((folder) => (
              <FolderCard
                key={folder.id}
                folder={folder}
                mediaCount={folderMediaCounts[folder.id] ?? 0}
                onOpen={openFolder}
                onRename={handleRenameFolder}
                onDelete={handleDeleteFolder}
              />
            ))}
          </div>
        </div>
      )}

      {/* Séparateur si dossiers ET images à la racine */}
      {!currentFolderId && mediaFolders.length > 0 && filtered.length > 0 && (
        <h3 className="text-[0.8rem] font-semibold text-[var(--bo-text-dim)] uppercase tracking-wide mb-2">
          {t('mediaLibrary.unsortedLabel')}
        </h3>
      )}

      {/* Grille images */}
      <MediaGrid
        items={filtered}
        selectedIds={selectedIds}
        selectMode={selectMode}
        onToggleSelect={toggleSelect}
        onOpen={openPanel}
      />

      {/* Barre de sélection */}
      <SelectionBar
        count={selectedIds.size}
        onDeselect={clearSelection}
        onMove={openMoveModal}
        onDelete={handleDeleteBulk}
      />

      {/* Modal déplacement */}
      {showMoveModal && selectedIds.size > 0 && (
        <MoveToFolderModal
          folders={mediaFolders}
          currentFolderId={currentFolderId}
          selectedCount={selectedIds.size}
          onMove={handleMoveConfirm}
          onClose={closeMoveModal}
        />
      )}

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
        <div className="fixed inset-0 bg-[rgba(52,211,153,0.12)] backdrop-blur-[2px] z-[400] flex items-center justify-center pointer-events-none">
          <div className="flex flex-col items-center gap-[0.8rem] text-[var(--bo-green)] text-[1.2rem] font-semibold">
            <Upload size={48} />
            <span>{t('mediaLibrary.dragOverlay')}</span>
          </div>
        </div>
      )}
    </div>
  );
}
