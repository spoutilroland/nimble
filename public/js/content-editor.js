/**
 * content-editor.js — Édition inline des textes (admin only)
 * Chargé sur index.html et nos-travaux.html
 */

(function () {
  'use strict';

  // Détecter la page courante depuis data-page-id (injecté server-side)
  const PAGE = document.documentElement.dataset.pageId ||
    (window.location.pathname === '/nos-travaux' ? 'nos-travaux' : 'index');

  // Langue active (injectée server-side via data-lang)
  const LANG = document.documentElement.dataset.lang ||
    document.documentElement.lang || 'fr';

  // ── 1. Appliquer les textes sauvegardés ──────────────────────
  async function applyContent() {
    try {
      const res = await fetch('/api/content');
      const content = await res.json();
      const pageContent = content[PAGE] || {};

      document.querySelectorAll('[data-content-key]').forEach(el => {
        const key = el.dataset.contentKey;
        if (pageContent[key] !== undefined) {
          el.innerHTML = pageContent[key];
        }
      });
    } catch (e) {}
  }

  // ── 2. Vérifier la session admin — le cookie HttpOnly est envoyé automatiquement
  async function checkAdmin() {
    try {
      const res = await fetch('/api/auth/check');
      const data = await res.json();
      return data.valid === true;
    } catch (e) {
      return false;
    }
  }

  // ── 3. Mode édition admin ────────────────────────────────────
  let editBar, editTrigger, editToolbar, richToolbar;
  let currentEl = null;
  let savedContent = null;
  let isEditing = false;

  async function buildLangSwitcher() {
    try {
      const r = await fetch('/api/site');
      const site = await r.json();
      const available = (site.languages && site.languages.available) || ['fr'];
      if (available.length <= 1) return '';
      const buttons = available.map(l =>
        `<button class="lang-btn${l === LANG ? ' active' : ''}" data-lang="${l}">${l.toUpperCase()}</button>`
      ).join('');
      return `<span class="lang-switcher">${buttons}</span>`;
    } catch { return ''; }
  }

  function createEditorUI() {
    // Barre indicateur en haut
    editBar = document.createElement('div');
    editBar.className = 'admin-edit-bar';
    editBar.innerHTML = `✏ Mode édition admin — passez la souris sur un texte pour le modifier
      <span class="admin-bar-lang">Langue : <strong>${LANG.toUpperCase()}</strong></span>`;
    document.body.prepend(editBar);

    // Décaler le header sticky vers le bas pour ne pas être caché par le bandeau admin
    const header = document.querySelector('.header');
    if (header) header.style.top = editBar.offsetHeight + 'px';

    // Injecter sélecteur de langue si plusieurs langues dispo
    buildLangSwitcher().then(html => {
      if (html) {
        const span = editBar.querySelector('.admin-bar-lang');
        if (span) span.innerHTML = html;
        editBar.querySelectorAll('.lang-btn').forEach(btn => {
          btn.addEventListener('click', async () => {
            const lang = btn.dataset.lang;
            await fetch('/api/set-lang', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ lang })
            });
            window.location.reload();
          });
        });
      }
    });

    // Bouton flottant unique
    editTrigger = document.createElement('button');
    editTrigger.className = 'edit-trigger';
    editTrigger.title = 'Modifier ce texte';
    editTrigger.innerHTML = '✏';
    editTrigger.addEventListener('click', () => {
      if (currentEl && !isEditing) openEditor(currentEl);
    });
    document.body.appendChild(editTrigger);

    // Toolbar Save/Cancel
    editToolbar = document.createElement('div');
    editToolbar.className = 'edit-toolbar';
    editToolbar.innerHTML = `
      <button class="edit-save">Enregistrer</button>
      <button class="edit-cancel">Annuler</button>
    `;
    editToolbar.querySelector('.edit-save').addEventListener('click', saveEdit);
    editToolbar.querySelector('.edit-cancel').addEventListener('click', cancelEdit);
    document.body.appendChild(editToolbar);

    // Mini toolbar richtext (gras, italique, lien, liste, alignement)
    richToolbar = document.createElement('div');
    richToolbar.className = 'rich-toolbar';
    richToolbar.innerHTML = `
      <button data-cmd="bold" title="Gras"><b>B</b></button>
      <button data-cmd="italic" title="Italique"><i>I</i></button>
      <button data-cmd="createLink" title="Lien">🔗</button>
      <span class="rich-toolbar-sep"></span>
      <button data-cmd="insertUnorderedList" title="Liste">☰</button>
      <span class="rich-toolbar-sep"></span>
      <button data-cmd="justifyLeft" title="Aligner gauche">◧</button>
      <button data-cmd="justifyCenter" title="Centrer">◫</button>
      <button data-cmd="justifyRight" title="Aligner droite">◨</button>
    `;
    richToolbar.addEventListener('mousedown', e => e.preventDefault());
    richToolbar.querySelectorAll('button[data-cmd]').forEach(btn => {
      btn.addEventListener('click', () => {
        const cmd = btn.dataset.cmd;
        if (cmd === 'createLink') {
          const url = prompt('URL du lien :');
          if (url) document.execCommand('createLink', false, url);
        } else {
          document.execCommand(cmd, false, null);
        }
      });
    });
    document.body.appendChild(richToolbar);
  }

  function positionTrigger(el) {
    const rect = el.getBoundingClientRect();
    editTrigger.style.top = (rect.top + window.scrollY - 14) + 'px';
    editTrigger.style.left = (rect.right + window.scrollX - 14) + 'px';
    editTrigger.style.display = 'block';
  }

  function positionToolbar(el) {
    const rect = el.getBoundingClientRect();
    editToolbar.style.top = (rect.bottom + window.scrollY + 6) + 'px';
    editToolbar.style.left = rect.left + window.scrollX + 'px';
    editToolbar.style.display = 'flex';
  }

  function openEditor(el) {
    isEditing = true;
    savedContent = el.innerHTML;
    el.contentEditable = 'true';
    el.classList.add('is-editing');
    el.focus();

    // Placer le curseur en fin de contenu
    const range = document.createRange();
    range.selectNodeContents(el);
    range.collapse(false);
    const sel = window.getSelection();
    sel.removeAllRanges();
    sel.addRange(range);

    positionToolbar(el);
    editTrigger.style.display = 'none';

    // Afficher la toolbar richtext pour les blocs richtext
    if (el.classList.contains('layout-richtext')) {
      const rect = el.getBoundingClientRect();
      richToolbar.style.top = (rect.top + window.scrollY - richToolbar.offsetHeight - 6) + 'px';
      richToolbar.style.left = rect.left + window.scrollX + 'px';
      richToolbar.style.display = 'flex';
    }

    // Enter = save (sauf richtext), Escape = cancel
    el.addEventListener('keydown', onKeyDown);
  }

  function onKeyDown(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
      // Dans un bloc richtext, Enter insère un saut de ligne (comportement natif)
      if (currentEl && currentEl.classList.contains('layout-richtext')) return;
      e.preventDefault();
      saveEdit();
    } else if (e.key === 'Escape') {
      cancelEdit();
    }
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
        body: JSON.stringify({ page: PAGE, key, value, lang: LANG })
      });
      if (!res.ok) throw new Error('Save failed');
      // Indication visuelle de succès
      showFlash('Texte enregistré ✓', 'success');
    } catch (e) {
      showFlash('Erreur lors de la sauvegarde', 'error');
    }
  }

  function cancelEdit() {
    if (!currentEl || !isEditing) return;
    currentEl.innerHTML = savedContent;
    closeEditor();
  }

  function closeEditor() {
    if (!currentEl) return;
    currentEl.contentEditable = 'false';
    currentEl.classList.remove('is-editing');
    currentEl.removeEventListener('keydown', onKeyDown);
    editToolbar.style.display = 'none';
    if (richToolbar) richToolbar.style.display = 'none';
    isEditing = false;
    savedContent = null;
  }

  function showFlash(msg, type) {
    const flash = document.createElement('div');
    flash.className = 'edit-flash edit-flash--' + type;
    flash.textContent = msg;
    document.body.appendChild(flash);
    setTimeout(() => flash.remove(), 2500);
  }

  function bindHoverListeners() {
    document.querySelectorAll('[data-content-key]').forEach(el => {
      el.addEventListener('mouseenter', () => {
        if (isEditing) return;
        currentEl = el;
        positionTrigger(el);
      });
      el.addEventListener('mouseleave', (e) => {
        if (isEditing) return;
        // Ne cacher que si on ne va pas sur le bouton
        if (e.relatedTarget !== editTrigger) {
          editTrigger.style.display = 'none';
          currentEl = null;
        }
      });
    });

    editTrigger.addEventListener('mouseleave', (e) => {
      if (isEditing) return;
      if (!e.relatedTarget || !e.relatedTarget.dataset || !e.relatedTarget.dataset.contentKey) {
        editTrigger.style.display = 'none';
        currentEl = null;
      }
    });
  }

  // ── Init ─────────────────────────────────────────────────────
  async function init() {
    await applyContent();

    const isAdmin = await checkAdmin();
    if (!isAdmin) return;

    document.body.classList.add('admin-mode');
    createEditorUI();
    bindHoverListeners();
  }

  // Attendre que le DOM soit prêt
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
