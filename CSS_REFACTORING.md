# CSS Refactoring Plan — Nimble

## Objectif

Migrer le CSS custom vers Tailwind inline pour **réduire drastiquement** les fichiers CSS, améliorer la maintenabilité et appliquer le principe DRY. Le design ne doit **pas changer visuellement**.

---

## État actuel

| Fichier | Lignes | Rôle | Statut |
|---|---|---|---|
| `app/globals.css` | 1 712 | Site public (thèmes, hero, sections, footer) | Phase 2 |
| `app/(admin)/back/admin.css` | 4 208 | Backoffice (login, dashboard, toutes les sections) | Phase 1 |
| `app/(admin)/back/admin-legacy.css` | 2 988 | Copie obsolète d'admin.css — **non importé nulle part** | **À SUPPRIMER** |
| **Total** | **8 908** | | Cible : < 500 lignes |

### Problèmes identifiés

1. **admin-legacy.css est du code mort** — 2 988 lignes inutiles
2. **Duplication massive** entre les 3 fichiers :
   - Inline editor (~170 lignes) copié-collé dans les 3 fichiers
   - Social widget, footer grid, custom layout dupliqués dans les 3 fichiers
   - Footer `.footer::before` dupliqué entre globals.css et admin.css
3. **admin.css contient 4 208 lignes** alors que la Passe 2 Tailwind a déjà migré les `style={{}}` — mais les classes CSS custom restent
4. **~570 className** dans les composants admin, dont seulement ~170 utilisent déjà Tailwind

---

## Décisions architecturales

- **Stratégie** : Tailwind inline dans les composants (zéro `@apply`)
- **Périmètre** : Phase 1 = Admin, Phase 2 = Site public
- **admin-legacy.css** : Suppression immédiate
- **CSS résiduel** : Seul le CSS non-exprimable en Tailwind reste (keyframes, clip-paths complexes, pseudo-éléments décoratifs, variables de thème, sélecteurs complexes)

---

## Phase 0 — Nettoyage immédiat

> Effort : ~30 min | Impact : -2 988 lignes

### 0.1 Supprimer admin-legacy.css
- [x] Supprimé ✅

### 0.2 Supprimer le backup CSS
- [x] Supprimé ✅

### 0.3 Dédupliquer le code inline editor
- [x] Bloc dupliqué supprimé d'admin.css ✅

### 0.4 Dédupliquer le footer
- [x] Copie supprimée d'admin.css ✅

**Résultat Phase 0 : ~-3 180 lignes**

---

## Phase 1 — Admin (admin.css → Tailwind inline)

> Effort : ~2-3 jours | Impact : admin.css passe de 4 208 à ~300 lignes

### Principe de migration par composant

Pour chaque section admin, on :
1. Lit le composant TSX
2. Identifie les classes CSS custom utilisées
3. Remplace chaque classe par des classes Tailwind équivalentes dans `className`
4. Supprime les règles CSS correspondantes d'admin.css
5. Vérifie visuellement que rien ne change

### 1.1 Variables et base — CONSERVÉ (~130 lignes)

Les éléments suivants **restent dans admin.css** car non-exprimables en Tailwind :

```
✗ Variables --bo-* sur .backoffice-body (L1-80)
✗ Variables --back-* sur .is-backoffice (L3360-3400)
✗ Light mode override html:not([data-back-theme="dark"]) (L3400+)
✗ Reset inputs .backoffice-body input:not([type=...]) (L80-127)
✗ Keyframes : pulse-dot, fadeInUp, edit-flash-*, media-* (dispersés)
```

### 1.2 Login Screen (~150 lignes → ~20 lignes CSS)
- [x] `LoginScreen.tsx` migré, CSS interne supprimé ✅
- [x] **Conservé en CSS** : `::before/::after` clip-path montagne, `@keyframes fadeInUp`

### 1.3 Admin Header + Footer (~170 lignes → ~10 lignes CSS)
- [x] `AdminShell.tsx` header/footer inner migré Tailwind, CSS child classes supprimées ✅
- [x] **Conservé en CSS** : `.admin-header::before`, `.admin-footer::after`, `@keyframes pulse-dot`

### 1.4 Tabs + Sidebar + Layout Grid (~300 lignes → ~30 lignes CSS)
- [x] `AdminShell.tsx` — `#backoffice-body`, `bo-logo-cell`, `bo-logo-img`, `bo-section-slot`, `side-nav-label`, `side-nav-sep`, `side-nav-spacer`, `side-nav-footer*` migrés ✅
- [x] **Conservé en CSS** : `.bo-layout-grid`, `#main-tabs`, `.main-tab` (+ hover/active), `.bo-sections-container` (+ scrollbar), `.side-nav`, `.side-nav-link` (+ hover/active/light mode)

### 1.5 Buttons (~40 lignes → gardé)
- [x] `.btn-success`, `.btn-danger` conservés (utilisés dans 18+ endroits) ✅

### 1.6 Section Divider
- [x] `.section-divider`, `.section-divider-label` supprimés (code mort) ✅

### 1.7 Theme Section (~200 lignes → ~0 lignes CSS)
- [x] `ThemeGrid.tsx` migré, `theme-card`→`group`, `theme-label` conditionnel Tailwind ✅
- [x] `.theme-grid`, `.theme-card`, `.theme-swatches`, `.theme-label`, `.theme-badge`, `.theme-creator-content`, `.tc-pickers-label`, `.color-codes`, `.btn-harmony` supprimés ✅
- [x] **Conservé en CSS** : `.harmony-radio-group label:has(input:checked)`

### 1.8–1.23 Nettoyage massif CSS mort
- [x] `.logo-upload-area`, `.logo-preview`, `.logo-preview-img`, `.logo-placeholder`, `.logo-hint`, `.logo-separator`, `.logo-img`, `.footer-logo` (doublon) supprimés ✅
- [x] `.site-form`, `.site-form-group`, `.site-form-category`, `.social-inputs-grid` (doublon, Tailwind inline fait le travail) supprimés ✅
- [x] `.captcha-guide`, `.captcha-guide-*` supprimés ✅
- [x] `.seo-details` supprimé ✅
- [x] `.page-card`, `.page-card-header`, `.page-card-info`, `.page-card-actions`, `.page-card-*` supprimés ✅
- [x] `.section-row`, `.section-row-label`, `.section-row-top` supprimés ✅
- [x] `.block-images-list`, `.block-image-editor`, `.block-image-label`, `.section-subsection-label`, `.block-image-zone`, `.block-image-thumb`, `.block-image-placeholder` supprimés ✅
- [x] `.section-props-editor` et tout son bloc supprimés ✅
- [x] `.section-divider-row`, `.section-divider-type`, `.section-divider-color`, `.section-divider-flip-label`, `.section-divider-controls`, `.section-divider-preview` supprimés ✅
- [x] `.pwd-strength-bar` supprimé (`.pwd-strength-fill` conservé pour transition dynamique) ✅
- [x] `.layout-card`, `.layout-editor`, `.palette-block`, `.palette-icon`, `.layout-canvas`, `.layout-canvas-drop-hint` supprimés ✅
- [x] `.layout-preview-panel`, `.layout-preview-grid`, `.preview-block`, `.preview-title`, `.preview-richtext`, `.preview-*`, `.palette-add-btn`, `@media palette-title` supprimés ✅
- [x] `.border-preview-grid`, `.border-preview-card`, `.border-preview-demo`, `.border-preview-label`, `.border-custom-editor`, `.border-custom-preview*` supprimés ✅
- [x] `.border-corner-input-row`, `.border-corner-val` supprimés ✅
- [x] `.inline-carousel-editor`, `.inline-carousel-dragover`, `.inline-carousel-grid` supprimés ✅
- [x] `.add-section-select`, `.section-carousel-id`, `.section-no-carousel` supprimés ✅
- [x] `.checkbox-label`, `.logo-mode-group`, `logo-mode-option` bases supprimées (`:has` conservé) ✅
- [x] `.grid-add-btn--pick` supprimé ✅
- [x] `.btn-icon-sm` supprimé ✅
- [x] `.site-form`, `.site-form-group`, `.site-form-category` → Tailwind inline (BusinessForm, ConfigSection, FooterSection, PagesSection, LayoutEditor) ✅
- [x] `.page-card*` → Tailwind inline (LayoutsSection/index, SnapshotsSection) ✅
- [x] `.seo-details` → Tailwind inline (PageCard) ✅
- [x] Media queries site public (~55 lignes) supprimées d'admin.css (code mort dupliqué depuis globals.css) ✅
- [x] `.bo-section-title` supprimé (code mort) ✅
- [x] 1.8 `.carousel-section` et famille : **conserve volontairement** (20+ composants l'utilisent)
- [x] 1.9 `.modal`, `.modal-content` : **conserve volontairement** (complexe, utilise partout)
- [x] 1.22 MediaPicker, MediaSourcePicker migrés Tailwind ✅
- [x] 1.23 MediaLibrary (MediaLibrarySection, MediaFilters, MediaGrid, MediaThumb, SelectionBar, MediaPanel, DeleteConfirmModal) migré Tailwind ✅
- [x] **Conservé en CSS** : `@keyframes media-selection-bar-in/media-backdrop-in/media-panel-in`, `.media-source-thumb.selected::after` (SVG), `.btn-sm` déplacé dans section boutons

- [x] CSS site public dupliqué supprimé d'admin.css : `.custom-layout-grid`, `.layout-social`, `.social-btn`, `.footer-grid`, `.footer-block` (déjà dans globals.css) ✅
- [x] Media queries site public (`@media 900px/768px/600px`) supprimées d'admin.css ✅
- [x] `.inline-carousel-footer`, `.inline-carousel-hint`, `.inline-carousel-info` supprimés (migrés Tailwind) ✅
- [x] Régression visuelle corrigée : `.site-form*`, `.page-card*`, `.seo-details` → Tailwind inline ✅

**Résultat Phase 1 à ce jour : admin.css passe de 4 208 à 1 467 lignes (-65%)**

--- vérification complète admin ---

## Phase 2 — Site Public (globals.css → Tailwind inline) ✅ TERMINÉE

> globals.css passe de 1 712 à **1 193 lignes** (-30%)

### Constat post-migration

L'estimation initiale (~400 lignes) était **trop optimiste**. Le site public utilise massivement du CSS incompressible (clip-paths, pseudo-éléments décoratifs, animations keyframes, hover/transitions complexes, sélecteurs composés). Ces éléments ne peuvent pas être exprimés en Tailwind inline.

### CSS incompressible restant dans globals.css (~1 193 lignes)

```
- Variables de thème :root + [data-theme="*"] (~86 lignes, 5 themes)
- @keyframes : slowZoom, fadeInDown, fadeInUp, fadeUp, slideDown, edit-flash-* (~30 lignes)
- clip-path : .btn, .feature-card, .service-card, .gallery-item, .bento-*, .project-*, .stats-bar, .tag-pill, .polaroid-tag, .tag-chip (~120 lignes)
- Pseudo-elements : .section-title::before/::after, .nav-link::after, .hero-overlay::before, .polaroid::before, .btn::before, .feature-card::before, .gallery-item::before/::after, .stat-item::after, .footer::before (~100 lignes)
- Hero slideshow (.hero-slide, #accueil, .hero-overlay gradients) (~80 lignes)
- Hover/transitions complexes (.feature-card:hover, .gallery-item:hover, .bento-card:hover, .polaroid:hover, .service-card:hover, .project-row:hover) (~50 lignes)
- Scroll reveal .section.visible / .reveal.visible (~12 lignes)
- Responsive @media (burger mobile, footer grid, hero titres, custom-layout) (~60 lignes)
- Editeur inline (admin-edit-bar, edit-trigger, is-editing, edit-toolbar, edit-flash) (~150 lignes)
- Social widget (.layout-social, .social-btn, .social-btn-row — DOM dynamique) (~60 lignes)
- Footer base (.footer gradient, .footer-grid avec CSS var, responsive) (~35 lignes)
- Custom layout (h1/h2/h3.layout-title, .layout-richtext p, .layout-image img, .layout-carousel-container, responsive) (~50 lignes)
- Section backgrounds (.section-about/services/gallery/contact avec parallaxe) (~25 lignes)
- Boutons (.btn, .btn-primary, .btn-secondary + hovers) (~55 lignes)
- Sections Nos Travaux (.s1/.s2/.s3, color overrides) (~20 lignes)
- Nav base (.nav, .nav-link::after, hover/active, burger transforms, dropdown state, logo positions) (~60 lignes)
- .header (gradient + box-shadow avec color-mix + animation) (~5 lignes)
- Divers (.section-divider, .section-header overrides, .form-group input focus) (~30 lignes)
```

### 2.1 Reset & Base ✅
- [x] Reset custom supprime (Tailwind preflight)
- [x] `body` → `font-['Raleway',sans-serif] leading-[1.7] text-[var(--text)] bg-[var(--bg)] overflow-x-hidden` sur `<body>` dans layout.tsx
- [x] `html` → `scroll-smooth` sur `<html>` dans layout.tsx
- [x] `.container` → `max-w-[1200px] mx-auto px-5` inline dans tous les composants

### 2.2 Header + Nav ✅
- [x] `SiteHeader.tsx` — `.header` partial (sticky/z-index/padding/backdrop/border inline), `.logo`/`.logo-img`/`.logo-name`/`.logo-tagline` inline, `.nav-center-layout` inline
- [x] `.nav-link` base styles inline (via `navLinkCls` constant), CSS garde hover/active/::after
- [x] `NavBurger.tsx` — base layout inline, CSS garde span transforms + burger-active
- [x] `NavDropdown.tsx` — `.nav-dropdown` relative inline, `.nav-dropdown-toggle` inline, `.nav-dropdown-menu` positionnement inline, `.nav-dropdown-item` inline, CSS garde display toggle + hover/active states
- [x] **Conserve en CSS** : `.header` gradient/box-shadow/animation, `.nav-link::after`, `.nav-link:hover/.active`, burger transforms, dropdown display/hover states, responsive mobile, logo positions

### 2.3 Hero Sections ✅
- [x] `HeroSection.tsx` — `.hero` layout inline, `.hero-content` inline, `.hero-dots` + `.hero-dot` inline
- [x] `HeroSimpleSection.tsx` — `.hero` layout inline, `.hero-content` inline
- [x] **Conserve en CSS** : slideshow transitions, `@keyframes slowZoom/fadeInDown/fadeInUp/fadeUp`, `.hero-overlay::before` scanlines, gradient overlays, `#accueil` hero overrides, `.hero-bg`, `.hero-eyebrow`

### 2.4 Buttons — CONSERVE EN CSS
- [x] **Tout conserve** : `.btn` a clip-path + `::before` shimmer + animation, `.btn-primary/.btn-secondary` hovers. Non migrable en Tailwind.

### 2.5 Sections Accueil ✅
- [x] `AboutSection.tsx` — `.about-content` grid, `.about-text` text styles, `.about-features` grid, `.feature-icon` size, `.feature-card h3/p` inline
- [x] `ServicesSection.tsx` — `.services-grid` grid inline, `.service-icon` size, `.service-card h3/p` inline
- [x] `GallerySection.tsx` — `.gallery-grid` grid inline
- [x] `ContactSection.tsx` — `.contact-form` max-width, `.form-row` grid, `.form-group` margin inline
- [x] **Conserve en CSS** : `.feature-card`/`.service-card`/`.gallery-item` clip-paths + `::before/::after` + hovers, `.section-title::before/::after`, `.section` reveal, section backgrounds, `.form-group input/textarea` clip-path + focus

### 2.6 Sections Nos Travaux ✅
- [x] `BentoGridSection.tsx` — `.bento` grid inline, `.section-header` + `.section-tag` inline, `.bento-hero-text h3/p` inline, `.bento-card-info h4` inline, `.bento-card-overlay p` inline, `.stats-bar` bg/padding inline, `.stat-item/.stat-number/.stat-label` inline
- [x] `CinematicSplitSection.tsx` — `.project-row` grid inline, `.project-text` flex inline, `.project-num` position inline, `.project-text-inner` z-index inline, `.tag-row` flex inline, `h3/p` inline
- [x] `PolaroidsSection.tsx` — `.polaroid-grid` flex inline, `.polaroid-img` size inline, `.polaroid-caption` inline
- [x] **Conserve en CSS** : `.bento-hero/.bento-card` clip-paths + hovers, `.bento-card-overlay` slide-up, `.bento-card-info` gradient, `.stats-bar` clip-path, `.stat-item::after`, `.project-image img` hover, `.project-text/.project-row.reversed` clip-paths, `.tag-pill/.tag-chip` clip-paths, `.polaroid` rotations + `::before` pin + hover, `.s1/.s2/.s3` backgrounds + color overrides

### 2.7 Footer ✅
- [x] `SiteFooter.tsx` — `.footer-block` color inline, tous `h3/h4/p/a` inline dans chaque bloc (logo-desc, contact, hours, legal), `.footer-logo` inline
- [x] **Conserve en CSS** : `.footer` gradient + `::before` bar, `.footer-grid` (CSS var `--footer-cols`), `.footer .social-btn` overrides, responsive `@media`

### 2.8 Inline Editor — CONSERVE EN CSS
- [x] `AdminBar.tsx` deja en Tailwind (pas d'impact)
- [x] **Tout conserve** : `.admin-edit-bar`, `.lang-btn`, `.edit-trigger`, `.edit-toolbar`, `.edit-flash`, `body.admin-mode [data-content-key]:hover`, `.is-editing` — ces elements sont geres par du JS vanilla (DOM manipulation) et ont des etats complexes (`display: none` toggle, absolute positioning, keyframes). Non migrable.

### 2.9 Custom Layout + Social ✅ (partiel)
- [x] `CustomLayoutSection.tsx` — `.custom-layout-grid` grid inline, `.layout-title` margin/color inline, `.layout-richtext` color/leading inline, `.layout-image-placeholder` inline
- [x] **Conserve en CSS** : `h1/h2/h3.layout-title` (selecteurs element), `.layout-richtext p` (child selector), `.layout-image img` (child + dynamic DOM), `.layout-carousel-container` (`:empty::before` pseudo), responsive `@media`
- [x] `FooterSocial.tsx` — **conserve en CSS** : `.layout-social`, `.social-btn`, `.social-btn-row` — DOM dynamique via `document.createElement`, pas de JSX

**Resultat reel Phase 2 : globals.css passe de 1 712 a 1 193 lignes (-30%)**

---

## Resultat final

| Phase | Avant | Apres | Reduction |
|---|---|---|---|
| Phase 0 — Nettoyage | 8 908 lignes (3 fichiers) | 5 750 lignes (2 fichiers) | -3 158 lignes |
| Phase 1 — Admin | 4 208 lignes (admin.css) | 1 483 lignes | -2 725 lignes (-65%) |
| Phase 2 — Site public | 1 712 lignes (globals.css) | 1 193 lignes | -519 lignes (-30%) |
| **Total** | **8 908 lignes (3 fichiers)** | **2 676 lignes (2 fichiers)** | **-6 232 lignes (-70%)** |

### Pourquoi l'estimation initiale etait trop optimiste

L'estimation de ~700 lignes totales (350 admin + 350 globals) supposait que la plupart du CSS pouvait etre migre en Tailwind inline. En realite :

1. **Le site public est beaucoup plus "decoratif" que l'admin** : clip-paths sur presque tous les composants, pseudo-elements decoratifs (punaise polaroid, shimmer bouton, scanlines hero, underline nav), animations keyframes
2. **Les hovers complexes** (`.gallery-item:hover` scale + overlay, `.bento-card:hover` slide-up, `.polaroid:hover` rotate reset) ne sont pas pratiques en Tailwind inline
3. **Le DOM dynamique** (FooterSocial, editeur inline, carousel loader) utilise `classList` et `document.createElement` — impossible de migrer vers `className` JSX
4. **Les selecteurs composes** (`.s2 .section-tag`, `.footer .social-btn`, `body.admin-mode [data-content-key]:hover`) ne peuvent pas etre exprimes en Tailwind
5. **Les responsive queries** doivent rester en CSS car elles ciblent des elements par classe (`.footer-grid`, `.custom-layout-grid`, `.nav`)

Les ~2 676 lignes restantes sont du **CSS genuinement incompressible**.

---

## Historique d'execution

Toutes les phases sont terminees. Voir le detail ci-dessus.

---

## Regles appliquees pendant le refactoring

1. **Un composant a la fois** — jamais plusieurs en parallele
2. **Verification visuelle** apres chaque migration (dark + light mode pour l'admin)
3. **Suppression du CSS** au fur et a mesure — pas de CSS orphelin
4. **Pas de changement de design** — pixel-perfect par rapport a l'existant
5. **Test des interactions** — hover, focus, active, disabled, drag, animations
6. **Arbitrary values Tailwind** : `gap-[0.8rem]`, `text-[0.82rem]`, `bg-[var(--bo-bg)]`
7. **Bridge CSS vars / Tailwind** : `bg-[var(--bo-bg)]`
8. **CSS incompressible garde** : clip-paths, pseudo-elements, keyframes, selecteurs composes, DOM dynamique, responsive queries
