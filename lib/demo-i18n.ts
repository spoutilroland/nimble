import { readFileSync, existsSync } from 'fs';
import { join } from 'path';
import type { Section } from '@/lib/types';
import { getDataDir } from '@/lib/paths';

const FILE_PATH = join(getDataDir(), 'demo-i18n.json');

interface DemoI18n {
  pages: Record<string, Record<string, string>>;
  stats: Record<string, { count: number; label: string }[]>;
  bento: Record<string, Record<string, { title: string; body: string }>>;
  contact: Record<string, Record<string, string>>;
}

let cached: DemoI18n | null = null;

function load(): DemoI18n | null {
  if (cached) return cached;
  if (!existsSync(FILE_PATH)) return null;
  try {
    cached = JSON.parse(readFileSync(FILE_PATH, 'utf-8'));
    return cached;
  } catch {
    return null;
  }
}

/** Traduit le titre d'une page (ex: "Accueil" → "Home") */
export function translatePageTitle(pageId: string, lang: string, fallback: string): string {
  const data = load();
  if (!data) return fallback;
  return data.pages[pageId]?.[lang] ?? fallback;
}

/** Traduit les props d'une section (stats labels, bento overlays) */
export function translateSectionProps(section: Section, lang: string): Section {
  const data = load();
  if (!data || lang === 'fr') return section;

  if (section.type === 'stats' && data.stats[lang]) {
    const translated = data.stats[lang];
    const items = section.props?.items as { count: number; label: string }[] | undefined;
    if (items) {
      return {
        ...section,
        props: {
          ...section.props,
          items: items.map((item, i) => translated[i] ?? item),
        },
      };
    }
  }

  if (section.type === 'bento-grid' && data.bento[lang]) {
    const translated = data.bento[lang];
    const cells = section.props?.cells as Array<{
      id: string;
      col: number; row: number; colSpan: number; rowSpan: number;
      content?: { imageUrl?: string; overlay?: { position: string; textAlign: string; title: string; body: string } };
    }> | undefined;
    if (cells) {
      return {
        ...section,
        props: {
          ...section.props,
          cells: cells.map((cell) => {
            const t = translated[cell.id];
            if (!t || !cell.content?.overlay) return cell;
            return {
              ...cell,
              content: {
                ...cell.content,
                overlay: { ...cell.content.overlay, title: t.title, body: t.body },
              },
            };
          }),
        },
      };
    }
  }

  return section;
}

/** Récupère les textes du formulaire contact */
export function getContactTexts(lang: string): Record<string, string> {
  const data = load();
  const defaults: Record<string, string> = {
    nameLabel: 'Nom', namePlaceholder: 'Votre nom',
    emailLabel: 'Email', emailPlaceholder: 'Votre email',
    phonePlaceholder: 'Votre telephone', locationPlaceholder: 'Votre ville',
    messageLabel: 'Message', messagePlaceholder: 'Decrivez votre projet...',
    submit: 'Envoyer la demande', sending: 'Envoi en cours...',
    success: 'Votre demande a bien été envoyée ! Nous vous répondrons rapidement.',
    error: "Erreur lors de l'envoi",
    captchaError: 'Veuillez valider le captcha.',
  };
  if (!data || !data.contact[lang]) return defaults;
  return { ...defaults, ...data.contact[lang] };
}
