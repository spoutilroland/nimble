**FR | [EN](README.md)**

# Nimble

Un CMS léger, sans base de données, pour les sites vitrines. Gérez les pages, sections, carrousels, thème, contenu et formulaire de contact depuis un back-office — tout est stocké en fichiers JSON.

## Stack

- **Framework** : Next.js 16 + React 19 + TypeScript
- **Auth** : iron-session + bcryptjs
- **État** : Zustand (admin) + Zod (validation)
- **Uploads** : Sharp (redimensionnement auto & conversion WebP)
- **Email** : Nodemailer (SMTP)
- **Style** : Tailwind CSS v4 + variables CSS natives
- **Stockage** : Fichiers JSON — pas de base de données

## Fonctionnalités

- Back-office visuel sur `/back` avec mode sombre/clair
- Constructeur de pages : ajout/réorganisation de sections (hero, à propos, galerie, services, stats, contact…)
- Gestionnaire de carrousels avec tri des images par glisser-déposer
- Constructeur de mises en page sur grille
- Éditeur de thème : thèmes natifs + générateur de palette personnalisée
- Upload de logo, favicon et médias
- Constructeur de pied de page (blocs : coordonnées, horaires, liens sociaux, carte…)
- Formulaire de contact avec SMTP + support captcha (Turnstile, reCAPTCHA, hCaptcha)
- Back-office bilingue (FR / EN)

---

## Développement local

**Prérequis** : Node.js 20+

```bash
git clone <repo-url> nimble
cd nimble
npm install
cp .env.example .env   # à éditer avec vos paramètres
npm run dev            # http://localhost:3000
```

Back-office : `http://localhost:3000/back`
Identifiants par défaut : `admin` / `changeme123`

> Changez votre mot de passe via les paramètres du back-office à la première connexion.
> Il sera haché avec bcrypt et stocké dans `data/admin.json`.

---

## Production — Docker sur Ubuntu

### 1. Installer Docker et Git

```bash
# Dépendances
sudo apt update && sudo apt install -y git curl

# Docker (méthode officielle)
curl -fsSL https://get.docker.com | sudo sh

# Ajouter votre utilisateur au groupe docker (évite sudo)
sudo usermod -aG docker $USER
newgrp docker
```

### 2. Cloner et déployer

```bash
git clone <repo-url> nimble
cd nimble
bash deploy.sh
```

Le script va :
1. Vérifier que Docker est installé
2. Créer `.env` depuis `.env.example` si absent et vous inviter à l'éditer
3. Valider que `SESSION_SECRET` fait au moins 32 caractères
4. Construire l'image Docker et démarrer le container

Application : `http://<ip-serveur>:3000` — Back-office : `http://<ip-serveur>:3000/back`

### Volumes persistants

| Volume | Chemin dans le container | Contenu |
|--------|--------------------------|---------|
| `nimble_data` | `/app/data` | Fichiers JSON |
| `nimble_uploads` | `/app/public/uploads` | Images uploadées |

Les données sont initialisées depuis les valeurs par défaut au premier démarrage et ne sont jamais écrasées lors des redémarrages suivants.

### Commandes utiles

```bash
docker compose logs -f          # Voir les logs en direct
docker compose down             # Arrêter le container
docker compose up -d --build    # Mettre à jour après git pull
```

---

## Variables d'environnement

Voir `.env.example` pour toutes les options disponibles.

| Variable | Description |
|---|---|
| `ADMIN_USERNAME` | Identifiant du back-office (défaut : `admin`) |
| `ADMIN_PASSWORD` | Mot de passe temporaire pour la première connexion |
| `SESSION_SECRET` | Chaîne aléatoire pour la signature de session — **minimum 32 caractères** |
| `EMAIL_HOST` | Hôte SMTP |
| `EMAIL_PORT` | Port SMTP |
| `EMAIL_USER` | Nom d'utilisateur SMTP |
| `EMAIL_PASS` | Mot de passe SMTP |
| `EMAIL_FROM` | Adresse expéditeur |
| `EMAIL_TO` | Destinataire des soumissions du formulaire de contact |
| `CAPTCHA_SECRET_KEY` | Clé secrète côté serveur pour la validation du captcha |

Générer un secret de session sécurisé :
```bash
openssl rand -base64 32
```

---

## Structure du projet

```
nimble/
├── app/
│   ├── (site)/             # Site public (SSR)
│   ├── (admin)/back/       # Back-office
│   └── api/                # Routes API REST (34 endpoints)
├── components/
│   ├── admin/              # Composants back-office (sections, shell, login)
│   └── site/               # Composants du site public
├── lib/
│   ├── admin/              # Registry, constantes, stores Zustand
│   ├── i18n/               # Internationalisation (FR/EN)
│   ├── schemas/            # Schémas Zod
│   └── utils/              # Utilitaires partagés
├── data/                   # Données JSON (persistées via volume Docker)
│   ├── site.json           # Infos entreprise, SEO, polices, design
│   ├── pages.json          # Pages et sections
│   ├── carousels.json      # Définitions des carrousels + refs images
│   ├── layouts.json        # Mises en page grille personnalisées
│   ├── theme.json          # Thème actif + thèmes personnalisés
│   ├── content.json        # Textes éditables en ligne
│   └── media.json          # Registre des médias
├── locales/                # Fichiers de traduction (fr.json, en.json)
├── public/
│   └── uploads/            # Images uploadées (persistées via volume Docker)
├── Dockerfile
├── docker-compose.yml
├── entrypoint.sh
└── deploy.sh
```

---

## Licence

Ce projet est sous licence MIT. Voir le fichier [LICENSE](LICENSE) pour plus de détails.