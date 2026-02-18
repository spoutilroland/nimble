# Showcase Website

A lightweight, database-free mini CMS built with Node.js and Express. Manage a showcase website entirely from a back-office: pages, sections, carousels, content, theme and contact form — all stored in JSON files.

## Stack

- **Backend**: Node.js + Express + EJS
- **Auth**: Session-based with bcrypt
- **Uploads**: Multer + Sharp (auto-resize & WebP conversion)
- **Email**: Nodemailer (SMTP)
- **Storage**: JSON files + `uploads/` folder — no database

## Quick Start

```bash
npm install
cp .env.example .env   # then edit .env with your settings
npm run dev            # starts on http://localhost:3000
```

Back-office: `http://localhost:3000/back`
Default login: `admin` / `changeme123`

> **Before going to production**, change your password via the back-office settings.
> It will be hashed with bcrypt and stored in `data/admin.json` automatically.

## Project Structure

```
showcase-website/
├── server.js           # Express server + all routes
├── config.js           # App configuration
├── middleware/auth.js  # Session authentication
├── data/
│   ├── site.json       # Business info, SEO, fonts, design
│   ├── pages.json      # Pages and sections
│   ├── carousels.json  # Carousel definitions + image refs
│   ├── media.json      # Centralized media registry
│   ├── theme.json      # Active theme + custom themes
│   └── content.json    # Inline-editable text content
├── views/
│   ├── page.ejs        # Main page template
│   ├── backoffice.ejs  # Admin panel
│   └── sections/       # Section templates (hero, gallery, contact…)
├── public/
│   ├── css/style.css
│   └── js/
│       ├── backoffice.js
│       └── content-editor.js
└── uploads/
    ├── media/          # All site images
    ├── logo/
    └── favicon/
```

## Environment Variables

See `.env.example` for all available options. Key variables:

| Variable | Description |
|---|---|
| `ADMIN_USERNAME` | Back-office login |
| `ADMIN_PASSWORD` | Temporary password for first login (then change via back-office) |
| `SESSION_SECRET` | Random string for session signing |
| `EMAIL_*` | SMTP config for contact form |
| `CAPTCHA_SECRET_KEY` | Turnstile / reCAPTCHA / hCaptcha |

## Production

```bash
# Process manager
pm2 start server.js --name showcase

# Nginx reverse proxy → port 3000 + certbot for SSL
# After enabling SSL, set upgradeInsecureRequests: [] in server.js (CSP)
```

Migration between machines: copy `.env`, `uploads/`, `data/`, then `npm install`.

## License

ISC
