'use client';

import { useRef, useCallback } from 'react';

interface DragState {
  carouselId: string;
  draggedFilename: string;
  lastInsertIndex: number | null;
}

// Calcule l'index d'insertion basé sur la position de la souris
function getInsertIndex(cards: HTMLElement[], x: number, y: number): number {
  for (let i = 0; i < cards.length; i++) {
    const r = cards[i].getBoundingClientRect();
    if (y < r.bottom && x < r.left + r.width / 2) return i;
    if (y < r.top) return i;
  }
  return cards.length;
}

// FLIP animation : enregistre positions, déplace dans le DOM, anime les transitions
function flipMove(grid: HTMLElement, draggedEl: HTMLElement, insertBeforeEl: HTMLElement | null) {
  const all = [...grid.querySelectorAll('.image-card')] as HTMLElement[];
  const first = new Map(all.map(c => [c, c.getBoundingClientRect()]));

  // Déplacer dans le DOM
  const addBtn = grid.querySelector('.grid-add-btn');
  grid.insertBefore(draggedEl, insertBeforeEl || addBtn || null);

  // Animer chaque carte (sauf celle qu'on drag)
  all.forEach(c => {
    if (c === draggedEl) return;
    const f = first.get(c);
    if (!f) return;
    const l = c.getBoundingClientRect();
    const dx = f.left - l.left;
    const dy = f.top - l.top;
    if (Math.abs(dx) < 1 && Math.abs(dy) < 1) return;
    c.style.transition = 'none';
    c.style.transform = `translate(${dx}px, ${dy}px)`;
    requestAnimationFrame(() => requestAnimationFrame(() => {
      c.style.transition = 'transform 0.2s ease';
      c.style.transform = '';
    }));
  });
}

export function useDragDrop(
  carouselId: string,
  onReorder: (newOrder: string[]) => void,
) {
  const dragStateRef = useRef<DragState | null>(null);

  const handleDragStart = useCallback((filename: string, e: React.DragEvent) => {
    dragStateRef.current = {
      carouselId,
      draggedFilename: filename,
      lastInsertIndex: null,
    };
    e.dataTransfer.setData('text/plain', filename);
    e.dataTransfer.effectAllowed = 'move';
    const card = e.currentTarget as HTMLElement;
    setTimeout(() => card.classList.add('dragging'), 0);
  }, [carouselId]);

  const handleDragEnd = useCallback((e: React.DragEvent) => {
    const card = e.currentTarget as HTMLElement;
    card.classList.remove('dragging');
    card.style.transition = '';
    card.style.transform = '';

    if (dragStateRef.current?.carouselId === carouselId) {
      const grid = card.parentElement;
      if (grid) {
        const newOrder = [...grid.querySelectorAll('.image-card')]
          .map(c => (c as HTMLElement).dataset.filename!)
          .filter(Boolean);
        onReorder(newOrder);
      }
      dragStateRef.current = null;
    }
  }, [carouselId, onReorder]);

  const handleGridDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();

    // Upload externe de fichiers — juste indiquer qu'on accepte
    if (e.dataTransfer.types.includes('Files')) {
      (e.currentTarget as HTMLElement).classList.add('dragover');
      return;
    }

    // Réordonnancement interne avec FLIP
    const state = dragStateRef.current;
    if (!state || state.carouselId !== carouselId) return;

    const grid = e.currentTarget as HTMLElement;
    const cards = [...grid.querySelectorAll('.image-card:not(.dragging)')] as HTMLElement[];
    const insertIndex = getInsertIndex(cards, e.clientX, e.clientY);

    if (state.lastInsertIndex === insertIndex) return;
    state.lastInsertIndex = insertIndex;

    const draggedCard = grid.querySelector(`.image-card[data-filename="${state.draggedFilename}"]`) as HTMLElement;
    if (!draggedCard) return;

    const insertBefore = insertIndex < cards.length ? cards[insertIndex] : null;
    flipMove(grid, draggedCard, insertBefore);
  }, [carouselId]);

  const handleGridDragLeave = useCallback((e: React.DragEvent) => {
    const grid = e.currentTarget as HTMLElement;
    if (!e.relatedTarget || !grid.contains(e.relatedTarget as Node)) {
      grid.classList.remove('dragover');
    }
  }, []);

  const handleGridDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    (e.currentTarget as HTMLElement).classList.remove('dragover');
  }, []);

  return {
    handleDragStart,
    handleDragEnd,
    handleGridDragOver,
    handleGridDragLeave,
    handleGridDrop,
  };
}
