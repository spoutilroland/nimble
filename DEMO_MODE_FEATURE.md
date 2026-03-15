# Feature : Mode Demo (Vercel)

## Concept

Heberger une instance de demo sur Vercel free tier (`nimble-demo.vercel.app`).
Le visiteur arrive sur un site pre-rempli, teste le back office, et tout se reset automatiquement grace au filesystem ephemere de Vercel.

## Setup Vercel (une seule fois)

1. Creer un projet Vercel lie au repo GitHub de Nimble
2. Variables d'environnement :
   - `DEMO_MODE=true`
   - `SESSION_SECRET=...` (32+ chars)
   - `BLOB_READ_WRITE_TOKEN=...` (Vercel Blob, gratuit 500 Mo)
3. Push sur une branche `demo` → Vercel deploie automatiquement

## Flux visiteur

```
Visiteur clique "Essayer Nimble"
  → arrive sur demo.nimble.dev (Vercel)
  → bootstrap : Blob charge le contenu demo (site vitrine, images, pages)
  → le visiteur voit un beau site d'exemple
  → bandeau fixe : "Mode demo"
  → bouton : "Acceder au back office"
  → il modifie des trucs, teste les sections, upload des images
  → tout fonctionne (ecrit dans le filesystem ephemere)
  → il part
  → apres ~5-15 min d'inactivite, Vercel recycle l'instance
  → le prochain visiteur retrouve le site demo d'origine (clean)
```

## Ce qu'il faut coder cote Nimble

### 1. `DEMO_MODE=true` bloque le sync Blob

Toutes les fonctions d'ecriture Blob (`syncJsonToBlob`, `uploadToBlob`, `appendMediaToBlob`, etc.) deviennent des no-op en mode demo. Les ecritures restent en local (filesystem ephemere) : elles marchent le temps de la session mais disparaissent au cold start.

### 2. Le bootstrap Blob charge les donnees demo

Au demarrage, `bootstrapDataFromBlob()` restaure un contenu de demonstration pre-prepare (site vitrine avec pages, images, theme, etc.). Le Blob contient le "backup de demo" qui sert de source de verite.

### 3. Bandeau + bouton sur le site public

- Bandeau fixe en haut : "Mode demo — les donnees sont reinitialisees regulierement"
- Bouton fixe en haut a droite : "Acceder au back office"
- Visible uniquement quand `DEMO_MODE=true`

### 4. Login desactive ou pre-rempli

- Soit acces direct au back office sans mot de passe
- Soit mot de passe pre-rempli dans le formulaire de login (ex: `demo` / `demo`)

### 5. Features sensibles desactivees

- Changement de mot de passe : masque
- Envoi de mails : desactive
- Section securite : message "Non disponible en mode demo"

## Preparation du contenu demo

Creer un backup ZIP (via la feature export/import) contenant :
- Un site vitrine attrayant (artisan, restaurant, ou photographe)
- 3-4 pages avec sections variees (hero, galerie, services, contact)
- 10-15 images de demo (libres de droits)
- Theme personnalise
- Footer configure

Uploader ce contenu dans le Vercel Blob du projet demo.

## Limites du free tier Vercel

- Serverless : 100 GB-heures/mois (largement suffisant)
- Blob : 500 Mo gratuits
- Bandwidth : 100 Go/mois
- URL gratuite : `nimble-demo.vercel.app`

## Limite connue : pas d'isolation par visiteur

Vercel ne cree pas une instance par visiteur. Si deux personnes testent en meme temps, elles partagent le meme filesystem ephemere. En pratique, c'est rarement un probleme (peu de visiteurs simultanes sur une demo).
