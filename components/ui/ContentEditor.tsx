'use client';

import { useEffect } from 'react';

interface Props {
  pageId: string;
  lang: string;
  backPath?: string;
}

// Limites de caractères par content-key (textContent, sans HTML)
const CHAR_LIMITS: Record<string, number> = {
  // Titres hero
  'hero-title': 80,
  'hero-eyebrow': 40,
  'hero-subtitle': 150,
  // Titres de sections (s1/s2/s3 = galeries bento)
  's1-title': 80,  's1-tag': 40,
  's2-title': 80,  's2-tag': 40,
  's3-title': 80,  's3-tag': 40,
  // About
  'about-title': 80,
  'about-p1': 400,
  'about-p2': 400,
  // Services
  'services-title': 80,
  'service-1-title': 60, 'service-1-desc': 220,
  'service-2-title': 60, 'service-2-desc': 220,
  'service-3-title': 60, 'service-3-desc': 220,
  'service-4-title': 60, 'service-4-desc': 220,
  // Features (about cards)
  'feature-1-title': 22, 'feature-1-desc': 220,
  'feature-2-title': 22, 'feature-2-desc': 220,
  'feature-3-title': 22, 'feature-3-desc': 220,
  // Gallery
  'gallery-title': 80,
  // Bento hero
  'bento-hero-title': 70,
  'bento-hero-tag': 30,
  'bento-hero-desc': 150,
  // Bento cards
  'bento-card1-title': 45, 'bento-card1-tag': 30, 'bento-card1-desc': 200,
  'bento-card2-title': 45, 'bento-card2-tag': 30, 'bento-card2-desc': 200,
  // Cinematic
  'cinematic-title': 80,
  'cinematic-desc': 220,
  // Contact
  'contact-title': 80,
};

// Fallback basé sur le suffixe de la clé
function getLimitForKey(key: string): number {
  if (key.endsWith('-title') || key === 'hero-title') return 80;
  if (key.endsWith('-tag') || key === 'hero-eyebrow') return 40;
  if (key.endsWith('-subtitle')) return 150;
  if (key.endsWith('-desc')) return 220;
  if (key.startsWith('about-p') || key.endsWith('-p1') || key.endsWith('-p2')) return 400;
  return 300;
}

function getLimit(key: string): number {
  return CHAR_LIMITS[key] ?? getLimitForKey(key);
}

export function ContentEditor({ pageId, lang, backPath = '/back' }: Props) {
  useEffect(() => {
    let editBar: HTMLDivElement | null = null;
    let editTrigger: HTMLButtonElement | null = null;
    let editToolbar: HTMLDivElement | null = null;
    let richToolbar: HTMLDivElement | null = null;
    let charCounter: HTMLDivElement | null = null;
    let currentEl: HTMLElement | null = null;
    let savedContent: string | null = null;
    let isEditing = false;
    let currentLimit = 300;
    let hideTimeout: ReturnType<typeof setTimeout> | null = null;

    function getTextLength(el: HTMLElement): number {
      return (el.textContent || '').length;
    }

    function updateCounter(el: HTMLElement) {
      if (!charCounter) return;
      const len = getTextLength(el);
      const remaining = currentLimit - len;
      charCounter.textContent = `${len} / ${currentLimit}`;
      charCounter.className = `content-editor-counter${remaining <= 10 ? ' content-editor-counter--danger' : remaining <= 30 ? ' content-editor-counter--warn' : ''}`;

      const rect = el.getBoundingClientRect();
      charCounter.style.top = (rect.bottom + window.scrollY + 4) + 'px';
      charCounter.style.left = (rect.right + window.scrollX) + 'px';
      charCounter.style.display = 'block';
    }

    function onInput() {
      if (!currentEl) return;
      const len = getTextLength(currentEl);
      if (len > currentLimit) {
        // Tronquer si dépassement
        const text = (currentEl.textContent || '').slice(0, currentLimit);
        currentEl.textContent = text;
        // Replacer le curseur à la fin
        const range = document.createRange();
        range.selectNodeContents(currentEl);
        range.collapse(false);
        const sel = window.getSelection();
        sel?.removeAllRanges();
        sel?.addRange(range);
      }
      updateCounter(currentEl);
    }

    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Enter' && !e.shiftKey) {
        if (currentEl?.classList.contains('layout-richtext')) return;
        e.preventDefault();
        saveEdit();
      } else if (e.key === 'Escape') {
        cancelEdit();
      }
    }

    function positionTrigger(el: HTMLElement) {
      if (!editTrigger) return;
      const rect = el.getBoundingClientRect();
      editTrigger.style.top = (rect.top + window.scrollY - 14) + 'px';
      editTrigger.style.left = (rect.right + window.scrollX - 14) + 'px';
      editTrigger.style.display = 'block';
    }

    function positionToolbar(el: HTMLElement) {
      if (!editToolbar) return;
      const rect = el.getBoundingClientRect();
      editToolbar.style.top = (rect.bottom + window.scrollY + 6) + 'px';
      editToolbar.style.left = rect.left + window.scrollX + 'px';
      editToolbar.style.display = 'flex';
    }

    function openEditor(el: HTMLElement) {
      isEditing = true;
      savedContent = el.innerHTML;
      el.contentEditable = 'true';
      el.classList.add('is-editing');
      el.focus();

      // Déterminer la limite pour cet élément
      const key = el.dataset.contentKey || '';
      currentLimit = getLimit(key);

      const range = document.createRange();
      range.selectNodeContents(el);
      range.collapse(false);
      const sel = window.getSelection();
      sel?.removeAllRanges();
      sel?.addRange(range);

      positionToolbar(el);
      if (editTrigger) editTrigger.style.display = 'none';

      if (el.classList.contains('layout-richtext') && richToolbar) {
        const rect = el.getBoundingClientRect();
        richToolbar.style.top = (rect.top + window.scrollY - richToolbar.offsetHeight - 6) + 'px';
        richToolbar.style.left = rect.left + window.scrollX + 'px';
        richToolbar.style.display = 'flex';
      }

      el.addEventListener('keydown', onKeyDown);
      el.addEventListener('input', onInput);
      updateCounter(el);
    }

    async function saveEdit() {
      if (!currentEl || !isEditing) return;
      const key = currentEl.dataset.contentKey;
      const value = currentEl.innerHTML;
      closeEditor();

      try {
        const res = await fetch('/api/admin/content', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ page: pageId, key, value, lang }),
        });
        if (!res.ok) throw new Error('Save failed');
        showFlash('Texte enregistre', 'success');
      } catch {
        showFlash('Erreur lors de la sauvegarde', 'error');
      }
    }

    function cancelEdit() {
      if (!currentEl || !isEditing) return;
      currentEl.innerHTML = savedContent || '';
      closeEditor();
    }

    function closeEditor() {
      if (!currentEl) return;
      currentEl.contentEditable = 'false';
      currentEl.classList.remove('is-editing');
      currentEl.removeEventListener('keydown', onKeyDown);
      currentEl.removeEventListener('input', onInput);
      if (editToolbar) editToolbar.style.display = 'none';
      if (richToolbar) richToolbar.style.display = 'none';
      if (charCounter) charCounter.style.display = 'none';
      if (editTrigger) editTrigger.style.display = 'none';
      isEditing = false;
      currentEl = null;
      savedContent = null;
    }

    // Sauvegarde automatique si clic en dehors de la zone d'édition
    function onDocumentMouseDown(e: MouseEvent) {
      if (!isEditing || !currentEl) return;
      const target = e.target as Node;
      if (
        currentEl.contains(target) ||
        editToolbar?.contains(target) ||
        richToolbar?.contains(target) ||
        charCounter?.contains(target) ||
        editTrigger?.contains(target)
      ) return;
      saveEdit();
    }

    function showFlash(msg: string, type: string) {
      const flash = document.createElement('div');
      flash.className = `edit-flash edit-flash--${type}`;
      flash.textContent = msg;
      document.body.appendChild(flash);
      setTimeout(() => flash.remove(), 2500);
    }

    async function applyContent() {
      try {
        const res = await fetch('/api/content');
        const content = await res.json();
        const pageContent = content[pageId] || {};
        document.querySelectorAll('[data-content-key]').forEach((el) => {
          const key = (el as HTMLElement).dataset.contentKey;
          if (key && pageContent[key] !== undefined) {
            el.innerHTML = pageContent[key].replace(/\n/g, '<br>');
          }
        });
      } catch {}
    }

    async function checkAdmin(): Promise<boolean> {
      if (!document.cookie.includes('is_admin=')) return false;
      try {
        const res = await fetch('/api/auth/check');
        const data = await res.json();
        return data.valid === true;
      } catch {
        return false;
      }
    }

    function createEditorUI() {
      editBar = document.createElement('div');
      editBar.className = 'admin-edit-bar';
      editBar.innerHTML = `Mode edition admin
        <span class="admin-bar-lang">Langue : <strong>${lang.toUpperCase()}</strong></span>
        <a href="${backPath}" class="admin-bar-backlink">Aller au back office</a>`;
      document.body.prepend(editBar);

      const header = document.querySelector<HTMLElement>('.header');
      if (header && editBar) header.style.top = editBar.offsetHeight + 'px';

      // Lang switcher
      fetch('/api/site')
        .then((r) => r.json())
        .then((site) => {
          const available = site.languages?.available || ['fr'];
          if (available.length <= 1 || !editBar) return;
          const span = editBar.querySelector('.admin-bar-lang');
          if (!span) return;
          span.innerHTML = available
            .map(
              (l: string) =>
                `<button class="lang-btn${l === lang ? ' active' : ''}" data-lang="${l}">${l.toUpperCase()}</button>`
            )
            .join('');
          editBar.querySelectorAll('.lang-btn').forEach((btn) => {
            btn.addEventListener('click', async () => {
              const newLang = (btn as HTMLElement).dataset.lang;
              await fetch('/api/set-lang', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ lang: newLang }),
              });
              window.location.reload();
            });
          });
        })
        .catch(() => {});

      editTrigger = document.createElement('button');
      editTrigger.className = 'edit-trigger';
      editTrigger.title = 'Modifier ce texte';
      editTrigger.innerHTML = '&#9998;';
      editTrigger.addEventListener('click', () => {
        if (currentEl && !isEditing) openEditor(currentEl);
      });
      document.body.appendChild(editTrigger);

      editToolbar = document.createElement('div');
      editToolbar.className = 'edit-toolbar';
      editToolbar.innerHTML = `
        <button class="edit-save">Enregistrer</button>
        <button class="edit-cancel">Annuler</button>`;
      editToolbar.querySelector('.edit-save')?.addEventListener('click', saveEdit);
      editToolbar.querySelector('.edit-cancel')?.addEventListener('click', cancelEdit);
      document.body.appendChild(editToolbar);

      // Compteur de caractères
      charCounter = document.createElement('div');
      charCounter.className = 'content-editor-counter';
      charCounter.style.display = 'none';
      document.body.appendChild(charCounter);

      richToolbar = document.createElement('div');
      richToolbar.className = 'rich-toolbar';
      richToolbar.style.display = 'none';
      richToolbar.innerHTML = `
        <button data-cmd="bold" title="Gras"><b>B</b></button>
        <button data-cmd="italic" title="Italique"><i>I</i></button>
        <button data-cmd="createLink" title="Lien">&#128279;</button>
        <span class="rich-toolbar-sep"></span>
        <button data-cmd="insertUnorderedList" title="Liste">&#9776;</button>
        <span class="rich-toolbar-sep"></span>
        <button data-cmd="justifyLeft" title="Aligner gauche">&#9703;</button>
        <button data-cmd="justifyCenter" title="Centrer">&#9707;</button>
        <button data-cmd="justifyRight" title="Aligner droite">&#9704;</button>`;
      richToolbar.addEventListener('mousedown', (e) => e.preventDefault());
      richToolbar.querySelectorAll('button[data-cmd]').forEach((btn) => {
        btn.addEventListener('click', () => {
          const cmd = (btn as HTMLElement).dataset.cmd;
          if (cmd === 'createLink') {
            const url = prompt('URL du lien :');
            if (url) document.execCommand('createLink', false, url);
          } else if (cmd) {
            document.execCommand(cmd, false, undefined);
          }
        });
      });
      document.body.appendChild(richToolbar);
    }

    function cancelHide() {
      if (hideTimeout !== null) {
        clearTimeout(hideTimeout);
        hideTimeout = null;
      }
    }

    function scheduleHide() {
      cancelHide();
      hideTimeout = setTimeout(() => {
        if (!isEditing) {
          if (editTrigger) editTrigger.style.display = 'none';
          currentEl = null;
        }
        hideTimeout = null;
      }, 200);
    }

    function bindHoverListeners() {
      document.querySelectorAll('[data-content-key]').forEach((el) => {
        el.addEventListener('mouseenter', () => {
          if (isEditing) return;
          cancelHide();
          currentEl = el as HTMLElement;
          positionTrigger(el as HTMLElement);
        });
        el.addEventListener('mouseleave', () => {
          if (isEditing) return;
          scheduleHide();
        });
        el.addEventListener('dblclick', () => {
          if (isEditing) return;
          cancelHide();
          currentEl = el as HTMLElement;
          openEditor(el as HTMLElement);
        });
      });

      editTrigger?.addEventListener('mouseenter', () => {
        if (isEditing) return;
        cancelHide();
      });
      editTrigger?.addEventListener('mouseleave', () => {
        if (isEditing) return;
        scheduleHide();
      });
    }

    async function init() {
      await applyContent();
      const isAdmin = await checkAdmin();
      if (!isAdmin) return;

      document.body.classList.add('admin-mode');
      createEditorUI();
      bindHoverListeners();
      document.addEventListener('mousedown', onDocumentMouseDown);
    }

    init();

    return () => {
      if (hideTimeout !== null) clearTimeout(hideTimeout);
      document.removeEventListener('mousedown', onDocumentMouseDown);
      editBar?.remove();
      editTrigger?.remove();
      editToolbar?.remove();
      richToolbar?.remove();
      charCounter?.remove();
      document.body.classList.remove('admin-mode');
      const header = document.querySelector<HTMLElement>('.header');
      if (header) header.style.top = '';
    };
  }, [pageId, lang, backPath]);

  return null;
}
