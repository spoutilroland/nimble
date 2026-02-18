const express = require('express');
const helmet = require('helmet');
const cookieParser = require('cookie-parser');
const multer = require('multer');
const nodemailer = require('nodemailer');
const path = require('path');
const fs = require('fs').promises;
const fsSync = require('fs');
const rateLimit = require('express-rate-limit');
const bcrypt = require('bcryptjs');
const sharp = require('sharp');
const config = require('./config');
const auth = require('./middleware/auth');
const undoManager = require('./undo-manager');

const app = express();

// Moteur de vues EJS
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// ============ HELPERS DONNÉES JSON ============

const siteFile      = path.join(__dirname, 'data', 'site.json');
const pagesFile     = path.join(__dirname, 'data', 'pages.json');
const layoutsFile   = path.join(__dirname, 'data', 'layouts.json');
const adminFile     = path.join(__dirname, 'data', 'admin.json');
const mediaFile     = path.join(__dirname, 'data', 'media.json');
const carouselsFile = path.join(__dirname, 'data', 'carousels.json');

function readSiteConfig() {
  try {
    return JSON.parse(fsSync.readFileSync(siteFile, 'utf8'));
  } catch {
    return { business: { name: 'Mon Site' }, seo: {}, fonts: {}, captcha: {} };
  }
}

function readPagesConfig() {
  try {
    return JSON.parse(fsSync.readFileSync(pagesFile, 'utf8'));
  } catch {
    return { pages: [] };
  }
}

function readLayoutsConfig() {
  try {
    return JSON.parse(fsSync.readFileSync(layoutsFile, 'utf8'));
  } catch {
    return { layouts: {} };
  }
}

async function writeLayoutsConfig(data) {
  await fs.writeFile(layoutsFile, JSON.stringify(data, null, 2));
}

function readMediaRegistry() {
  try {
    return JSON.parse(fsSync.readFileSync(mediaFile, 'utf8'));
  } catch {
    return { media: {} };
  }
}

async function writeMediaRegistry(data) {
  await fs.writeFile(mediaFile, JSON.stringify(data, null, 2));
}

function writeMediaRegistrySync(data) {
  fsSync.writeFileSync(mediaFile, JSON.stringify(data, null, 2));
}

function readCarouselsConfig() {
  try {
    return JSON.parse(fsSync.readFileSync(carouselsFile, 'utf8'));
  } catch {
    return { carousels: {} };
  }
}

async function writeCarouselsConfig(data) {
  await fs.writeFile(carouselsFile, JSON.stringify(data, null, 2));
}

function writeCarouselsConfigSync(data) {
  fsSync.writeFileSync(carouselsFile, JSON.stringify(data, null, 2));
}

function generateMediaId() {
  return 'm_' + Date.now() + '_' + Math.round(Math.random() * 1e9);
}

function getMediaUrls(mediaEntry) {
  return {
    filename: mediaEntry.filename,
    url: '/uploads/media/' + mediaEntry.filename,
    webpUrl: mediaEntry.hasWebp ? '/uploads/media/' + mediaEntry.filename.replace(/\.(jpg|jpeg|png)$/i, '') + '.webp' : null,
  };
}

// ============ MIGRATION : ancien format carousel → media.json + carousels.json ============

(function migrateToMediaRegistry() {
  const heroDir = path.join(config.upload.uploadDir, 'hero');
  const hasOldFormat = fsSync.existsSync(heroDir);
  const hasNewFormat = fsSync.existsSync(mediaFile);

  // Migration uniquement si ancien format détecté ET nouveau pas encore créé
  if (!hasOldFormat || hasNewFormat) return;

  console.log('🔄 Migration uploads vers media.json + carousels.json...');

  const mediaData = { media: {} };
  const carouselsData = { carousels: {} };

  // Créer le dossier uploads/media/
  const mediaDir = path.join(config.upload.uploadDir, 'media');
  if (!fsSync.existsSync(mediaDir)) fsSync.mkdirSync(mediaDir, { recursive: true });

  // Collecter tous les carousels (config.js + pages.json dynamiques)
  const pagesData = readPagesConfig();
  const dynamicIds = extractCarouselIds(pagesData);
  const allCarousels = {};

  // Carousels de config.js (rétro-compatibilité migration)
  for (const [key, c] of Object.entries(config.carousels || {})) {
    allCarousels[key] = { id: c.id, title: c.title, maxImages: c.maxImages, folder: c.folder };
  }

  // Carousels dynamiques (pages.json)
  for (const id of dynamicIds) {
    if (!allCarousels[id]) {
      allCarousels[id] = { id, title: id, maxImages: 20, folder: id };
    }
  }

  for (const [carouselId, carousel] of Object.entries(allCarousels)) {
    const folderPath = path.join(config.upload.uploadDir, carousel.folder);
    if (!fsSync.existsSync(folderPath)) continue;

    let files;
    try {
      files = fsSync.readdirSync(folderPath);
    } catch { continue; }

    // Lire l'ordre existant
    let order = [];
    try {
      order = JSON.parse(fsSync.readFileSync(path.join(folderPath, 'order.json'), 'utf8'));
    } catch {}

    // Fichiers source (exclure order.json et .webp compagnons)
    const allFileSet = new Set(files);
    const sourceFiles = files.filter(f => {
      if (f === 'order.json') return false;
      if (/\.(jpg|jpeg|png)$/i.test(f)) return true;
      if (/\.webp$/i.test(f)) {
        const base = f.replace(/\.webp$/i, '');
        return !allFileSet.has(base + '.jpg') && !allFileSet.has(base + '.jpeg') && !allFileSet.has(base + '.png');
      }
      return false;
    });

    // Trier selon order.json
    const orderedSources = [
      ...order.filter(f => sourceFiles.includes(f)),
      ...sourceFiles.filter(f => !order.includes(f)),
    ];

    const imageRefs = [];

    for (const file of orderedSources) {
      const mediaId = generateMediaId();
      const ext = path.extname(file);
      const newFilename = mediaId.replace(/^m_/, '') + ext;
      const srcPath = path.join(folderPath, file);
      const destPath = path.join(mediaDir, newFilename);

      // Copier le fichier source
      try {
        fsSync.copyFileSync(srcPath, destPath);
      } catch (err) {
        console.warn(`  ⚠️ Impossible de copier ${file}: ${err.message}`);
        continue;
      }

      // Copier le .webp compagnon s'il existe
      let hasWebp = false;
      const webpName = file.replace(/\.(jpg|jpeg|png)$/i, '') + '.webp';
      const webpSrc = path.join(folderPath, webpName);
      if (/\.(jpg|jpeg|png)$/i.test(file) && fsSync.existsSync(webpSrc)) {
        const newWebpName = newFilename.replace(/\.(jpg|jpeg|png)$/i, '') + '.webp';
        try {
          fsSync.copyFileSync(webpSrc, path.join(mediaDir, newWebpName));
          hasWebp = true;
        } catch {}
      }

      // Créer l'entrée media
      mediaData.media[mediaId] = {
        id: mediaId,
        filename: newFilename,
        originalName: file,
        mimeType: ext === '.png' ? 'image/png' : ext === '.webp' ? 'image/webp' : 'image/jpeg',
        hasWebp,
        uploadedAt: new Date().toISOString(),
      };

      imageRefs.push(mediaId);
    }

    // Créer l'entrée carousel
    carouselsData.carousels[carouselId] = {
      id: carouselId,
      title: carousel.title,
      maxImages: carousel.maxImages,
      images: imageRefs,
    };

    console.log(`  ✅ ${carouselId}: ${imageRefs.length} image(s) migrée(s)`);
  }

  // Écrire les fichiers
  writeMediaRegistrySync(mediaData);
  writeCarouselsConfigSync(carouselsData);

  const totalMedia = Object.keys(mediaData.media).length;
  const totalCarousels = Object.keys(carouselsData.carousels).length;
  console.log(`✅ Migration terminée: ${totalMedia} media, ${totalCarousels} carousels`);
})();

// Nettoyage des anciens dossiers carousel (après migration réussie)
(function cleanOldCarouselFolders() {
  if (!fsSync.existsSync(mediaFile)) return; // pas encore migré
  const uploadRoot = config.upload.uploadDir;
  const protectedDirs = new Set(['media', 'logo', 'favicon']);
  try {
    const entries = fsSync.readdirSync(uploadRoot, { withFileTypes: true });
    for (const entry of entries) {
      if (!entry.isDirectory()) continue;
      if (protectedDirs.has(entry.name)) continue;
      const dirPath = path.join(uploadRoot, entry.name);
      fsSync.rmSync(dirPath, { recursive: true, force: true });
      console.log(`🗑️  Ancien dossier supprimé : ${entry.name}`);
    }
  } catch {}
})();

// Migration auto : blocs sans row/col → auto-placement (order+colSpan → row+col)
(function migrateLayoutsToRowCol() {
  const data = readLayoutsConfig();
  let changed = false;
  for (const layout of Object.values(data.layouts || {})) {
    const needsMigration = (layout.blocks || []).some(b => b.row === undefined);
    if (!needsMigration) continue;
    layout.blocks.sort((a, b) => (a.order || 0) - (b.order || 0));
    let row = 1, col = 1;
    layout.blocks.forEach(b => {
      const span = b.colSpan || 1;
      if (col + span - 1 > 3) { row++; col = 1; }
      b.row = row;
      b.col = col;
      col += span;
      if (col > 3) { row++; col = 1; }
      delete b.order;
    });
    changed = true;
  }
  if (changed) {
    fsSync.writeFileSync(layoutsFile, JSON.stringify(data, null, 2));
    console.log('✅ layouts.json migré vers format row/col');
  }
})();

// ============ MIGRATION : site.social + site.footer ============

(function migrateSiteSocialAndFooter() {
  const raw = fsSync.readFileSync(siteFile, 'utf8');
  const site = JSON.parse(raw);
  let changed = false;

  // Ajouter site.social si absent
  if (!site.social) {
    site.social = {
      linkedin: '', facebook: '', instagram: '',
      x: '', tiktok: '', youtube: '', pinterest: '', github: '',
    };
    changed = true;
  }

  // Ajouter site.footer si absent
  if (!site.footer) {
    site.footer = {
      cols: 3,
      blocks: [
        { blockId: 'f1', type: 'logo-desc', row: 1, col: 1, colSpan: 1 },
        { blockId: 'f2', type: 'contact',   row: 1, col: 2, colSpan: 1 },
        { blockId: 'f3', type: 'hours',     row: 1, col: 3, colSpan: 1 },
        { blockId: 'f4', type: 'legal',     row: 2, col: 1, colSpan: 3 },
      ],
    };
    changed = true;
  }

  if (changed) {
    fsSync.writeFileSync(siteFile, JSON.stringify(site, null, 2));
    console.log('✅ site.json migré : social + footer ajoutés');
  }
})();

// Extrait tous les carouselId uniques définis dans pages.json (inclut blockCarousels)
function extractCarouselIds(pagesData) {
  const ids = [];
  for (const page of (pagesData.pages || [])) {
    for (const section of (page.sections || [])) {
      if (section.carouselId && !ids.includes(section.carouselId)) {
        ids.push(section.carouselId);
      }
      if (section.blockCarousels) {
        for (const bcId of Object.values(section.blockCarousels)) {
          if (bcId && !ids.includes(bcId)) ids.push(bcId);
        }
      }
    }
  }
  return ids;
}

// Résout un carouselId depuis carousels.json — crée à la volée si format sécurisé
function getCarouselInfo(carouselId) {
  const data = readCarouselsConfig();
  if (data.carousels[carouselId]) return data.carousels[carouselId];
  // Accepter tout ID au format sécurisé (blockCarousels uploadés avant sauvegarde de la page)
  if (/^[a-zA-Z0-9_-]{1,100}$/.test(carouselId)) {
    return { id: carouselId, title: carouselId, maxImages: 20, images: [] };
  }
  return null;
}

// S'assure qu'un carousel existe dans carousels.json — le crée si absent
function ensureCarouselExists(carouselId, title, maxImages) {
  const data = readCarouselsConfig();
  if (!data.carousels[carouselId]) {
    data.carousels[carouselId] = {
      id: carouselId,
      title: title || carouselId,
      maxImages: maxImages || 20,
      images: [],
    };
    writeCarouselsConfigSync(data);
  }
  return data.carousels[carouselId];
}

// Hash admin password on startup (if plain text password is provided)
// This allows backward compatibility while encouraging hash usage
let adminPasswordHash = config.admin.passwordHash;

if (!adminPasswordHash && config.admin.password) {
  // Hash the plain text password from .env (sync operation on startup is OK)
  const saltRounds = 10;
  adminPasswordHash = bcrypt.hashSync(config.admin.password, saltRounds);
}

// Si admin.json existe, le mot de passe du .env est ignoré mais toujours présent
if (auth.readAdminHash() && config.admin.password) {
  console.log('⚠️  ADMIN_PASSWORD est encore dans votre .env mais est ignoré (data/admin.json a la priorité).');
  console.log('   Vous pouvez supprimer la ligne ADMIN_PASSWORD de votre .env.\n');
}

// Make the hash available to auth middleware
auth.setPasswordHash(adminPasswordHash);

// ============ MULTI-LANGUE ============

// Détecte la langue active : cookie lang > Accept-Language > défaut site.json
function detectLang(req) {
  const site = readSiteConfig();
  const available  = (site.languages && site.languages.available) || ['fr'];
  const defaultLang = (site.languages && site.languages.default) || 'fr';
  if (req.cookies && req.cookies.lang && available.includes(req.cookies.lang)) {
    return req.cookies.lang;
  }
  const accept = req.headers['accept-language'] || '';
  const preferred = accept.split(',')[0].split('-')[0].trim();
  if (preferred && available.includes(preferred)) return preferred;
  return defaultLang;
}

// Migration content.json mono-langue → multi-langue au démarrage
function migrateContentToMultilang() {
  const contentPath = path.join(__dirname, 'data', 'content.json');
  try {
    const raw = fsSync.readFileSync(contentPath, 'utf8');
    const content = JSON.parse(raw);
    const site = readSiteConfig();
    const available = (site.languages && site.languages.available) || ['fr'];
    const defaultLang = (site.languages && site.languages.default) || 'fr';
    // Si aucune clé de langue n'est présente → ancienne structure, migrer
    const isAlreadyMultilang = Object.keys(content).some(k => available.includes(k) || k.length === 2);
    if (!isAlreadyMultilang && Object.keys(content).length > 0) {
      const migrated = { [defaultLang]: content };
      fsSync.writeFileSync(contentPath, JSON.stringify(migrated, null, 2));
      console.log(`✅ content.json migré vers structure multi-langue (${defaultLang})`);
    }
  } catch { /* fichier absent ou vide — OK */ }
}

migrateContentToMultilang();

// Retourne l'URL du favicon actuel ou null
function getFaviconUrl() {
  try {
    const dir   = path.join(config.upload.uploadDir, 'favicon');
    const files = fsSync.readdirSync(dir).filter(f => /\.(ico|png|svg|jpg|jpeg|webp)$/i.test(f));
    return files.length > 0 ? `/uploads/favicon/${files[0]}` : null;
  } catch { return null; }
}

// Retourne l'URL du logo actuel ou null
function getLogoUrl() {
  try {
    const logoDir = path.join(config.upload.uploadDir, 'logo');
    const files   = fsSync.readdirSync(logoDir).filter(f => /\.(jpg|jpeg|png|webp)$/i.test(f));
    return files.length > 0 ? `/uploads/logo/${files[0]}` : null;
  } catch { return null; }
}

// Crée uniquement les dossiers nécessaires : media/, logo/, favicon/
['media', 'logo', 'favicon'].forEach(folder => {
  const dir = path.join(config.upload.uploadDir, folder);
  if (!fsSync.existsSync(dir)) {
    fsSync.mkdirSync(dir, { recursive: true });
  }
});

// Headers de sécurité (helmet)
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
      fontSrc: ["'self'", 'https://fonts.gstatic.com'],
      imgSrc: ["'self'", 'data:', 'https://images.unsplash.com', 'https://source.unsplash.com'],
      scriptSrc: ["'self'", "'unsafe-inline'",
        'https://challenges.cloudflare.com',
        'https://www.google.com', 'https://www.gstatic.com',
        'https://js.hcaptcha.com', 'https://assets.hcaptcha.com'],
      frameSrc: ["'self'",
        'https://challenges.cloudflare.com',
        'https://www.google.com', 'https://hcaptcha.com'],
      connectSrc: ["'self'",
        'https://challenges.cloudflare.com',
        'https://hcaptcha.com'],
      // Désactivé : upgrade-insecure-requests force le HTTPS et casse les assets en HTTP
      upgradeInsecureRequests: null,
    }
  }
}));

// Middleware
app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/uploads', express.static('uploads'));

// ============ PAGE ROUTES (avant le static) ============

app.get('/back', (req, res) => {
  const site = readSiteConfig();
  const lang = detectLang(req);
  res.render('backoffice', { site, lang, faviconUrl: getFaviconUrl() });
});

// Route dynamique — matche toutes les pages définies dans pages.json
app.get('*', (req, res, next) => {
  const pagesData = readPagesConfig();
  const page = pagesData.pages.find(p => p.slug === req.path);
  if (!page) return next();
  const site = readSiteConfig();
  const lang = detectLang(req);
  const layouts = readLayoutsConfig().layouts || {};
  res.render('page', { site, page, pages: pagesData.pages, logoUrl: getLogoUrl(), logoMode: site.logoMode || 'logo-only', logoPosition: site.logoPosition || 'left', faviconUrl: getFaviconUrl(), lang, layouts });
});

// Fichiers statiques (CSS, JS, images...)
app.use(express.static('public'));

// Rate limiting for contact form
const contactLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5,
  message: { error: 'Too many requests, please try again later.' }
});

// Rate limiting pour le login (anti brute force)
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // 10 tentatives max par IP
  message: { error: 'Too many login attempts, please try again later.' }
});

// Configure multer for file uploads
// Extension forcée selon le mimetype réel — on ignore file.originalname
const MIME_TO_EXT = {
  'image/jpeg':                '.jpg',
  'image/jpg':                 '.jpg',
  'image/png':                 '.png',
  'image/webp':                '.webp',
  'image/x-icon':              '.ico',
  'image/vnd.microsoft.icon':  '.ico',
  'image/svg+xml':             '.svg',
};

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const carouselId = req.params.carouselId;
    const carousel = getCarouselInfo(carouselId);
    if (!carousel) {
      return cb(new Error('Invalid carousel ID'));
    }
    // Toujours uploader dans uploads/media/
    const destDir = path.join(config.upload.uploadDir, 'media');
    fsSync.mkdirSync(destDir, { recursive: true });
    cb(null, destDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = MIME_TO_EXT[file.mimetype] || '.jpg';
    cb(null, uniqueSuffix + ext);
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: config.upload.maxFileSize
  },
  fileFilter: function (req, file, cb) {
    if (config.upload.allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only JPEG, PNG, and WebP allowed.'));
    }
  }
});

// Configure nodemailer
let transporter = null;
if (config.email.auth.user && config.email.auth.pass) {
  transporter = nodemailer.createTransport({
    host: config.email.host,
    port: config.email.port,
    secure: config.email.secure,
    auth: config.email.auth
  });
}

// Encodage HTML pour prévenir l'injection dans les emails
function escapeHtml(str) {
  if (typeof str !== 'string') return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;');
}

// ============ SHARP — OPTIMISATION IMAGES ============

// Génère un .webp optimisé à côté de l'original (max 1920px, qualité 85)
async function processImageWithSharp(filePath) {
  try {
    const dir      = path.dirname(filePath);
    const base     = path.basename(filePath, path.extname(filePath));
    const webpPath = path.join(dir, base + '.webp');
    await sharp(filePath)
      .resize({ width: 1920, height: 1920, fit: 'inside', withoutEnlargement: true })
      .webp({ quality: 85 })
      .toFile(webpPath);
  } catch (err) {
    console.warn('Sharp processing skipped:', err.message);
  }
}

// ============ HELPERS IMAGES (nouveau modèle media.json) ============

// Retourne les images d'un carousel en format compatible avec l'ancien API
function getCarouselImages(carouselId) {
  const carouselsData = readCarouselsConfig();
  const mediaData = readMediaRegistry();
  const carousel = carouselsData.carousels[carouselId];
  if (!carousel) return [];
  return (carousel.images || [])
    .filter(mediaId => mediaData.media[mediaId])
    .map(mediaId => getMediaUrls(mediaData.media[mediaId]));
}

// ============ SITE & PAGES CONFIG ============

// GET /api/site (public)
app.get('/api/site', (req, res) => {
  res.json(readSiteConfig());
});

// POST /api/admin/site (protégé)
app.post('/api/admin/site', auth.requireAuth, async (req, res) => {
  try {
    undoManager.pushUndo('Identité du site', { 'site.json': siteFile });
    await fs.writeFile(siteFile, JSON.stringify(req.body, null, 2));
    res.json({ success: true });
  } catch {
    res.status(500).json({ error: 'Save failed' });
  }
});

// GET /api/pages (public)
app.get('/api/pages', (req, res) => {
  res.json(readPagesConfig());
});

// Supprime les carousels orphelins de carousels.json et les media orphelins de media.json
async function cleanOrphanedCarousels(newPagesData) {
  const activeIds = new Set(extractCarouselIds(newPagesData));
  const carouselsData = readCarouselsConfig();
  const mediaData = readMediaRegistry();

  // Identifier les carousels orphelins (pas dans pages.json et pas hardcodés)
  const hardcodedIds = new Set(Object.keys(config.carousels || {}));
  const orphanCarouselIds = [];
  for (const id of Object.keys(carouselsData.carousels)) {
    if (!activeIds.has(id) && !hardcodedIds.has(id)) {
      orphanCarouselIds.push(id);
    }
  }

  // Supprimer les carousels orphelins
  for (const id of orphanCarouselIds) {
    delete carouselsData.carousels[id];
    console.log(`🗑️  Carousel orphelin supprimé : ${id}`);
  }

  // Identifier les mediaIds encore référencés par au moins un carousel
  const usedMediaIds = new Set();
  for (const carousel of Object.values(carouselsData.carousels)) {
    for (const mediaId of (carousel.images || [])) {
      usedMediaIds.add(mediaId);
    }
  }

  // Supprimer les media orphelins (plus référencés par aucun carousel)
  const mediaDir = path.join(config.upload.uploadDir, 'media');
  for (const [mediaId, entry] of Object.entries(mediaData.media)) {
    if (!usedMediaIds.has(mediaId)) {
      // Supprimer les fichiers physiques
      const filePath = path.join(mediaDir, entry.filename);
      await fs.unlink(filePath).catch(() => {});
      if (entry.hasWebp) {
        const webpPath = path.join(mediaDir, entry.filename.replace(/\.(jpg|jpeg|png)$/i, '') + '.webp');
        await fs.unlink(webpPath).catch(() => {});
      }
      delete mediaData.media[mediaId];
      console.log(`🗑️  Media orphelin supprimé : ${entry.filename}`);
    }
  }

  await writeCarouselsConfig(carouselsData);
  await writeMediaRegistry(mediaData);
}

// POST /api/admin/pages (protégé)
app.post('/api/admin/pages', auth.requireAuth, async (req, res) => {
  try {
    undoManager.pushUndo('Pages et sections', {
      'pages.json': pagesFile,
      'carousels.json': carouselsFile,
      'media.json': mediaFile,
    });
    await fs.writeFile(pagesFile, JSON.stringify(req.body, null, 2));
    // Crée les carousels manquants dans carousels.json
    extractCarouselIds(req.body).forEach(id => {
      ensureCarouselExists(id);
    });
    // Supprime les carousels et media orphelins
    cleanOrphanedCarousels(req.body).catch(() => {});
    res.json({ success: true });
  } catch {
    res.status(500).json({ error: 'Save failed' });
  }
});

// ============ LOGO ============

// Multer spécifique pour le logo (fichier unique, nom fixe logo.ext)
const logoStorage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, path.join(config.upload.uploadDir, 'logo')),
  filename:    (req, file, cb) => {
    const ext = MIME_TO_EXT[file.mimetype] || '.jpg';
    cb(null, 'logo' + ext);
  }
});
const uploadLogo = multer({
  storage: logoStorage,
  limits: { fileSize: config.upload.maxFileSize },
  fileFilter: (req, file, cb) => {
    if (config.upload.allowedTypes.includes(file.mimetype)) cb(null, true);
    else cb(new Error('Invalid file type'));
  }
});

// GET /api/logo (public)
app.get('/api/logo', (req, res) => {
  res.json({ url: getLogoUrl() });
});

// POST /api/admin/logo (protégé) — remplace le logo existant
app.post('/api/admin/logo', auth.requireAuth, uploadLogo.single('logo'), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
  // Supprimer l'ancien logo s'il a un nom différent
  try {
    const dir   = path.join(config.upload.uploadDir, 'logo');
    const files = await fs.readdir(dir);
    for (const f of files) {
      if (f !== req.file.filename && /\.(jpg|jpeg|png|webp)$/i.test(f)) {
        await fs.unlink(path.join(dir, f)).catch(() => {});
      }
    }
  } catch {}
  // Générer le .webp optimisé du logo
  processImageWithSharp(req.file.path).catch(() => {});
  res.json({ success: true, url: `/uploads/logo/${req.file.filename}` });
});

// PUT /api/admin/logo-position (protégé)
app.put('/api/admin/logo-position', auth.requireAuth, async (req, res) => {
  const { position } = req.body;
  if (!['left', 'right', 'center'].includes(position)) {
    return res.status(400).json({ error: 'Position invalide' });
  }
  try {
    undoManager.pushUndo('Position logo', { 'site.json': siteFile });
    const site = readSiteConfig();
    site.logoPosition = position;
    await fs.writeFile(siteFile, JSON.stringify(site, null, 2));
    res.json({ success: true });
  } catch {
    res.status(500).json({ error: 'Erreur sauvegarde' });
  }
});

// PUT /api/admin/logo-mode (protégé)
app.put('/api/admin/logo-mode', auth.requireAuth, async (req, res) => {
  const { mode } = req.body;
  if (!['logo-only', 'name-only', 'logo-name'].includes(mode)) {
    return res.status(400).json({ error: 'Mode invalide' });
  }
  try {
    undoManager.pushUndo('Mode logo', { 'site.json': siteFile });
    const site = readSiteConfig();
    site.logoMode = mode;
    await fs.writeFile(siteFile, JSON.stringify(site, null, 2));
    res.json({ success: true });
  } catch {
    res.status(500).json({ error: 'Erreur sauvegarde' });
  }
});

// DELETE /api/admin/logo (protégé)
app.delete('/api/admin/logo', auth.requireAuth, async (req, res) => {
  try {
    const dir   = path.join(config.upload.uploadDir, 'logo');
    const files = await fs.readdir(dir);
    for (const f of files) {
      if (/\.(jpg|jpeg|png|webp)$/i.test(f)) await fs.unlink(path.join(dir, f));
    }
    res.json({ success: true });
  } catch {
    res.status(500).json({ error: 'Delete failed' });
  }
});

// ============ FAVICON ============

const faviconTypes = ['image/x-icon', 'image/vnd.microsoft.icon', 'image/png', 'image/svg+xml', 'image/jpeg', 'image/jpg', 'image/webp'];

const faviconStorage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, path.join(config.upload.uploadDir, 'favicon')),
  filename:    (req, file, cb) => {
    const ext = MIME_TO_EXT[file.mimetype] || '.png';
    cb(null, 'favicon' + ext);
  }
});
const uploadFavicon = multer({
  storage: faviconStorage,
  limits: { fileSize: 1 * 1024 * 1024 }, // 1 MB max pour un favicon
  fileFilter: (req, file, cb) => {
    if (faviconTypes.includes(file.mimetype)) cb(null, true);
    else cb(new Error('Format non supporté — utilisez ICO, PNG, SVG ou JPG'));
  }
});

// GET /api/favicon (public)
app.get('/api/favicon', (req, res) => {
  res.json({ url: getFaviconUrl() });
});

// POST /api/admin/favicon (protégé)
app.post('/api/admin/favicon', auth.requireAuth, uploadFavicon.single('favicon'), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
  // Supprimer l'ancienne version si extension différente
  try {
    const dir   = path.join(config.upload.uploadDir, 'favicon');
    const files = await fs.readdir(dir);
    for (const f of files) {
      if (f !== req.file.filename && /\.(ico|png|svg|jpg|jpeg|webp)$/i.test(f)) {
        await fs.unlink(path.join(dir, f)).catch(() => {});
      }
    }
  } catch {}
  res.json({ success: true, url: `/uploads/favicon/${req.file.filename}` });
});

// DELETE /api/admin/favicon (protégé)
app.delete('/api/admin/favicon', auth.requireAuth, async (req, res) => {
  try {
    const dir   = path.join(config.upload.uploadDir, 'favicon');
    const files = await fs.readdir(dir);
    for (const f of files) {
      if (/\.(ico|png|svg|jpg|jpeg|webp)$/i.test(f)) await fs.unlink(path.join(dir, f));
    }
    res.json({ success: true });
  } catch {
    res.status(500).json({ error: 'Delete failed' });
  }
});

// ============ CONTENT MANAGEMENT ============

const contentFile = path.join(__dirname, 'data', 'content.json');

// GET /api/content — public, retourne le contenu pour la langue active
app.get('/api/content', (req, res) => {
  try {
    const content = JSON.parse(fsSync.readFileSync(contentFile, 'utf8'));
    const lang = detectLang(req);
    const site = readSiteConfig();
    const available = (site.languages && site.languages.available) || ['fr'];
    const isMultilang = Object.keys(content).some(k => available.includes(k) || k.length === 2);
    res.json(isMultilang ? (content[lang] || {}) : content);
  } catch {
    res.json({});
  }
});

// POST /api/admin/content — protégé, body: { page, key, value, lang }
app.post('/api/admin/content', auth.requireAuth, async (req, res) => {
  const { page, key, value, lang } = req.body;
  try {
    undoManager.pushUndo('Texte inline', { 'content.json': contentFile });
    let content = {};
    try { content = JSON.parse(await fs.readFile(contentFile, 'utf8')); } catch {}
    const site = readSiteConfig();
    const available  = (site.languages && site.languages.available) || ['fr'];
    const defaultLang = (site.languages && site.languages.default) || 'fr';
    const targetLang = (lang && available.includes(lang)) ? lang : defaultLang;
    if (!content[targetLang]) content[targetLang] = {};
    if (!content[targetLang][page]) content[targetLang][page] = {};
    content[targetLang][page][key] = value;
    await fs.writeFile(contentFile, JSON.stringify(content, null, 2));
    res.json({ success: true });
  } catch {
    res.status(500).json({ error: 'Save failed' });
  }
});

// POST /api/set-lang — définit la langue active via cookie
app.post('/api/set-lang', (req, res) => {
  const { lang } = req.body;
  const site = readSiteConfig();
  const available = (site.languages && site.languages.available) || ['fr'];
  if (!available.includes(lang)) return res.status(400).json({ error: 'Langue non disponible' });
  res.cookie('lang', lang, { httpOnly: false, sameSite: 'strict', maxAge: 365 * 24 * 3600 * 1000 });
  res.json({ success: true });
});

// ============ THEME MANAGEMENT ============

const themeFile = path.join(__dirname, 'data', 'theme.json');
const VALID_THEMES = ['alpine', 'pro', 'craft', 'industrial', 'provence'];

// Helpers centralisés pour lire/écrire theme.json
function readThemeFile() {
  try {
    return JSON.parse(fsSync.readFileSync(themeFile, 'utf8'));
  } catch {
    return { theme: 'alpine', customThemes: {} };
  }
}

async function writeThemeFile(data) {
  await fs.writeFile(themeFile, JSON.stringify(data, null, 2));
}

// Migration auto des anciens noms de variables CSS dans les thèmes custom
(function migrateThemeVars() {
  const VAR_RENAMES = {
    '--sapin': '--primary', '--sapin-dark': '--primary-dark', '--sapin-light': '--primary-light',
    '--ardoise': '--secondary', '--ardoise-dark': '--secondary-dark',
    '--bois': '--accent', '--bois-dark': '--accent-dark',
    '--cream': '--bg', '--neige': '--bg-light',
    '--text-dark': '--text', '--text-light': '--text-muted',
  };
  const data = readThemeFile();
  if (!data.customThemes) return;
  let changed = false;
  for (const theme of Object.values(data.customThemes)) {
    if (!theme.vars) continue;
    for (const [oldName, newName] of Object.entries(VAR_RENAMES)) {
      if (oldName in theme.vars && !(newName in theme.vars)) {
        theme.vars[newName] = theme.vars[oldName];
        delete theme.vars[oldName];
        changed = true;
      }
    }
  }
  if (changed) {
    fsSync.writeFileSync(themeFile, JSON.stringify(data, null, 2));
    console.log('  Theme vars migrated to new names (--primary, --secondary, etc.)');
  }
})();

// ============ PUBLIC ROUTES ============

// Get active theme (public) — retourne aussi customThemes et vars si thème custom actif
app.get('/api/theme', (req, res) => {
  const data = readThemeFile();
  const response = { theme: data.theme, customThemes: data.customThemes || {} };
  // Si le thème actif est un custom, inclure ses vars dans la réponse
  if (data.customThemes && data.customThemes[data.theme]) {
    response.vars = data.customThemes[data.theme].vars;
  }
  res.json(response);
});

// Get carousel configuration
app.get('/api/carousels', (req, res) => {
  const data = readCarouselsConfig();
  const carouselsInfo = {};
  for (const [key, carousel] of Object.entries(data.carousels)) {
    carouselsInfo[key] = {
      id: carousel.id,
      title: carousel.title,
      maxImages: carousel.maxImages,
    };
  }
  res.json(carouselsInfo);
});

// Get images for a specific carousel
app.get('/api/carousel/:id/images', (req, res) => {
  const carouselId = req.params.id;
  const carousel = getCarouselInfo(carouselId);
  if (!carousel) {
    return res.status(404).json({ error: 'Carousel not found' });
  }
  const images = getCarouselImages(carouselId);
  res.json({ carousel: carouselId, images });
});

// Contact form submission
app.post('/api/contact', contactLimiter, async (req, res) => {
  try {
    const { name, email, phone, message } = req.body;
    const turnstileToken = req.body['cf-turnstile-response'];

    if (!name || !email || !message) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Validation basique de l'email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ error: 'Invalid email address' });
    }

    // Vérification captcha selon le provider configuré dans site.json
    const siteConfig      = readSiteConfig();
    const captchaProvider = siteConfig.captcha && siteConfig.captcha.provider;
    // Lit data/admin.json (override) ou CAPTCHA_SECRET_KEY / TURNSTILE_SECRET_KEY (.env)
    const adminData = (() => {
      try { return JSON.parse(fsSync.readFileSync('./data/admin.json', 'utf8')); } catch { return {}; }
    })();
    const captchaSecret = adminData.captchaSecretKey || config.captcha.secretKey;

    if (captchaProvider && captchaProvider !== 'none' && captchaSecret) {
      let token = null;
      let verifyUrl = null;

      if (captchaProvider === 'turnstile') {
        token = req.body['cf-turnstile-response'];
        verifyUrl = 'https://challenges.cloudflare.com/turnstile/v0/siteverify';
      } else if (captchaProvider === 'recaptcha') {
        token = req.body['g-recaptcha-response'];
        verifyUrl = 'https://www.google.com/recaptcha/api/siteverify';
      } else if (captchaProvider === 'hcaptcha') {
        token = req.body['h-captcha-response'];
        verifyUrl = 'https://hcaptcha.com/siteverify';
      }

      if (!token) return res.status(400).json({ error: 'Captcha requis' });

      const verifyRes  = await fetch(verifyUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ secret: captchaSecret, response: token, remoteip: req.ip })
      });
      const verifyData = await verifyRes.json();
      if (!verifyData.success) {
        return res.status(400).json({ error: 'Verification captcha echouee' });
      }
    }
    
    if (!transporter) {
      console.log('Email not configured. Contact form data:', { name, email, phone, message });
      return res.json({ 
        success: true, 
        message: 'Message received (email not configured in demo mode)' 
      });
    }
    
    const safeName    = escapeHtml(name);
    const safeEmail   = escapeHtml(email);
    const safePhone   = escapeHtml(phone || '');
    const safeMessage = escapeHtml(message).replace(/\n/g, '<br>');

    const mailOptions = {
      from: config.email.from,
      to: config.email.to,
      subject: `Nouveau message de ${safeName}`,
      html: `
        <h2>Nouveau message via le formulaire de contact</h2>
        <p><strong>Nom :</strong> ${safeName}</p>
        <p><strong>Email :</strong> ${safeEmail}</p>
        <p><strong>Téléphone :</strong> ${safePhone || 'Non renseigné'}</p>
        <p><strong>Message :</strong></p>
        <p>${safeMessage}</p>
      `
    };
    
    await transporter.sendMail(mailOptions);
    res.json({ success: true, message: 'Message sent successfully' });
  } catch (error) {
    console.error('Error sending email:', error);
    res.status(500).json({ error: 'Failed to send message' });
  }
});

// ============ AUTHENTICATION ROUTES ============

// Login
app.post('/api/auth/login', loginLimiter, async (req, res) => {
  const { username, password } = req.body;
  const result = await auth.login(username, password);

  if (result.success) {
    // Cookie HttpOnly : inaccessible depuis JS, protégé contre le vol par XSS
    res.cookie('sid', result.sessionId, {
      httpOnly: true,
      sameSite: 'strict',
      secure: process.env.NODE_ENV === 'production',
      maxAge: config.session.maxAge
    });
    res.json({ success: true });
  } else {
    res.status(401).json({ error: 'Invalid credentials' });
  }
});

// Logout
app.post('/api/auth/logout', (req, res) => {
  const sessionId = req.cookies && req.cookies.sid;
  auth.logout(sessionId);
  res.clearCookie('sid');
  res.json({ success: true });
});

// Check session
app.get('/api/auth/check', (req, res) => {
  const sessionId = req.cookies && req.cookies.sid;
  const result = auth.checkSession(sessionId);
  res.json(result);
});

// Changer le mot de passe admin — body: { current, newPassword }
app.post('/api/admin/password', auth.requireAuth, async (req, res) => {
  const { current, newPassword } = req.body;
  if (!current || !newPassword || newPassword.length < 8) {
    return res.status(400).json({ error: 'Nouveau mot de passe trop court (8 caracteres min)' });
  }
  // Vérifier le mot de passe actuel
  const currentHash = auth.readAdminHash() || adminPasswordHash;
  const isMatch     = await bcrypt.compare(current, currentHash);
  if (!isMatch) return res.status(401).json({ error: 'Mot de passe actuel incorrect' });
  // Hacher et sauvegarder le nouveau
  const newHash = await bcrypt.hash(newPassword, 10);
  auth.writeAdminHash(newHash);
  res.json({ success: true });
});

// ============ PROTECTED ROUTES (Back-office) ============

// Upload image to carousel
app.post('/api/admin/upload/:carouselId', auth.requireAuth, upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const carouselId = req.params.carouselId;

    // S'assurer que le carousel existe dans carousels.json
    ensureCarouselExists(carouselId);
    const carouselsData = readCarouselsConfig();
    const carousel = carouselsData.carousels[carouselId];

    // Vérifier la limite d'images
    if ((carousel.images || []).length >= carousel.maxImages) {
      await fs.unlink(req.file.path);
      return res.status(400).json({
        error: `Maximum ${carousel.maxImages} images allowed for this carousel`
      });
    }

    undoManager.pushUndo('Upload image', {
      'carousels.json': carouselsFile,
      'media.json': mediaFile,
    });

    // Générer le .webp optimisé
    const hasWebp = /\.(jpg|jpeg|png)$/i.test(req.file.filename);
    if (hasWebp) processImageWithSharp(req.file.path).catch(() => {});

    // Créer l'entrée media
    const mediaId = generateMediaId();
    const mediaData = readMediaRegistry();
    mediaData.media[mediaId] = {
      id: mediaId,
      filename: req.file.filename,
      originalName: req.file.originalname,
      mimeType: req.file.mimetype,
      hasWebp,
      uploadedAt: new Date().toISOString(),
    };
    await writeMediaRegistry(mediaData);

    // Ajouter la ref au carousel
    if (!carousel.images) carousel.images = [];
    carousel.images.push(mediaId);
    await writeCarouselsConfig(carouselsData);

    const urls = getMediaUrls(mediaData.media[mediaId]);
    res.json({
      success: true,
      filename: urls.filename,
      url: urls.url,
    });
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ error: 'Upload failed' });
  }
});

// Delete image
app.delete('/api/admin/image', auth.requireAuth, async (req, res) => {
  try {
    const { carouselId, filename } = req.body;
    const carouselsData = readCarouselsConfig();
    const carousel = carouselsData.carousels[carouselId];

    if (!carousel) {
      return res.status(404).json({ error: 'Carousel not found' });
    }

    const safeFilename = path.basename(filename);

    undoManager.pushUndo('Suppression image', {
      'carousels.json': carouselsFile,
      'media.json': mediaFile,
    });

    // Trouver le mediaId par filename
    const mediaData = readMediaRegistry();
    const mediaId = Object.keys(mediaData.media).find(
      id => mediaData.media[id].filename === safeFilename
    );

    if (!mediaId) {
      return res.status(404).json({ error: 'Image not found' });
    }

    // Retirer la ref du carousel
    carousel.images = (carousel.images || []).filter(id => id !== mediaId);
    await writeCarouselsConfig(carouselsData);

    // Vérifier si le media est encore référencé par un autre carousel
    const isStillUsed = Object.values(carouselsData.carousels).some(
      c => c.id !== carouselId && (c.images || []).includes(mediaId)
    );

    if (!isStillUsed) {
      // Supprimer les fichiers physiques + l'entrée media
      const mediaDir = path.join(config.upload.uploadDir, 'media');
      const entry = mediaData.media[mediaId];
      await fs.unlink(path.join(mediaDir, entry.filename)).catch(() => {});
      if (entry.hasWebp) {
        const webpName = entry.filename.replace(/\.(jpg|jpeg|png)$/i, '') + '.webp';
        await fs.unlink(path.join(mediaDir, webpName)).catch(() => {});
      }
      delete mediaData.media[mediaId];
      await writeMediaRegistry(mediaData);
    }

    res.json({ success: true });
  } catch (error) {
    console.error('Delete error:', error);
    res.status(500).json({ error: 'Delete failed' });
  }
});

// Get all images for admin — lit carousels.json + media.json
app.get('/api/admin/images', auth.requireAuth, (req, res) => {
  try {
    const carouselsData = readCarouselsConfig();
    const mediaData = readMediaRegistry();
    const allImages = {};

    // Enrichir les titres des carousels de blockCarousels (layouts)
    const pagesDataForImages = readPagesConfig();
    const layoutsDataForImages = readLayoutsConfig();

    for (const [key, carousel] of Object.entries(carouselsData.carousels)) {
      // Chercher un titre lisible pour les blockCarousels
      let title = carousel.title;
      if (title === key) {
        for (const page of (pagesDataForImages.pages || [])) {
          for (const section of (page.sections || [])) {
            if (!section.blockCarousels) continue;
            for (const [blockId, bcId] of Object.entries(section.blockCarousels)) {
              if (bcId !== key) continue;
              const layout = layoutsDataForImages.layouts && layoutsDataForImages.layouts[section.layoutId];
              const block  = layout && (layout.blocks || []).find(b => b.blockId === blockId);
              const blockType   = block ? (block.type === 'image' ? 'Image' : 'Carrousel') : 'Media';
              const layoutLabel = layout ? layout.label : (section.layoutId || key);
              title = `${layoutLabel} — ${blockType} (${section.carouselId || key})`;
            }
          }
        }
      }

      const images = (carousel.images || [])
        .filter(mediaId => mediaData.media[mediaId])
        .map(mediaId => getMediaUrls(mediaData.media[mediaId]));

      allImages[key] = {
        carousel: { id: carousel.id, title, maxImages: carousel.maxImages },
        images,
      };
    }

    res.json(allImages);
  } catch (error) {
    console.error('Error fetching images:', error);
    res.status(500).json({ error: 'Failed to fetch images' });
  }
});

// Set active theme (protected) — accepte les thèmes natifs et les thèmes custom
app.post('/api/admin/theme', auth.requireAuth, async (req, res) => {
  const { theme } = req.body;
  const data = readThemeFile();
  const isNative = VALID_THEMES.includes(theme);
  const isCustom = data.customThemes && data.customThemes[theme];
  if (!isNative && !isCustom) {
    return res.status(400).json({ error: 'Invalid theme' });
  }
  try {
    undoManager.pushUndo('Thème actif', { 'theme.json': themeFile });
    data.theme = theme;
    await writeThemeFile(data);
    res.json({ success: true, theme });
  } catch (error) {
    res.status(500).json({ error: 'Failed to save theme' });
  }
});

// Créer ou mettre à jour un thème custom — body: { id, label, vars }
app.post('/api/admin/theme/custom', auth.requireAuth, async (req, res) => {
  const { id, label, vars } = req.body;
  // Validation : id alphanumérique + tirets uniquement
  if (!id || !/^[a-z0-9-]+$/.test(id)) {
    return res.status(400).json({ error: 'Invalid theme id (lowercase letters, numbers, hyphens only)' });
  }
  if (!label || typeof label !== 'string' || label.trim().length === 0) {
    return res.status(400).json({ error: 'Label is required' });
  }
  if (!vars || typeof vars !== 'object') {
    return res.status(400).json({ error: 'vars object is required' });
  }
  // Empêcher d'écraser un thème natif
  if (VALID_THEMES.includes(id)) {
    return res.status(400).json({ error: 'Cannot override a native theme' });
  }
  try {
    const data = readThemeFile();
    if (!data.customThemes) data.customThemes = {};
    data.customThemes[id] = { label: label.trim(), vars };
    await writeThemeFile(data);
    res.json({ success: true, id, label: label.trim() });
  } catch (error) {
    res.status(500).json({ error: 'Failed to save custom theme' });
  }
});

// Supprimer un thème custom
app.delete('/api/admin/theme/custom/:id', auth.requireAuth, async (req, res) => {
  const { id } = req.params;
  try {
    const data = readThemeFile();
    if (!data.customThemes || !data.customThemes[id]) {
      return res.status(404).json({ error: 'Custom theme not found' });
    }
    delete data.customThemes[id];
    // Si le thème supprimé était actif, revenir sur alpine
    if (data.theme === id) data.theme = 'alpine';
    await writeThemeFile(data);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete custom theme' });
  }
});

// Sauvegarder l'ordre des images d'un carousel
app.post('/api/admin/carousel/:carouselId/order', auth.requireAuth, async (req, res) => {
  const { carouselId } = req.params;
  const { order }      = req.body;
  if (!Array.isArray(order)) return res.status(400).json({ error: 'order must be an array' });
  try {
    const carouselsData = readCarouselsConfig();
    const carousel = carouselsData.carousels[carouselId];
    if (!carousel) return res.status(404).json({ error: 'Carousel not found' });

    undoManager.pushUndo('Ordre images', { 'carousels.json': carouselsFile });

    // L'ordre arrive en filenames — convertir en mediaIds
    const mediaData = readMediaRegistry();
    const filenameToId = {};
    for (const [id, entry] of Object.entries(mediaData.media)) {
      filenameToId[entry.filename] = id;
    }

    // Garder uniquement les mediaIds valides qui appartiennent au carousel
    const currentIds = new Set(carousel.images || []);
    const newOrder = order
      .map(f => filenameToId[f])
      .filter(id => id && currentIds.has(id));

    // Ajouter les IDs existants qui ne sont pas dans le nouvel ordre (sécurité)
    for (const id of (carousel.images || [])) {
      if (!newOrder.includes(id)) newOrder.push(id);
    }

    carousel.images = newOrder;
    await writeCarouselsConfig(carouselsData);
    res.json({ success: true });
  } catch {
    res.status(500).json({ error: 'Failed to save order' });
  }
});

// Copier une image existante vers un autre carousel (zéro copie physique !)
app.post('/api/admin/carousel/:carouselId/copy-image', auth.requireAuth, async (req, res) => {
  const { carouselId } = req.params;
  const { sourceCarouselId, filename } = req.body;

  const carouselsData = readCarouselsConfig();
  const destCarousel = carouselsData.carousels[carouselId];
  const srcCarousel  = carouselsData.carousels[sourceCarouselId];

  if (!destCarousel) return res.status(404).json({ error: 'Carousel destination introuvable' });
  if (!srcCarousel)  return res.status(404).json({ error: 'Carousel source introuvable' });

  // Trouver le mediaId par filename
  const safeFilename = path.basename(filename);
  const mediaData = readMediaRegistry();
  const mediaId = Object.keys(mediaData.media).find(
    id => mediaData.media[id].filename === safeFilename
  );

  if (!mediaId) return res.status(404).json({ error: 'Image source introuvable' });

  // Vérifier la limite d'images
  if ((destCarousel.images || []).length >= destCarousel.maxImages) {
    return res.status(400).json({ error: `Limite de ${destCarousel.maxImages} images atteinte` });
  }

  try {
    undoManager.pushUndo('Copie image', { 'carousels.json': carouselsFile });

    // Simplement ajouter le mediaId au carousel destination (zéro copie fichier !)
    if (!destCarousel.images) destCarousel.images = [];
    if (!destCarousel.images.includes(mediaId)) {
      destCarousel.images.push(mediaId);
    }
    await writeCarouselsConfig(carouselsData);

    const urls = getMediaUrls(mediaData.media[mediaId]);
    res.json({
      success: true,
      filename: urls.filename,
      url: urls.url,
    });
  } catch (err) {
    console.error('copy-image error:', err);
    res.status(500).json({ error: 'Copie échouée' });
  }
});

// ============ MEDIA LIBRARY (endpoints optionnels) ============

// GET /api/admin/media — bibliothèque complète des médias
app.get('/api/admin/media', auth.requireAuth, (req, res) => {
  const mediaData = readMediaRegistry();
  const carouselsData = readCarouselsConfig();
  // Enrichir chaque media avec ses URLs et les carousels qui le référencent
  const items = Object.values(mediaData.media).map(entry => {
    const usedIn = Object.entries(carouselsData.carousels)
      .filter(([, c]) => (c.images || []).includes(entry.id))
      .map(([id, c]) => ({ id, title: c.title }));
    return { ...entry, ...getMediaUrls(entry), usedIn };
  });
  res.json({ media: items });
});

// DELETE /api/admin/media/:mediaId — supprimer un media (le retire de tous les carousels)
app.delete('/api/admin/media/:mediaId', auth.requireAuth, async (req, res) => {
  const { mediaId } = req.params;
  const mediaData = readMediaRegistry();
  const entry = mediaData.media[mediaId];
  if (!entry) return res.status(404).json({ error: 'Media introuvable' });

  try {
    undoManager.pushUndo('Suppression media', {
      'media.json': mediaFile,
      'carousels.json': carouselsFile,
    });

    // Retirer de tous les carousels
    const carouselsData = readCarouselsConfig();
    for (const carousel of Object.values(carouselsData.carousels)) {
      carousel.images = (carousel.images || []).filter(id => id !== mediaId);
    }
    await writeCarouselsConfig(carouselsData);

    // Supprimer les fichiers physiques
    const mediaDir = path.join(config.upload.uploadDir, 'media');
    await fs.unlink(path.join(mediaDir, entry.filename)).catch(() => {});
    if (entry.hasWebp) {
      const webpName = entry.filename.replace(/\.(jpg|jpeg|png)$/i, '') + '.webp';
      await fs.unlink(path.join(mediaDir, webpName)).catch(() => {});
    }

    delete mediaData.media[mediaId];
    await writeMediaRegistry(mediaData);

    res.json({ success: true });
  } catch (err) {
    console.error('Delete media error:', err);
    res.status(500).json({ error: 'Suppression échouée' });
  }
});

// ============ LAYOUTS (Générateur de sections) ============

// GET /api/layouts (public)
app.get('/api/layouts', (req, res) => {
  res.json(readLayoutsConfig());
});

// POST /api/admin/layouts (protégé) — créer un layout
app.post('/api/admin/layouts', auth.requireAuth, async (req, res) => {
  const { id, label, blocks } = req.body;
  if (!id || !/^[a-z0-9-]+$/.test(id)) {
    return res.status(400).json({ error: 'ID invalide (lettres minuscules, chiffres, tirets)' });
  }
  if (!label || !label.trim()) {
    return res.status(400).json({ error: 'Nom requis' });
  }
  if (!Array.isArray(blocks)) {
    return res.status(400).json({ error: 'blocks doit être un tableau' });
  }
  try {
    const data = readLayoutsConfig();
    if (data.layouts[id]) {
      return res.status(409).json({ error: 'Un layout avec cet ID existe déjà' });
    }
    const now = new Date().toISOString();
    data.layouts[id] = { id, label: label.trim(), createdAt: now, updatedAt: now, blocks };
    await writeLayoutsConfig(data);
    res.json({ success: true, layout: data.layouts[id] });
  } catch {
    res.status(500).json({ error: 'Erreur sauvegarde' });
  }
});

// PUT /api/admin/layouts/:id (protégé) — modifier un layout
app.put('/api/admin/layouts/:id', auth.requireAuth, async (req, res) => {
  const { id } = req.params;
  const { label, blocks } = req.body;
  try {
    const data = readLayoutsConfig();
    if (!data.layouts[id]) {
      return res.status(404).json({ error: 'Layout introuvable' });
    }
    if (label) data.layouts[id].label = label.trim();
    if (Array.isArray(blocks)) data.layouts[id].blocks = blocks;
    data.layouts[id].updatedAt = new Date().toISOString();
    await writeLayoutsConfig(data);
    res.json({ success: true, layout: data.layouts[id] });
  } catch {
    res.status(500).json({ error: 'Erreur sauvegarde' });
  }
});

// DELETE /api/admin/layouts/:id (protégé) — supprimer un layout
app.delete('/api/admin/layouts/:id', auth.requireAuth, async (req, res) => {
  const { id } = req.params;
  try {
    const data = readLayoutsConfig();
    if (!data.layouts[id]) {
      return res.status(404).json({ error: 'Layout introuvable' });
    }
    // Vérifier si le layout est utilisé dans des pages
    const pagesData = readPagesConfig();
    const usedIn = [];
    for (const page of (pagesData.pages || [])) {
      for (const section of (page.sections || [])) {
        if (section.type === 'custom-layout' && section.layoutId === id) {
          usedIn.push(page.title);
        }
      }
    }
    if (usedIn.length > 0) {
      return res.status(409).json({
        error: `Ce layout est utilisé dans : ${usedIn.join(', ')}. Retirez-le des pages avant de le supprimer.`,
        usedIn
      });
    }
    delete data.layouts[id];
    await writeLayoutsConfig(data);
    res.json({ success: true });
  } catch {
    res.status(500).json({ error: 'Erreur suppression' });
  }
});

// ============ ERROR HANDLING ============

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: err.message || 'Something went wrong!' });
});

// ============ START SERVER ============

app.listen(config.port, () => {
  const passwordDisplay = config.admin.passwordHash ? '[hashed]' : config.admin.password;
  const securityNote = config.admin.passwordHash 
    ? '  ✅ Using hashed password (secure)'
    : '  ⚠️  Using plain text password';
  
  console.log(`
╔════════════════════════════════════════╗
║   Showcase Website Server Running      ║
╠════════════════════════════════════════╣
║  Public Site:  http://localhost:${config.port}
║  Nos Travaux:  http://localhost:${config.port}/nos-travaux
║  Back-Office:  http://localhost:${config.port}/back
║                                        ║
║  Admin Login:                          ║
║  Username: ${config.admin.username.padEnd(24)} ║
║  Password: ${passwordDisplay.padEnd(24)} ║
║                                        ║
║${securityNote.padEnd(40)}║
╚════════════════════════════════════════╝
${!config.admin.passwordHash ? '\n💡 Tip: Generate a password hash for better security:\n   node util/generate-hash.js yourpassword\n' : ''}
  `);
});
