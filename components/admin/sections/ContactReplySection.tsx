'use client';

import { useState, useEffect, useRef } from 'react';
import { useI18n } from '@/lib/i18n/context';
import { useAdminStore } from '@/lib/admin/store';

const SENTINEL = '••set••';

const PROVIDERS = [
  { id: 'gmail',     label: 'Gmail',           host: 'smtp.gmail.com',       port: 587, secure: false },
  { id: 'ovh',       label: 'OVH',             host: 'ssl0.ovh.net',         port: 465, secure: true },
  { id: 'ionos',     label: 'IONOS',           host: 'smtp.ionos.fr',        port: 465, secure: true },
  { id: 'outlook',   label: 'Outlook / Office 365', host: 'smtp.office365.com', port: 587, secure: false },
  { id: 'yahoo',     label: 'Yahoo',           host: 'smtp.mail.yahoo.com',  port: 465, secure: true },
  { id: 'infomaniak', label: 'Infomaniak',     host: 'mail.infomaniak.com',  port: 587, secure: false },
  { id: 'custom',    label: '',                 host: '',                     port: 587, secure: false },
] as const;

type ProviderId = typeof PROVIDERS[number]['id'];

function detectProvider(host: string): ProviderId {
  const match = PROVIDERS.find((p) => p.id !== 'custom' && p.host === host);
  return match ? match.id : 'custom';
}

export function ContactReplySection() {
  const { t } = useI18n();
  const site = useAdminStore((s) => s.site);
  const loadSite = useAdminStore((s) => s.loadSite);
  const saveSite = useAdminStore((s) => s.saveSite);

  // Auto-reply state
  const [enabled, setEnabled] = useState(false);
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');

  // SMTP state
  const [provider, setProvider] = useState<ProviderId>('gmail');
  const [smtpHost, setSmtpHost] = useState('smtp.gmail.com');
  const [smtpPort, setSmtpPort] = useState(587);
  const [smtpSecure, setSmtpSecure] = useState(false);
  const [smtpUser, setSmtpUser] = useState('');
  const [smtpPass, setSmtpPass] = useState(SENTINEL); // sentinel = pass déjà configuré
  const [smtpFrom, setSmtpFrom] = useState('');
  const [smtpTo, setSmtpTo] = useState('');
  const [showAdvanced, setShowAdvanced] = useState(false);
  const passIsSet = smtpPass === SENTINEL;

  // Modale mot de passe
  const [showPassModal, setShowPassModal] = useState(false);
  const [modalPass, setModalPass] = useState('');
  const modalInputRef = useRef<HTMLInputElement>(null);

  // UI state
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);
  const [testing, setTesting] = useState(false);
  const [testHint, setTestHint] = useState(false);
  const [testError, setTestError] = useState<string | null>(null);

  useEffect(() => {
    if (!site) loadSite();
  }, [site, loadSite]);

  useEffect(() => {
    if (site) {
      setEnabled(site.contactReply?.enabled ?? false);
      setSubject(site.contactReply?.subject ?? '');
      setBody(site.contactReply?.message ?? '');

      if (site.mail) {
        const m = site.mail;
        setSmtpHost(m.host || 'smtp.gmail.com');
        setSmtpPort(m.port || 587);
        setSmtpSecure(m.secure ?? false);
        setSmtpUser(m.user || '');
        // pass vaut soit '••set••' (masqué par l'API) soit '' (jamais configuré)
        setSmtpPass(m.pass === SENTINEL ? SENTINEL : '');
        setSmtpFrom(m.from || '');
        setSmtpTo(m.to || '');
        const detected = detectProvider(m.host || '');
        setProvider(detected);
        if (detected === 'custom') setShowAdvanced(true);
      }
    }
  }, [site]);

  const handleProviderChange = (id: ProviderId) => {
    setProvider(id);
    if (id === 'custom') {
      setShowAdvanced(true);
      return;
    }
    const p = PROVIDERS.find((x) => x.id === id)!;
    setSmtpHost(p.host);
    setSmtpPort(p.port);
    setSmtpSecure(p.secure);
  };

  const save = async () => {
    const ok = await saveSite({
      contactReply: {
        enabled,
        subject: subject.trim(),
        message: body.trim(),
      },
      mail: {
        enabled: Boolean(smtpUser && smtpPass),
        host: smtpHost,
        port: smtpPort,
        secure: smtpSecure,
        user: smtpUser.trim(),
        pass: smtpPass.trim(),
        from: smtpFrom.trim() || smtpUser.trim(),
        to: smtpTo.trim(),
      },
    });
    if (ok) {
      flash(t('contactReply.saved'), 'success');
    } else {
      flash(t('contactReply.saveError'), 'error');
    }
  };

  const testConnection = async () => {
    if (!smtpUser || !smtpPass || !smtpTo) {
      flash(t('smtp.notConfigured'), 'error');
      return;
    }
    setTesting(true);
    setTestHint(false);
    setTestError(null);
    try {
      const res = await fetch('/api/admin/mail-test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          host: smtpHost,
          port: smtpPort,
          secure: smtpSecure,
          user: smtpUser.trim(),
          pass: smtpPass,
          from: smtpFrom.trim() || smtpUser.trim(),
          to: smtpTo.trim(),
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setTestHint(true);
        setTimeout(() => setTestHint(false), 8000);
      } else {
        setTestError(data.error || 'Erreur inconnue');
      }
    } catch {
      setTestError('Erreur réseau');
    } finally {
      setTesting(false);
    }
  };

  const flash = (text: string, type: 'success' | 'error') => {
    setMessage({ text, type });
    setTimeout(() => setMessage(null), 6000);
  };

  const openPassModal = () => {
    setModalPass('');
    setShowPassModal(true);
    setTimeout(() => modalInputRef.current?.focus(), 50);
  };

  const confirmPass = async () => {
    const newPass = modalPass.trim();
    if (!newPass) return;
    setShowPassModal(false);
    setModalPass('');

    // Sauvegarde immédiate avec le nouveau mot de passe
    const ok = await saveSite({
      mail: {
        enabled: Boolean(smtpUser && newPass),
        host: smtpHost,
        port: smtpPort,
        secure: smtpSecure,
        user: smtpUser.trim(),
        pass: newPass,
        from: smtpFrom.trim() || smtpUser.trim(),
        to: smtpTo.trim(),
      },
    });

    if (ok) {
      // Après sauvegarde, repasser en mode sentinel (le pass est masqué par l'API)
      setSmtpPass(SENTINEL);
    } else {
      flash(t('contactReply.saveError'), 'error');
    }
  };

  const inputCls = 'w-full p-[0.65rem] border border-[var(--bo-border)] bg-[var(--bo-card)] text-[var(--bo-text)] rounded-lg text-[0.875rem] font-["Inter",sans-serif] outline-none focus:border-[var(--bo-green)] transition-colors';
  const labelCls = 'block text-[0.8rem] text-[var(--bo-text-dim)] font-["Inter",sans-serif] mb-[0.3rem]';
  const blockCls = 'border border-[var(--bo-border)] py-[1.2rem] px-[1.4rem]';
  const groupTitleCls = "font-['Plus_Jakarta_Sans',sans-serif] text-[0.8rem] tracking-[0.12em] uppercase text-[var(--bo-green)] m-0 mb-4";

  return (
    <div className="carousel-section" id="contact-reply-section">
      <div className="carousel-section-header">
        <div>
          <h2>{t('contactReply.sectionTitle')}</h2>
          <div className="carousel-info">{t('contactReply.sectionInfo')}</div>
        </div>
      </div>

      <div className="flex flex-col gap-[0.9rem] mt-[0.9rem] max-w-[620px]">

        {/* ── Bloc SMTP ──────────────────────────────────── */}
        <div className={blockCls}>
          <h3 className={groupTitleCls}>{t('smtp.groupTitle')}</h3>

          <div className="flex flex-col gap-4">
            {/* Fournisseur */}
            <div>
              <label className={labelCls}>{t('smtp.provider')}</label>
              <select
                className={inputCls}
                value={provider}
                onChange={(e) => handleProviderChange(e.target.value as ProviderId)}
              >
                {PROVIDERS.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.id === 'custom' ? t('smtp.providerCustom') : p.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Email + Mot de passe */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className={labelCls}>{t('smtp.email')}</label>
                <input
                  type="email"
                  className={inputCls}
                  value={smtpUser}
                  placeholder={t('smtp.emailPlaceholder')}
                  onChange={(e) => setSmtpUser(e.target.value)}
                />
              </div>
              <div>
                <label className={labelCls}>{t('smtp.password')}</label>
                {passIsSet ? (
                  <div className="flex items-center gap-3 h-[38px]">
                    <div className="flex items-center gap-2 text-[0.875rem] text-[var(--bo-green)]">
                      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                        <circle cx="8" cy="8" r="7" stroke="currentColor" strokeWidth="1.5"/>
                        <path d="M4.5 8l2.5 2.5 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                      <span>{t('smtp.passSet')}</span>
                    </div>
                    <button
                      type="button"
                      onClick={openPassModal}
                      className="text-[0.8rem] text-[var(--bo-text-dim)] hover:text-[var(--bo-green)] underline bg-transparent border-none cursor-pointer font-['Inter',sans-serif] p-0"
                    >
                      {t('smtp.passChange')}
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={openPassModal}
                    className={`${inputCls} text-left text-[var(--bo-text-dim)] cursor-pointer`}
                  >
                    {t('smtp.passAdd')}
                  </button>
                )}
              </div>
            </div>

            {/* From + To */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className={labelCls}>{t('smtp.from')}</label>
                <input
                  type="email"
                  className={inputCls}
                  value={smtpFrom}
                  placeholder={t('smtp.fromPlaceholder')}
                  onChange={(e) => setSmtpFrom(e.target.value)}
                />
              </div>
              <div>
                <label className={labelCls}>{t('smtp.to')}</label>
                <input
                  type="email"
                  className={inputCls}
                  value={smtpTo}
                  placeholder={t('smtp.toPlaceholder')}
                  onChange={(e) => setSmtpTo(e.target.value)}
                />
              </div>
            </div>

            {/* Paramètres avancés */}
            <div>
              <button
                type="button"
                className="text-[0.8rem] text-[var(--bo-text-dim)] hover:text-[var(--bo-green)] cursor-pointer bg-transparent border-none p-0 font-['Inter',sans-serif] underline"
                onClick={() => setShowAdvanced(!showAdvanced)}
              >
                {t('smtp.advanced')} {showAdvanced ? '▴' : '▾'}
              </button>

              {showAdvanced && (
                <div className="grid grid-cols-[1fr_100px] gap-4 mt-3">
                  <div>
                    <label className={labelCls}>{t('smtp.host')}</label>
                    <input
                      type="text"
                      className={inputCls}
                      value={smtpHost}
                      onChange={(e) => setSmtpHost(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className={labelCls}>{t('smtp.port')}</label>
                    <input
                      type="number"
                      className={inputCls}
                      value={smtpPort}
                      onChange={(e) => setSmtpPort(parseInt(e.target.value) || 587)}
                    />
                  </div>
                  <div className="col-span-2">
                    <label className="flex items-center gap-3 cursor-pointer text-[0.85rem] text-[var(--bo-text-dim)]">
                      <input
                        type="checkbox"
                        checked={smtpSecure}
                        onChange={(e) => setSmtpSecure(e.target.checked)}
                        className="w-4 h-4"
                      />
                      {t('smtp.ssl')}
                    </label>
                  </div>
                </div>
              )}
            </div>

            {/* Bouton test + notif */}
            <div className="flex items-center gap-3">
              <button
                type="button"
                className="text-[0.85rem] py-[0.5rem] px-4 border border-[var(--bo-green)] text-[var(--bo-green)] bg-transparent rounded-lg cursor-pointer transition-[background,color] duration-200 hover:bg-[var(--bo-green)] hover:text-[#0b0d12] disabled:opacity-50 disabled:cursor-not-allowed font-['Inter',sans-serif]"
                onClick={testConnection}
                disabled={testing || !smtpUser || !smtpPass || !smtpTo}
              >
                {testing ? t('smtp.testing') : t('smtp.testBtn')}
              </button>
              {testHint && (
                <span className="text-[0.82rem] text-[var(--bo-green)] font-['Inter',sans-serif]">
                  {t('smtp.testHint')}
                </span>
              )}
              {testError && (
                <span className="text-[0.78rem] text-red-400 font-['Inter',sans-serif] max-w-[260px] leading-tight flex flex-col gap-[2px]">
                  {testError.split('\n').map((line, i) =>
                    line.startsWith('http') ? (
                      <a key={i} href={line} target="_blank" rel="noreferrer" className="underline text-red-300 hover:text-red-200">{line}</a>
                    ) : (
                      <span key={i}>{line}</span>
                    )
                  )}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* ── Bloc réponse automatique ───────────────────── */}
        <div className={blockCls}>
          <h3 className={groupTitleCls}>{t('contactReply.groupTitle')}</h3>

          <div className="flex items-center gap-2 mb-4">
            <input
              type="checkbox"
              id="contact-reply-enabled"
              checked={enabled}
              onChange={(e) => setEnabled(e.target.checked)}
              className="w-4 h-4 cursor-pointer shrink-0"
            />
            <label htmlFor="contact-reply-enabled" className="text-[0.875rem] text-[var(--bo-text)] cursor-pointer leading-none">
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

      {/* ── Actions ───────────────────────────────────── */}
      <div className="flex justify-end items-center gap-3 mt-4">
        {message && <div className={`form-message ${message.type}`}>{message.text}</div>}
        <button
          className="bg-[var(--bo-green)] text-[#0b0d12] font-['Plus_Jakarta_Sans',sans-serif] text-[0.875rem] font-bold tracking-[0.2px] py-[0.65rem] px-6 border-none rounded-xl cursor-pointer transition-[background,box-shadow] duration-200 hover:bg-[var(--primary-light)] hover:shadow-[var(--bo-green-glow)]"
          onClick={save}
        >
          {t('contactReply.btnSave')}
        </button>
      </div>

      {/* ── Modale mot de passe ───────────────────────── */}
      {showPassModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
          onClick={(e) => { if (e.target === e.currentTarget) setShowPassModal(false); }}
        >
          <div className="bg-[var(--bo-card)] border border-[var(--bo-border)] rounded-xl p-6 w-full max-w-sm shadow-2xl">
            <h3 className="font-['Plus_Jakarta_Sans',sans-serif] text-[1rem] font-bold text-[var(--bo-text)] mb-1">
              {t('smtp.modalTitle')}
            </h3>
            <p className="text-[0.82rem] text-[var(--bo-text-dim)] mb-4">{t('smtp.modalHint')}</p>
            <input
              ref={modalInputRef}
              type="password"
              className={inputCls}
              value={modalPass}
              placeholder={t('smtp.passwordPlaceholder')}
              onChange={(e) => setModalPass(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') confirmPass(); if (e.key === 'Escape') setShowPassModal(false); }}
            />
            <div className="flex justify-end gap-3 mt-4">
              <button
                type="button"
                onClick={() => setShowPassModal(false)}
                className="text-[0.875rem] text-[var(--bo-text-dim)] bg-transparent border border-[var(--bo-border)] rounded-lg py-[0.5rem] px-4 cursor-pointer hover:border-[var(--bo-green)] transition-colors font-['Inter',sans-serif]"
              >
                {t('common.cancel')}
              </button>
              <button
                type="button"
                onClick={confirmPass}
                disabled={!modalPass.trim()}
                className="text-[0.875rem] bg-[var(--bo-green)] text-[#0b0d12] border-none rounded-lg py-[0.5rem] px-4 cursor-pointer font-bold disabled:opacity-40 disabled:cursor-not-allowed font-['Plus_Jakarta_Sans',sans-serif]"
              >
                {t('smtp.modalConfirm')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
