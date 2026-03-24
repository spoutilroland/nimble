'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { X, ChevronRight, ArrowUpRight, Sparkles } from 'lucide-react';

const COOKIE_NAME = 'nimble-site-welcome-done';
const SPOTLIGHT_PAD = 10;

interface SiteStep {
  target: string | null;
  title: string;
  body: string;
  icon: string;
  cta?: { label: string; href: string };
  onEnter?: () => void;
  waitForTarget?: boolean;
}

function openSidebar() {
  const btn = document.querySelector('[data-tour="sidebar-toggle"]') as HTMLButtonElement | null;
  // Ouvrir la sidebar seulement si elle est fermée (le panneau est hors écran)
  const panel = document.querySelector('.fixed.left-0.top-0.z-\\[9998\\]');
  if (btn && panel && panel.classList.contains('-translate-x-full')) {
    btn.click();
  }
}

function expandFirstSection() {
  // Déplier la première section si pas encore dépliée
  const expanded = document.querySelector('[data-tour="sidebar-section-expanded"]');
  if (expanded) return; // déjà dépliée
  const first = document.querySelector('[data-tour="sidebar-section-first"]');
  if (first) {
    const expandBtn = first.querySelector('button');
    if (expandBtn) expandBtn.click();
  }
}

const SITE_STEPS: SiteStep[] = [
  {
    target: null,
    title: 'Bienvenue sur Nimble',
    body: 'Un mini CMS que vous pouvez explorer librement.\nModifiez le design, le contenu et les médias — chaque changement est visible instantanément.',
    icon: '✦',
    cta: { label: 'Ouvrir le back office', href: '/back' },
  },
  {
    target: '[data-tour="back-office-link"]',
    title: 'Accès au back office',
    body: 'Ce lien vous emmène vers le tableau de bord d\'administration.',
    icon: '⊟',
    cta: { label: 'Back office', href: '/back' },
  },
  {
    target: '[data-tour="sidebar-toggle"]',
    title: 'Édition en direct',
    body: 'Ce bouton ouvre la sidebar d\'édition. Voyons ce qu\'elle permet de faire.',
    icon: '⊞',
  },
  {
    target: '[data-tour="sidebar-section-first"]',
    title: 'Vos sections',
    body: 'La sidebar liste toutes les sections de la page. Cliquez sur une section pour déplier ses options d\'édition.',
    icon: '☰',
    onEnter: openSidebar,
    waitForTarget: true,
  },
  {
    target: '[data-tour="sidebar-section-expanded"]',
    title: 'Modifier une section',
    body: 'Chaque section dépliée révèle ses champs : textes, images, options. Les modifications sont enregistrées instantanément.',
    icon: '✎',
    onEnter: expandFirstSection,
    waitForTarget: true,
  },
  {
    target: '[data-tour="sidebar-delete-btn"]',
    title: 'Supprimer une section',
    body: 'Retirez une section en un clic. Rechargez ensuite la page pour voir le changement appliqué.',
    icon: '✕',
  },
  {
    target: '[data-tour="sidebar-add-section"]',
    title: 'Ajouter une section',
    body: 'Ce bouton ouvre un catalogue de sections prêtes à l\'emploi : Hero, Galerie, Services, Contact et bien d\'autres.',
    icon: '✚',
  },
  {
    target: '[data-tour="sidebar-grip"]',
    title: 'Réordonner les sections',
    body: 'Glissez cette poignée pour déplacer une section. L\'ordre dans la sidebar correspond à l\'ordre sur la page.',
    icon: '⋮',
  },
  {
    target: '.hero-title',
    title: 'Édition inline',
    body: 'Double-cliquez sur un texte ou une image pour le modifier directement. Essayez avec ce titre !',
    icon: '✎',
  },
];

function isWelcomeDone(): boolean {
  if (typeof document === 'undefined') return false;
  return document.cookie.includes(`${COOKIE_NAME}=1`);
}

function markWelcomeDone() {
  document.cookie = `${COOKIE_NAME}=1; path=/; max-age=${365 * 24 * 3600}; SameSite=Lax`;
}

// ── Typewriter ──

function Typewriter({ text, speed = 20, onDone }: { text: string; speed?: number; onDone?: () => void }) {
  const [displayed, setDisplayed] = useState('');
  const indexRef = useRef(0);

  useEffect(() => {
    indexRef.current = 0;
    setDisplayed('');

    const interval = setInterval(() => {
      indexRef.current++;
      if (indexRef.current >= text.length) {
        setDisplayed(text);
        clearInterval(interval);
        onDone?.();
      } else {
        setDisplayed(text.slice(0, indexRef.current));
      }
    }, speed);

    return () => clearInterval(interval);
  }, [text, speed, onDone]);

  return (
    <>
      {displayed.split('\n').map((line, i) => (
        <span key={i}>
          {i > 0 && <br />}
          {line}
        </span>
      ))}
      <span className="inline-block w-[2px] h-[0.9em] bg-emerald-400/80 ml-[1px] align-middle" style={{ animation: 'tw-blink 0.8s step-end infinite' }} />
    </>
  );
}

// ── Orbs flottants (fond du tooltip centré) ──

function FloatingOrbs() {
  return (
    <div className="absolute inset-0 overflow-hidden rounded-2xl pointer-events-none">
      <div
        className="absolute w-[120px] h-[120px] rounded-full blur-[60px] opacity-[0.08]"
        style={{
          background: '#34d399',
          top: '-20px',
          right: '-20px',
          animation: 'orb-drift-1 6s ease-in-out infinite',
        }}
      />
      <div
        className="absolute w-[80px] h-[80px] rounded-full blur-[50px] opacity-[0.06]"
        style={{
          background: '#818cf8',
          bottom: '-10px',
          left: '20px',
          animation: 'orb-drift-2 8s ease-in-out infinite',
        }}
      />
    </div>
  );
}

// ── Composant principal ──

export function DemoSiteWelcome() {
  const [stepIndex, setStepIndex] = useState(0);
  const [visible, setVisible] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [done, setDone] = useState(false);
    const [bodyReady, setBodyReady] = useState(false);
  const [pos, setPos] = useState<{ top: number; left: number; arrow: 'top' | 'bottom' } | null>(null);
  const [targetRect, setTargetRect] = useState<DOMRect | null>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted || isWelcomeDone() || done) return;

    setVisible(false);
    setBodyReady(false);

    const step = SITE_STEPS[stepIndex];

    // Exécuter l'action d'entrée (ouvrir sidebar, déplier section, etc.)
    if (step.onEnter) step.onEnter();

    const positionTooltip = () => {
      if (!step.target) {
        setPos(null);
        setTargetRect(null);
      } else {
        const target = document.querySelector(step.target);
        if (!target) {
          setPos(null);
          setTargetRect(null);
        } else {
          const rect = target.getBoundingClientRect();
          setTargetRect(rect);
          const tooltipW = 380;
          const left = Math.max(12, rect.left + rect.width / 2 - tooltipW / 2);
          const vh = window.innerHeight;
          if (rect.bottom + 200 < vh) {
            setPos({ top: rect.bottom + 18, left, arrow: 'top' });
          } else {
            setPos({ top: rect.top - 200, left, arrow: 'bottom' });
          }
        }
      }
      requestAnimationFrame(() => {
        setVisible(true);
        setTimeout(() => setBodyReady(true), 400);
      });
    };

    // Si waitForTarget, on attend que l'élément apparaisse dans le DOM
    if (step.waitForTarget && step.target) {
      const delay = stepIndex === 0 ? 600 : 200;
      let attempts = 0;
      const maxAttempts = 20;
      const tryFind = () => {
        attempts++;
        const el = document.querySelector(step.target!);
        if (el || attempts >= maxAttempts) {
          positionTooltip();
        } else {
          setTimeout(tryFind, 100);
        }
      };
      const timer = setTimeout(tryFind, delay);
      return () => clearTimeout(timer);
    } else {
      const timer = setTimeout(positionTooltip, stepIndex === 0 ? 600 : 200);
      return () => clearTimeout(timer);
    }
  }, [mounted, stepIndex, done]);

  const handleClose = useCallback(() => {
    setVisible(false);
    setTimeout(() => {
      setDone(true);
      markWelcomeDone();
    }, 300);
  }, []);

  const handleNext = useCallback(() => {
    if (stepIndex < SITE_STEPS.length - 1) {
      setStepIndex((i) => i + 1);
    } else {
      handleClose();
    }
  }, [stepIndex, handleClose]);

  if (!mounted || isWelcomeDone() || done) return null;

  const step = SITE_STEPS[stepIndex];
  const isLast = stepIndex === SITE_STEPS.length - 1;
  const isCentered = !step.target || !pos;

  return createPortal(
    <>
      {/* Overlay — z au-dessus de la sidebar (z-[9998]) */}
      {isCentered ? (
        <div
          className={`fixed inset-0 z-[10000] transition-all duration-500 ${visible ? 'bg-black/70 backdrop-blur-[6px]' : 'bg-black/0'}`}
        />
      ) : targetRect ? (
        <div
          className="fixed z-[10000] transition-all duration-500 ease-out"
          style={{
            top: targetRect.top - SPOTLIGHT_PAD,
            left: targetRect.left - SPOTLIGHT_PAD,
            width: targetRect.width + SPOTLIGHT_PAD * 2,
            height: targetRect.height + SPOTLIGHT_PAD * 2,
            borderRadius: 14,
            boxShadow: '0 0 0 9999px rgba(0,0,0,0.65)',
          }}
        >
          {/* Double pulse ring */}
          <div
            className="absolute inset-[-6px] rounded-[18px] border border-emerald-400/30"
            style={{ animation: 'sw-pulse-ring 2s ease-in-out infinite' }}
          />
          <div
            className="absolute inset-[-12px] rounded-[22px] border border-emerald-400/10"
            style={{ animation: 'sw-pulse-ring 2s ease-in-out infinite 0.3s' }}
          />
        </div>
      ) : null}

      {/* Tooltip */}
      <div
        ref={tooltipRef}
        className={`fixed z-[10001] transition-all duration-500 ease-out ${
          visible
            ? 'opacity-100 translate-y-0 scale-100'
            : isCentered
              ? 'opacity-0 scale-95'
              : 'opacity-0 -translate-y-4'
        }`}
        style={
          isCentered
            ? { top: '50%', left: '50%', transform: `translate(-50%, -50%) ${visible ? 'scale(1)' : 'scale(0.95)'}` }
            : pos
              ? { top: pos.top, left: pos.left }
              : undefined
        }
      >
        {/* Flèche haut */}
        {pos?.arrow === 'top' && !isCentered && (
          <div className="flex justify-center -mb-px">
            <div className="w-0 h-0" style={{ borderLeft: '9px solid transparent', borderRight: '9px solid transparent', borderBottom: '9px solid #13161f' }} />
          </div>
        )}

        <div className="relative overflow-hidden bg-[#13161f] border border-white/[0.06] rounded-2xl shadow-[0_24px_64px_rgba(0,0,0,0.7)] min-w-[300px]" style={{ maxWidth: isCentered ? 420 : 380 }}>
          {/* Orbs en background (centré uniquement) */}
          {isCentered && <FloatingOrbs />}

          {/* Progress gradient en haut */}
          <div className="h-[2px] bg-white/[0.03]">
            <div
              className="h-full transition-all duration-700 ease-out"
              style={{
                width: `${((stepIndex + 1) / SITE_STEPS.length) * 100}%`,
                background: 'linear-gradient(90deg, #34d399, #818cf8, #f472b6)',
              }}
            />
          </div>

          <div className={`relative ${isCentered ? 'px-7 pt-6 pb-5' : 'px-5 pt-4 pb-4'}`}>
            {/* Header */}
            <div className="flex items-start justify-between gap-3 mb-3">
              <div className="flex items-center gap-3">
                <span
                  className="flex items-center justify-center w-9 h-9 rounded-xl text-base font-bold shrink-0"
                  style={{
                    background: 'linear-gradient(135deg, rgba(52,211,153,0.15), rgba(99,102,241,0.1))',
                    color: '#34d399',
                    boxShadow: '0 0 16px rgba(52,211,153,0.1)',
                    animation: 'sw-icon-glow 3s ease-in-out infinite',
                  }}
                >
                  {step.icon}
                </span>
                <div>
                  <h4 className={`font-bold text-white m-0 leading-tight ${isCentered ? 'text-[1.1rem]' : 'text-[0.95rem]'}`}>
                    {step.title}
                  </h4>
                  {isCentered && stepIndex === 0 && (
                    <span className="inline-flex items-center gap-1 mt-1 text-[0.65rem] text-emerald-400/60 font-semibold uppercase tracking-wider">
                      <Sparkles size={10} />
                      Mini CMS — zéro base de données
                    </span>
                  )}
                </div>
              </div>
              <button
                onClick={handleClose}
                className="shrink-0 p-1.5 rounded-lg bg-transparent border-none text-white/20 cursor-pointer hover:text-white/60 hover:bg-white/[0.04] transition-all duration-200"
              >
                <X size={14} />
              </button>
            </div>

            {/* Body avec typewriter */}
            <div className={`text-[0.82rem] text-white/45 leading-[1.7] m-0 ${isCentered ? 'mb-5' : 'mb-4'} min-h-[2.5em]`}>
              {bodyReady ? (
                <Typewriter text={step.body} speed={10} />
              ) : (
                <span className="inline-block w-[2px] h-[0.9em] bg-emerald-400/80 ml-[1px] align-middle" style={{ animation: 'tw-blink 0.8s step-end infinite' }} />
              )}
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between">
              {/* Progress dots */}
              <div className="flex items-center gap-1.5">
                {SITE_STEPS.map((_, i) => (
                  <div
                    key={i}
                    className={`rounded-full transition-all duration-500 ${
                      i === stepIndex
                        ? 'w-6 h-1.5 shadow-[0_0_6px_rgba(52,211,153,0.4)]'
                        : i < stepIndex
                          ? 'w-1.5 h-1.5'
                          : 'w-1.5 h-1.5'
                    }`}
                    style={{
                      background: i === stepIndex
                        ? 'linear-gradient(90deg, #34d399, #818cf8)'
                        : i < stepIndex
                          ? 'rgba(52,211,153,0.4)'
                          : 'rgba(255,255,255,0.08)',
                    }}
                  />
                ))}
              </div>

              <div className="flex items-center gap-2">
                {step.cta && (
                  <a
                    href={step.cta.href}
                    onClick={handleClose}
                    className="group inline-flex items-center gap-1 px-3.5 py-1 rounded-lg bg-white/[0.04] border border-white/[0.06] no-underline text-white/50 text-[0.72rem] font-semibold cursor-pointer hover:bg-white/[0.08] hover:text-white/80 transition-all duration-200"
                  >
                    {step.cta.label}
                    <ArrowUpRight size={12} className="opacity-40 group-hover:opacity-70 transition-all duration-200 group-hover:translate-x-[1px] group-hover:-translate-y-[1px]" />
                  </a>
                )}
                <button
                  onClick={handleNext}
                  className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-lg border-none text-white text-[0.75rem] font-bold cursor-pointer transition-all duration-300"
                  style={{
                    background: 'linear-gradient(135deg, #34d399, #2dd4a8)',
                    boxShadow: '0 2px 12px rgba(52,211,153,0.3), inset 0 1px 0 rgba(255,255,255,0.15)',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.boxShadow = '0 4px 20px rgba(52,211,153,0.4), inset 0 1px 0 rgba(255,255,255,0.15)';
                    e.currentTarget.style.transform = 'translateY(-1px)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.boxShadow = '0 2px 12px rgba(52,211,153,0.3), inset 0 1px 0 rgba(255,255,255,0.15)';
                    e.currentTarget.style.transform = 'translateY(0)';
                  }}
                >
                  {isLast ? 'C\'est parti !' : 'Suivant'}
                  {!isLast && <ChevronRight size={14} />}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Flèche bas */}
        {pos?.arrow === 'bottom' && !isCentered && (
          <div className="flex justify-center -mt-px">
            <div className="w-0 h-0" style={{ borderLeft: '9px solid transparent', borderRight: '9px solid transparent', borderTop: '9px solid #13161f' }} />
          </div>
        )}
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes sw-pulse-ring {
          0%, 100% { opacity: 0.3; transform: scale(1); }
          50% { opacity: 0.8; transform: scale(1.02); }
        }
        @keyframes sw-icon-glow {
          0%, 100% { box-shadow: 0 0 12px rgba(52,211,153,0.1); }
          50% { box-shadow: 0 0 20px rgba(52,211,153,0.2); }
        }
        @keyframes tw-blink {
          0%, 100% { opacity: 1; }
          50% { opacity: 0; }
        }
        @keyframes orb-drift-1 {
          0%, 100% { transform: translate(0, 0); }
          50% { transform: translate(-15px, 10px); }
        }
        @keyframes orb-drift-2 {
          0%, 100% { transform: translate(0, 0); }
          50% { transform: translate(10px, -8px); }
        }
      ` }} />
    </>,
    document.body
  );
}
