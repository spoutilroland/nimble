**[FR](README.fr.md) | EN**

# Nimble

A lightweight, database-free CMS for showcase websites. Manage pages, sections, carousels, theme, content and contact form entirely from a back-office — all stored in JSON files.

## Stack

- **Framework**: Next.js 16 + React 19 + TypeScript
- **Auth**: iron-session + bcryptjs
- **State**: Zustand (admin) + Zod (validation)
- **Uploads**: Sharp (auto-resize & WebP conversion)
- **Email**: Nodemailer (SMTP)
- **Styling**: Tailwind CSS v4 + native CSS variables
- **Storage**: JSON files — no database

## Features

- Visual back-office at `/back` with dark/light mode
- Page builder: add/reorder sections (hero, about, gallery, services, stats, contact…)
- Carousel manager with drag-and-drop image ordering
- Layout builder with a grid-based canvas
- Theme editor: native themes + custom color palette generator
- Logo, favicon and media uploads
- Footer builder (blocks: contact info, opening hours, social links, map…)
- Contact form with SMTP + captcha support (Turnstile, reCAPTCHA, hCaptcha)
- Bilingual back-office (FR / EN)

---

## Local Development

**Requirements**: Node.js 20+

```bash
git clone <repo-url> nimble
cd nimble
npm install
cp .env.example .env   # edit with your settings
npm run dev            # http://localhost:3000
```

Back-office: `http://localhost:3000/back`
Default login: `admin` / `changeme123`

> Change your password via the back-office settings on first login.
> It will be hashed with bcrypt and stored in `data/admin.json`.

---

## Production — Docker on Ubuntu

### 1. Install Docker and Git

```bash
# Dépendances
sudo apt update && sudo apt install -y git curl

# Docker (méthode officielle)
curl -fsSL https://get.docker.com | sudo sh

# Ajouter votre utilisateur au groupe docker (évite sudo)
sudo usermod -aG docker $USER
newgrp docker
```

### 2. Clone and deploy

```bash
git clone <repo-url> nimble
cd nimble
bash deploy.sh
```

The script will:
1. Check Docker is installed
2. Create `.env` from `.env.example` if missing and prompt you to edit it
3. Validate that `SESSION_SECRET` is at least 32 characters
4. Build the Docker image and start the container

App: `http://<server-ip>:3000` — Back-office: `http://<server-ip>:3000/back`

### Persistent volumes

| Volume | Path in container | Content |
|--------|------------------|---------|
| `nimble_data` | `/app/data` | JSON data files |
| `nimble_uploads` | `/app/public/uploads` | Uploaded images |

Data is initialized from defaults on first start and never overwritten on subsequent restarts.

### Useful commands

```bash
docker compose logs -f          # View live logs
docker compose down             # Stop the container
docker compose up -d --build    # Update after git pull
```

---

## Environment Variables

See `.env.example` for all available options.

| Variable | Description |
|---|---|
| `ADMIN_USERNAME` | Back-office login (default: `admin`) |
| `ADMIN_PASSWORD` | Temporary password for first login |
| `SESSION_SECRET` | Random string for session signing — **minimum 32 characters** |
| `EMAIL_HOST` | SMTP host |
| `EMAIL_PORT` | SMTP port |
| `EMAIL_USER` | SMTP username |
| `EMAIL_PASS` | SMTP password |
| `EMAIL_FROM` | Sender address |
| `EMAIL_TO` | Recipient for contact form submissions |
| `CAPTCHA_SECRET_KEY` | Server-side secret for captcha validation |

Generate a secure session secret:
```bash
openssl rand -base64 32
```

---

## Project Structure

```
nimble/
├── app/
│   ├── (site)/             # Public site (SSR)
│   ├── (admin)/back/       # Back-office
│   └── api/                # REST API routes (34 endpoints)
├── components/
│   ├── admin/              # Back-office components (sections, shell, login)
│   └── site/               # Public site components
├── lib/
│   ├── admin/              # Registry, constants, Zustand stores
│   ├── i18n/               # Internationalization (FR/EN)
│   ├── schemas/            # Zod schemas
│   └── utils/              # Shared utilities
├── data/                   # JSON data (persisted via Docker volume)
│   ├── site.json           # Business info, SEO, fonts, design
│   ├── pages.json          # Pages and sections
│   ├── carousels.json      # Carousel definitions + image refs
│   ├── layouts.json        # Custom grid layouts
│   ├── theme.json          # Active theme + custom themes
│   ├── content.json        # Inline-editable text content
│   └── media.json          # Media registry
├── locales/                # Translation files (fr.json, en.json)
├── public/
│   └── uploads/            # Uploaded images (persisted via Docker volume)
├── Dockerfile
├── docker-compose.yml
├── entrypoint.sh
└── deploy.sh
```

---

## License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.