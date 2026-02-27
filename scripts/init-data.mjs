/**
 * Initialise data/ si les fichiers n'existent pas encore.
 * Exécuté automatiquement avant chaque build (prebuild).
 *
 * Ces fichiers ne sont JAMAIS écrasés s'ils existent déjà.
 */

import { existsSync, mkdirSync, writeFileSync, readFileSync } from 'fs';
import { resolve } from 'path';
import bcrypt from 'bcryptjs';

const dataDir = resolve('data');

const write = (file, data) => {
  const filePath = resolve(dataDir, file);
  if (!existsSync(filePath)) {
    writeFileSync(filePath, JSON.stringify(data, null, 2));
    console.log(`[init-data] ${file} créé`);
  }
};

// Créer data/ si nécessaire
if (!existsSync(dataDir)) {
  mkdirSync(dataDir, { recursive: true });
  console.log('[init-data] data/ créé');
}

// ── setup.json ──────────────────────────────────────────────────
const setupFile = resolve(dataDir, 'setup.json');
if (!existsSync(setupFile)) {
  writeFileSync(setupFile, JSON.stringify({ setupDone: true, adminSlug: 'back' }, null, 2));
  console.log('[init-data] setup.json créé — back office : /back');
} else {
  const setup = JSON.parse(readFileSync(setupFile, 'utf8'));
  if (setup.adminSlug && setup.adminSlug !== 'back') {
    setup.adminSlug = 'back';
    writeFileSync(setupFile, JSON.stringify(setup, null, 2));
    console.log('[init-data] setup.json migré — adminSlug forcé à /back');
  }
}

// ── admin.json ───────────────────────────────────────────────────
const adminFile = resolve(dataDir, 'admin.json');
if (!existsSync(adminFile)) {
  const passwordHash = bcrypt.hashSync('changeme123', 10);
  writeFileSync(adminFile, JSON.stringify({ passwordHash }, null, 2));
  console.log('[init-data] admin.json créé — mot de passe par défaut : changeme123');
  console.log('[init-data] ⚠  Changez le mot de passe depuis le back-office après connexion !');
}

// ── theme.json ───────────────────────────────────────────────────
write('theme.json', {
  theme: 'alpine',
  customThemes: {}
});

// ── site.json ────────────────────────────────────────────────────
write('site.json', {
  business: {
    name: 'Mon Entreprise',
    tagline: '',
    description: 'Description de votre activité',
    phone: '',
    email: '',
    address: '',
    hours: { weekdays: '', saturday: '', note: '' },
    legal: { siret: '', certifications: '', copyright: `${new Date().getFullYear()} Mon Entreprise` }
  },
  seo: {
    defaultTitle: 'Mon Entreprise',
    defaultDescription: 'Description de votre activité',
    ogImage: null
  },
  fonts: {
    heading: 'Oswald',
    body: 'Raleway',
    googleFontsUrl: 'https://fonts.googleapis.com/css2?family=Oswald:wght@400;600;700&family=Raleway:wght@300;400;500;600;700&display=swap'
  },
  captcha: { provider: '', siteKey: '' },
  design: { borderStyle: 'angular' },
  logoMode: 'logo-name',
  logoPosition: 'left',
  languages: { available: ['fr'], default: 'fr' },
  social: {},
  footer: {
    cols: 3,
    blocks: [
      { blockId: 'f1', type: 'logo-desc', row: 1, col: 1, colSpan: 1 },
      { blockId: 'f2', type: 'contact',   row: 1, col: 2, colSpan: 1 },
      { blockId: 'f3', type: 'hours',     row: 1, col: 3, colSpan: 1 },
      { blockId: 'f4', type: 'legal',     row: 2, col: 1, colSpan: 3 }
    ]
  }
});

// ── pages.json ───────────────────────────────────────────────────
write('pages.json', {
  pages: [
    {
      id: 'home',
      slug: '/',
      title: 'Accueil',
      showInNav: true,
      navOrder: 0,
      seo: { title: '', description: '', ogImage: null },
      sections: [
        { type: 'hero', carouselId: 'hero' },
        { type: 'about' },
        { type: 'services', carouselId: '' },
        { type: 'contact' }
      ]
    }
  ]
});

// ── content.json ─────────────────────────────────────────────────
write('content.json', {
  fr: {
    index: {
      'hero-title': 'Votre partenaire de confiance',
      'about-title': 'Notre Expertise',
      'about-p1': 'Décrivez ici votre activité, votre histoire et ce qui vous distingue.',
      'contact-title': 'Contactez-nous'
    }
  }
});

// ── carousels.json ───────────────────────────────────────────────
write('carousels.json', {
  carousels: {
    hero: { id: 'hero', title: 'Accueil — Hero', maxImages: 5, images: [] }
  }
});

// ── layouts.json ─────────────────────────────────────────────────
write('layouts.json', { layouts: {} });

// ── media.json ───────────────────────────────────────────────────
write('media.json', { media: {} });

console.log('[init-data] ✓ Initialisation terminée');
