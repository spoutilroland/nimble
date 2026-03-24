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

export const TOUR_STEPS: TourStep[] = [
  {
    id: 'welcome',
    target: null,
    title: 'Bienvenue sur Nimble !',
    body: 'Découvrez les principales fonctionnalités du back-office en quelques étapes.',
  },
  {
    id: 'tabs',
    target: '#main-tabs',
    title: 'Navigation',
    body: 'Naviguez entre les sections : Design, Contenu, Média, Identité, Configuration...',
    preferredPosition: 'bottom',
  },
  {
    id: 'design',
    target: '#main-tabs .main-tab:first-child',
    title: 'Design & Thèmes',
    body: 'Changez l\'apparence du site en un clic : couleurs, typo, bordures.',
    preferredPosition: 'bottom',
  },
  {
    id: 'content',
    target: '#main-tabs .main-tab:nth-child(2)',
    title: 'Contenu & Pages',
    body: 'Gérez vos pages et leurs sections. Ajoutez, réorganisez, supprimez.',
    preferredPosition: 'bottom',
  },
  {
    id: 'media',
    target: '#main-tabs .main-tab:nth-child(3)',
    title: 'Médiathèque',
    body: 'Votre bibliothèque d\'images. Glissez-déposez entre dossiers.',
    preferredPosition: 'bottom',
  },
  {
    id: 'view-site',
    target: 'a[target="_blank"][rel="noopener noreferrer"]',
    title: 'Voir le site',
    body: 'Vos modifications sont visibles en temps réel. Double-cliquez sur n\'importe quel texte du site pour le modifier directement.',
    preferredPosition: 'bottom',
  },
];

export const TOUR_TIPS: TourTip[] = [
  { id: 'tip-drag-folder', text: 'Astuce : glissez une image de la médiathèque directement dans un dossier.' },
  { id: 'tip-themes', text: 'Astuce : vous pouvez créer jusqu\'à 5 thèmes personnalisés.' },
  { id: 'tip-alt-text', text: 'Astuce : cliquez sur une image pour modifier son alt text et ses tags.' },
  { id: 'tip-sidebar', text: 'Astuce : sur le site, la sidebar latérale permet d\'ajouter/supprimer des sections.' },
  { id: 'tip-reset', text: 'Astuce : le bouton Reset remet toute la demo à l\'état initial.' },
];

const COOKIE_NAME = 'nimble-tour-done';

export function isTourDone(): boolean {
  if (typeof document === 'undefined') return false;
  return document.cookie.includes(`${COOKIE_NAME}=1`);
}

export function markTourDone() {
  // Cookie valide 365 jours
  document.cookie = `${COOKIE_NAME}=1; path=/; max-age=${365 * 24 * 3600}; SameSite=Lax`;
}

export function resetTourCookie() {
  document.cookie = `${COOKIE_NAME}=; path=/; max-age=0`;
}

export function getRandomTip(): TourTip {
  return TOUR_TIPS[Math.floor(Math.random() * TOUR_TIPS.length)];
}
