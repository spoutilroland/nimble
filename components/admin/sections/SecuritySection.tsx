'use client';

import { useState } from 'react';
import { useI18n } from '@/lib/i18n/context';

interface Criteria {
  length: boolean;
  upper: boolean;
  digit: boolean;
  special: boolean;
}

function checkCriteria(pwd: string): Criteria {
  return {
    length: pwd.length >= 8,
    upper: /[A-Z]/.test(pwd),
    digit: /[0-9]/.test(pwd),
    special: /[^A-Za-z0-9]/.test(pwd),
  };
}

const STRENGTH_COLORS = ['', '#e53935', '#fb8c00', '#fdd835', '#43a047'];

export function SecuritySection() {
  const { t } = useI18n();
  const [current, setCurrent] = useState('');
  const [newPwd, setNewPwd] = useState('');
  const [confirmPwd, setConfirmPwd] = useState('');
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  const crit = checkCriteria(newPwd);
  const score = Object.values(crit).filter(Boolean).length;
  const strengthLabels = ['', t('security.strengthWeak'), t('security.strengthMedium'), t('security.strengthGood'), t('security.strengthStrong')];

  const save = async () => {
    if (!current || !newPwd || !confirmPwd) {
      setMessage({ text: t('security.allFieldsRequired'), type: 'error' }); return;
    }
    if (newPwd !== confirmPwd) {
      setMessage({ text: t('security.passwordsMismatch'), type: 'error' }); return;
    }
    if (!crit.length) { setMessage({ text: t('security.minLength'), type: 'error' }); return; }
    if (!crit.upper) { setMessage({ text: t('security.needUpper'), type: 'error' }); return; }
    if (!crit.digit) { setMessage({ text: t('security.needDigit'), type: 'error' }); return; }
    if (!crit.special) { setMessage({ text: t('security.needSpecial'), type: 'error' }); return; }

    try {
      const r = await fetch('/api/admin/password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ current, newPassword: newPwd }),
      });
      const data = await r.json();
      if (!r.ok) throw new Error(data.error || 'Erreur');
      setMessage({ text: t('security.saved'), type: 'success' });
      setCurrent('');
      setNewPwd('');
      setConfirmPwd('');
      setTimeout(() => setMessage(null), 4000);
    } catch (err) {
      setMessage({ text: (err as Error).message, type: 'error' });
    }
  };

  return (
    <div className="carousel-section" id="security-section">
      <div className="carousel-section-header">
        <div>
          <h2>{t('security.sectionTitle')}</h2>
          <div className="carousel-info">{t('security.sectionInfo')}</div>
        </div>
      </div>

      <div className="flex flex-col gap-[0.9rem] mt-[0.9rem] max-w-[420px]">
        <div className="border border-[var(--bo-border)] py-[1.2rem] px-[1.4rem]">
          <h3 className="font-['Plus_Jakarta_Sans',sans-serif] text-[0.8rem] tracking-[0.12em] uppercase text-[var(--bo-green)] m-0 mb-4">{t('security.passwordGroupTitle')}</h3>

          <div className="form-group">
            <label>{t('security.currentPwdLabel')}</label>
            <input
              type="password"
              autoComplete="current-password"
              value={current}
              onChange={(e) => setCurrent(e.target.value)}
            />
          </div>

          <div className="form-group">
            <label>{t('security.newPwdLabel')}</label>
            <input
              type="password"
              autoComplete="new-password"
              value={newPwd}
              onChange={(e) => setNewPwd(e.target.value)}
            />
            <div className="h-1 bg-[rgba(255,255,255,0.08)] mt-2 overflow-hidden">
              <div
                className="pwd-strength-fill"
                style={{
                  width: newPwd.length ? `${score * 25}%` : '0',
                  background: STRENGTH_COLORS[score] || '',
                }}
                data-label={newPwd.length ? strengthLabels[score] : ''}
              />
            </div>
            <ul className="list-none mt-[0.7rem] flex flex-wrap gap-x-4 gap-y-[0.4rem]">
              <li className={`pwd-criterion${crit.length ? ' ok' : ''}`}>{t('security.critLength')}</li>
              <li className={`pwd-criterion${crit.upper ? ' ok' : ''}`}>{t('security.critUpper')}</li>
              <li className={`pwd-criterion${crit.digit ? ' ok' : ''}`}>{t('security.critDigit')}</li>
              <li className={`pwd-criterion${crit.special ? ' ok' : ''}`}>{t('security.critSpecial')}</li>
            </ul>
          </div>

          <div className="form-group">
            <label>{t('security.confirmPwdLabel')}</label>
            <input
              type="password"
              autoComplete="new-password"
              value={confirmPwd}
              onChange={(e) => setConfirmPwd(e.target.value)}
            />
          </div>

          <div className="text-right">
            <button className="bg-[var(--bo-green)] text-[#0b0d12] font-['Plus_Jakarta_Sans',sans-serif] text-[0.875rem] font-bold tracking-[0.2px] py-[0.65rem] px-6 border-none rounded-xl cursor-pointer transition-[background,box-shadow] duration-200 hover:bg-[var(--primary-light)] hover:shadow-[var(--bo-green-glow)]" onClick={save}>
              {t('security.btnSave')}
            </button>
          </div>

          {message && (
            <div className={`form-message ${message.type}`}>{message.text}</div>
          )}
        </div>
      </div>
    </div>
  );
}
