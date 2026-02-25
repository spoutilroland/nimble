# Contributing to Nimble

Merci de l'intérêt pour le projet ! Voici comment contribuer.

## Avant de commencer

- Vérifie qu'une [issue](https://github.com/spoutilroland/nimble/issues) n'existe pas déjà pour ton problème ou ta suggestion
- Pour les changements importants, ouvre une issue d'abord pour en discuter

## Workflow

1. **Fork** le repo et clone ton fork
2. **Crée une branche** depuis `main` :
   ```bash
   git checkout -b fix/nom-du-bug
   # ou
   git checkout -b feat/nom-de-la-feature
   ```
3. **Code** ton changement
4. **Vérifie** que le projet build sans erreur :
   ```bash
   npm ci
   npm run lint
   npm run build
   ```
5. **Commit** avec un message clair (voir convention ci-dessous)
6. **Ouvre une Pull Request** vers `main`

## Convention de commits

```
feat: ajouter le support des blocs vidéo
fix: corriger l'upload de favicon sur Safari
docs: mettre à jour le README
refactor: extraire la logique de ThemeSection dans un hook
```

## Ce qu'on accepte

- Corrections de bugs ✅
- Améliorations de performance ✅
- Nouvelles sections ou blocs de contenu ✅
- Traductions (FR/EN ou autres langues) ✅
- Améliorations de la documentation ✅

## Ce qu'on n'accepte pas

- Ajout de base de données (le stockage JSON est une contrainte volontaire)
- Dépendances lourdes sans discussion préalable

## Développement local

**Prérequis** : Node.js 20+

```bash
git clone <ton-fork> nimble
cd nimble
npm install
cp .env.example .env
npm run dev
```

Back-office disponible sur `http://localhost:3000/back` (login: `admin` / `changeme123`).
