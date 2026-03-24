'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { X, ChevronRight, SkipForward, Lightbulb, Check } from 'lucide-react';
import {
  TOUR_STEPS, type TourStep,
  isTourDone, markTourDone, getRandomTip,
} from '@/lib/tour/config';

const TIP_DISPLAY_MS = 6000;
const SPOTLIGHT_PAD = 10;
const SPOTLIGHT_RADIUS = 14;

// ── Position intelligente ──

interface Position {
  top: number;
  left: number;
  arrow: 'top' | 'bottom' | 'left' | 'right';
}

function computePosition(targetEl: Element, tooltipW: number, tooltipH: number, preferred?: string): Position {
  const rect = targetEl.getBoundingClientRect();
  const gap = 16;
  const arrowSize = 9;
  const vw = window.innerWidth;
  const vh = window.innerHeight;

  const centerX = rect.left + rect.width / 2 - tooltipW / 2;
  const centerY = rect.top + rect.height / 2 - tooltipH / 2;

  const positions: { pos: Position; score: number }[] = [];

  const bottomTop = rect.bottom + gap + arrowSize;
  const bottomLeft = Math.max(12, Math.min(centerX, vw - tooltipW - 12));
  if (bottomTop + tooltipH < vh) {
    positions.push({ pos: { top: bottomTop, left: bottomLeft, arrow: 'top' }, score: preferred === 'bottom' ? 10 : 5 });
  }

  const topTop = rect.top - tooltipH - gap - arrowSize;
  const topLeft = Math.max(12, Math.min(centerX, vw - tooltipW - 12));
  if (topTop > 0) {
    positions.push({ pos: { top: topTop, left: topLeft, arrow: 'bottom' }, score: preferred === 'top' ? 10 : 4 });
  }

  const rightLeft = rect.right + gap + arrowSize;
  const rightTop = Math.max(12, Math.min(centerY, vh - tooltipH - 12));
  if (rightLeft + tooltipW < vw) {
    positions.push({ pos: { top: rightTop, left: rightLeft, arrow: 'left' }, score: preferred === 'right' ? 10 : 3 });
  }

  const leftLeft = rect.left - tooltipW - gap - arrowSize;
  const leftTop = Math.max(12, Math.min(centerY, vh - tooltipH - 12));
  if (leftLeft > 0) {
    positions.push({ pos: { top: leftTop, left: leftLeft, arrow: 'right' }, score: preferred === 'left' ? 10 : 2 });
  }

  if (positions.length === 0) {
    return { top: rect.bottom + gap, left: Math.max(12, centerX), arrow: 'top' };
  }

  positions.sort((a, b) => b.score - a.score);
  return positions[0].pos;
}

// ── Icônes + couleurs par étape ──

const STEP_META: Record<string, { icon: string; accent: string }> = {
  welcome:       { icon: '✦', accent: '#34d399' },
  tabs:          { icon: '⊟', accent: '#818cf8' },
  design:        { icon: '◈', accent: '#f472b6' },
  content:       { icon: '⊞', accent: '#fbbf24' },
  media:         { icon: '◉', accent: '#38bdf8' },
  'view-site':   { icon: '↗', accent: '#a78bfa' },
};

// ── Flèche SVG ──

function Arrow({ direction, color }: { direction: 'top' | 'bottom' | 'left' | 'right'; color: string }) {
  const styles: Record<string, React.CSSProperties> = {
    top: { borderLeft: '9px solid transparent', borderRight: '9px solid transparent', borderBottom: `9px solid ${color}` },
    bottom: { borderLeft: '9px solid transparent', borderRight: '9px solid transparent', borderTop: `9px solid ${color}` },
    left: { borderTop: '9px solid transparent', borderBottom: '9px solid transparent', borderRight: `9px solid ${color}` },
    right: { borderTop: '9px solid transparent', borderBottom: '9px solid transparent', borderLeft: `9px solid ${color}` },
  };
  const wrapperClass: Record<string, string> = {
    top: 'absolute -top-[9px] left-1/2 -translate-x-1/2',
    bottom: 'absolute -bottom-[9px] left-1/2 -translate-x-1/2',
    left: 'absolute -left-[9px] top-1/2 -translate-y-1/2',
    right: 'absolute -right-[9px] top-1/2 -translate-y-1/2',
  };
  return (
    <div className={wrapperClass[direction]}>
      <div className="w-0 h-0" style={styles[direction]} />
    </div>
  );
}

// ── Coach mark ──

function CoachMark({ step, onNext, onSkip, onClose, stepIndex, totalSteps }: {
  step: TourStep;
  onNext: () => void;
  onSkip: () => void;
  onClose: () => void;
  stepIndex: number;
  totalSteps: number;
}) {
  const tooltipRef = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState<Position | null>(null);
  const [targetRect, setTargetRect] = useState<DOMRect | null>(null);
  const [visible, setVisible] = useState(false);
  const [transitioning, setTransitioning] = useState(false);

  useEffect(() => {
    setVisible(false);
    setTransitioning(true);

    const raf = requestAnimationFrame(() => {
      const tooltip = tooltipRef.current;
      if (!tooltip) return;

      if (!step.target) {
        setPos(null);
        setTargetRect(null);
      } else {
        const targetEl = document.querySelector(step.target);
        if (!targetEl) {
          setPos(null);
          setTargetRect(null);
        } else {
          setTargetRect(targetEl.getBoundingClientRect());
          const rect = tooltip.getBoundingClientRect();
          const p = computePosition(targetEl, rect.width || 380, rect.height || 180, step.preferredPosition);
          setPos(p);
        }
      }
      // Petit délai pour l'animation d'entrée
      setTimeout(() => {
        setTransitioning(false);
        requestAnimationFrame(() => setVisible(true));
      }, 80);
    });
    return () => cancelAnimationFrame(raf);
  }, [step]);

  const isLast = stepIndex === totalSteps - 1;
  const isCentered = !step.target || !pos;
  const hasTarget = targetRect !== null && !isCentered;
  const progress = ((stepIndex + 1) / totalSteps) * 100;
  const meta = STEP_META[step.id] || { icon: '●', accent: '#34d399' };

  const content = (
    <>
      {/* Overlay */}
      {hasTarget ? (
        <div
          className="fixed z-[8999] pointer-events-auto transition-all duration-600 ease-out"
          style={{
            top: targetRect.top - SPOTLIGHT_PAD,
            left: targetRect.left - SPOTLIGHT_PAD,
            width: targetRect.width + SPOTLIGHT_PAD * 2,
            height: targetRect.height + SPOTLIGHT_PAD * 2,
            borderRadius: SPOTLIGHT_RADIUS,
            boxShadow: '0 0 0 9999px rgba(0,0,0,0.65)',
          }}
        >
          {/* Glow + pulse rings */}
          <div
            className="absolute inset-0 rounded-[inherit] pointer-events-none"
            style={{
              boxShadow: `0 0 20px 4px ${meta.accent}15, inset 0 0 8px ${meta.accent}08`,
            }}
          />
          <div
            className="absolute inset-[-5px] rounded-[16px] pointer-events-none"
            style={{
              border: `1px solid ${meta.accent}30`,
              animation: 'gt-ring-pulse 2s ease-in-out infinite',
            }}
          />
          <div
            className="absolute inset-[-11px] rounded-[20px] pointer-events-none"
            style={{
              border: `1px solid ${meta.accent}12`,
              animation: 'gt-ring-pulse 2s ease-in-out infinite 0.4s',
            }}
          />
        </div>
      ) : (
        <div className={`fixed inset-0 z-[8999] pointer-events-auto transition-all duration-500 ${visible ? 'bg-black/65 backdrop-blur-[4px]' : 'bg-black/0'}`} />
      )}

      <div
        ref={tooltipRef}
        className={`fixed z-[9001] pointer-events-auto transition-all duration-500 ease-out ${
          visible && !transitioning
            ? 'opacity-100 scale-100 translate-y-0'
            : isCentered
              ? 'opacity-0 scale-[0.92]'
              : 'opacity-0 -translate-y-3 scale-[0.97]'
        }`}
        style={isCentered
          ? { top: '50%', left: '50%', transform: `translate(-50%, -50%) ${visible && !transitioning ? 'scale(1)' : 'scale(0.92)'}` }
          : { top: pos!.top, left: pos!.left }
        }
      >
        {/* Tooltip card */}
        <div className="relative overflow-hidden bg-[var(--bo-surface,#13161f)] border border-[var(--bo-border,rgba(255,255,255,0.06))] rounded-2xl shadow-[0_24px_64px_rgba(0,0,0,0.6)] max-w-[380px] min-w-[300px]">
          {/* Flèche */}
          {pos && !isCentered && (
            <Arrow direction={pos.arrow} color="var(--bo-surface, #13161f)" />
          )}

          {/* Progress bar gradient */}
          <div className="h-[2px] bg-white/[0.03] overflow-hidden">
            <div
              className="h-full transition-all duration-700 ease-out"
              style={{
                width: `${progress}%`,
                background: `linear-gradient(90deg, #34d399, ${meta.accent})`,
                boxShadow: `0 0 8px ${meta.accent}40`,
              }}
            />
          </div>

          {/* Ambient glow en haut */}
          <div
            className="absolute top-0 left-1/2 -translate-x-1/2 w-[60%] h-[1px] blur-[8px] pointer-events-none"
            style={{ background: meta.accent, opacity: 0.15 }}
          />

          <div className={`relative ${isCentered ? 'px-7 pt-6 pb-5' : 'px-5 pt-4 pb-4'}`}>
            {/* Step counter + close */}
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                {/* Icône animée */}
                <span
                  className="flex items-center justify-center w-8 h-8 rounded-xl text-sm font-bold shrink-0 transition-all duration-500"
                  style={{
                    background: `linear-gradient(135deg, ${meta.accent}20, ${meta.accent}08)`,
                    color: meta.accent,
                    boxShadow: `0 0 14px ${meta.accent}15`,
                  }}
                >
                  {meta.icon}
                </span>

                {/* Step stepper visuel */}
                <div className="flex items-center gap-1">
                  {Array.from({ length: totalSteps }, (_, i) => (
                    <div
                      key={i}
                      className="relative flex items-center justify-center transition-all duration-500"
                      style={{
                        width: i === stepIndex ? 22 : 6,
                        height: 6,
                        borderRadius: 3,
                        background: i === stepIndex
                          ? `linear-gradient(90deg, ${meta.accent}, ${meta.accent}80)`
                          : i < stepIndex
                            ? `${meta.accent}50`
                            : 'rgba(255,255,255,0.06)',
                        boxShadow: i === stepIndex ? `0 0 6px ${meta.accent}30` : 'none',
                      }}
                    >
                      {i < stepIndex && (
                        <Check size={4} className="text-white/80 absolute" />
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-[0.65rem] text-[var(--bo-text-dim,#8892a4)] opacity-40 tabular-nums">
                  {stepIndex + 1}/{totalSteps}
                </span>
                <button
                  onClick={onClose}
                  className="shrink-0 p-1 rounded-lg bg-transparent border-none text-[var(--bo-text-dim,#8892a4)] opacity-30 cursor-pointer hover:opacity-80 hover:bg-white/[0.04] transition-all duration-200"
                >
                  <X size={13} />
                </button>
              </div>
            </div>

            {/* Titre */}
            <h4 className={`font-bold text-[var(--bo-text,#eceef5)] m-0 leading-tight mb-2 ${isCentered ? 'text-[1.05rem]' : 'text-[0.92rem]'}`}>
              {step.title}
            </h4>

            {/* Body */}
            <p className="text-[0.8rem] text-[var(--bo-text-dim,#8892a4)] leading-[1.65] m-0 mb-4">{step.body}</p>

            {/* Actions */}
            <div className="flex items-center justify-between">
              {/* Keyboard hint */}
              <div className="flex items-center gap-1">
                <kbd className="inline-flex items-center justify-center px-1.5 py-0.5 rounded bg-white/[0.04] border border-white/[0.06] text-[0.6rem] text-[var(--bo-text-dim,#8892a4)] opacity-40 font-mono">
                  Esc
                </kbd>
                <span className="text-[0.6rem] text-[var(--bo-text-dim,#8892a4)] opacity-25">fermer</span>
              </div>

              <div className="flex items-center gap-2">
                {!isLast && (
                  <button
                    onClick={onSkip}
                    className="group inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-transparent border border-[var(--bo-border,rgba(255,255,255,0.06))] text-[var(--bo-text-dim,#8892a4)] text-[0.72rem] font-medium cursor-pointer hover:text-[var(--bo-text,#eceef5)] hover:border-[var(--bo-border-hover,rgba(255,255,255,0.15))] transition-all duration-200"
                  >
                    <SkipForward size={11} className="group-hover:translate-x-[1px] transition-transform duration-200" />
                    Passer
                  </button>
                )}
                <button
                  onClick={onNext}
                  className="group inline-flex items-center gap-1.5 px-4 py-1.5 rounded-lg border-none text-white text-[0.75rem] font-bold cursor-pointer transition-all duration-300"
                  style={{
                    background: `linear-gradient(135deg, ${meta.accent}, ${meta.accent}cc)`,
                    boxShadow: `0 2px 12px ${meta.accent}30, inset 0 1px 0 rgba(255,255,255,0.12)`,
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.boxShadow = `0 4px 24px ${meta.accent}40, inset 0 1px 0 rgba(255,255,255,0.12)`;
                    e.currentTarget.style.transform = 'translateY(-1px)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.boxShadow = `0 2px 12px ${meta.accent}30, inset 0 1px 0 rgba(255,255,255,0.12)`;
                    e.currentTarget.style.transform = 'translateY(0)';
                  }}
                >
                  {isLast ? 'C\'est parti !' : 'Suivant'}
                  {!isLast && <ChevronRight size={13} className="group-hover:translate-x-[2px] transition-transform duration-200" />}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes gt-ring-pulse {
          0%, 100% { opacity: 0.3; transform: scale(1); }
          50% { opacity: 0.7; transform: scale(1.03); }
        }
      ` }} />
    </>
  );

  // Keyboard listener
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'Enter' || e.key === 'ArrowRight') onNext();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose, onNext]);

  return createPortal(content, document.body);
}

// ── Toast tip (post-parcours) ──

function TipToast({ text, onDone }: { text: string; onDone: () => void }) {
  const [visible, setVisible] = useState(false);
  const [progress, setProgress] = useState(100);

  useEffect(() => {
    requestAnimationFrame(() => {
      setVisible(true);
      setTimeout(() => setProgress(0), 50);
    });
    const timer = setTimeout(() => {
      setVisible(false);
      setTimeout(onDone, 400);
    }, TIP_DISPLAY_MS);
    return () => clearTimeout(timer);
  }, [onDone]);

  return createPortal(
    <div
      className={`fixed bottom-6 right-6 z-[9001] max-w-[360px] overflow-hidden bg-[var(--bo-surface,#13161f)] border border-[var(--bo-border,rgba(255,255,255,0.06))] rounded-2xl shadow-[0_12px_40px_rgba(0,0,0,0.4)] transition-all duration-400 ${
        visible ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 translate-y-4 scale-95'
      }`}
    >
      {/* Progress bar */}
      <div className="h-[2px] bg-white/[0.03]">
        <div
          className="h-full rounded-full"
          style={{
            width: `${progress}%`,
            background: 'linear-gradient(90deg, #34d399, #818cf8)',
            transition: `width ${TIP_DISPLAY_MS - 100}ms linear`,
            boxShadow: '0 0 4px rgba(52,211,153,0.3)',
          }}
        />
      </div>
      <div className="flex items-start gap-3 px-4 py-3.5">
        <span
          className="flex items-center justify-center w-6 h-6 rounded-lg shrink-0 mt-0.5"
          style={{
            background: 'linear-gradient(135deg, rgba(52,211,153,0.12), rgba(99,102,241,0.08))',
          }}
        >
          <Lightbulb size={13} className="text-emerald-400 opacity-80" />
        </span>
        <p className="text-[0.8rem] text-[var(--bo-text-dim,#8892a4)] m-0 leading-[1.55]">{text}</p>
      </div>
    </div>,
    document.body
  );
}

// ── Composant principal ──

export function GuidedTour() {
  const [mode, setMode] = useState<'idle' | 'tour' | 'tip' | 'done'>('idle');
  const [stepIndex, setStepIndex] = useState(0);
  const [tipText, setTipText] = useState('');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    const timer = setTimeout(() => {
      if (isTourDone()) {
        const tip = getRandomTip();
        setTipText(tip.text);
        setMode('tip');
      } else {
        setMode('tour');
      }
    }, 1500);
    return () => clearTimeout(timer);
  }, [mounted]);

  const handleNext = useCallback(() => {
    if (stepIndex < TOUR_STEPS.length - 1) {
      setStepIndex((i) => i + 1);
    } else {
      markTourDone();
      setMode('done');
    }
  }, [stepIndex]);

  const handleSkip = useCallback(() => {
    markTourDone();
    setMode('done');
  }, []);

  const handleClose = useCallback(() => {
    markTourDone();
    setMode('done');
  }, []);

  const handleTipDone = useCallback(() => {
    setMode('done');
  }, []);

  if (!mounted) return null;

  if (mode === 'tour') {
    return (
      <CoachMark
        step={TOUR_STEPS[stepIndex]}
        stepIndex={stepIndex}
        totalSteps={TOUR_STEPS.length}
        onNext={handleNext}
        onSkip={handleSkip}
        onClose={handleClose}
      />
    );
  }

  if (mode === 'tip') {
    return <TipToast text={tipText} onDone={handleTipDone} />;
  }

  return null;
}
