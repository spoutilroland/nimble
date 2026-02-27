'use client';

import { useState, useEffect } from 'react';
import { useI18n } from '@/lib/i18n/context';
import { useAdminStore } from '@/lib/admin/store';
import { useFlashMessage } from '@/lib/hooks/useFlashMessage';
import { slugify } from '@/lib/utils/slug';
import type { PageData } from '@/lib/types';

export function usePagesLogic() {
  const { t, tp } = useI18n();
  const pages = useAdminStore((s) => s.pages);
  const loadPages = useAdminStore((s) => s.loadPages);
  const storeCreatePage = useAdminStore((s) => s.createPage);
  const storeDeletePage = useAdminStore((s) => s.deletePage);
  const storeUpdatePage = useAdminStore((s) => s.updatePage);
  const layouts = useAdminStore((s) => s.layouts);
  const loadLayouts = useAdminStore((s) => s.loadLayouts);
  const site = useAdminStore((s) => s.site);
  const loadSite = useAdminStore((s) => s.loadSite);
  const saveSite = useAdminStore((s) => s.saveSite);
  const [showNewForm, setShowNewForm] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newSlug, setNewSlug] = useState('');
  const [newNav, setNewNav] = useState(true);
  const { message: newMessage, show: showNewMsg } = useFlashMessage();
  const { message: globalMessage, show: showGlobalMsg } = useFlashMessage();
  const { message: redirectMessage, show: showRedirectMsg } = useFlashMessage();

  useEffect(() => {
    loadPages();
    loadLayouts();
    loadSite();
  }, [loadPages, loadLayouts, loadSite]);

  const homepageRedirect = site?.homepageRedirect ?? '';

  const saveRedirect = async (slug: string) => {
    const ok = await saveSite({ homepageRedirect: slug || undefined });
    if (ok) {
      showRedirectMsg(t('pages.redirectSaved'), 'success');
    } else {
      showRedirectMsg(t('pages.saveError'), 'error');
    }
  };

  const createNewPage = async () => {
    if (!newTitle.trim() || !newSlug.trim()) {
      showNewMsg(t('pages.validationTitleSlug'), 'error');
      return;
    }
    if (pages.find(p => p.slug === newSlug.trim())) {
      showNewMsg(t('pages.slugExists'), 'error');
      return;
    }
    const id = newSlug.trim().replace(/^\//, '').replace(/\//g, '-') || 'page-' + Date.now();
    const ok = await storeCreatePage({
      id,
      title: newTitle.trim(),
      slug: newSlug.trim(),
      showInNav: newNav,
      navOrder: pages.length,
      seo: { title: '', description: '', ogImage: null },
      sections: [],
    });
    if (ok) {
      showGlobalMsg(t('pages.saved'), 'success');
      setShowNewForm(false);
      setNewTitle('');
      setNewSlug('');
      setNewNav(true);
    } else {
      showNewMsg(t('pages.saveError'), 'error');
    }
  };

  const deletePage = async (pageId: string) => {
    if (!confirm(t('pages.confirmDelete'))) return;
    const ok = await storeDeletePage(pageId);
    if (ok) {
      showGlobalMsg(t('pages.saved'), 'success');
    } else {
      showGlobalMsg(t('pages.saveError'), 'error');
    }
  };

  const savePage = async (pageId: string, updatedPage: Partial<PageData>) => {
    const current = pages.find(p => p.id === pageId);
    if (!current) return;
    const ok = await storeUpdatePage(pageId, { ...current, ...updatedPage });
    if (ok) {
      showGlobalMsg(t('pages.saved'), 'success');
    } else {
      showGlobalMsg(t('pages.saveError'), 'error');
    }
  };

  const handleTitleChange = (value: string) => {
    setNewTitle(value);
    setNewSlug(slugify(value));
  };

  return {
    pages,
    layouts,
    showNewForm,
    setShowNewForm,
    newTitle,
    newSlug,
    setNewSlug,
    newNav,
    setNewNav,
    newMessage,
    globalMessage,
    createNewPage,
    deletePage,
    savePage,
    handleTitleChange,
    homepageRedirect,
    saveRedirect,
    redirectMessage,
    t,
    tp,
  };
}
