'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useI18n } from '@/lib/i18n/context';
import { useAdminStore } from '@/lib/admin/store';
import { useFlashMessage } from '@/lib/hooks/useFlashMessage';
import type { FooterBlock, FooterBlockType } from '@/lib/types';

import type { FooterFormField } from '../components/BusinessForm';

type FooterFormData = Record<FooterFormField, string>;

export function useFooterLogic() {
  const { t } = useI18n();
  const site = useAdminStore((s) => s.site);
  const loadSite = useAdminStore((s) => s.loadSite);
  const saveSite = useAdminStore((s) => s.saveSite);
  const [collapsed, setCollapsed] = useState(false);
  const [cols, setCols] = useState(3);
  const [blocks, setBlocks] = useState<FooterBlock[]>([]);
  const [formData, setFormData] = useState<FooterFormData>({
    phone: '', email: '', address: '',
    weekdays: '', saturday: '', hoursNote: '',
    siret: '', certifications: '', copyright: '',
  });
  const [saving, setSaving] = useState(false);
  const { message, show } = useFlashMessage();
  const [showDropdown, setShowDropdown] = useState(false);
  const blockCounterRef = useRef(0);

  useEffect(() => {
    if (!site) loadSite();
  }, [site, loadSite]);

  useEffect(() => {
    if (site) {
      const b = site.business || {} as Record<string, unknown>;
      const h = (b as { hours?: Record<string, string> }).hours || {};
      const l = (b as { legal?: Record<string, string> }).legal || {};
      const footer = site.footer || { cols: 3, blocks: [] };
      setCols(footer.cols || 3);
      setBlocks(footer.blocks as FooterBlock[] || []);
      blockCounterRef.current = (footer.blocks || []).length;
      setFormData({
        phone: b.phone || '',
        email: b.email || '',
        address: b.address || '',
        weekdays: h.weekdays || '',
        saturday: h.saturday || '',
        hoursNote: h.note || '',
        siret: l.siret || '',
        certifications: l.certifications || '',
        copyright: l.copyright || '',
      });
    }
  }, [site]);

  useEffect(() => {
    const close = () => setShowDropdown(false);
    document.addEventListener('click', close);
    return () => document.removeEventListener('click', close);
  }, []);

  const checkOverlaps = useCallback((): boolean => {
    const cells: Record<string, string> = {};
    for (const b of blocks) {
      for (let c = b.col; c < b.col + (b.colSpan || 1) && c <= cols; c++) {
        const key = b.row + '-' + c;
        if (cells[key]) return true;
        cells[key] = b.blockId;
      }
    }
    return false;
  }, [blocks, cols]);

  const updateField = (field: FooterFormField, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const addBlock = (type: FooterBlockType) => {
    blockCounterRef.current++;
    const newBlock: FooterBlock = {
      blockId: 'f' + blockCounterRef.current,
      type,
      row: 1, col: 1, colSpan: 1,
    };
    if (type === 'social-links') {
      newBlock.direction = 'vertical';
    }
    if (type === 'map') {
      newBlock.provider = 'leaflet';
      newBlock.height = '300';
    }
    setBlocks(prev => [...prev, newBlock]);
    setShowDropdown(false);
  };

  const removeBlock = (blockId: string) => {
    setBlocks(prev => prev.filter(b => b.blockId !== blockId));
  };

  const updateBlock = (blockId: string, updates: Partial<FooterBlock>) => {
    setBlocks(prev => prev.map(b => b.blockId === blockId ? { ...b, ...updates } : b));
  };

  const save = async () => {
    if (checkOverlaps()) {
      show(t('footerSection.validationOverlap'), 'error');
      return;
    }
    setSaving(true);
    const d = formData;
    const ok = await saveSite({
      footer: { cols, blocks },
      business: {
        ...site!.business,
        phone: d.phone.trim(),
        email: d.email.trim(),
        address: d.address.trim(),
        hours: {
          weekdays: d.weekdays.trim(),
          saturday: d.saturday.trim(),
          note: d.hoursNote.trim(),
        },
        legal: {
          siret: d.siret.trim(),
          certifications: d.certifications.trim(),
          copyright: d.copyright.trim(),
        },
      },
    });
    if (ok) {
      show(t('footerSection.saved'), 'success');
    } else {
      show(t('footerSection.saveError'), 'error');
    }
    setSaving(false);
  };

  return {
    collapsed,
    setCollapsed,
    cols,
    setCols,
    blocks,
    formData,
    updateField,
    saving,
    message,
    showDropdown,
    setShowDropdown,
    hasOverlap: checkOverlaps(),
    addBlock,
    removeBlock,
    updateBlock,
    save,
    t,
  };
}
