'use client';

import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useAdminStore } from '@/lib/admin/store';
import type { MediaItemWithMeta } from '@/lib/types';

export type SortMode = 'newest' | 'oldest' | 'largest' | 'smallest';
export type FilterUsage = 'all' | 'used' | 'orphan';
export type FilterType = 'all' | 'jpg' | 'png' | 'webp' | 'svg';

export function useMediaLibrary() {
  const mediaItems = useAdminStore((s) => s.mediaItems);
  const mediaFolders = useAdminStore((s) => s.mediaFolders);
  const mediaLoading = useAdminStore((s) => s.mediaLoading);
  const loadMedia = useAdminStore((s) => s.loadMedia);
  const uploadMedia = useAdminStore((s) => s.uploadMedia);
  const deleteMedia = useAdminStore((s) => s.deleteMedia);
  const bulkDeleteMedia = useAdminStore((s) => s.bulkDeleteMedia);
  const updateMediaEntry = useAdminStore((s) => s.updateMediaEntry);
  const createFolder = useAdminStore((s) => s.createFolder);
  const renameFolder = useAdminStore((s) => s.renameFolder);
  const deleteFolderAction = useAdminStore((s) => s.deleteFolder);
  const moveMedia = useAdminStore((s) => s.moveMedia);

  const [sort, setSort] = useState<SortMode>('newest');
  const [filterUsage, setFilterUsage] = useState<FilterUsage>('all');
  const [filterType, setFilterType] = useState<FilterType>('all');
  const [filterDimension, setFilterDimension] = useState<string>('all');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [panelMediaId, setPanelMediaId] = useState<string | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<'single' | 'bulk'>('single');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Dossier actuellement ouvert (null = racine)
  const [currentFolderId, setCurrentFolderId] = useState<string | null>(null);
  const [showMoveModal, setShowMoveModal] = useState(false);

  // Mode sélection : clic sur l'image = sélectionner (au lieu d'ouvrir le panel)
  const [selectMode, setSelectMode] = useState(false);

  useEffect(() => {
    loadMedia();
  }, [loadMedia]);

  // Dimensions uniques disponibles (triées par surface décroissante)
  const availableDimensions = useMemo(() => {
    const dimMap = new Map<string, number>();
    for (const m of mediaItems) {
      if (m.width && m.height && m.width > 0 && m.height > 0) {
        const key = `${m.width}x${m.height}`;
        dimMap.set(key, (dimMap.get(key) ?? 0) + 1);
      }
    }
    return [...dimMap.entries()]
      .map(([dim, count]) => {
        const [w, h] = dim.split('x').map(Number);
        return { dim, count, area: w * h };
      })
      .sort((a, b) => b.area - a.area);
  }, [mediaItems]);

  // Items filtrés par dossier courant + filtres
  const filtered = useMemo(() => {
    let items = [...mediaItems];

    // Filtre par dossier courant
    if (currentFolderId) {
      items = items.filter((m) => m.folderId === currentFolderId);
    } else {
      // Racine : seulement les médias sans dossier
      items = items.filter((m) => !m.folderId);
    }

    // Filtre usage
    if (filterUsage === 'used') items = items.filter((m) => m.usedIn.length > 0);
    if (filterUsage === 'orphan') items = items.filter((m) => m.usedIn.length === 0);

    // Filtre type
    if (filterType === 'jpg') items = items.filter((m) => m.mimeType === 'image/jpeg');
    if (filterType === 'png') items = items.filter((m) => m.mimeType === 'image/png');
    if (filterType === 'webp') items = items.filter((m) => m.mimeType === 'image/webp');
    if (filterType === 'svg') items = items.filter((m) => m.mimeType === 'image/svg+xml');

    // Filtre dimension
    if (filterDimension !== 'all') {
      const [w, h] = filterDimension.split('x').map(Number);
      items = items.filter((m) => m.width === w && m.height === h);
    }

    // Tri
    switch (sort) {
      case 'newest':
        items.sort((a, b) => new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime());
        break;
      case 'oldest':
        items.sort((a, b) => new Date(a.uploadedAt).getTime() - new Date(b.uploadedAt).getTime());
        break;
      case 'largest':
        items.sort((a, b) => (b.fileSize ?? 0) - (a.fileSize ?? 0));
        break;
      case 'smallest':
        items.sort((a, b) => (a.fileSize ?? 0) - (b.fileSize ?? 0));
        break;
    }

    return items;
  }, [mediaItems, sort, filterUsage, filterType, filterDimension, currentFolderId]);

  // Nombre de médias dans chaque dossier
  const folderMediaCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const m of mediaItems) {
      if (m.folderId) {
        counts[m.folderId] = (counts[m.folderId] ?? 0) + 1;
      }
    }
    return counts;
  }, [mediaItems]);

  const currentFolder = useMemo(
    () => mediaFolders.find((f) => f.id === currentFolderId) ?? null,
    [mediaFolders, currentFolderId]
  );

  const toggleSelect = useCallback((id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const clearSelection = useCallback(() => {
    setSelectedIds(new Set());
    setSelectMode(false);
  }, []);

  const toggleSelectMode = useCallback(() => {
    setSelectMode((prev) => {
      if (prev) setSelectedIds(new Set()); // sortie = vider la sélection
      return !prev;
    });
  }, []);

  const openPanel = useCallback((id: string) => {
    setPanelMediaId(id);
  }, []);

  const closePanel = useCallback(() => {
    setPanelMediaId(null);
  }, []);

  const panelMedia = useMemo(
    () => mediaItems.find((m) => m.id === panelMediaId) ?? null,
    [mediaItems, panelMediaId]
  );

  const handleUpload = useCallback(async (files: FileList | File[]) => {
    return uploadMedia(files, currentFolderId ?? undefined);
  }, [uploadMedia, currentFolderId]);

  const handleDeleteSingle = useCallback((id: string) => {
    setDeleteTarget('single');
    setPanelMediaId(id);
    setShowDeleteModal(true);
  }, []);

  const handleDeleteBulk = useCallback(() => {
    setDeleteTarget('bulk');
    setShowDeleteModal(true);
  }, []);

  const confirmDelete = useCallback(async () => {
    setShowDeleteModal(false);
    if (deleteTarget === 'single' && panelMediaId) {
      const ok = await deleteMedia(panelMediaId);
      if (ok) setPanelMediaId(null);
      return ok;
    }
    if (deleteTarget === 'bulk' && selectedIds.size > 0) {
      const result = await bulkDeleteMedia(Array.from(selectedIds));
      if (result.ok) { setSelectedIds(new Set()); setSelectMode(false); }
      return result.ok;
    }
    return false;
  }, [deleteTarget, panelMediaId, selectedIds, deleteMedia, bulkDeleteMedia]);

  const cancelDelete = useCallback(() => {
    setShowDeleteModal(false);
  }, []);

  // Média(s) concerné(s) par la suppression en cours
  const deleteItems = useMemo((): MediaItemWithMeta[] => {
    if (deleteTarget === 'single' && panelMediaId) {
      const item = mediaItems.find((m) => m.id === panelMediaId);
      return item ? [item] : [];
    }
    if (deleteTarget === 'bulk') {
      return mediaItems.filter((m) => selectedIds.has(m.id));
    }
    return [];
  }, [deleteTarget, panelMediaId, selectedIds, mediaItems]);

  // Navigation dossiers
  const openFolder = useCallback((folderId: string) => {
    setCurrentFolderId(folderId);
    setSelectedIds(new Set());
  }, []);

  const goToRoot = useCallback(() => {
    setCurrentFolderId(null);
    setSelectedIds(new Set());
  }, []);

  // CRUD dossiers
  const handleCreateFolder = useCallback(async (name: string) => {
    return createFolder(name);
  }, [createFolder]);

  const handleRenameFolder = useCallback(async (folderId: string, name: string) => {
    return renameFolder(folderId, name);
  }, [renameFolder]);

  const handleDeleteFolder = useCallback(async (folderId: string) => {
    const ok = await deleteFolderAction(folderId);
    if (ok && currentFolderId === folderId) {
      setCurrentFolderId(null);
    }
    return ok;
  }, [deleteFolderAction, currentFolderId]);

  // Déplacement
  const handleMoveMedia = useCallback(async (mediaIds: string[], folderId: string | null) => {
    const ok = await moveMedia(mediaIds, folderId);
    if (ok) {
      setSelectedIds(new Set());
      setShowMoveModal(false);
    }
    return ok;
  }, [moveMedia]);

  const openMoveModal = useCallback(() => {
    setShowMoveModal(true);
  }, []);

  const closeMoveModal = useCallback(() => {
    setShowMoveModal(false);
  }, []);

  return {
    // Data
    filtered,
    mediaLoading,
    totalCount: mediaItems.length,

    // Filtres
    sort, setSort,
    filterUsage, setFilterUsage,
    filterType, setFilterType,
    filterDimension, setFilterDimension,
    availableDimensions,

    // Sélection
    selectedIds, toggleSelect, clearSelection, selectMode, toggleSelectMode,

    // Panel
    panelMedia, panelMediaId, openPanel, closePanel,

    // Upload
    handleUpload, fileInputRef,

    // Delete
    showDeleteModal, deleteTarget, deleteItems,
    handleDeleteSingle, handleDeleteBulk, confirmDelete, cancelDelete,

    // Update
    updateMediaEntry,

    // Dossiers
    mediaFolders, folderMediaCounts,
    currentFolderId, currentFolder,
    openFolder, goToRoot,
    handleCreateFolder, handleRenameFolder, handleDeleteFolder,

    // Déplacement
    showMoveModal, openMoveModal, closeMoveModal,
    handleMoveMedia,
  };
}
