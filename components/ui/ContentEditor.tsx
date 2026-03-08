'use client';

import { useEffect } from 'react';

interface Props {
  pageId: string;
  lang: string;
  backPath?: string;
}

export function ContentEditor({ pageId, lang, backPath = '/back' }: Props) {
  useEffect(() => {
    let editBar: HTMLDivElement | null = null;
    let editTrigger: HTMLButtonElement | null = null;
    let editToolbar: HTMLDivElement | null = null;
    let richToolbar: HTMLDivElement | null = null;
    let currentEl: HTMLElement | null = null;
    let savedContent: string | null = null;
    let isEditing = false;

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
      if (editToolbar) editToolbar.style.display = 'none';
      if (richToolbar) richToolbar.style.display = 'none';
      isEditing = false;
      savedContent = null;
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
            el.innerHTML = pageContent[key];
          }
        });
      } catch {}
    }

    async function checkAdmin(): Promise<boolean> {
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

    function bindHoverListeners() {
      document.querySelectorAll('[data-content-key]').forEach((el) => {
        el.addEventListener('mouseenter', () => {
          if (isEditing) return;
          currentEl = el as HTMLElement;
          positionTrigger(el as HTMLElement);
        });
        el.addEventListener('mouseleave', (e) => {
          if (isEditing) return;
          if ((e as MouseEvent).relatedTarget !== editTrigger) {
            if (editTrigger) editTrigger.style.display = 'none';
            currentEl = null;
          }
        });
      });

      editTrigger?.addEventListener('mouseleave', (e) => {
        if (isEditing) return;
        const related = (e as MouseEvent).relatedTarget as HTMLElement | null;
        if (!related?.dataset?.contentKey) {
          if (editTrigger) editTrigger.style.display = 'none';
          currentEl = null;
        }
      });
    }

    async function init() {
      await applyContent();
      const isAdmin = await checkAdmin();
      if (!isAdmin) return;

      document.body.classList.add('admin-mode');
      createEditorUI();
      bindHoverListeners();
    }

    init();

    return () => {
      editBar?.remove();
      editTrigger?.remove();
      editToolbar?.remove();
      richToolbar?.remove();
      document.body.classList.remove('admin-mode');
      const header = document.querySelector<HTMLElement>('.header');
      if (header) header.style.top = '';
    };
  }, [pageId, lang]);

  return null;
}
