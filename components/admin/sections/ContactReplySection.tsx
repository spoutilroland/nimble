'use client';

import { useState, useEffect } from 'react';
import { useI18n } from '@/lib/i18n/context';
import { useAdminStore } from '@/lib/admin/store';

export function ContactReplySection() {
  const { t } = useI18n();
  const site = useAdminStore((s) => s.site);
  const loadSite = useAdminStore((s) => s.loadSite);
  const saveSite = useAdminStore((s) => s.saveSite);

  const [enabled, setEnabled] = useState(false);
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  useEffect(() => {
    if (!site) loadSite();
  }, [site, loadSite]);

  useEffect(() => {
    if (site) {
      setEnabled(site.contactReply?.enabled ?? false);
      setSubject(site.contactReply?.subject ?? '');
      setBody(site.contactReply?.message ?? '');
    }
  }, [site]);

  const save = async () => {
    const ok = await saveSite({
      contactReply: {
        enabled,
        subject: subject.trim(),
        message: body.trim(),
      },
    });
    if (ok) {
      setMessage({ text: t('contactReply.saved'), type: 'success' });
      setTimeout(() => setMessage(null), 5000);
    } else {
      setMessage({ text: t('contactReply.saveError'), type: 'error' });
    }
  };

  return (
    <div className="carousel-section" id="contact-reply-section">
      <div className="carousel-section-header">
        <div>
          <h2>{t('contactReply.sectionTitle')}</h2>
          <div className="carousel-info">{t('contactReply.sectionInfo')}</div>
        </div>
        <button
          className="bg-[var(--bo-green)] text-[#0b0d12] font-['Plus_Jakarta_Sans',sans-serif] text-[0.875rem] font-bold tracking-[0.2px] py-[0.65rem] px-6 border-none rounded-xl cursor-pointer transition-[background,box-shadow] duration-200 hover:bg-[var(--primary-light)] hover:shadow-[var(--bo-green-glow)]"
          onClick={save}
        >
          {t('contactReply.btnSave')}
        </button>
      </div>

      <div className="flex flex-col gap-[0.9rem] mt-[0.9rem] max-w-[620px]">
        <div className="border border-[var(--bo-border)] py-[1.2rem] px-[1.4rem]">
          <h3 className="font-['Plus_Jakarta_Sans',sans-serif] text-[0.8rem] tracking-[0.12em] uppercase text-[var(--bo-green)] m-0 mb-4">
            {t('contactReply.groupTitle')}
          </h3>

          <div className="form-group">
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={enabled}
                onChange={(e) => setEnabled(e.target.checked)}
                className="w-4 h-4"
              />
              {t('contactReply.enableLabel')}
            </label>
          </div>

          {enabled && (
            <>
              <div className="form-group">
                <label>{t('contactReply.subjectLabel')}</label>
                <input
                  type="text"
                  value={subject}
                  placeholder={t('contactReply.subjectPlaceholder')}
                  onChange={(e) => setSubject(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label>{t('contactReply.messageLabel')}</label>
                <textarea
                  value={body}
                  placeholder={t('contactReply.messagePlaceholder')}
                  onChange={(e) => setBody(e.target.value)}
                  rows={8}
                  className="w-full resize-y"
                />
              </div>

              <div className="mt-4 p-4 bg-[rgba(74,124,89,0.08)] border-l-[3px] border-l-[var(--bo-green)] text-[0.85rem]">
                <div className="font-semibold mb-2 text-[var(--bo-green)]">
                  {t('contactReply.variablesTitle')}
                </div>
                <ul className="pl-[1.2rem] m-0 mb-[0.8rem] leading-[1.8] text-[var(--bo-text)]">
                  <li><code>{'{name}'}</code> — {t('contactReply.varName')}</li>
                </ul>
                <div className="text-[var(--bo-text-dim)] text-[0.82rem]">
                  {t('contactReply.signatureNote')}
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {message && (
        <div className={`form-message ${message.type}`}>{message.text}</div>
      )}
    </div>
  );
}
