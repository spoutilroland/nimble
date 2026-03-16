'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { getSectionFields } from '@/lib/sidebar/section-fields';
import { ck } from '@/lib/content-key';
import { SECTION_TYPES, DIVIDER_TYPES, DIVIDER_COLORS, DIVIDER_SVG_PATHS } from '@/lib/admin/constants/pages';
import type { Section, SectionType, DividerConfig } from '@/lib/types/pages';
import type { Layout } from '@/lib/schemas/layouts';

interface SidebarEditorProps {
  pageId: string;
  lang: string;
  sections: Section[];
}

interface CarouselImage {
  url: string;
  webpUrl?: string;
  alt?: string;
}

interface StatItem { count: number; label: string; }
interface PolaroidItem { title: string; tag: string; tagColor: string; imageUrl?: string; }
interface CinematicProject { tags: string[]; metaItems: string[]; imageUrl?: string; }

const TAG_COLORS = ['bois', 'green', 'slate'] as const;

// ── Limites de caractères (copié depuis ContentEditor) ──

const CHAR_LIMITS: Record<string, number> = {
  'hero-title': 80, 'hero-eyebrow': 40, 'hero-subtitle': 150,
  's1-title': 80, 's1-tag': 40, 's2-title': 80, 's2-tag': 40, 's3-title': 80, 's3-tag': 40,
  'about-title': 80, 'about-p1': 400, 'about-p2': 400,
  'services-title': 80,
  'service-1-title': 60, 'service-1-desc': 220, 'service-2-title': 60, 'service-2-desc': 220,
  'service-3-title': 60, 'service-3-desc': 220, 'service-4-title': 60, 'service-4-desc': 220,
  'feature-1-title': 22, 'feature-1-desc': 220, 'feature-2-title': 22, 'feature-2-desc': 220,
  'feature-3-title': 22, 'feature-3-desc': 220,
  'gallery-title': 80, 'contact-title': 80,
  'project-1-title': 60, 'project-1-desc': 220, 'project-2-title': 60, 'project-2-desc': 220,
  'project-3-title': 60, 'project-3-desc': 220,
};

function getCharLimit(key: string): number {
  // Retirer le contentId prefix (e.g. "abc123--hero-title" → "hero-title")
  const bare = key.includes('--') ? key.split('--').slice(1).join('--') : key;
  if (CHAR_LIMITS[bare]) return CHAR_LIMITS[bare];
  if (bare.endsWith('-title')) return 80;
  if (bare.endsWith('-tag')) return 40;
  if (bare.endsWith('-subtitle')) return 150;
  if (bare.endsWith('-desc')) return 220;
  if (bare.startsWith('about-p') || bare.endsWith('-p1') || bare.endsWith('-p2')) return 400;
  return 300;
}

// ── Helpers ──

async function persistAllSections(pageId: string, sections: Section[]): Promise<boolean> {
  try {
    const res = await fetch('/api/pages');
    const config = await res.json();
    for (const page of config.pages || []) {
      const pid = (page.slug || '/').replace(/^\//, '') || 'index';
      if (pid === pageId) { page.sections = sections; break; }
    }
    const r = await fetch('/api/admin/pages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ pages: config.pages }),
    });
    return r.ok;
  } catch { return false; }
}

// Flash pill component rendu dans la sidebar (pas sur la page)
function SidebarFlashPill({ type }: { type: 'saved' | 'error' }) {
  const bg = type === 'saved' ? '#059669' : '#dc2626';
  return (
    <span
      className="absolute top-2 right-2 z-10 pointer-events-none animate-[fadeInOut_2s_ease_forwards] text-white text-[0.7rem] font-medium px-2.5 py-0.5 rounded-full shadow-md"
      style={{ background: bg }}
    >
      {type === 'saved' ? 'Enregistré' : 'Erreur'}
    </span>
  );
}

function getDividerPreviewSvg(type: string, flip: boolean): string {
  if (!type || type === 'none' || !DIVIDER_SVG_PATHS[type]) return '';
  const pathEl = `<path d="${DIVIDER_SVG_PATHS[type]}" fill="currentColor"/>`;
  const inner = flip ? `<g transform="scale(1,-1) translate(0,-80)">${pathEl}</g>` : pathEl;
  return `<svg viewBox="0 0 1440 80" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="none" style="display:block;width:100%;height:100%">${inner}</svg>`;
}

// ── Main Component ──

export function SidebarEditor({ pageId, lang, sections }: SidebarEditorProps) {
  const [isAdmin, setIsAdmin] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [sidebarWidth, setSidebarWidth] = useState(360);
  const resizeRef = useRef<{ startX: number; startWidth: number } | null>(null);
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);
  const [content, setContent] = useState<Record<string, string>>({});
  const [carouselImages, setCarouselImages] = useState<Record<string, CarouselImage[]>>({});
  const [layouts, setLayouts] = useState<Record<string, Layout>>({});
  const [localSections, setLocalSections] = useState<Section[]>(sections);
  const [bentoSection, setBentoSection] = useState<{ section: Section; index: number } | null>(null);
  const [sectionPickerOpen, setSectionPickerOpen] = useState(false);
  const [flashSection, setFlashSection] = useState<{ idx: number; type: 'saved' | 'error' } | null>(null);
  const [addFlash, setAddFlash] = useState(false);
  const [cancelSnapshot, setCancelSnapshot] = useState<{ content: Record<string, string>; sections: Section[] } | null>(null);
  const [mediaPicker, setMediaPicker] = useState<{ carouselId: string; replaceIndex?: number; onResult: (url: string, webpUrl?: string) => void } | null>(null);
  const debounceTimers = useRef<Record<string, ReturnType<typeof setTimeout>>>({});

  // Drag & drop state
  const listRef = useRef<HTMLDivElement>(null);
  const sortRef = useRef<{ dragIdx: number; insertIdx: number; startY: number; ghostY: number; rects: { mid: number; h: number }[] } | null>(null);
  const ghostRef = useRef<HTMLDivElement | null>(null);
  const [sortRender, setSortRender] = useState<{ dragIdx: number; insertIdx: number } | null>(null);

  // Sync sections from server
  useEffect(() => { setLocalSections(sections); }, [sections]);

  // Auth check
  useEffect(() => {
    async function checkAdmin() {
      if (!document.cookie.includes('is_admin=')) return;
      try {
        const res = await fetch('/api/auth/check');
        const data = await res.json();
        if (data.valid === true) setIsAdmin(true);
      } catch { /* ignore */ }
    }
    checkAdmin();
  }, []);

  // localStorage pour garder la sidebar ouverte + largeur entre les pages
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('sidebar-editor-open');
      if (stored === 'true') setIsOpen(true);
      const storedWidth = localStorage.getItem('sidebar-editor-width');
      if (storedWidth) {
        const w = parseInt(storedWidth, 10);
        if (w >= 360 && w <= 600) setSidebarWidth(w);
      }
    }
  }, []);
  useEffect(() => {
    if (isAdmin) localStorage.setItem('sidebar-editor-open', String(isOpen));
  }, [isOpen, isAdmin]);
  useEffect(() => {
    if (isAdmin) localStorage.setItem('sidebar-editor-width', String(sidebarWidth));
  }, [sidebarWidth, isAdmin]);

  // Charger contenu + layouts
  useEffect(() => {
    if (!isAdmin) return;
    fetch('/api/content').then(r => r.json()).then(data => setContent(data[pageId] || {})).catch(() => {});
    fetch('/api/layouts').then(r => r.json()).then(data => setLayouts(data.layouts || {})).catch(() => {});
  }, [isAdmin, pageId]);

  // Push layout
  useEffect(() => {
    if (!isAdmin) return;
    document.body.style.transition = 'margin-left 0.3s ease';
    document.body.style.marginLeft = isOpen ? `${sidebarWidth}px` : '0';
    return () => { document.body.style.marginLeft = '0'; document.body.style.transition = ''; };
  }, [isOpen, isAdmin, sidebarWidth]);

  // Charger images carousel (section principale + blockCarousels)
  useEffect(() => {
    if (expandedIndex === null) return;
    const section = localSections[expandedIndex];
    if (!section) return;
    const idsToFetch: string[] = [];
    const def = getSectionFields(section.type as SectionType);
    if (def.hasCarousel && section.carouselId && !carouselImages[section.carouselId]) {
      idsToFetch.push(section.carouselId);
    }
    if (section.blockCarousels) {
      for (const bcId of Object.values(section.blockCarousels as Record<string, string>)) {
        if (bcId && !carouselImages[bcId]) idsToFetch.push(bcId);
      }
    }
    if (idsToFetch.length === 0) return;
    Promise.all(
      idsToFetch.map(cid =>
        fetch(`/api/carousel/${cid}/images`).then(r => r.json())
          .then(data => ({ cid, imgs: Array.isArray(data) ? data : (data.images || []) }))
          .catch(() => ({ cid, imgs: [] as CarouselImage[] }))
      )
    ).then(results => {
      setCarouselImages(prev => {
        const next = { ...prev };
        for (const { cid, imgs } of results) next[cid] = imgs;
        return next;
      });
    });
  }, [expandedIndex, localSections, carouselImages]);

  // Cleanup timers
  useEffect(() => {
    const timers = debounceTimers.current;
    return () => { Object.values(timers).forEach(clearTimeout); };
  }, []);

  // ── Flash helper ──

  const triggerFlash = useCallback((idx: number, type: 'saved' | 'error') => {
    setFlashSection({ idx, type });
    setTimeout(() => setFlashSection(null), 2000);
  }, []);

  // ── Handlers ──

  const saveField = useCallback(async (key: string, value: string) => {
    try {
      const res = await fetch('/api/admin/content', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ page: pageId, key, value, lang }),
      });
      if (!res.ok) throw new Error();
      const el = document.querySelector(`[data-content-key="${key}"]`);
      if (el) el.innerHTML = value.replace(/\n/g, '<br>');
      if (expandedIndex !== null) triggerFlash(expandedIndex, 'saved');
    } catch {
      if (expandedIndex !== null) triggerFlash(expandedIndex, 'error');
    }
  }, [pageId, lang, expandedIndex, triggerFlash]);

  const handleFieldChange = useCallback((key: string, value: string) => {
    setContent(prev => ({ ...prev, [key]: value }));
    // Mirroring WYSIWYG avec support saut de ligne
    const el = document.querySelector(`[data-content-key="${key}"]`);
    if (el) el.innerHTML = value.replace(/\n/g, '<br>');
    if (debounceTimers.current[key]) clearTimeout(debounceTimers.current[key]);
    debounceTimers.current[key] = setTimeout(() => saveField(key, value), 500);
  }, [saveField]);

  const handleExpand = useCallback((index: number) => {
    const isCollapsing = expandedIndex === index;
    setExpandedIndex(prev => (prev === index ? null : index));
    // Au dépliage : pré-remplir les champs vides depuis le DOM (fallback text)
    if (!isCollapsing) {
      const section = localSections[index];
      const domPatched: Record<string, string> = {};
      if (section) {
        const keysToCheck: string[] = [];
        const def = getSectionFields(section.type as SectionType);
        for (const field of def.fields) keysToCheck.push(ck(section.contentId, field.key));
        if (section.type === 'cinematic-split') {
          const projects = (section.props?.projects as CinematicProject[]) || [];
          for (let pi = 0; pi < Math.max(projects.length, 1); pi++) {
            keysToCheck.push(ck(section.contentId, `project-${pi + 1}-title`));
            keysToCheck.push(ck(section.contentId, `project-${pi + 1}-desc`));
          }
        }
        for (const fullKey of keysToCheck) {
          if (!content[fullKey]) {
            const domEl = document.querySelector(`[data-content-key="${fullKey}"]`);
            if (domEl) {
              const text = (domEl.textContent || '').trim();
              if (text) domPatched[fullKey] = text;
            }
          }
        }
        if (Object.keys(domPatched).length > 0) setContent(prev => ({ ...prev, ...domPatched }));
      }
      // Snapshot pour le bouton annuler (inclut les valeurs pré-remplies depuis le DOM)
      const snapshotContent = { ...content, ...domPatched };
      setCancelSnapshot({ content: snapshotContent, sections: localSections.map(s => ({ ...s, props: s.props ? { ...s.props } : undefined, dividerAfter: s.dividerAfter ? { ...s.dividerAfter } : undefined })) });
    }
    const el = document.getElementById(`section-${index}`);
    if (el) {
      const header = document.querySelector('header.sticky, header.header');
      const headerH = header ? header.getBoundingClientRect().height : 0;
      const top = el.getBoundingClientRect().top + window.scrollY - headerH - 16;
      window.scrollTo({ top, behavior: 'smooth' });
      // Flash visuel plus visible
      el.style.position = el.style.position || 'relative';
      const overlay = document.createElement('div');
      overlay.style.cssText = 'position:absolute;inset:0;background:rgba(59,130,246,0.22);pointer-events:none;z-index:10;transition:opacity 0.6s ease;border:2px solid rgba(59,130,246,0.5);border-radius:4px';
      el.appendChild(overlay);
      setTimeout(() => { overlay.style.opacity = '0'; }, 800);
      setTimeout(() => { overlay.remove(); }, 1400);
    }
  }, []);

  // Props section change (stats, cinematic, polaroids)
  const handlePropsChange = (sectionIdx: number, propsPatch: Record<string, unknown>) => {
    setLocalSections(prev => {
      const next = [...prev];
      next[sectionIdx] = { ...next[sectionIdx], props: { ...(next[sectionIdx].props || {}), ...propsPatch } };
      return next;
    });

    // WYSIWYG live pour stats
    if (propsPatch.items && Array.isArray(propsPatch.items)) {
      const sectionEl = document.getElementById(`section-${sectionIdx}`);
      const statsBar = sectionEl?.querySelector('.stats-bar');
      if (statsBar) {
        const statsItems = propsPatch.items as StatItem[];
        // Reconstruire le HTML des stats
        statsBar.innerHTML = statsItems.map((item, i) => {
          const isOdd = statsItems.length % 2 !== 0;
          const isLastAlone = i === statsItems.length - 1 && isOdd;
          return `<div class="stat-item text-center relative px-4 sm:px-8 min-w-[140px]${isLastAlone ? ' col-span-2' : ''}">
            <span class="stat-number font-['Oswald',sans-serif] text-[2.5rem] sm:text-[3.5rem] font-bold text-white leading-none block" data-count="${item.count}">
              <span>${item.count}</span>
            </span>
            <span class="stat-label text-[0.7rem] sm:text-[0.8rem] tracking-[2px] sm:tracking-[3px] uppercase text-white/60 mt-[0.4rem] block font-semibold">${item.label}</span>
          </div>`;
        }).join('');
      }
    }

    // WYSIWYG live pour cinematic-split tags/meta
    if (propsPatch.projects && Array.isArray(propsPatch.projects)) {
      const sectionEl = document.getElementById(`section-${sectionIdx}`);
      if (sectionEl) {
        const cinematicProjects = propsPatch.projects as CinematicProject[];
        cinematicProjects.forEach((proj, pi) => {
          // Tags
          const tagsEl = sectionEl.querySelector(`[data-cinematic-tags="${pi}"]`);
          if (tagsEl) {
            const validTags = proj.tags.filter(Boolean);
            tagsEl.innerHTML = validTags.map(tag =>
              `<span class="inline-block px-3 py-1 text-[0.7rem] font-bold tracking-[1.5px] uppercase border-[1.5px] border-[var(--primary)] text-[var(--primary)] [clip-path:polygon(4px_0,100%_0,calc(100%-4px)_100%,0_100%)]">${tag}</span>`
            ).join('');
            tagsEl.className = `flex flex-wrap gap-2 ${validTags.length > 0 ? 'mb-3' : ''}`;
          }
          // Meta
          const metaEl = sectionEl.querySelector(`[data-cinematic-meta="${pi}"]`);
          if (metaEl) {
            const validMeta = proj.metaItems.filter(Boolean);
            metaEl.innerHTML = validMeta.map((item, mi) =>
              `<span>${mi > 0 ? '<span class="mx-1">·</span>' : ''}${item}</span>`
            ).join('');
          }
        });
      }
    }

    const key = `props-${sectionIdx}`;
    if (debounceTimers.current[key]) clearTimeout(debounceTimers.current[key]);
    debounceTimers.current[key] = setTimeout(async () => {
      const ok = await persistSectionUpdate(sectionIdx, s => ({
        ...s,
        props: { ...(s.props || {}), ...propsPatch },
      }));
      triggerFlash(sectionIdx, ok ? 'saved' : 'error');
    }, 500);
  };

  // Divider change + WYSIWYG live
  const handleDividerChange = (sectionIdx: number, divider: DividerConfig | undefined) => {
    setLocalSections(prev => {
      const next = [...prev];
      next[sectionIdx] = { ...next[sectionIdx], dividerAfter: divider };
      return next;
    });
    // WYSIWYG : mettre à jour le divider sur la page en live
    const sectionEl = document.getElementById(`section-${sectionIdx}`);
    if (sectionEl) {
      const divEl = sectionEl.querySelector('.section-divider');
      if (!divider?.type || divider.type === 'none' || !DIVIDER_SVG_PATHS[divider.type]) {
        // Supprimer le divider
        if (divEl) divEl.innerHTML = '';
      } else {
        const pathD = DIVIDER_SVG_PATHS[divider.type];
        const color = divider.color || 'var(--bg)';
        const pathEl = divider.flip
          ? `<g transform="scale(1,-1) translate(0,-80)"><path d="${pathD}" fill="currentColor"/></g>`
          : `<path d="${pathD}" fill="currentColor"/>`;
        const svgHtml = `<svg viewBox="0 0 1440 80" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="none">${pathEl}</svg>`;
        if (divEl) {
          (divEl as HTMLElement).style.color = color;
          divEl.innerHTML = svgHtml;
        } else {
          // Créer le divider s'il n'existe pas
          const newDiv = document.createElement('div');
          newDiv.className = 'section-divider';
          newDiv.setAttribute('aria-hidden', 'true');
          newDiv.style.color = color;
          newDiv.innerHTML = svgHtml;
          sectionEl.appendChild(newDiv);
        }
      }
    }
    const key = `divider-${sectionIdx}`;
    if (debounceTimers.current[key]) clearTimeout(debounceTimers.current[key]);
    debounceTimers.current[key] = setTimeout(async () => {
      const ok = await persistSectionUpdate(sectionIdx, s => ({
        ...s,
        dividerAfter: divider,
      }));
      triggerFlash(sectionIdx, ok ? 'saved' : 'error');
    }, 500);
  };

  // Section update via pages API
  const persistSectionUpdate = useCallback(async (sectionIdx: number, updater: (s: Section) => Section): Promise<boolean> => {
    try {
      const res = await fetch('/api/pages');
      const config = await res.json();
      for (const page of config.pages || []) {
        const pid = (page.slug || '/').replace(/^\//, '') || 'index';
        if (pid !== pageId) continue;
        if (sectionIdx < page.sections.length) page.sections[sectionIdx] = updater(page.sections[sectionIdx]);
        break;
      }
      const r = await fetch('/api/admin/pages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pages: config.pages }),
      });
      return r.ok;
    } catch { return false; }
  }, [pageId]);

  // Add section
  const addSection = useCallback((type: string, layoutId?: string, label?: string) => {
    const info = SECTION_TYPES.find(st => st.type === type);
    const carouselId = info?.needsCarousel ? Math.random().toString(36).slice(2, 8) : '';
    const contentId = Math.random().toString(36).slice(2, 8);
    const newSection: Section = { type: type as Section['type'], carouselId, contentId };
    if (layoutId) newSection.layoutId = layoutId;
    if (label) {
      newSection.label = label;
    } else {
      const sameCount = localSections.filter(s => s.type === type).length;
      if (sameCount > 0) newSection.label = `#${sameCount + 1}`;
    }
    if (type === 'stats') {
      newSection.props = { items: [] };
    }
    if (type === 'custom-layout' && layoutId && layouts[layoutId]) {
      const bc: Record<string, string> = {};
      layouts[layoutId].blocks.forEach(b => {
        if (b.type === 'image' || b.type === 'carousel') bc[b.blockId] = `${carouselId}-${b.blockId}`;
      });
      newSection.blockCarousels = bc;
    }
    const updated = [...localSections, newSection];
    setLocalSections(updated);
    setSectionPickerOpen(false);
    persistAllSections(pageId, updated).then(ok => {
      if (ok) {
        setAddFlash(true);
        setTimeout(() => setAddFlash(false), 4000);
      }
    });
  }, [localSections, layouts, pageId]);

  // Delete section
  const handleDeleteSection = useCallback((index: number) => {
    if (!confirm('Supprimer cette section ? Cette action est irréversible.')) return;
    const updated = localSections.filter((_, i) => i !== index);
    setLocalSections(updated);
    setExpandedIndex(null);
    setCancelSnapshot(null);
    persistAllSections(pageId, updated).then(ok => {
      if (ok) {
        setAddFlash(true);
        setTimeout(() => setAddFlash(false), 4000);
      }
    });
  }, [localSections, pageId]);

  // Open media picker for carousel images
  const openCarouselMediaPicker = useCallback((carouselId: string, replaceIndex: number | undefined, onResult: (url: string, webpUrl?: string) => void) => {
    setMediaPicker({ carouselId, replaceIndex, onResult });
  }, []);

  // ── Drag & drop ──

  const handleGripDown = useCallback((e: React.PointerEvent, dragIdx: number) => {
    e.preventDefault();
    const list = listRef.current;
    if (!list) return;
    const children = Array.from(list.children) as HTMLElement[];
    const listRect = list.getBoundingClientRect();
    const rects = children.map(c => {
      const r = c.getBoundingClientRect();
      return { mid: r.top - listRect.top + r.height / 2, h: r.height };
    });
    const source = children[dragIdx];
    const sr = source.getBoundingClientRect();
    const ghost = document.createElement('div');
    ghost.innerHTML = source.innerHTML;
    ghost.style.cssText = `position:fixed;left:${sr.left}px;top:${sr.top}px;width:${sr.width}px;z-index:9999;pointer-events:none;opacity:0.92;box-shadow:0 8px 24px rgba(0,0,0,0.25);border-radius:6px;background:#fff;border:1px solid #3b82f6;transition:none`;
    document.body.appendChild(ghost);
    ghostRef.current = ghost;
    sortRef.current = { dragIdx, insertIdx: dragIdx, startY: e.clientY, ghostY: sr.top, rects };
    setSortRender({ dragIdx, insertIdx: dragIdx });
    const handleMove = (ev: PointerEvent) => {
      const s = sortRef.current;
      if (!s) return;
      const dy = ev.clientY - s.startY;
      if (ghostRef.current) ghostRef.current.style.top = `${s.ghostY + dy}px`;
      const dragMid = s.rects[s.dragIdx].mid + dy;
      let insert = 0;
      for (let i = 0; i < s.rects.length; i++) { if (dragMid > s.rects[i].mid) insert = i + 1; }
      insert = Math.max(0, Math.min(insert, s.rects.length));
      if (insert !== s.insertIdx) { s.insertIdx = insert; setSortRender({ dragIdx: s.dragIdx, insertIdx: insert }); }
    };
    const handleUp = () => {
      const s = sortRef.current;
      sortRef.current = null;
      if (ghostRef.current) { ghostRef.current.remove(); ghostRef.current = null; }
      setSortRender(null);
      if (s && s.dragIdx !== s.insertIdx && s.insertIdx !== s.dragIdx + 1) {
        setLocalSections(prev => {
          const arr = [...prev];
          const [moved] = arr.splice(s.dragIdx, 1);
          const target = s.insertIdx > s.dragIdx ? s.insertIdx - 1 : s.insertIdx;
          arr.splice(target, 0, moved);
          persistAllSections(pageId, arr);
          return arr;
        });
      }
      document.removeEventListener('pointermove', handleMove);
      document.removeEventListener('pointerup', handleUp);
    };
    document.addEventListener('pointermove', handleMove);
    document.addEventListener('pointerup', handleUp);
  }, [pageId]);

  const getDisplacement = (idx: number): number => {
    if (!sortRender) return 0;
    const { dragIdx, insertIdx } = sortRender;
    if (idx === dragIdx) return 0;
    const rects = sortRef.current?.rects;
    if (!rects) return 0;
    const dragH = rects[dragIdx].h + 2;
    if (insertIdx <= dragIdx) {
      if (idx >= insertIdx && idx < dragIdx) return dragH;
    } else {
      if (idx > dragIdx && idx < insertIdx) return -dragH;
    }
    return 0;
  };

  // Inject CSS keyframe for flash animation
  useEffect(() => {
    if (document.getElementById('sidebar-flash-style')) return;
    const style = document.createElement('style');
    style.id = 'sidebar-flash-style';
    style.textContent = `@keyframes fadeInOut{0%{opacity:0;transform:translateY(-4px)}10%{opacity:1;transform:translateY(0)}75%{opacity:1}100%{opacity:0}}`;
    document.head.appendChild(style);
    return () => { style.remove(); };
  }, []);

  if (!isAdmin) return null;

  // ── Display helpers ──

  const sectionDisplayName = (section: Section) => {
    if (section.type === 'custom-layout') {
      const layoutData = section.layoutId ? layouts[section.layoutId] : undefined;
      const name = section.label || layoutData?.label || 'Layout personnalise';
      return { primary: name, secondary: 'Layout personnalise' };
    }
    const labels: Record<string, string> = {
      hero: 'Hero', 'hero-simple': 'Hero Simple', about: 'A propos',
      services: 'Services', gallery: 'Galerie', contact: 'Contact',
      'bento-grid': 'Bento Grid', 'cinematic-split': 'Cinematic Split',
      polaroids: 'Polaroids', stats: 'Statistiques',
    };
    return { primary: labels[section.type] || section.type, secondary: section.label };
  };

  return (
    <>
      {/* Bouton flottant */}
      <button
        onClick={() => setIsOpen(prev => !prev)}
        className="fixed top-4 z-[9999] flex h-10 w-10 items-center justify-center rounded-full bg-neutral-900 text-white shadow-lg hover:bg-neutral-700 transition-all duration-300"
        style={{ left: isOpen ? `${sidebarWidth + 12}px` : '16px' }}
        title={isOpen ? 'Fermer' : 'Ouvrir la sidebar'}
      >
        {isOpen ? (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="3" width="18" height="18" rx="2" /><line x1="9" y1="3" x2="9" y2="21" /><line x1="15" y1="9" x2="12" y2="12" /><line x1="15" y1="15" x2="12" y2="12" />
          </svg>
        ) : (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="3" width="18" height="18" rx="2" /><line x1="9" y1="3" x2="9" y2="21" /><line x1="14" y1="9" x2="17" y2="12" /><line x1="14" y1="15" x2="17" y2="12" />
          </svg>
        )}
      </button>

      {/* Sidebar */}
      <div className={`fixed left-0 top-0 z-[9998] flex h-screen flex-col border-r border-neutral-200 bg-white shadow-xl transition-transform duration-300 ${isOpen ? 'translate-x-0' : '-translate-x-full'}`} style={{ width: `${sidebarWidth}px` }}>
        {/* Resize handle */}
        <div
          className="absolute right-0 top-0 h-full w-1 cursor-col-resize z-10 hover:bg-indigo-300/50 active:bg-indigo-400/50 transition-colors"
          onPointerDown={(e) => {
            e.preventDefault();
            resizeRef.current = { startX: e.clientX, startWidth: sidebarWidth };
            const handleMove = (ev: PointerEvent) => {
              if (!resizeRef.current) return;
              const delta = ev.clientX - resizeRef.current.startX;
              const newWidth = Math.min(600, Math.max(360, resizeRef.current.startWidth + delta));
              setSidebarWidth(newWidth);
              document.body.style.marginLeft = `${newWidth}px`;
              document.body.style.transition = 'none';
            };
            const handleUp = () => {
              resizeRef.current = null;
              document.body.style.transition = 'margin-left 0.3s ease';
              document.removeEventListener('pointermove', handleMove);
              document.removeEventListener('pointerup', handleUp);
            };
            document.addEventListener('pointermove', handleMove);
            document.addEventListener('pointerup', handleUp);
          }}
        />
        {/* Header */}
        <div className="flex items-center justify-between border-b border-neutral-200 px-4 py-3">
          <h2 className="text-sm font-semibold text-neutral-900">Sections de la page</h2>
          <button onClick={() => setIsOpen(false)} className="flex h-8 w-8 items-center justify-center rounded-md text-neutral-500 hover:bg-neutral-100 hover:text-neutral-800">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
          </button>
        </div>

        {/* Sections list */}
        <div className="flex-1 overflow-y-auto" ref={listRef}>
          {localSections.map((section, i) => {
            const def = getSectionFields(section.type as SectionType);
            const isExpanded = expandedIndex === i;
            const display = sectionDisplayName(section);
            const isDragged = sortRender?.dragIdx === i;
            const disp = getDisplacement(i);

            return (
              <div
                key={`${section.contentId || i}`}
                className={`border-b border-neutral-100 transition-transform duration-200 ease-out ${isDragged ? 'opacity-0' : ''}`}
                style={{ transform: disp ? `translateY(${disp}px)` : undefined }}
              >
                {/* Section header */}
                <div className={`flex w-full items-center gap-1 px-2 py-2.5 text-sm transition-colors ${isExpanded ? 'bg-neutral-50' : ''}`}>
                  {/* Grip handle */}
                  <div
                    onPointerDown={(e) => handleGripDown(e, i)}
                    className="cursor-grab active:cursor-grabbing text-neutral-300 hover:text-neutral-500 shrink-0 touch-none select-none px-1"
                  >
                    <svg width="12" height="12" viewBox="0 0 16 16" fill="currentColor">
                      <circle cx="5" cy="3" r="1.5"/><circle cx="11" cy="3" r="1.5"/><circle cx="5" cy="8" r="1.5"/><circle cx="11" cy="8" r="1.5"/><circle cx="5" cy="13" r="1.5"/><circle cx="11" cy="13" r="1.5"/>
                    </svg>
                  </div>
                  <button
                    onClick={() => handleExpand(i)}
                    className="flex flex-1 items-center gap-2 text-left min-w-0"
                  >
                    <span className={`flex h-5 w-5 items-center justify-center rounded text-[0.65rem] font-bold shrink-0 ${isExpanded ? 'bg-neutral-900 text-white' : 'bg-neutral-200 text-neutral-600'}`}>
                      {i + 1}
                    </span>
                    <span className="flex-1 truncate text-neutral-800 text-[0.82rem]">
                      {display.primary}
                      {display.secondary && (
                        <span className="ml-1 text-neutral-400 text-[0.72rem]">({display.secondary})</span>
                      )}
                    </span>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={`text-neutral-400 transition-transform shrink-0 ${isExpanded ? 'rotate-180' : ''}`}>
                      <polyline points="6 9 12 15 18 9" />
                    </svg>
                  </button>
                </div>

                {/* Expanded content */}
                {isExpanded && (
                  <div className="relative border-t border-neutral-100 bg-neutral-50 px-4 py-3">
                    {/* Flash pill dans la sidebar */}
                    {flashSection?.idx === i && <SidebarFlashPill type={flashSection.type} />}

                    {/* Text fields (content API) */}
                    {def.fields.map(field => {
                      const fullKey = ck(section.contentId, field.key);
                      const limit = getCharLimit(fullKey);
                      const val = content[fullKey] || '';
                      const remaining = limit - val.length;
                      return (
                        <div key={fullKey} className="mb-3">
                          <label className="mb-1 block text-xs font-medium text-neutral-500">{field.key}</label>
                          {field.type === 'textarea' ? (
                            <textarea
                              value={val}
                              onChange={e => handleFieldChange(fullKey, e.target.value)}
                              rows={3}
                              maxLength={limit}
                              className="w-full rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-800 placeholder-neutral-400 focus:border-neutral-500 focus:outline-none focus:ring-1 focus:ring-neutral-500"
                            />
                          ) : (
                            <input
                              type="text"
                              value={val}
                              onChange={e => handleFieldChange(fullKey, e.target.value)}
                              maxLength={limit}
                              className="w-full rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-800 placeholder-neutral-400 focus:border-neutral-500 focus:outline-none focus:ring-1 focus:ring-neutral-500"
                            />
                          )}
                          <div className="text-right mt-0.5">
                            <span className={`text-[0.65rem] tabular-nums ${remaining <= 0 ? 'text-red-500' : remaining <= 5 ? 'text-amber-500' : 'text-neutral-400'}`}>
                              {val.length}/{limit}
                            </span>
                          </div>
                        </div>
                      );
                    })}

                    {/* Stats inline editor */}
                    {section.type === 'stats' && (
                      <StatsEditor
                        items={(section.props?.items as StatItem[]) || []}
                        onChange={items => handlePropsChange(i, { items })}
                      />
                    )}

                    {/* Cinematic split — unified project editor */}
                    {section.type === 'cinematic-split' && (() => {
                      const projects = (section.props?.projects as CinematicProject[]) || [];
                      const projectCount = Math.max(projects.length, 1);
                      return (
                        <>
                          <p className="mb-2 text-xs font-medium text-neutral-500">Projets ({projectCount}/3)</p>
                          {Array.from({ length: projectCount }, (_, pi) => {
                            const titleKey = ck(section.contentId, `project-${pi + 1}-title`);
                            const descKey = ck(section.contentId, `project-${pi + 1}-desc`);
                            const titleLimit = getCharLimit(titleKey);
                            const descLimit = getCharLimit(descKey);
                            const titleVal = content[titleKey] || '';
                            const descVal = content[descKey] || '';
                            const proj = projects[pi] || { tags: [], metaItems: [] };
                            return (
                              <div key={pi} className="mb-3 pl-2 border-l-2 border-neutral-200">
                                <div className="flex items-center justify-between mb-1">
                                  <p className="text-xs font-medium text-neutral-600">Projet {pi + 1}</p>
                                  {projectCount > 1 && (
                                    <button onClick={() => {
                                      const next = projects.filter((_, j) => j !== pi);
                                      handlePropsChange(i, { projects: next });
                                    }} className="text-red-400 hover:text-red-600 text-xs">Supprimer</button>
                                  )}
                                </div>
                                {/* Image */}
                                <div className="flex items-center gap-2 mb-1.5">
                                  <button onClick={() => {
                                    const cid = section.carouselId || '';
                                    openCarouselMediaPicker(cid, undefined, (url) => {
                                      const next = [...projects];
                                      if (!next[pi]) next[pi] = { tags: [], metaItems: [] };
                                      next[pi] = { ...next[pi], imageUrl: url };
                                      handlePropsChange(i, { projects: next });
                                    });
                                  }} className="h-12 w-16 shrink-0 rounded border border-neutral-200 bg-neutral-100 overflow-hidden flex items-center justify-center cursor-pointer hover:border-neutral-400">
                                    {proj.imageUrl ? (
                                      <img src={proj.imageUrl} alt="" className="h-full w-full object-cover" />
                                    ) : (
                                      <span className="text-neutral-300 text-lg">+</span>
                                    )}
                                  </button>
                                  <span className="text-[0.65rem] text-neutral-400">Image projet</span>
                                </div>
                                {/* Title */}
                                <div className="mb-1.5">
                                  <label className="mb-0.5 block text-[0.65rem] text-neutral-400">Titre</label>
                                  <input type="text" value={titleVal} maxLength={titleLimit}
                                    onChange={e => handleFieldChange(titleKey, e.target.value)}
                                    className="w-full rounded-md border border-neutral-300 bg-white px-2 py-1.5 text-sm text-neutral-800 focus:border-neutral-500 focus:outline-none focus:ring-1 focus:ring-neutral-500"
                                  />
                                  <div className="text-right mt-0.5"><span className={`text-[0.65rem] tabular-nums ${titleLimit - titleVal.length <= 0 ? 'text-red-500' : titleLimit - titleVal.length <= 5 ? 'text-amber-500' : 'text-neutral-400'}`}>{titleVal.length}/{titleLimit}</span></div>
                                </div>
                                {/* Description */}
                                <div className="mb-1.5">
                                  <label className="mb-0.5 block text-[0.65rem] text-neutral-400">Description</label>
                                  <textarea value={descVal} maxLength={descLimit} rows={2}
                                    onChange={e => handleFieldChange(descKey, e.target.value)}
                                    className="w-full rounded-md border border-neutral-300 bg-white px-2 py-1.5 text-sm text-neutral-800 focus:border-neutral-500 focus:outline-none focus:ring-1 focus:ring-neutral-500"
                                  />
                                  <div className="text-right mt-0.5"><span className={`text-[0.65rem] tabular-nums ${descLimit - descVal.length <= 0 ? 'text-red-500' : descLimit - descVal.length <= 5 ? 'text-amber-500' : 'text-neutral-400'}`}>{descVal.length}/{descLimit}</span></div>
                                </div>
                                {/* Tags */}
                                <p className="text-[0.65rem] uppercase tracking-wider text-neutral-400 mb-0.5">Tags</p>
                                {proj.tags.map((tag, ti) => (
                                  <div key={ti} className="flex gap-1 items-center mb-1">
                                    <input type="text" value={tag} maxLength={20}
                                      onChange={e => {
                                        const next = [...projects];
                                        const tags = [...next[pi].tags]; tags[ti] = e.target.value;
                                        next[pi] = { ...next[pi], tags };
                                        handlePropsChange(i, { projects: next });
                                      }}
                                      className="flex-1 min-w-0 rounded border border-neutral-300 bg-white px-2 py-1 text-xs text-neutral-800 focus:border-neutral-500 focus:outline-none"
                                    />
                                    <button onClick={() => {
                                      const next = [...projects];
                                      next[pi] = { ...next[pi], tags: next[pi].tags.filter((_, j) => j !== ti) };
                                      handlePropsChange(i, { projects: next });
                                    }} className="text-red-400 hover:text-red-600 text-xs">×</button>
                                  </div>
                                ))}
                                {proj.tags.length < 3 && (
                                  <button onClick={() => {
                                    const next = [...projects];
                                    if (!next[pi]) next[pi] = { tags: [], metaItems: [] };
                                    next[pi] = { ...next[pi], tags: [...next[pi].tags, ''] };
                                    handlePropsChange(i, { projects: next });
                                  }} className="text-[0.65rem] text-emerald-600">+ Tag</button>
                                )}
                                {/* Meta */}
                                <p className="text-[0.65rem] uppercase tracking-wider text-neutral-400 mt-1.5 mb-0.5">Meta</p>
                                {proj.metaItems.map((meta, mi) => (
                                  <div key={mi} className="flex gap-1 items-center mb-1">
                                    <input type="text" value={meta} maxLength={25}
                                      onChange={e => {
                                        const next = [...projects];
                                        const metaItems = [...next[pi].metaItems]; metaItems[mi] = e.target.value;
                                        next[pi] = { ...next[pi], metaItems };
                                        handlePropsChange(i, { projects: next });
                                      }}
                                      className="flex-1 min-w-0 rounded border border-neutral-300 bg-white px-2 py-1 text-xs text-neutral-800 focus:border-neutral-500 focus:outline-none"
                                    />
                                    <button onClick={() => {
                                      const next = [...projects];
                                      next[pi] = { ...next[pi], metaItems: next[pi].metaItems.filter((_, j) => j !== mi) };
                                      handlePropsChange(i, { projects: next });
                                    }} className="text-red-400 hover:text-red-600 text-xs">×</button>
                                  </div>
                                ))}
                                {proj.metaItems.length < 3 && (
                                  <button onClick={() => {
                                    const next = [...projects];
                                    if (!next[pi]) next[pi] = { tags: [], metaItems: [] };
                                    next[pi] = { ...next[pi], metaItems: [...next[pi].metaItems, ''] };
                                    handlePropsChange(i, { projects: next });
                                  }} className="text-[0.65rem] text-emerald-600">+ Meta</button>
                                )}
                              </div>
                            );
                          })}
                          {/* Bouton ajouter projet */}
                          {projectCount < 3 && (
                            <button onClick={() => {
                              const next = [...projects, { tags: [], metaItems: [] }];
                              handlePropsChange(i, { projects: next });
                            }} className="text-xs text-emerald-600 hover:text-emerald-700">
                              + Ajouter un projet
                            </button>
                          )}
                        </>
                      );
                    })()}

                    {/* Polaroids props editor */}
                    {section.type === 'polaroids' && (
                      <PolaroidsPropsEditor
                        items={(section.props?.items as PolaroidItem[]) || []}
                        onChange={items => handlePropsChange(i, { items })}
                        onImagePick={(itemIdx) => {
                          const cid = section.carouselId || '';
                          const currentItems = (section.props?.items as PolaroidItem[]) || [];
                          openCarouselMediaPicker(cid, undefined, (url) => {
                            const next = [...currentItems];
                            next[itemIdx] = { ...next[itemIdx], imageUrl: url };
                            handlePropsChange(i, { items: next });
                          });
                        }}
                      />
                    )}

                    {/* Bento-grid */}
                    {def.specialEditor === 'bento-grid' && (
                      <button
                        onClick={() => setBentoSection({ section, index: i })}
                        className="mt-1 w-full rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-100 transition-colors"
                      >
                        Modifier la grille
                      </button>
                    )}

                    {/* Carousel images — grille + upload inline */}
                    {def.hasCarousel && section.carouselId && section.type !== 'custom-layout' && (
                      <CarouselImageGrid
                        carouselId={section.carouselId}
                        images={carouselImages[section.carouselId]}
                        maxImages={SECTION_TYPES.find(st => st.type === section.type)?.maxImages}
                        onImagesChange={(imgs) => setCarouselImages(prev => ({ ...prev, [section.carouselId!]: imgs }))}
                        onOpenPicker={({ carouselId: cid, replaceIndex }) => {
                          const imgs = carouselImages[cid] || [];
                          openCarouselMediaPicker(cid, replaceIndex, (url, webpUrl) => {
                            if (replaceIndex !== undefined) {
                              const updated = [...imgs];
                              updated[replaceIndex] = { url, webpUrl };
                              setCarouselImages(prev => ({ ...prev, [cid]: updated }));
                            } else {
                              setCarouselImages(prev => ({ ...prev, [cid]: [...imgs, { url, webpUrl }] }));
                            }
                          });
                        }}
                      />
                    )}

                    {/* Custom layout blocks */}
                    {section.type === 'custom-layout' && section.layoutId && layouts[section.layoutId] && (
                      <div className="mt-1">
                        {layouts[section.layoutId].blocks
                          .filter(b => b.type === 'title' || b.type === 'richtext')
                          .map(block => {
                            if (block.type === 'title' || block.type === 'richtext') {
                              const fullKey = ck(section.contentId, `layout-${section.layoutId}-${block.blockId}`);
                              const limit = getCharLimit(fullKey);
                              const val = content[fullKey] || '';
                              const remaining = limit - val.length;
                              return (
                                <div key={block.blockId} className="mb-3">
                                  <div className="flex items-center gap-1 mb-1">
                                    <label className="block text-xs font-medium text-neutral-500">
                                      {block.type === 'title' ? 'Titre' : 'Texte'} ({block.blockId})
                                    </label>
                                    {block.type === 'richtext' && <HtmlInfoButton />}
                                  </div>
                                  {block.type === 'richtext' ? (
                                    <textarea
                                      value={val}
                                      onChange={e => handleFieldChange(fullKey, e.target.value)}
                                      rows={3}
                                      maxLength={limit}
                                      className="w-full rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-800 placeholder-neutral-400 focus:border-neutral-500 focus:outline-none focus:ring-1 focus:ring-neutral-500"
                                    />
                                  ) : (
                                    <input
                                      type="text"
                                      value={val}
                                      onChange={e => handleFieldChange(fullKey, e.target.value)}
                                      maxLength={limit}
                                      className="w-full rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-800 placeholder-neutral-400 focus:border-neutral-500 focus:outline-none focus:ring-1 focus:ring-neutral-500"
                                    />
                                  )}
                                  <div className="text-right mt-0.5">
                                    <span className={`text-[0.65rem] tabular-nums ${remaining <= 0 ? 'text-red-500' : remaining <= 5 ? 'text-amber-500' : 'text-neutral-400'}`}>
                                      {val.length}/{limit}
                                    </span>
                                  </div>
                                </div>
                              );
                            }
                            return null;
                          })}
                      </div>
                    )}

                    {/* Divider editor */}
                    <div className="mt-3 pt-3 border-t border-neutral-200">
                      <p className="mb-2 text-xs font-medium text-neutral-500">Separateur</p>
                      <SidebarDividerEditor
                        divider={section.dividerAfter}
                        onChange={d => handleDividerChange(i, d)}
                      />
                    </div>

                    {/* Empty state */}
                    {def.fields.length === 0 && !def.hasCarousel && !def.specialEditor && section.type !== 'custom-layout' && section.type !== 'stats' && section.type !== 'cinematic-split' && section.type !== 'polaroids' && (
                      <p className="text-xs text-neutral-400">Aucun champ editable</p>
                    )}

                    {/* Bouton supprimer */}
                    <button
                      onClick={() => handleDeleteSection(i)}
                      className="mt-3 w-full rounded-md border border-red-200 bg-red-50 px-3 py-1.5 text-xs text-red-600 hover:bg-red-100 transition-colors"
                    >
                      Supprimer cette section
                    </button>

                    {/* Bouton annuler */}
                    {cancelSnapshot && (
                      <button
                        onClick={() => {
                          // Restaurer content + sections props (pas les images)
                          setContent(cancelSnapshot.content);
                          setLocalSections(cancelSnapshot.sections);
                          // Restaurer le DOM WYSIWYG
                          for (const [key, val] of Object.entries(cancelSnapshot.content)) {
                            const el = document.querySelector(`[data-content-key="${key}"]`);
                            if (el) el.innerHTML = (val || '').replace(/\n/g, '<br>');
                          }
                          // Persister les anciennes sections
                          persistAllSections(pageId, cancelSnapshot.sections);
                          // Re-sauvegarder les anciens contenus
                          for (const [key, val] of Object.entries(cancelSnapshot.content)) {
                            const currentVal = content[key];
                            if (currentVal !== undefined && currentVal !== val) {
                              const bare = key.includes('--') ? key.split('--').slice(1).join('--') : key;
                              if (bare) {
                                fetch('/api/admin/content', {
                                  method: 'POST',
                                  headers: { 'Content-Type': 'application/json' },
                                  body: JSON.stringify({ page: pageId, key, value: val, lang }),
                                }).catch(() => {});
                              }
                            }
                          }
                          triggerFlash(i, 'saved');
                        }}
                        className="mt-3 w-full rounded-md border border-neutral-300 bg-white px-3 py-1.5 text-xs text-neutral-600 hover:bg-neutral-100 transition-colors"
                      >
                        Annuler les modifications
                      </button>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Bottom actions */}
        <div className="border-t border-neutral-200 px-4 py-3 flex flex-col gap-2">
          {addFlash && (
            <div className="rounded-md bg-emerald-50 border border-emerald-200 px-3 py-2 text-xs text-emerald-700">
              Section ajoutée. Rechargez la page pour voir les changements.
            </div>
          )}
          <button
            onClick={() => setSectionPickerOpen(true)}
            className="w-full rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-indigo-700 transition-colors shadow-sm"
          >
            + Ajouter une section
          </button>
          <a
            href="/back"
            className="block text-center text-xs text-neutral-500 hover:text-neutral-700 underline py-1"
          >
            Aller au back-office
          </a>
        </div>
      </div>

      {/* Section picker modal */}
      {sectionPickerOpen && (
        <SectionPickerWrapper
          layouts={layouts}
          onSelect={addSection}
          onClose={() => setSectionPickerOpen(false)}
        />
      )}

      {/* Bento grid modal */}
      {bentoSection && <BentoModal section={bentoSection.section} onClose={() => {
        setBentoSection(null);
        window.location.reload();
      }} />}

      {/* Media picker modal */}
      {mediaPicker && (
        <SidebarMediaPickerWrapper
          carouselId={mediaPicker.carouselId}
          onClose={() => setMediaPicker(null)}
          onFileUpload={async (files) => {
            const file = files[0];
            if (!file) return;
            const formData = new FormData();
            formData.append('image', file);
            try {
              const res = await fetch(`/api/admin/upload/${mediaPicker.carouselId}`, { method: 'POST', body: formData });
              const data = await res.json();
              if (data.url) mediaPicker.onResult(data.url, data.webpUrl);
            } catch { /* ignore */ }
            setMediaPicker(null);
          }}
          onPickFromLibrary={(url) => {
            mediaPicker.onResult(url);
            setMediaPicker(null);
          }}
        />
      )}
    </>
  );
}

// ── HTML Info Button ──

function HtmlInfoButton() {
  const [open, setOpen] = useState(false);
  return (
    <span className="relative inline-block">
      <button
        onClick={() => setOpen(v => !v)}
        className="h-4 w-4 rounded-full bg-neutral-200 text-neutral-500 text-[0.6rem] font-bold leading-none hover:bg-neutral-300 transition-colors flex items-center justify-center"
        title="Tags HTML supportés"
      >i</button>
      {open && (
        <div className="absolute left-5 top-0 z-20 rounded-md bg-neutral-800 text-white text-[0.65rem] px-3 py-2 shadow-lg whitespace-nowrap">
          <p className="font-semibold mb-1">Tags HTML supportés :</p>
          <code>&lt;b&gt; &lt;i&gt; &lt;u&gt; &lt;br&gt; &lt;a href=&quot;...&quot;&gt; &lt;strong&gt; &lt;em&gt;</code>
          <button onClick={() => setOpen(false)} className="block mt-1 text-neutral-400 hover:text-white text-[0.6rem]">Fermer</button>
        </div>
      )}
    </span>
  );
}

// ── Carousel Image Grid (grille + upload inline) ──

function CarouselImageGrid({ carouselId, images, maxImages, gridCols = 4, onImagesChange, onOpenPicker }: {
  carouselId: string;
  images?: CarouselImage[];
  maxImages?: number;
  gridCols?: number;
  onImagesChange: (imgs: CarouselImage[]) => void;
  onOpenPicker: (config: { carouselId: string; replaceIndex?: number }) => void;
}) {
  const canAdd = !maxImages || (images?.length || 0) < maxImages;

  return (
    <div className="mt-2">
      <p className="mb-2 text-xs font-medium text-neutral-500">Images</p>
      {images ? (
        images.length > 0 ? (
          <div className="grid gap-1.5" style={{ gridTemplateColumns: `repeat(${gridCols}, 1fr)` }}>
            {images.map((img, idx) => (
              <button key={idx} onClick={() => onOpenPicker({ carouselId, replaceIndex: idx })} className="relative h-16 overflow-hidden rounded-md border border-neutral-200 bg-neutral-100 cursor-pointer hover:border-neutral-400 transition-colors group/img">
                <img src={img.webpUrl || img.url} alt={img.alt || ''} className="h-full w-full object-cover" />
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/img:opacity-100 transition-opacity flex items-center justify-center">
                  <span className="text-white text-[0.6rem] font-medium">Changer</span>
                </div>
              </button>
            ))}
            {canAdd && (
              <button
                onClick={() => onOpenPicker({ carouselId })}
                className="h-16 rounded-md border border-dashed border-neutral-300 bg-white text-neutral-400 hover:border-neutral-400 hover:text-neutral-600 transition-colors flex items-center justify-center text-lg"
              >
                +
              </button>
            )}
          </div>
        ) : (
          <button
            onClick={() => onOpenPicker({ carouselId })}
            className="w-full h-16 rounded-md border border-dashed border-neutral-300 bg-white text-neutral-400 hover:border-neutral-400 hover:text-neutral-600 transition-colors flex items-center justify-center text-sm"
          >
            + Ajouter une image
          </button>
        )
      ) : (
        <p className="text-xs text-neutral-400">Chargement...</p>
      )}
    </div>
  );
}

// ── Stats Editor ──

function StatsEditor({ items, onChange }: { items: StatItem[]; onChange: (items: StatItem[]) => void }) {
  return (
    <div className="mb-3">
      <p className="mb-2 text-xs font-medium text-neutral-500">Statistiques</p>
      {items.map((item, i) => (
        <div key={i} className="flex gap-1.5 items-center mb-1.5">
          <input
            type="number"
            value={item.count}
            min={0}
            max={9999999}
            onChange={e => {
              const next = [...items];
              next[i] = { ...next[i], count: Math.min(parseInt(e.target.value) || 0, 9999999) };
              onChange(next);
            }}
            className="w-20 rounded-md border border-neutral-300 bg-white px-2 py-1.5 text-sm text-neutral-800 text-center focus:border-neutral-500 focus:outline-none focus:ring-1 focus:ring-neutral-500"
          />
          <input
            type="text"
            value={item.label}
            maxLength={35}
            placeholder="Label"
            onChange={e => {
              const next = [...items];
              next[i] = { ...next[i], label: e.target.value };
              onChange(next);
            }}
            className="flex-1 min-w-0 rounded-md border border-neutral-300 bg-white px-2 py-1.5 text-sm text-neutral-800 focus:border-neutral-500 focus:outline-none focus:ring-1 focus:ring-neutral-500"
          />
          <button
            onClick={() => onChange(items.filter((_, j) => j !== i))}
            className="shrink-0 h-7 w-7 flex items-center justify-center rounded text-red-400 hover:bg-red-50 hover:text-red-600 text-sm"
          >×</button>
        </div>
      ))}
      {items.length < 6 && (
        <button
          onClick={() => onChange([...items, { count: 0, label: '' }])}
          className="text-xs text-emerald-600 hover:text-emerald-700"
        >
          + Ajouter
        </button>
      )}
    </div>
  );
}

// ── Polaroids Props Editor ──

function PolaroidsPropsEditor({ items, onChange, onImagePick }: {
  items: PolaroidItem[];
  onChange: (items: PolaroidItem[]) => void;
  onImagePick: (itemIdx: number) => void;
}) {
  return (
    <div className="mb-3">
      <p className="mb-2 text-xs font-medium text-neutral-500">Polaroids</p>
      {items.map((item, i) => (
        <div key={i} className="flex gap-1.5 items-start mb-2">
          {/* Image thumb */}
          <button onClick={() => onImagePick(i)} className="h-10 w-10 shrink-0 rounded border border-neutral-200 bg-neutral-100 overflow-hidden flex items-center justify-center cursor-pointer hover:border-neutral-400">
            {item.imageUrl ? (
              <img src={item.imageUrl} alt="" className="h-full w-full object-cover" />
            ) : (
              <span className="text-neutral-300 text-lg">+</span>
            )}
          </button>
          <div className="flex-1 min-w-0 flex flex-col gap-1">
            <input
              type="text" value={item.title} maxLength={45} placeholder="Titre"
              onChange={e => { const n = [...items]; n[i] = { ...n[i], title: e.target.value }; onChange(n); }}
              className="w-full rounded border border-neutral-300 bg-white px-2 py-1 text-xs text-neutral-800 focus:border-neutral-500 focus:outline-none"
            />
            <div className="flex gap-1">
              <input
                type="text" value={item.tag} maxLength={15} placeholder="Tag"
                onChange={e => { const n = [...items]; n[i] = { ...n[i], tag: e.target.value }; onChange(n); }}
                className="flex-1 min-w-0 rounded border border-neutral-300 bg-white px-2 py-1 text-xs text-neutral-800 focus:border-neutral-500 focus:outline-none"
              />
              <select
                value={item.tagColor}
                onChange={e => { const n = [...items]; n[i] = { ...n[i], tagColor: e.target.value }; onChange(n); }}
                className="rounded border border-neutral-300 bg-white px-1 py-1 text-xs text-neutral-800"
              >
                {TAG_COLORS.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
          </div>
          <button
            onClick={() => onChange(items.filter((_, j) => j !== i))}
            className="shrink-0 mt-1 text-red-400 hover:text-red-600 text-xs"
          >×</button>
        </div>
      ))}
      {items.length < 12 && (
        <button
          onClick={() => onChange([...items, { title: '', tag: '', tagColor: 'bois' }])}
          className="text-xs text-emerald-600 hover:text-emerald-700"
        >
          + Ajouter
        </button>
      )}
    </div>
  );
}

// ── Sidebar Divider Editor ──

function SidebarDividerEditor({ divider, onChange }: { divider?: DividerConfig; onChange: (d: DividerConfig | undefined) => void }) {
  const currentType = divider?.type || 'none';
  const currentColor = divider?.color || 'var(--primary)';
  const currentFlip = divider?.flip || false;
  const isNone = currentType === 'none';

  return (
    <div className="flex flex-col gap-1.5">
      <select
        value={currentType}
        onChange={e => {
          const t = e.target.value;
          if (t === 'none') onChange(undefined);
          else onChange({ type: t as DividerConfig['type'], color: currentColor, flip: currentFlip });
        }}
        className="w-full rounded-md border border-neutral-300 bg-white px-2 py-1.5 text-xs text-neutral-800"
      >
        {DIVIDER_TYPES.map(dt => (
          <option key={dt} value={dt}>{dt === 'none' ? 'Aucun' : dt}</option>
        ))}
      </select>
      {!isNone && (
        <>
          <div className="flex gap-1.5 items-center">
            <select
              value={currentColor}
              onChange={e => onChange({ type: currentType as DividerConfig['type'], color: e.target.value, flip: currentFlip })}
              className="flex-1 rounded-md border border-neutral-300 bg-white px-2 py-1.5 text-xs text-neutral-800"
            >
              {DIVIDER_COLORS.map(c => (
                <option key={c.value} value={c.value}>{c.value.includes('--') ? c.value.replace(/var\(--/, '').replace(/\)/, '') : c.value}</option>
              ))}
            </select>
            <label className="flex items-center gap-1 text-xs text-neutral-600 cursor-pointer whitespace-nowrap">
              <input
                type="checkbox"
                checked={currentFlip}
                onChange={e => onChange({ type: currentType as DividerConfig['type'], color: currentColor, flip: e.target.checked })}
                className="w-3.5 h-3.5"
              />
              Inverser
            </label>
          </div>
          <div
            className="w-full h-5 rounded overflow-hidden bg-neutral-100 border border-neutral-200"
            style={{ color: currentColor }}
            dangerouslySetInnerHTML={{ __html: getDividerPreviewSvg(currentType, currentFlip) }}
          />
        </>
      )}
    </div>
  );
}

// ── Section Picker Wrapper (lazy-loaded) ──

function SectionPickerWrapper({ layouts, onSelect, onClose }: {
  layouts: Record<string, Layout>;
  onSelect: (type: string, layoutId?: string, label?: string) => void;
  onClose: () => void;
}) {
  const [SectionPickerModal, setSectionPickerModal] = useState<React.ComponentType<{
    layouts: Layout[];
    onSelect: (type: string, layoutId?: string, label?: string) => void;
    onClose: () => void;
  }> | null>(null);
  const [I18nProvider, setI18nProvider] = useState<React.ComponentType<{
    locale: Record<string, unknown>;
    children: React.ReactNode;
  }> | null>(null);
  const [locale, setLocale] = useState<Record<string, unknown> | null>(null);

  useEffect(() => {
    Promise.all([
      import('@/components/admin/sections/PagesSection/components/SectionPickerModal'),
      import('@/lib/i18n/context'),
      fetch('/api/site').then(r => r.json()),
    ]).then(([pickerMod, i18nMod, site]) => {
      setSectionPickerModal(() => pickerMod.SectionPickerModal);
      setI18nProvider(() => i18nMod.I18nProvider);
      const lang = site.languages?.default || 'fr';
      import(`@/locales/${lang}.json`).then(m => setLocale(m.default || m));
    });
  }, []);

  // Inject --bo-* CSS variables for site context
  useEffect(() => {
    const root = document.documentElement;
    const vars: Record<string, string> = {
      '--bo-bg': '#ffffff', '--bo-surface': '#f5f5f5', '--bo-card': '#ffffff',
      '--bo-border': 'rgba(0,0,0,0.12)', '--bo-border-hover': 'rgba(0,0,0,0.25)',
      '--bo-text': '#1a1a1a', '--bo-text-dim': '#6b7280',
      '--bo-accent': '#6366f1', '--bo-green': '#059669',
    };
    for (const [k, v] of Object.entries(vars)) root.style.setProperty(k, v);
    return () => { for (const k of Object.keys(vars)) root.style.removeProperty(k); };
  }, []);

  if (!SectionPickerModal || !I18nProvider || !locale) {
    return createPortal(
      <div className="fixed inset-0 z-[10001] flex items-center justify-center bg-black/50">
        <div className="rounded-lg bg-white px-6 py-4 text-sm text-neutral-600">Chargement...</div>
      </div>,
      document.body,
    );
  }

  const layoutsList = Object.values(layouts);

  return createPortal(
    <I18nProvider locale={locale}>
      <SectionPickerModal layouts={layoutsList} onSelect={onSelect} onClose={onClose} />
    </I18nProvider>,
    document.body,
  );
}

// ── Bento Modal ──

function BentoModal({ section, onClose }: { section: Section; onClose: () => void }) {
  const [BentoGridEditor, setBentoGridEditor] = useState<React.ComponentType<{
    section: Section;
    onUpdate: (updates: Partial<Section>) => void;
    onSave?: () => void;
  }> | null>(null);
  const [locale, setLocale] = useState<Record<string, unknown> | null>(null);

  useEffect(() => {
    Promise.all([
      import('@/components/admin/sections/PagesSection/components/BentoGridEditor'),
      fetch('/api/site').then(r => r.json()),
      import('@/lib/i18n/context'),
    ]).then(([bentoMod, site]) => {
      setBentoGridEditor(() => bentoMod.BentoGridEditor);
      const lang = site.languages?.default || 'fr';
      import(`@/locales/${lang}.json`).then(m => setLocale(m.default || m));
    });
  }, []);

  if (!BentoGridEditor || !locale) {
    return createPortal(
      <div className="fixed inset-0 z-[10001] flex items-center justify-center bg-black/50">
        <div className="rounded-lg bg-white px-6 py-4 text-sm text-neutral-600">Chargement...</div>
      </div>,
      document.body,
    );
  }

  return createPortal(
    <BentoModalInner section={section} onClose={onClose} Editor={BentoGridEditor} locale={locale} />,
    document.body,
  );
}

function BentoModalInner({ section, onClose, Editor, locale }: {
  section: Section;
  onClose: () => void;
  Editor: React.ComponentType<{ section: Section; onUpdate: (updates: Partial<Section>) => void; onSave?: () => void }>;
  locale: Record<string, unknown>;
}) {
  const [I18nProvider, setI18nProvider] = useState<React.ComponentType<{ locale: Record<string, unknown>; children: React.ReactNode }> | null>(null);
  const [editedSection, setEditedSection] = useState(section);
  const [saveFlash, setSaveFlash] = useState<'idle' | 'saved' | 'error'>('idle');
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const latestSectionRef = useRef(editedSection);

  useEffect(() => {
    import('@/lib/i18n/context').then(mod => setI18nProvider(() => mod.I18nProvider));
  }, []);

  // Injecter --bo-* CSS variables pour le mode light
  useEffect(() => {
    const root = document.documentElement;
    const vars: Record<string, string> = {
      '--bo-bg': '#ffffff', '--bo-surface': '#f5f5f5', '--bo-card': '#ffffff',
      '--bo-border': 'rgba(0,0,0,0.12)', '--bo-border-hover': 'rgba(0,0,0,0.25)',
      '--bo-text': '#1a1a1a', '--bo-text-dim': '#6b7280',
      '--bo-accent': '#6366f1', '--bo-green': '#059669',
    };
    for (const [k, v] of Object.entries(vars)) root.style.setProperty(k, v);
    return () => { for (const k of Object.keys(vars)) root.style.removeProperty(k); };
  }, []);

  useEffect(() => { latestSectionRef.current = editedSection; }, [editedSection]);

  const persistToApi = useCallback(async (sectionToSave: Section) => {
    try {
      const res = await fetch('/api/pages');
      const config = await res.json();
      for (const page of config.pages || []) {
        const idx = page.sections.findIndex((s: Section) => s.contentId === section.contentId);
        if (idx !== -1) { page.sections[idx] = sectionToSave; break; }
      }
      const r = await fetch('/api/admin/pages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pages: config.pages }),
      });
      if (!r.ok) throw new Error();
      setSaveFlash('saved');
      setTimeout(() => setSaveFlash('idle'), 2000);
    } catch {
      setSaveFlash('error');
      setTimeout(() => setSaveFlash('idle'), 2000);
    }
  }, [section.contentId]);

  const handleUpdate = useCallback((updates: Partial<Section>) => {
    setEditedSection(prev => {
      const next = { ...prev, ...updates };
      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => persistToApi(next), 800);
      return next;
    });
  }, [persistToApi]);

  // Save + close (bouton vert "Enregistrer")
  const handleSaveAndClose = useCallback(async () => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    await persistToApi(latestSectionRef.current);
    onClose();
  }, [persistToApi, onClose]);

  // Save only (text overlay validation — ne ferme PAS le modal)
  const handleSaveOnly = useCallback(async () => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    await persistToApi(latestSectionRef.current);
  }, [persistToApi]);

  useEffect(() => { return () => { if (debounceRef.current) clearTimeout(debounceRef.current); }; }, []);

  if (!I18nProvider) return null;

  return (
    <div className="fixed inset-0 z-[10001] flex items-center justify-center bg-black/50" onClick={onClose}>
      <div className="relative max-h-[90vh] w-[90vw] max-w-5xl overflow-y-auto rounded-xl bg-white shadow-2xl" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between border-b border-neutral-200 px-6 py-4">
          <h3 className="text-base font-semibold text-neutral-900">Bento Grid</h3>
          <div className="flex items-center gap-3">
            {saveFlash === 'saved' && <span className="text-xs font-medium text-emerald-600">Enregistre</span>}
            {saveFlash === 'error' && <span className="text-xs font-medium text-red-600">Erreur</span>}
            <button onClick={handleSaveAndClose} className="rounded-md bg-emerald-600 px-4 py-1.5 text-sm font-medium text-white hover:bg-emerald-700">
              Enregistrer
            </button>
            <button onClick={onClose} className="flex h-8 w-8 items-center justify-center rounded-md text-neutral-500 hover:bg-neutral-100">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
            </button>
          </div>
        </div>
        <div className="p-6">
          <I18nProvider locale={locale}>
            <Editor section={editedSection} onUpdate={handleUpdate} onSave={handleSaveOnly} />
          </I18nProvider>
        </div>
      </div>
    </div>
  );
}

// ── Sidebar Media Picker Wrapper (lazy-loads MediaSourcePicker + I18nProvider) ──

function SidebarMediaPickerWrapper({ carouselId, onClose, onFileUpload, onPickFromLibrary }: {
  carouselId: string;
  onClose: () => void;
  onFileUpload: (files: FileList) => void;
  onPickFromLibrary: (url: string) => void;
}) {
  const [MediaSourcePicker, setMediaSourcePicker] = useState<React.ComponentType<{
    carouselId: string;
    isOpen: boolean;
    onClose: () => void;
    onFileUpload: (files: FileList) => void;
    onSuccess: () => void;
    onPickFromLibrary?: (url: string) => void;
  }> | null>(null);
  const [I18nProvider, setI18nProvider] = useState<React.ComponentType<{
    locale: Record<string, unknown>;
    children: React.ReactNode;
  }> | null>(null);
  const [locale, setLocale] = useState<Record<string, unknown> | null>(null);

  useEffect(() => {
    Promise.all([
      import('@/components/admin/shared/MediaSourcePicker'),
      import('@/lib/i18n/context'),
      fetch('/api/site').then(r => r.json()),
    ]).then(([pickerMod, i18nMod, site]) => {
      setMediaSourcePicker(() => pickerMod.MediaSourcePicker);
      setI18nProvider(() => i18nMod.I18nProvider);
      const lang = site.languages?.default || 'fr';
      import(`@/locales/${lang}.json`).then(m => setLocale(m.default || m));
    });
  }, []);

  // Inject --bo-* CSS variables
  useEffect(() => {
    const root = document.documentElement;
    const vars: Record<string, string> = {
      '--bo-bg': '#ffffff', '--bo-surface': '#f5f5f5', '--bo-card': '#ffffff',
      '--bo-border': 'rgba(0,0,0,0.12)', '--bo-border-hover': 'rgba(0,0,0,0.25)',
      '--bo-text': '#1a1a1a', '--bo-text-dim': '#6b7280',
      '--bo-accent': '#6366f1', '--bo-green': '#059669',
    };
    for (const [k, v] of Object.entries(vars)) root.style.setProperty(k, v);
    return () => { for (const k of Object.keys(vars)) root.style.removeProperty(k); };
  }, []);

  if (!MediaSourcePicker || !I18nProvider || !locale) return null;

  return (
    <I18nProvider locale={locale}>
      <MediaSourcePicker
        carouselId={carouselId}
        isOpen={true}
        onClose={onClose}
        onFileUpload={onFileUpload}
        onSuccess={onClose}
        onPickFromLibrary={onPickFromLibrary}
      />
    </I18nProvider>
  );
}
