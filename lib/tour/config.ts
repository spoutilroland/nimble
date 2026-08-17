/** Configuration du parcours guidé et des tips rappels */

export interface TourStep {
  id: string;
  /** Sélecteur CSS de l'élément cible (null = toast centré sans pointeur) */
  target: string | null;
  title: string;
  body: string;
  /** Position préférée de la bulle par rapport à l'élément */
  preferredPosition?: 'top' | 'bottom' | 'left' | 'right';
}

export interface TourTip {
  id: string;
  text: string;
}

type TourTexts = {
  steps: Pick<TourStep, 'title' | 'body'>[];
  tips: Pick<TourTip, 'text'>[];
  next: string;
  done: string;
  skip: string;
  close: string;
};

const TOUR_TEXTS: Record<string, TourTexts> = {
  fr: {
    steps: [
      { title: 'Bienvenue sur Nimble !', body: 'Découvrez les principales fonctionnalités du back-office en quelques étapes.' },
      { title: 'Navigation', body: 'Naviguez entre les sections : Design, Contenu, Média, Identité, Configuration...' },
      { title: 'Design & Thèmes', body: 'Changez l\'apparence du site en un clic : couleurs, typo, bordures.' },
      { title: 'Contenu & Pages', body: 'Gérez vos pages et leurs sections. Ajoutez, réorganisez, supprimez.' },
      { title: 'Médiathèque', body: 'Votre bibliothèque d\'images. Glissez-déposez entre dossiers.' },
      { title: 'Voir le site', body: 'Vos modifications sont visibles en temps réel. Double-cliquez sur n\'importe quel texte du site pour le modifier directement.' },
    ],
    tips: [
      { text: 'Astuce : glissez une image de la médiathèque directement dans un dossier.' },
      { text: 'Astuce : vous pouvez créer jusqu\'à 5 thèmes personnalisés.' },
      { text: 'Astuce : cliquez sur une image pour modifier son alt text et ses tags.' },
      { text: 'Astuce : sur le site, la sidebar latérale permet d\'ajouter/supprimer des sections.' },
      { text: 'Astuce : le bouton Reset remet toute la demo à l\'état initial.' },
    ],
    next: 'Suivant',
    done: 'C\'est parti !',
    skip: 'Passer',
    close: 'fermer',
  },
  en: {
    steps: [
      { title: 'Welcome to Nimble!', body: 'Discover the main back-office features in a few steps.' },
      { title: 'Navigation', body: 'Browse sections: Design, Content, Media, Identity, Configuration...' },
      { title: 'Design & Themes', body: 'Change the site appearance in one click: colors, typography, borders.' },
      { title: 'Content & Pages', body: 'Manage your pages and their sections. Add, reorder, delete.' },
      { title: 'Media Library', body: 'Your image library. Drag and drop between folders.' },
      { title: 'View site', body: 'Your changes are visible in real time. Double-click any text on the site to edit it directly.' },
    ],
    tips: [
      { text: 'Tip: drag an image from the media library directly into a folder.' },
      { text: 'Tip: you can create up to 5 custom themes.' },
      { text: 'Tip: click an image to edit its alt text and tags.' },
      { text: 'Tip: on the site, the side panel lets you add/remove sections.' },
      { text: 'Tip: the Reset button restores the demo to its initial state.' },
    ],
    next: 'Next',
    done: 'Let\'s go!',
    skip: 'Skip',
    close: 'close',
  },
};

const STEP_DEFS: Omit<TourStep, 'title' | 'body'>[] = [
  { id: 'welcome', target: null },
  { id: 'tabs', target: '#main-tabs', preferredPosition: 'bottom' },
  { id: 'design', target: '#main-tabs .main-tab:first-child', preferredPosition: 'bottom' },
  { id: 'content', target: '#main-tabs .main-tab:nth-child(2)', preferredPosition: 'bottom' },
  { id: 'media', target: '#main-tabs .main-tab:nth-child(3)', preferredPosition: 'bottom' },
  { id: 'view-site', target: 'a[target="_blank"][rel="noopener noreferrer"]', preferredPosition: 'bottom' },
];

const TIP_IDS = ['tip-drag-folder', 'tip-themes', 'tip-alt-text', 'tip-sidebar', 'tip-reset'];

/** Détecte la langue depuis le cookie côté client */
export function detectClientLang(): string {
  if (typeof document === 'undefined') return 'fr';
  const match = document.cookie.match(/(?:^|;\s*)lang=(\w+)/);
  if (match) return match[1];
  return document.documentElement.lang || 'fr';
}

function getTexts(lang?: string): TourTexts {
  const l = lang || detectClientLang();
  return TOUR_TEXTS[l] || TOUR_TEXTS.fr;
}

export function getTourSteps(lang?: string): TourStep[] {
  const texts = getTexts(lang);
  return STEP_DEFS.map((def, i) => ({
    ...def,
    title: texts.steps[i].title,
    body: texts.steps[i].body,
  }));
}

export function getTourTips(lang?: string): TourTip[] {
  const texts = getTexts(lang);
  return TIP_IDS.map((id, i) => ({
    id,
    text: texts.tips[i].text,
  }));
}

export function getTourUi(lang?: string) {
  const texts = getTexts(lang);
  return { next: texts.next, done: texts.done, skip: texts.skip, close: texts.close };
}

// Compat : exports existants (utilise la détection auto)
export const TOUR_STEPS: TourStep[] = getTourSteps();
export const TOUR_TIPS: TourTip[] = getTourTips();

const COOKIE_NAME = 'nimble-tour-done';

export function isTourDone(): boolean {
  if (typeof document === 'undefined') return false;
  return document.cookie.includes(`${COOKIE_NAME}=1`);
}

export function markTourDone() {
  document.cookie = `${COOKIE_NAME}=1; path=/; max-age=${365 * 24 * 3600}; SameSite=Lax`;
}

export function resetTourCookie() {
  document.cookie = `${COOKIE_NAME}=; path=/; max-age=0`;
}

export function getRandomTip(lang?: string): TourTip {
  const tips = getTourTips(lang);
  return tips[Math.floor(Math.random() * tips.length)];
}
