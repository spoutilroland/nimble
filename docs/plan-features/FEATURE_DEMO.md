# Feature : Mode Demo Live

## Contexte

Branche `demo` — pull depuis `main`, **JAMAIS mergee sur main**.
Deploiement dedie pour permettre a des visiteurs de tester Nimble en conditions reelles, avec des gardes-fous pour empecher les abus.

---

## Principes

- Pas d'ecran de connexion admin : le visiteur arrive directement en mode admin
- Certaines features destructrices ou sensibles sont desactivees
- Un set d'images pre-chargees (~50) est present et ne peut pas etre supprime
- Les modifications du visiteur (textes, sections, etc.) sont possibles mais ephemeres (reset auto apres 30 min d'inactivite)

---

## Decisions (questions reglees)

### Q1 — Reset des donnees → B + C

- Reset automatique apres **30 minutes d'inactivite** (aucun visiteur actif)
- Bouton **"Reset demo"** visible pour que le visiteur puisse reinitialiser lui-meme

### Q2 — Scope du back-office → Custom

- **Onglet Security** : supprime (masque)
- **Onglet Configuration** : sous-section Contact supprimee
- **Onglet Contenu (Pages)** :
  - Max **10 pages** creees
  - Max **15 sections** par page
  - Max **10 sections personnalisees**
- **Onglet Design** :
  - Max **5 themes** crees
- **Onglet Media** :
  - Mediathque accessible
  - Max **5 dossiers** creables
  - Images selectionnables
  - Bouton suppression **grise** (disabled)
  - Rename, reorientation, deplacement vers dossier : OK
  - **Pas d'upload** depuis le PC
- Upload media bloque partout (back-office + sidebar)

### Q3 — Sidebar site (SidebarEditor) → Oui avec limites

- Sidebar **entierement fonctionnelle**
- Limite de **15 sections** par page (coherent avec Q2)
- Upload uniquement via la **mediatheque** (pas depuis le PC)
- Suppression d'images des sections : **OK** (ne supprime pas de la mediatheque)

### Q4 — Indicateur visuel → A (bandeau permanent)

- Bandeau permanent en haut du site et du back-office
- Texte : "Mode Demo — Tout est reinitialise apres 30 min d'inactivite"
- Contient un **lien vers le back-office**

### Q5 — Acces au site public → A (live)

- Le site public reflete les modifications en temps reel
- C'est le but de la demo : montrer le CMS en action

### Q6 — Contact / email → A + B

- Formulaire present mais **n'envoie rien**
- Affiche un **toast "Email simule envoye !"** pour que le visiteur voie le feedback

### Q7 — Implementation technique → C (env var + fichier config)

- `DEMO_MODE=true` dans `.env` de la branche demo (source de verite)
- `data/demo.json` pour la **configuration** du mode demo (limites, textes, etc.)

### Q8 — Images demo → A (committees dans le repo)

- ~50 images committees dans le repo (branche demo uniquement)
- Stockees dans `public/uploads/` (ou `data/media/`)
- Protegees contre la suppression

---

## Features desactivees / protegees (resume)

| Feature | Comportement demo |
|---------|-------------------|
| Login admin | Bypasse — acces direct au dashboard |
| Changement de mot de passe | Masque (onglet Security supprime) |
| Upload media (PC) | Bloque partout (back-office + sidebar) |
| Suppression media | Bouton grise (images demo protegees) |
| Section Contact (config) | Masquee |
| Envoi email contact | Simule (toast sans envoi reel) |
| Creation pages | Max 10 |
| Sections par page | Max 15 |
| Sections personnalisees | Max 10 |
| Themes | Max 5 |
| Dossiers mediatheque | Max 5 |

---

## Plan d'implementation

### Phase 1 : Infrastructure demo

1. ✅ **Creer `data/demo.json`** — fichier de config avec toutes les limites
2. ✅ **Helper `isDemoMode()`** — `lib/demo.ts` (serveur) + `/api/demo/config` (client)
3. ✅ **Hook `useDemoMode()`** — `lib/hooks/useDemoMode.ts`
4. ⏳ **Snapshot de reference** — script pour sauvegarder l'etat initial (Phase 5)

### Phase 2 : Guards back-office

5. ✅ **Masquer l'onglet Security** dans `AdminShell.tsx` (filtre `DEMO_HIDDEN_TABS`)
6. ✅ **Masquer la sous-section Contact Reply** via `getDemoFilteredSections()` dans registry
7. ✅ **Bloquer l'upload** :
   - ✅ `MediaSourcePicker` : va directement à la library en demo (skip écran "choice")
   - ✅ `MediaLibrarySection` (drop zone) : ignore les drops de fichiers si demo, bouton import masqué
   - ✅ API routes upload : `demoBlock()` sur upload media, upload carousel, logo POST/DELETE, favicon POST/DELETE
   - ✅ API route password : `demoBlock()` sur POST
   - ✅ API route media delete : `demoBlock()` sur DELETE unitaire et bulk-delete
   - ✅ `withAuth` bypass auth en demo (pas de session nécessaire)
8. ✅ **Griser le bouton suppression media** :
   - ✅ `MediaPanel` : prop `disableDelete` grise le bouton
   - ✅ `SelectionBar` : `onDelete` optionnel, bouton grisé si absent
9. ✅ **Appliquer les limites de creation** :
   - ✅ Pages : max 10 (guard API `/api/admin/pages`)
   - ✅ Sections par page : max 15 (guard API `/api/admin/pages`)
   - ✅ Sections personnalisees : max 10 (guard API `/api/admin/pages`)
   - ✅ Themes : max 5 (guard API `/api/admin/theme/custom`)
   - ✅ Dossiers mediatheque : max 5 (guard API `/api/admin/media/folders` + bouton masqué si limite)

### Phase 3 : Guards sidebar site

10. ✅ **SidebarEditor** : upload PC bloqué via `MediaSourcePicker` (skip écran choice en demo) + API routes upload retournent 403
11. ✅ **Limiter les sections** : passe par la même API `/api/admin/pages` qui a les guards
12. ✅ **Suppression d'images de section** : autorisee (pas de changement necessaire)

### Phase 4 : Bandeau demo + bypass login

13. ✅ **Bandeau demo sur le site** : `AdminBar.tsx` remplace "Administration" par bandeau demo amber avec lien `/back`
14. ✅ **Bandeau demo sur le back-office** : `DemoBanner.tsx` affiche en haut du dashboard
15. ✅ **Bypass login** : `AdminShell.tsx` skip `checkSession()` + `/api/auth/check` retourne `valid: true` en demo
16. ✅ **Masquer bouton logout** en mode demo dans `AdminShell.tsx`

### Phase 5 : Reset & contact

17. ✅ **Bouton "Reset demo"** :
    - ✅ Bouton dans `DemoBanner.tsx` (back-office)
    - ✅ API `POST /api/demo/reset` restaure le snapshot
    - ✅ `lib/demo-reset.ts` : `createDemoSnapshot()` + `restoreDemoSnapshot()`
    - ✅ Snapshot créé automatiquement au premier appel `/api/demo/config`
18. ✅ **Reset auto inactivite** :
    - ✅ Heartbeat client toutes les 5 min (`POST /api/demo/heartbeat`)
    - ✅ Timer serveur vérifie toutes les minutes, reset si >30 min d'inactivité
    - ✅ Initialisé au premier appel `/api/demo/config`
19. ✅ **Formulaire contact** :
    - ✅ Si demo → retourne succes simulé sans appeler nodemailer
    - ✅ Réponse JSON avec `demo: true` pour que le client affiche le toast approprié

### Phase 6 : Images demo

20. ⏳ **Preparer ~50 images** libres de droits → les placer dans `uploads/media/demo-raw/` (TODO HUMAIN)
21. ✅ **Script `demo-init.mjs`** : traite les images (resize, webp, thumb) + met à jour `media.json` + crée le snapshot
22. ✅ **Snapshot initial** : créé automatiquement par le script `demo-init.mjs`

### Phase 7 : Parcours guidé (onboarding)

23. ✅ **Configuration du tour** : `lib/tour/config.ts` — 8 étapes, 5 tips, helpers cookie
24. ✅ **Composant GuidedTour** : `components/admin/shared/GuidedTour.tsx` — CoachMark + TipToast + positionnement intelligent
25. ✅ **Intégration dans AdminShell** : rendu conditionnel `{isDemo && <GuidedTour />}`
26. ✅ **Lint + Build** : compilation vérifiée sans erreur

### Ce que tu dois faire manuellement

1. **Récupérer ~50 images** libres de droits (Unsplash, Pexels, Pixabay...)
   - Mix de paysages, architecture, portraits, objets, textures
   - Format JPG ou PNG, taille ~1920px minimum
   - Les placer dans `uploads/media/demo-raw/`

2. **Lancer le script** :
   ```bash
   node scripts/demo-init.mjs
   ```
   Le script :
   - Redimensionne à max 1920px
   - Génère les WebP + thumbnails
   - Met à jour `data/media.json`
   - Crée le snapshot dans `data/demo-snapshot/`

3. **Committer le tout** sur la branche `demo` (images + media.json + snapshot)

4. **Configurer `.env`** sur le serveur de demo avec `DEMO_MODE=true`
