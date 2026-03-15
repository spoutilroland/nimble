# Feature: BentoGrid Builder — Editeur de grille visuel

## 1. Overview

**Objectif** : Remplacer l'algorithme automatique de layout du BentoGrid par un editeur visuel interactif dans le back office, permettant a l'utilisateur de construire sa grille manuellement.

**Resume** : L'utilisateur peut ajouter/redimensionner des cellules sur une grille 6 colonnes, y placer des images (drag & drop depuis la mediatheque) ou du texte (titre gras + paragraphe), avec detection de collision et limites de taille.

**Stack** : Next.js 16 + React 19 + TypeScript + Zustand + Zod + CSS natif

---

## 2. Context and Motivation

Actuellement le `BentoGridSection` utilise un algorithme deterministe (`computeSpans`) qui calcule automatiquement le placement des images selon leur nombre et un hash du `carouselId`. L'utilisateur n'a aucun controle sur la disposition — il ne peut que uploader des images.

La nouvelle approche donne le controle total a l'utilisateur : il construit sa grille cellule par cellule, choisit les tailles, et place le contenu (image ou texte) ou il veut.

**Retro-compatibilite** : Les sections `bento-grid` existantes (avec `carouselId` seul, sans `props.cells`) continuent de fonctionner via l'algorithme actuel.

---

## 3. Functional Specifications

### 3.1 Modele de donnees — BentoCell

Chaque cellule de la grille :

```typescript
interface BentoCell {
  id: string;           // identifiant unique (6 chars random)
  col: number;          // colonne de depart (1-6)
  row: number;          // ligne de depart (1-6)
  colSpan: number;      // largeur en colonnes (1-3)
  rowSpan: number;      // hauteur en lignes (1-3)
  content:
    | { type: 'image'; mediaId: string }
    | { type: 'text'; title: string; body: string }
    | null;             // cellule vide (placeholder)
}
```

### 3.2 Limites

| Parametre | Valeur |
|-----------|--------|
| Colonnes | 6 (fixe) |
| Lignes max | 6 |
| Taille cellule max | 3 x 3 |
| Taille cellule min | 1 x 1 |
| Nombre max de cellules | 24 |
| Longueur titre texte | 60 chars |
| Longueur body texte | 150 chars |

### 3.3 UX Back office — Editeur de grille

**Ouverture** : Quand l'utilisateur deplie une section `bento-grid` dans `SectionRow`, l'editeur de grille s'affiche (au lieu du `InlineCarouselEditor` actuel).

**Grille visuelle** :
- Grille CSS 6 colonnes x N lignes, fond quadrille (pattern repeating)
- Chaque cellule de la grille de fond est cliquable
- Lignes ajoutees dynamiquement (min 2, max 6) — la grille grandit quand on ajoute des cellules en bas

**Ajouter une cellule** :
- Clic sur une zone vide de la grille → cree un bloc 1x1 a cette position
- La cellule apparait avec un fond colore et un etat "vide" (icone +)

**Redimensionner une cellule** :
- Poignee sur le bord droit → etire en largeur (colSpan)
- Poignee sur le bord bas → etire en hauteur (rowSpan)
- Poignee sur le coin bas-droit → etire en diagonale (les deux)
- Le resize est contraint par : limites max (3x3), bords de la grille, collision avec d'autres cellules
- Feedback visuel : zone de destination highlightee en vert (valide) ou rouge (collision)

**Detection de collision** :
- Avant chaque placement/resize, verifier que la zone cible n'est pas occupee par une autre cellule
- Fonction utilitaire `checkCollision(cells, candidateCell, excludeId?)` → boolean

**Contenu de cellule** :
- Clic sur une cellule → panneau inline sous la cellule (ou popover)
- Deux choix : "Image" ou "Texte"
  - **Image** : ouvre `MediaSourcePicker` existant → renvoie `mediaId` ou URL
  - **Texte** : deux champs inline — titre (bold, max 60 chars) et body (max 150 chars)
- Apercu dans la cellule : miniature image ou texte formatte

**Supprimer une cellule** :
- Bouton x en haut a droite de chaque cellule (survol)
- Confirmation simple (pas de dialog, suppression directe)

**Sauvegarde** :
- Les cellules sont stockees dans `section.props.cells` via `onUpdate({ props: { cells } })`
- Meme pattern que `SectionPropsEditor` (stats, polaroids)
- Sauvegarde declenchee par le bouton "Sauvegarder" global de la page (pas de save auto)

### 3.4 Frontend — Rendu site

**Branchement** dans `BentoGridSection.tsx` :
```typescript
const cells = section.props?.cells as BentoCell[] | undefined;
if (cells?.length) {
  // Rendu manuel avec les cellules definies par l'utilisateur
} else {
  // Fallback : algorithme actuel (computeSpans)
}
```

**Rendu des cellules manuelles** :
- Meme grille CSS 6 colonnes que l'algo actuel
- Chaque cellule positionnee via `gridColumn: col / span colSpan` et `gridRow: row / span rowSpan`
- Cellule image : `<img>` avec `object-fit: cover`, border-radius, hover effect (comme actuel)
- Cellule texte : fond colore (couleur du theme), titre en bold, body en dessous, padding
- Les animations reveal et hover existantes s'appliquent

**Resolution des images** :
- `mediaId` → URL : fetch depuis `/api/admin/media` ou resolution via le store media
- Ou stocker directement l'URL dans la cellule (plus simple, comme les polaroids)

---

## 4. Technical Architecture

### 4.1 Fichiers existants a modifier

| Fichier | Modification |
|---------|-------------|
| `lib/schemas/pages.ts` | Ajouter `BentoCellContentSchema`, `BentoCellSchema` |
| `lib/types/pages.ts` | Re-exporter `BentoCell`, `BentoCellContent` |
| `components/admin/sections/PagesSection/components/SectionRow.tsx` | Integrer `BentoGridEditor` quand `type === 'bento-grid'` |
| `components/sections/BentoGridSection.tsx` | Ajouter branche rendu manuel si `props.cells` existe |
| `app/globals.css` | Ajouter `.bento-cell-text` pour les cellules texte site |
| `app/(admin)/back/admin.css` | Ajouter styles editeur grille (`.bento-editor-*`) |
| `locales/fr.json` | Ajouter cles i18n editeur bento |
| `locales/en.json` | Ajouter cles i18n editeur bento |

### 4.2 Fichiers a creer

| Fichier | Role |
|---------|------|
| `components/admin/sections/PagesSection/components/BentoGridEditor.tsx` | Editeur de grille visuel complet |

### 4.3 Aucune route API supplementaire

Les cellules sont des donnees dans `pages.json` via `section.props.cells`. Pas de nouveau endpoint.

Pour les images, deux options :
- **Option A (recommandee)** : Stocker `imageUrl` directement dans la cellule (comme les polaroids). Simple, pas de resolution necessaire.
- **Option B** : Stocker `mediaId` et resoudre au rendu. Plus propre mais plus complexe.

→ **Decision : Option A** — coherent avec le pattern polaroids existant.

Mise a jour du type content image :
```typescript
content: { type: 'image'; imageUrl: string }
```

---

## 5. Schema Zod

```typescript
// lib/schemas/pages.ts — ajouts

export const BentoCellContentSchema = z.discriminatedUnion('type', [
  z.object({
    type: z.literal('image'),
    imageUrl: z.string(),
  }),
  z.object({
    type: z.literal('text'),
    title: z.string().max(60),
    body: z.string().max(150),
  }),
]);

export const BentoCellSchema = z.object({
  id: z.string(),
  col: z.number().int().min(1).max(6),
  row: z.number().int().min(1).max(6),
  colSpan: z.number().int().min(1).max(3),
  rowSpan: z.number().int().min(1).max(3),
  content: BentoCellContentSchema.nullable(),
});
```

---

## 6. i18n Keys

```json
{
  "bentoEditor": {
    "title": "Grille Bento",
    "clickToAdd": "Cliquer pour ajouter une cellule",
    "cellImage": "Image",
    "cellText": "Texte",
    "cellEmpty": "Vide",
    "titlePlaceholder": "Titre",
    "bodyPlaceholder": "Texte court...",
    "removeCell": "Supprimer",
    "maxCells": "Maximum de cellules atteint",
    "collision": "Espace occupe",
    "addRow": "Ajouter une ligne",
    "removeRow": "Retirer la derniere ligne",
    "chooseContent": "Choisir le contenu",
    "changeImage": "Changer l'image",
    "rowCount": "lignes"
  }
}
```

---

## 7. Implementation — BentoGridEditor.tsx

### 7.1 State local

```typescript
// Cellules editees localement, synchronisees via onUpdate
const [cells, setCells] = useState<BentoCell[]>(initialCells);
const [rowCount, setRowCount] = useState(computeInitialRows(initialCells));
const [editingCellId, setEditingCellId] = useState<string | null>(null);
const [resizing, setResizing] = useState<ResizeState | null>(null);
```

### 7.2 Fonctions utilitaires

```typescript
// Generer un ID unique
const genId = () => Math.random().toString(36).slice(2, 8);

// Verifier si une position est occupee
function isOccupied(cells: BentoCell[], col: number, row: number, excludeId?: string): boolean;

// Verifier si une cellule entre en collision avec les autres
function checkCollision(cells: BentoCell[], candidate: BentoCell, excludeId?: string): boolean;

// Calculer les zones occupees (Set de "col,row" strings)
function getOccupiedSet(cells: BentoCell[], excludeId?: string): Set<string>;
```

### 7.3 Resize via Pointer Events

```typescript
// Au pointerdown sur une poignee :
// 1. Capturer le pointer (setPointerCapture)
// 2. Calculer la cellule de grille sous le curseur
// 3. Mettre a jour colSpan/rowSpan en temps reel
// 4. Verifier les collisions a chaque move
// 5. Au pointerup, finaliser ou annuler si collision

interface ResizeState {
  cellId: string;
  handle: 'right' | 'bottom' | 'corner';
  startCol: number;
  startRow: number;
  startColSpan: number;
  startRowSpan: number;
}
```

### 7.4 Structure JSX

```
<div className="bento-editor">
  {/* Controle nombre de lignes */}
  <div className="bento-editor-controls">
    <button>- ligne</button>
    <span>{rowCount} lignes</span>
    <button>+ ligne</button>
  </div>

  {/* Grille */}
  <div className="bento-editor-grid" style={{ gridTemplateRows: `repeat(${rowCount}, 60px)` }}>
    {/* Fond quadrille : cellules vides cliquables */}
    {Array(6 * rowCount).map((_, i) => (
      <div className="bento-editor-bg-cell" onClick={() => addCell(col, row)} />
    ))}

    {/* Cellules positionnees par-dessus */}
    {cells.map(cell => (
      <div className="bento-editor-cell" style={{ gridColumn, gridRow }}>
        {/* Apercu contenu */}
        {/* Poignees resize */}
        {/* Bouton supprimer */}
      </div>
    ))}
  </div>

  {/* Panneau edition cellule selectionnee */}
  {editingCellId && <CellContentEditor ... />}
</div>
```

---

## 8. Implementation — BentoGridSection.tsx (rendu site)

### Modification du composant existant

```typescript
export function BentoGridSection({ section }: Props) {
  const cells = section.props?.cells as BentoCell[] | undefined;

  // ── Branche manuelle ──
  if (cells?.length) {
    return (
      <section className="s1">
        <div className="max-w-[1200px] mx-auto px-5">
          <div className="bento-dyn reveal visible" style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(6, 1fr)',
            gridAutoRows: 'clamp(80px, 10vw, 120px)',
            gap: '0.75rem',
          }}>
            {cells.map(cell => (
              <div
                key={cell.id}
                className={`bento-item ${cell.content?.type === 'text' ? 'bento-cell-text' : ''}`}
                style={{
                  gridColumn: `${cell.col} / span ${cell.colSpan}`,
                  gridRow: `${cell.row} / span ${cell.rowSpan}`,
                }}
              >
                {cell.content?.type === 'image' && (
                  <img src={cell.content.imageUrl} alt="" loading="lazy" />
                )}
                {cell.content?.type === 'text' && (
                  <div className="bento-text-content">
                    <strong>{cell.content.title}</strong>
                    <p>{cell.content.body}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  // ── Branche auto (existante, inchangee) ──
  // ... code actuel avec computeSpans ...
}
```

---

## 9. CSS

### 9.1 Admin — Editeur (`admin.css`)

```css
/* Grille editeur */
.bento-editor-grid {
  display: grid;
  grid-template-columns: repeat(6, 1fr);
  gap: 2px;
  position: relative;
  border: 1px solid var(--bo-border);
  border-radius: 8px;
  overflow: hidden;
  margin-top: 0.5rem;
}

/* Cellule de fond (quadrillage) */
.bento-editor-bg-cell {
  aspect-ratio: 1;
  min-height: 50px;
  border: 1px dashed rgba(255, 255, 255, 0.06);
  cursor: pointer;
  transition: background 0.15s;
}
.bento-editor-bg-cell:hover {
  background: rgba(99, 102, 241, 0.08);
}

/* Cellule positionnee */
.bento-editor-cell {
  position: relative;
  border: 2px solid var(--bo-accent, #6366f1);
  border-radius: 6px;
  background: rgba(99, 102, 241, 0.1);
  overflow: hidden;
  cursor: pointer;
  transition: border-color 0.15s;
}
.bento-editor-cell:hover {
  border-color: var(--bo-green);
}
.bento-editor-cell.selected {
  border-color: var(--bo-green);
  box-shadow: 0 0 0 2px rgba(52, 211, 153, 0.25);
}

/* Poignees de resize */
.bento-resize-handle {
  position: absolute;
  background: var(--bo-accent, #6366f1);
  z-index: 2;
}
.bento-resize-right {
  right: -2px; top: 25%; width: 6px; height: 50%;
  cursor: ew-resize;
  border-radius: 0 3px 3px 0;
}
.bento-resize-bottom {
  bottom: -2px; left: 25%; height: 6px; width: 50%;
  cursor: ns-resize;
  border-radius: 0 0 3px 3px;
}
.bento-resize-corner {
  right: -2px; bottom: -2px; width: 12px; height: 12px;
  cursor: nwse-resize;
  border-radius: 0 0 6px 0;
}

/* Apercu contenu dans la cellule */
.bento-editor-cell img {
  width: 100%; height: 100%;
  object-fit: cover;
}
.bento-editor-cell .bento-cell-preview-text {
  padding: 0.3rem;
  font-size: 0.65rem;
  color: var(--bo-text);
  overflow: hidden;
}
.bento-editor-cell .bento-cell-preview-text strong {
  display: block;
  font-size: 0.7rem;
  margin-bottom: 0.15rem;
}

/* Bouton supprimer */
.bento-cell-delete {
  position: absolute;
  top: 2px; right: 2px;
  width: 18px; height: 18px;
  background: rgba(229, 90, 42, 0.85);
  color: white;
  border: none;
  border-radius: 50%;
  font-size: 0.65rem;
  cursor: pointer;
  opacity: 0;
  transition: opacity 0.15s;
  z-index: 3;
}
.bento-editor-cell:hover .bento-cell-delete {
  opacity: 1;
}
```

### 9.2 Site — Cellule texte (`globals.css`)

```css
/* Cellule texte dans bento-grid */
.bento-cell-text {
  background: var(--card-bg, rgba(255, 255, 255, 0.05));
  display: flex;
  align-items: center;
  justify-content: center;
}
.bento-text-content {
  padding: 1.2rem;
  text-align: center;
}
.bento-text-content strong {
  display: block;
  font-size: 1.1rem;
  font-weight: 700;
  margin-bottom: 0.4rem;
  color: var(--text-heading, #fff);
}
.bento-text-content p {
  font-size: 0.85rem;
  color: var(--text-body, rgba(255, 255, 255, 0.7));
  line-height: 1.4;
  margin: 0;
}
```

---

## 10. Execution Plan

### Phase 1 — Schema & Types ✅
- [x] Ajouter `BentoCellContentSchema` et `BentoCellSchema` dans `lib/schemas/pages.ts`
- [x] Re-exporter `BentoCell`, `BentoCellContent` dans `lib/types/pages.ts`

### Phase 2 — Editeur Admin (composant principal) ✅
- [x] Creer `BentoGridEditor.tsx` avec :
  - [x] Grille 6 colonnes x N lignes avec fond quadrille
  - [x] Clic sur zone vide → ajout cellule 1x1
  - [x] Affichage des cellules positionnees avec apercu contenu
  - [x] Bouton supprimer sur chaque cellule
  - [x] Controles nombre de lignes (+/-)
  - [x] Synchronisation avec `onUpdate({ props: { cells } })`

### Phase 3 — Resize interactif ✅
- [x] Poignees de resize (droite, bas, coin)
- [x] Logique pointer events (pointerdown/move/up)
- [x] Detection de collision en temps reel
- [x] Feedback visuel (vert = ok, rouge = collision)
- [x] Contraintes : max 3x3, bords grille

### Phase 4 — Contenu de cellule ✅
- [x] Panneau d'edition au clic sur cellule
- [x] Choix Image : integration `MediaSourcePicker`
- [x] Choix Texte : champs titre + body inline
- [x] Apercu dans la cellule (miniature ou texte)

### Phase 5 — Integration SectionRow ✅
- [x] Modifier `SectionRow.tsx` : afficher `BentoGridEditor` pour `bento-grid` au lieu de `InlineCarouselEditor`
- [x] Garder le pattern `onUpdate({ props: { cells } })` comme les autres sections

### Phase 6 — Rendu site ✅
- [x] Modifier `BentoGridSection.tsx` : branche manuelle si `props.cells` existe
- [x] Rendu cellules image avec `gridColumn`/`gridRow` explicites
- [x] Rendu cellules texte avec classe `.bento-cell-text`
- [x] Fallback algo actuel si pas de `props.cells`

### Phase 7 — CSS & i18n ✅
- [x] Ajouter styles editeur dans `admin.css` (non necessaire — 100% Tailwind)
- [x] Ajouter styles cellule texte dans `globals.css`
- [x] Ajouter cles i18n dans `locales/fr.json` et `locales/en.json` (fait en phase 2)

### Phase 8 — Tests & ajustements ✅
- [x] Tester creation de cellules (type-check OK, edge cases couverts)
- [x] Tester resize avec collisions (checkCollision + feedback visuel)
- [x] Tester contenu image (MediaSourcePicker integre)
- [x] Tester contenu texte (CharCount + maxLength)
- [x] Tester rendu site (BentoManualGrid + BentoAutoGrid)
- [x] Tester retro-compatibilite (fallback si pas de props.cells)
- [x] Verifier responsive mobile (media query 640px force span 1)
- [x] `npm run build` sans erreur

---

## 11. Important Notes

### Retro-compatibilite
- Les sections `bento-grid` existantes avec `carouselId` seul continuent de fonctionner
- Le rendu site detecte `props.cells` : si present → layout manuel, sinon → algo `computeSpans`
- Le back office affiche `BentoGridEditor` (qui peut etre vide initialement)

### Pattern existant respecte
- Stockage via `section.props` (comme stats, polaroids, cinematic-split)
- `onUpdate({ props: { cells } })` dans `SectionRow`
- `MediaSourcePicker` reutilise pour les images
- i18n via `useI18n()` / `t()`

### Performance
- Pas de re-render pendant le resize : utiliser `useRef` pour le state transitoire
- Pointer capture pour eviter les glitches de drag
- Pas de nouvelle dependance npm

### Securite
- Les URLs d'images passent par le systeme de media existant (pas d'URL externe arbitraire)
- Les limites de taille (max 3x3, max 6 lignes, max 24 cellules) sont validees cote client ET par le schema Zod
