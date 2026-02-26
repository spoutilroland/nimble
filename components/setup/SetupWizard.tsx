'use client';

import { useState, useCallback } from 'react';
import {
  Eye, EyeOff, Copy, Check, AlertTriangle,
  ChevronLeft, ChevronRight,
} from 'lucide-react';

// ─── Types ──────────────────────────────────────────────────────────────────

interface FormData {
  password: string;
  confirmPassword: string;
  siteName: string;
  tagline: string;
  email: string;
  phone: string;
  contactEnabled: boolean;
  mailHost: string;
  mailPort: number;
  mailSecure: boolean;
  mailUser: string;
  mailPass: string;
  mailFrom: string;
  mailTo: string;
  captchaProvider: 'none' | 'turnstile' | 'recaptcha' | 'hcaptcha';
  captchaSiteKey: string;
  captchaSecretKey: string;
}

type UpdateFn = <K extends keyof FormData>(key: K, value: FormData[K]) => void;

type InputPropsFn = (
  name: string,
  type?: string
) => {
  style: React.CSSProperties;
  onFocus: () => void;
  onBlur: () => void;
  type: string;
};

const initialForm: FormData = {
  password: '',
  confirmPassword: '',
  siteName: '',
  tagline: '',
  email: '',
  phone: '',
  contactEnabled: false,
  mailHost: '',
  mailPort: 587,
  mailSecure: false,
  mailUser: '',
  mailPass: '',
  mailFrom: '',
  mailTo: '',
  captchaProvider: 'none',
  captchaSiteKey: '',
  captchaSecretKey: '',
};

const STEP_LABELS = ['Admin', 'Site', 'Contact', 'Captcha', 'Terminé'];

// ─── Main component ─────────────────────────────────────────────────────────

export function SetupWizard() {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState<FormData>(initialForm);
  const [adminUrl, setAdminUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);
  const [showPass, setShowPass] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [showMailPass, setShowMailPass] = useState(false);
  const [focusedInput, setFocusedInput] = useState<string | null>(null);

  const update = useCallback(<K extends keyof FormData>(key: K, value: FormData[K]) => {
    setFormData(prev => ({ ...prev, [key]: value }));
    setError('');
  }, []);

  // Validation par étape
  const validateStep = (): string => {
    if (step === 1) {
      if (formData.password.length < 8) return 'Le mot de passe doit contenir au moins 8 caractères.';
      if (formData.password !== formData.confirmPassword) return 'Les mots de passe ne correspondent pas.';
    }
    if (step === 2) {
      if (!formData.siteName.trim()) return 'Le nom du site est requis.';
    }
    return '';
  };

  const handleNext = async () => {
    const err = validateStep();
    if (err) { setError(err); return; }

    // Étape 4 → soumettre le wizard
    if (step === 4) {
      setLoading(true);
      setError('');
      try {
        const payload: Record<string, unknown> = {
          password: formData.password,
          siteName: formData.siteName,
          tagline: formData.tagline,
          email: formData.email,
          phone: formData.phone,
          contactEnabled: formData.contactEnabled,
          captchaProvider: formData.captchaProvider,
          captchaSiteKey: formData.captchaSiteKey,
          captchaSecretKey: formData.captchaSecretKey,
        };
        if (formData.contactEnabled) {
          payload.mail = {
            host: formData.mailHost,
            port: formData.mailPort,
            secure: formData.mailSecure,
            user: formData.mailUser,
            pass: formData.mailPass,
            from: formData.mailFrom,
            to: formData.mailTo,
          };
        }
        const res = await fetch('/api/setup', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        const data = await res.json();
        if (!res.ok) {
          setError(data.error || 'Une erreur est survenue.');
          return;
        }
        setAdminUrl(data.adminUrl as string);
        setStep(5);
      } catch {
        setError('Impossible de contacter le serveur.');
      } finally {
        setLoading(false);
      }
      return;
    }

    setStep(s => s + 1);
  };

  const handleBack = () => {
    setError('');
    setStep(s => s - 1);
  };

  const handleCopy = async () => {
    const url = window.location.origin + adminUrl;
    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  // Fabrique de props input (gestion focus)
  const inputProps: InputPropsFn = (name, type = 'text') => ({
    type,
    style: {
      width: '100%',
      padding: '10px 14px',
      border: `1.5px solid ${focusedInput === name ? '#2563eb' : '#e2e8f0'}`,
      borderRadius: '8px',
      fontSize: '14px',
      color: '#111',
      background: '#fafafa',
      outline: 'none',
      boxSizing: 'border-box',
      fontFamily: 'inherit',
      transition: 'border-color 0.15s',
    },
    onFocus: () => setFocusedInput(name),
    onBlur: () => setFocusedInput(null),
  });

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@500;700&family=Manrope:wght@400;500;600;700&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        input[type="number"]::-webkit-inner-spin-button { -webkit-appearance: none; }
        input::placeholder { color: #c0c9d6; }
      `}</style>

      <div style={{
        minHeight: '100vh',
        background: 'linear-gradient(145deg, #f2f4f7 0%, #e9edf2 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px',
        fontFamily: "'Manrope', -apple-system, BlinkMacSystemFont, sans-serif",
      }}>
        <div style={{
          background: '#fff',
          borderRadius: '20px',
          boxShadow: '0 2px 4px rgba(0,0,0,0.04), 0 16px 48px rgba(0,0,0,0.10)',
          padding: '48px',
          width: '100%',
          maxWidth: '520px',
        }}>
          {/* En-tête marque */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            marginBottom: '36px',
          }}>
            <div style={{
              width: '22px', height: '22px',
              background: '#2563eb',
              borderRadius: '6px',
              flexShrink: 0,
            }} />
            <span style={{
              fontSize: '11px',
              fontWeight: 700,
              letterSpacing: '0.15em',
              textTransform: 'uppercase',
              color: '#2563eb',
            }}>
              Nimble — Configuration initiale
            </span>
          </div>

          {/* Barre de progression */}
          {step < 5 && (
            <ProgressBar currentStep={step} steps={STEP_LABELS} />
          )}

          {/* Contenu de l'étape */}
          <div style={{ minHeight: '300px' }}>
            {step === 1 && (
              <StepAdmin
                formData={formData}
                update={update}
                showPass={showPass}
                setShowPass={setShowPass}
                showConfirm={showConfirm}
                setShowConfirm={setShowConfirm}
                inputProps={inputProps}
              />
            )}
            {step === 2 && (
              <StepIdentity formData={formData} update={update} inputProps={inputProps} />
            )}
            {step === 3 && (
              <StepContact
                formData={formData}
                update={update}
                showMailPass={showMailPass}
                setShowMailPass={setShowMailPass}
                inputProps={inputProps}
              />
            )}
            {step === 4 && (
              <StepCaptcha formData={formData} update={update} inputProps={inputProps} />
            )}
            {step === 5 && (
              <StepComplete adminUrl={adminUrl} copied={copied} onCopy={handleCopy} />
            )}
          </div>

          {/* Message d'erreur */}
          {error && (
            <div style={{
              display: 'flex',
              alignItems: 'flex-start',
              gap: '8px',
              background: '#fef2f2',
              border: '1px solid #fecaca',
              borderRadius: '8px',
              padding: '12px 14px',
              marginTop: '16px',
            }}>
              <AlertTriangle size={15} style={{ color: '#dc2626', flexShrink: 0, marginTop: '1px' }} />
              <span style={{ fontSize: '13px', color: '#b91c1c', lineHeight: 1.5 }}>{error}</span>
            </div>
          )}

          {/* Navigation */}
          {step < 5 && (
            <div style={{
              display: 'flex',
              justifyContent: step === 1 ? 'flex-end' : 'space-between',
              marginTop: '32px',
              gap: '12px',
            }}>
              {step > 1 && (
                <button
                  onClick={handleBack}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '10px 20px',
                    border: '1.5px solid #e2e8f0',
                    borderRadius: '8px',
                    background: 'transparent',
                    color: '#475569',
                    fontSize: '14px',
                    fontWeight: 600,
                    cursor: 'pointer',
                    fontFamily: 'inherit',
                  }}
                >
                  <ChevronLeft size={15} />
                  Retour
                </button>
              )}
              <button
                onClick={handleNext}
                disabled={loading}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '10px 24px',
                  border: 'none',
                  borderRadius: '8px',
                  background: loading ? '#93c5fd' : '#2563eb',
                  color: '#fff',
                  fontSize: '14px',
                  fontWeight: 600,
                  cursor: loading ? 'not-allowed' : 'pointer',
                  fontFamily: 'inherit',
                }}
              >
                {loading ? 'Configuration en cours...' : step === 4 ? 'Terminer la configuration' : 'Suivant'}
                {!loading && <ChevronRight size={15} />}
              </button>
            </div>
          )}
        </div>
      </div>
    </>
  );
}

// ─── Barre de progression ────────────────────────────────────────────────────

function ProgressBar({ currentStep, steps }: { currentStep: number; steps: string[] }) {
  return (
    <div style={{ display: 'flex', alignItems: 'flex-start', marginBottom: '40px' }}>
      {steps.map((label, i) => {
        const idx = i + 1;
        const done = idx < currentStep;
        const active = idx === currentStep;
        return (
          <div key={label} style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            flex: 1,
            position: 'relative',
          }}>
            {/* Ligne de connexion */}
            {i < steps.length - 1 && (
              <div style={{
                position: 'absolute',
                top: '13px',
                left: '50%',
                width: '100%',
                height: '2px',
                background: done ? '#2563eb' : '#e2e8f0',
                transition: 'background 0.3s ease',
                zIndex: 0,
              }} />
            )}
            {/* Cercle */}
            <div style={{
              width: '28px',
              height: '28px',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '11px',
              fontWeight: 700,
              background: (done || active) ? '#2563eb' : '#f1f5f9',
              color: (done || active) ? '#fff' : '#94a3b8',
              position: 'relative',
              zIndex: 1,
              flexShrink: 0,
              boxShadow: active ? '0 0 0 4px rgba(37,99,235,0.15)' : 'none',
              transition: 'all 0.25s ease',
            }}>
              {done ? <Check size={12} /> : idx}
            </div>
            {/* Label */}
            <span style={{
              fontSize: '10px',
              fontWeight: active ? 700 : done ? 500 : 400,
              color: active ? '#2563eb' : done ? '#475569' : '#94a3b8',
              marginTop: '7px',
              letterSpacing: '0.05em',
              textTransform: 'uppercase',
              whiteSpace: 'nowrap',
            }}>
              {label}
            </span>
          </div>
        );
      })}
    </div>
  );
}

// ─── Composant Field ─────────────────────────────────────────────────────────

function Field({ label, children, hint }: { label: string; children: React.ReactNode; hint?: string }) {
  return (
    <div style={{ marginBottom: '18px' }}>
      <label style={{
        display: 'block',
        fontSize: '11px',
        fontWeight: 700,
        letterSpacing: '0.08em',
        textTransform: 'uppercase',
        color: '#475569',
        marginBottom: '7px',
      }}>
        {label}
      </label>
      {children}
      {hint && (
        <p style={{ fontSize: '11px', color: '#94a3b8', marginTop: '5px', lineHeight: 1.4 }}>{hint}</p>
      )}
    </div>
  );
}

// ─── Étape 1 : Compte admin ──────────────────────────────────────────────────

function StepAdmin({
  formData, update,
  showPass, setShowPass,
  showConfirm, setShowConfirm,
  inputProps,
}: {
  formData: FormData;
  update: UpdateFn;
  showPass: boolean;
  setShowPass: (v: boolean) => void;
  showConfirm: boolean;
  setShowConfirm: (v: boolean) => void;
  inputProps: InputPropsFn;
}) {
  const strength = formData.password.length;
  const strengthColor = strength < 8 ? '#ef4444' : strength < 12 ? '#f59e0b' : '#16a34a';
  const strengthLabel = strength === 0 ? '' : strength < 8 ? 'Trop court' : strength < 12 ? 'Acceptable' : 'Robuste';

  return (
    <div>
      <h2 style={{ fontSize: '22px', fontWeight: 700, color: '#0f172a', marginBottom: '6px', fontFamily: "'Outfit', sans-serif" }}>
        Compte administrateur
      </h2>
      <p style={{ fontSize: '14px', color: '#64748b', marginBottom: '28px', lineHeight: 1.5 }}>
        Définissez le mot de passe pour accéder au back-office.
      </p>

      <Field label="Mot de passe">
        <div style={{ position: 'relative' }}>
          <input
            {...inputProps('password', showPass ? 'text' : 'password')}
            value={formData.password}
            onChange={e => update('password', e.target.value)}
            placeholder="8 caractères minimum"
          />
          <button
            type="button"
            onClick={() => setShowPass(!showPass)}
            style={{
              position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)',
              background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8',
              display: 'flex', alignItems: 'center', padding: 0,
            }}
          >
            {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
        </div>
        {/* Indicateur de force */}
        {formData.password.length > 0 && (
          <div style={{ marginTop: '8px' }}>
            <div style={{ display: 'flex', gap: '4px', marginBottom: '4px' }}>
              {[1, 2, 3, 4].map(i => (
                <div key={i} style={{
                  height: '3px', flex: 1, borderRadius: '2px',
                  background: strength >= i * 3 ? strengthColor : '#e2e8f0',
                  transition: 'background 0.2s',
                }} />
              ))}
            </div>
            <span style={{ fontSize: '11px', color: strengthColor, fontWeight: 600 }}>{strengthLabel}</span>
          </div>
        )}
      </Field>

      <Field label="Confirmer le mot de passe">
        <div style={{ position: 'relative' }}>
          <input
            {...inputProps('confirmPassword', showConfirm ? 'text' : 'password')}
            value={formData.confirmPassword}
            onChange={e => update('confirmPassword', e.target.value)}
            placeholder="Répétez le mot de passe"
          />
          <button
            type="button"
            onClick={() => setShowConfirm(!showConfirm)}
            style={{
              position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)',
              background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8',
              display: 'flex', alignItems: 'center', padding: 0,
            }}
          >
            {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
        </div>
      </Field>
    </div>
  );
}

// ─── Étape 2 : Identité du site ──────────────────────────────────────────────

function StepIdentity({ formData, update, inputProps }: {
  formData: FormData;
  update: UpdateFn;
  inputProps: InputPropsFn;
}) {
  return (
    <div>
      <h2 style={{ fontSize: '22px', fontWeight: 700, color: '#0f172a', marginBottom: '6px', fontFamily: "'Outfit', sans-serif" }}>
        Identité du site
      </h2>
      <p style={{ fontSize: '14px', color: '#64748b', marginBottom: '28px', lineHeight: 1.5 }}>
        Ces informations seront affichées sur votre site.
      </p>

      <Field label="Nom du site *">
        <input
          {...inputProps('siteName')}
          value={formData.siteName}
          onChange={e => update('siteName', e.target.value)}
          placeholder="Mon site"
        />
      </Field>
      <Field label="Accroche" hint="Une phrase courte qui décrit votre activité">
        <input
          {...inputProps('tagline')}
          value={formData.tagline}
          onChange={e => update('tagline', e.target.value)}
          placeholder="Votre spécialité en quelques mots"
        />
      </Field>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
        <Field label="Email de contact">
          <input
            {...inputProps('email', 'email')}
            value={formData.email}
            onChange={e => update('email', e.target.value)}
            placeholder="contact@site.com"
          />
        </Field>
        <Field label="Téléphone">
          <input
            {...inputProps('phone', 'tel')}
            value={formData.phone}
            onChange={e => update('phone', e.target.value)}
            placeholder="+33 1 23 45 67"
          />
        </Field>
      </div>
    </div>
  );
}

// ─── Étape 3 : Formulaire de contact ────────────────────────────────────────

function StepContact({
  formData, update,
  showMailPass, setShowMailPass,
  inputProps,
}: {
  formData: FormData;
  update: UpdateFn;
  showMailPass: boolean;
  setShowMailPass: (v: boolean) => void;
  inputProps: InputPropsFn;
}) {
  return (
    <div>
      <h2 style={{ fontSize: '22px', fontWeight: 700, color: '#0f172a', marginBottom: '6px', fontFamily: "'Outfit', sans-serif" }}>
        Formulaire de contact
      </h2>
      <p style={{ fontSize: '14px', color: '#64748b', marginBottom: '28px', lineHeight: 1.5 }}>
        Activez l'envoi d'emails depuis le formulaire de contact.
      </p>

      {/* Toggle */}
      <div
        onClick={() => update('contactEnabled', !formData.contactEnabled)}
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '16px',
          background: '#f8fafc',
          borderRadius: '10px',
          border: `1.5px solid ${formData.contactEnabled ? '#2563eb' : '#e2e8f0'}`,
          marginBottom: '24px',
          cursor: 'pointer',
          transition: 'border-color 0.15s',
        }}
      >
        <div>
          <div style={{ fontSize: '14px', fontWeight: 600, color: '#0f172a' }}>
            Activer le formulaire de contact
          </div>
          <div style={{ fontSize: '12px', color: '#94a3b8', marginTop: '3px' }}>
            Envoie les messages reçus via SMTP
          </div>
        </div>
        {/* Interrupteur toggle */}
        <div style={{
          width: '44px', height: '24px',
          borderRadius: '12px',
          background: formData.contactEnabled ? '#2563eb' : '#e2e8f0',
          position: 'relative',
          flexShrink: 0,
          transition: 'background 0.2s',
        }}>
          <div style={{
            position: 'absolute',
            top: '3px',
            left: formData.contactEnabled ? '22px' : '3px',
            width: '18px', height: '18px',
            borderRadius: '50%',
            background: '#fff',
            boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
            transition: 'left 0.2s',
          }} />
        </div>
      </div>

      {/* Champs SMTP */}
      {formData.contactEnabled && (
        <div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 90px', gap: '14px' }}>
            <Field label="Serveur SMTP">
              <input
                {...inputProps('mailHost')}
                value={formData.mailHost}
                onChange={e => update('mailHost', e.target.value)}
                placeholder="smtp.gmail.com"
              />
            </Field>
            <Field label="Port">
              <input
                {...inputProps('mailPort', 'number')}
                style={{ ...inputProps('mailPort', 'number').style, textAlign: 'center' }}
                value={formData.mailPort}
                onChange={e => update('mailPort', parseInt(e.target.value) || 587)}
              />
            </Field>
          </div>
          <Field label="Utilisateur SMTP">
            <input
              {...inputProps('mailUser', 'email')}
              value={formData.mailUser}
              onChange={e => update('mailUser', e.target.value)}
              placeholder="user@gmail.com"
            />
          </Field>
          <Field label="Mot de passe SMTP">
            <div style={{ position: 'relative' }}>
              <input
                {...inputProps('mailPass', showMailPass ? 'text' : 'password')}
                value={formData.mailPass}
                onChange={e => update('mailPass', e.target.value)}
                placeholder="Mot de passe ou token d'application"
              />
              <button
                type="button"
                onClick={() => setShowMailPass(!showMailPass)}
                style={{
                  position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)',
                  background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8',
                  display: 'flex', alignItems: 'center', padding: 0,
                }}
              >
                {showMailPass ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </Field>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
            <Field label="Expéditeur (From)">
              <input
                {...inputProps('mailFrom', 'email')}
                value={formData.mailFrom}
                onChange={e => update('mailFrom', e.target.value)}
                placeholder="noreply@site.com"
              />
            </Field>
            <Field label="Destinataire (To)">
              <input
                {...inputProps('mailTo', 'email')}
                value={formData.mailTo}
                onChange={e => update('mailTo', e.target.value)}
                placeholder="admin@site.com"
              />
            </Field>
          </div>
          <label style={{
            display: 'flex', alignItems: 'center', gap: '8px',
            cursor: 'pointer', fontSize: '13px', color: '#475569',
            marginTop: '-4px',
          }}>
            <input
              type="checkbox"
              checked={formData.mailSecure}
              onChange={e => update('mailSecure', e.target.checked)}
              style={{ width: '15px', height: '15px', accentColor: '#2563eb' }}
            />
            Connexion SSL/TLS (port 465)
          </label>
        </div>
      )}
    </div>
  );
}

// ─── Étape 4 : Captcha ───────────────────────────────────────────────────────

const CAPTCHA_PROVIDERS = [
  { value: 'none' as const, label: 'Aucun', desc: 'Pas de protection anti-bot' },
  { value: 'turnstile' as const, label: 'Cloudflare Turnstile', desc: 'Recommandé — invisible et respectueux de la vie privée' },
  { value: 'recaptcha' as const, label: 'Google reCAPTCHA', desc: 'v2 ou v3 selon votre configuration' },
  { value: 'hcaptcha' as const, label: 'hCaptcha', desc: 'Alternative à reCAPTCHA' },
];

function StepCaptcha({ formData, update, inputProps }: {
  formData: FormData;
  update: UpdateFn;
  inputProps: InputPropsFn;
}) {
  return (
    <div>
      <h2 style={{ fontSize: '22px', fontWeight: 700, color: '#0f172a', marginBottom: '6px', fontFamily: "'Outfit', sans-serif" }}>
        Protection anti-spam
      </h2>
      <p style={{ fontSize: '14px', color: '#64748b', marginBottom: '28px', lineHeight: 1.5 }}>
        Ajoutez un captcha au formulaire de contact pour bloquer les bots.
      </p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '24px' }}>
        {CAPTCHA_PROVIDERS.map(p => (
          <label key={p.value} style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            padding: '12px 16px',
            border: `1.5px solid ${formData.captchaProvider === p.value ? '#2563eb' : '#e2e8f0'}`,
            borderRadius: '10px',
            cursor: 'pointer',
            background: formData.captchaProvider === p.value ? '#eff6ff' : '#fafafa',
            transition: 'all 0.15s',
          }}>
            <input
              type="radio"
              name="captchaProvider"
              value={p.value}
              checked={formData.captchaProvider === p.value}
              onChange={() => update('captchaProvider', p.value)}
              style={{ accentColor: '#2563eb', flexShrink: 0 }}
            />
            <div>
              <div style={{ fontSize: '13px', fontWeight: 600, color: '#0f172a' }}>{p.label}</div>
              <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '2px' }}>{p.desc}</div>
            </div>
          </label>
        ))}
      </div>

      {formData.captchaProvider !== 'none' && (
        <>
          <Field label="Clé publique (site key)">
            <input
              {...inputProps('captchaSiteKey')}
              value={formData.captchaSiteKey}
              onChange={e => update('captchaSiteKey', e.target.value)}
              placeholder="Votre clé publique"
            />
          </Field>
          <Field label="Clé secrète (secret key)">
            <input
              {...inputProps('captchaSecretKey')}
              value={formData.captchaSecretKey}
              onChange={e => update('captchaSecretKey', e.target.value)}
              placeholder="Votre clé secrète"
            />
          </Field>
        </>
      )}
    </div>
  );
}

// ─── Étape 5 : Configuration terminée ───────────────────────────────────────

function StepComplete({ adminUrl, copied, onCopy }: {
  adminUrl: string;
  copied: boolean;
  onCopy: () => void;
}) {
  const fullUrl = typeof window !== 'undefined'
    ? window.location.origin + adminUrl
    : adminUrl;

  return (
    <div style={{ textAlign: 'center', padding: '8px 0' }}>
      {/* Icône succès */}
      <div style={{
        width: '60px', height: '60px',
        borderRadius: '50%',
        background: '#dcfce7',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        margin: '0 auto 24px',
      }}>
        <Check size={26} style={{ color: '#16a34a' }} />
      </div>

      <h2 style={{
        fontSize: '22px', fontWeight: 700, color: '#0f172a',
        marginBottom: '8px', fontFamily: "'Outfit', sans-serif",
      }}>
        Configuration terminée !
      </h2>
      <p style={{ fontSize: '14px', color: '#64748b', marginBottom: '32px', lineHeight: 1.5 }}>
        Nimble est prêt. Conservez précieusement votre URL d'administration sécurisée.
      </p>

      {/* Encadré URL */}
      <div style={{
        background: '#f8fafc',
        border: '2px solid #e2e8f0',
        borderRadius: '14px',
        padding: '22px 20px',
        marginBottom: '20px',
        textAlign: 'left',
      }}>
        <div style={{
          fontSize: '10px',
          fontWeight: 700,
          letterSpacing: '0.1em',
          textTransform: 'uppercase',
          color: '#94a3b8',
          marginBottom: '10px',
        }}>
          Votre URL d'administration
        </div>
        <div style={{
          fontSize: '15px',
          fontWeight: 700,
          color: '#2563eb',
          fontFamily: "'Courier New', Courier, monospace",
          wordBreak: 'break-all',
          marginBottom: '16px',
          lineHeight: 1.4,
        }}>
          {fullUrl}
        </div>
        <button
          onClick={onCopy}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            padding: '8px 16px',
            border: `1.5px solid ${copied ? '#16a34a' : '#e2e8f0'}`,
            borderRadius: '7px',
            background: copied ? '#f0fdf4' : '#fff',
            color: copied ? '#16a34a' : '#475569',
            fontSize: '12px',
            fontWeight: 600,
            cursor: 'pointer',
            fontFamily: 'inherit',
            transition: 'all 0.15s',
          }}
        >
          {copied ? <Check size={13} /> : <Copy size={13} />}
          {copied ? 'Copié !' : "Copier l'URL"}
        </button>
      </div>

      {/* Avertissement redémarrage */}
      <div style={{
        display: 'flex',
        alignItems: 'flex-start',
        gap: '10px',
        background: '#fffbeb',
        border: '1.5px solid #fde68a',
        borderRadius: '10px',
        padding: '14px 16px',
        marginBottom: '28px',
        textAlign: 'left',
      }}>
        <AlertTriangle size={16} style={{ color: '#d97706', flexShrink: 0, marginTop: '1px' }} />
        <div>
          <div style={{ fontSize: '12px', fontWeight: 700, color: '#92400e', marginBottom: '4px' }}>
            Redémarrage du serveur requis
          </div>
          <div style={{ fontSize: '12px', color: '#78350f', lineHeight: 1.6 }}>
            Relancez{' '}
            <code style={{
              background: '#fef3c7', padding: '1px 6px',
              borderRadius: '4px', fontSize: '11px', fontFamily: 'monospace',
            }}>
              npm run dev
            </code>
            {' '}pour activer votre URL sécurisée.
            En attendant, <strong>/back</strong> reste accessible.
          </div>
        </div>
      </div>

      {/* Bouton dashboard */}
      <a
        href="/back"
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '8px',
          padding: '12px 28px',
          background: '#2563eb',
          color: '#fff',
          borderRadius: '8px',
          fontSize: '14px',
          fontWeight: 600,
          textDecoration: 'none',
          fontFamily: 'inherit',
        }}
      >
        Accéder au dashboard
      </a>
    </div>
  );
}
