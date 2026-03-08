# Audit de Securite — Nimble (mini CMS)

**Date** : 2026-03-08
**Auditeur** : Claude Opus 4.6
**Scope** : Code source complet (Next.js 16, API routes, auth, uploads, filesystem)

---

## Progression

| Etape | Statut | Findings |
|---|---|---|
| 1. Auth & Sessions | TERMINE | 4 findings (1 haute, 3 moyennes) |
| 2. Routes API admin | TERMINE | 0 finding — toutes protegees |
| 3. Upload de fichiers | TERMINE | 0 finding critique |
| 4. Injections (XSS, path traversal, cmd) | TERMINE | 4 findings (2 hautes, 1 moyenne, 1 info) |
| 5. Exposition de donnees | TERMINE | 1 finding (moyenne) |
| 6. Headers & Config | TERMINE | 2 findings (1 haute, 1 basse) |
| 7. Dependances | BLOQUE | pas de package-lock.json |

---

## Findings

### HAUTE

#### H1 — Secret de session hardcode en fallback

- **Fichier** : `lib/auth/session.ts:6`
- **Description** : Le secret iron-session a un fallback hardcode (`'your-secret-key-change-in-production-32-chars-min'`). Si `SESSION_SECRET` n'est pas defini en production, toutes les sessions sont signees avec ce secret public.
- **Impact** : Un attaquant peut forger des cookies de session valides et acceder au backoffice sans mot de passe.
- **Recommandation** : Supprimer le fallback. Faire crasher l'app au demarrage si `SESSION_SECRET` est absent.
```typescript
// AVANT
password: process.env.SESSION_SECRET || 'your-secret-key-change-in-production-32-chars-min',
// APRES
password: process.env.SESSION_SECRET ?? (() => { throw new Error('SESSION_SECRET is required'); })(),
```

#### H2 — XSS via dangerouslySetInnerHTML (footer richtext)

- **Fichier** : `components/layout/SiteFooter.tsx:90`
- **Description** : Le contenu rich text du footer est injecte via `dangerouslySetInnerHTML={{ __html: b.content }}` sans sanitisation.
- **Impact** : Un admin peut injecter du JavaScript arbitraire qui s'execute pour tous les visiteurs du site.
- **Contexte** : Risque limite car seul un admin authentifie peut modifier ce contenu (self-XSS). Mais si le compte admin est compromis, cela permet une persistance XSS.
- **Recommandation** : Sanitiser avec DOMPurify cote client ou une lib comme `sanitize-html` cote serveur avant stockage.

#### H3 — XSS via ContentEditor innerHTML

- **Fichier** : `components/ui/ContentEditor.tsx:126`
- **Description** : Le ContentEditor injecte du contenu depuis `/api/content` via `el.innerHTML = pageContent[key]` sans sanitisation. Le contenu est stocke sans validation dans `app/api/admin/content/route.ts:23`.
- **Impact** : Meme risque que H2 — XSS persistant via le contenu editable des pages.
- **Contexte** : Egalement self-XSS (admin-only). Le ContentEditor est un editeur inline — l'injection HTML est une fonctionnalite voulue pour le rich text.
- **Recommandation** : Accepter le risque (design inherent d'un CMS) ou ajouter un sanitiseur qui preserve les balises de formatage mais bloque `<script>`, `onerror`, etc.

#### H4 — Pas de Content Security Policy (CSP)

- **Fichier** : `next.config.js`
- **Description** : Les headers de securite incluent X-Frame-Options, X-Content-Type-Options, Referrer-Policy mais pas de CSP.
- **Impact** : Sans CSP, les attaques XSS (H2, H3) peuvent executer du JavaScript inline sans restriction. Un CSP strict bloquerait l'execution meme si du HTML malveillant est injecte.
- **Recommandation** : Ajouter un header CSP minimal :
```
Content-Security-Policy: default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:;
```

### MOYENNE

#### M1 — Cookie secure conditionnel

- **Fichier** : `lib/auth/session.ts:11`
- **Description** : `secure: process.env.COOKIE_SECURE === 'true'` — le flag secure du cookie n'est actif que si la variable est explicitement `'true'`. Si oubliee en production, le cookie est envoye en HTTP clair.
- **Impact** : Interception du cookie de session sur un reseau non-chiffre (MITM).
- **Recommandation** : Inverser la logique — secure par defaut sauf en dev :
```typescript
secure: process.env.NODE_ENV === 'production' || process.env.COOKIE_SECURE === 'true',
```

#### M2 — Rate limiting en memoire

- **Fichier** : `app/api/auth/login/route.ts` (Map en memoire)
- **Description** : Le rate limiting utilise une `Map` en memoire. Il est perdu a chaque redemarrage du serveur ou si plusieurs instances tournent.
- **Impact** : Un attaquant peut relancer le brute-force apres chaque restart. En multi-instance, le rate limiting est contourne.
- **Contexte** : Pour un mini CMS mono-instance, le risque est faible. Problematique uniquement si deploye en cluster.
- **Recommandation** : Acceptable pour l'usage actuel. Pour un deploiement serieux, utiliser un store externe (Redis, fichier).

#### M3 — IP spoofable via x-forwarded-for

- **Fichier** : `app/api/auth/login/route.ts`, `app/api/contact/route.ts`
- **Description** : L'IP est extraite via `req.headers.get('x-forwarded-for')` qui est spoofable si le reverse proxy ne l'ecrase pas.
- **Impact** : Contournement du rate limiting en changeant le header X-Forwarded-For.
- **Recommandation** : S'assurer que le reverse proxy (Hostinger/Nginx) ecrase le header X-Forwarded-For. Alternativement, utiliser l'IP de connexion directe.

#### M4 — Exposition potentielle de la config mail

- **Fichier** : `app/api/site/route.ts` (public, sans auth)
- **Description** : L'endpoint GET `/api/site` retourne la config complete via `readSiteConfig()`. Si la config contient des parametres mail (SMTP host, credentials), ils sont exposes publiquement.
- **Impact** : Fuite d'information potentielle (credentials SMTP).
- **Recommandation** : Filtrer les champs sensibles avant de retourner la config publique. Ne jamais stocker de credentials dans `site.json`.

#### M5 — XSS via customRadius dans le layout site

- **Fichier** : `app/(site)/layout.tsx:48-50`
- **Description** : Les valeurs `site.design.customRadius.{tl,tr,br,bl}` sont interpolees directement dans un script inline via `dangerouslySetInnerHTML`.
- **Impact** : Si un admin injecte du JavaScript dans un champ radius (ex: `1px'; alert('xss'); '`), il s'execute pour tous les visiteurs.
- **Contexte** : Self-XSS (admin-only input). Les valeurs devraient etre numeriques.
- **Recommandation** : Parser les valeurs en `Number()` ou `parseInt()` avant interpolation :
```typescript
const tl = Number(site.design.customRadius.tl) || 0;
```

### BASSE

#### B1 — Pas de package-lock.json

- **Fichier** : racine du projet
- **Description** : Le fichier `package-lock.json` a ete supprime. Impossible de lancer `npm audit` pour verifier les vulnerabilites connues des dependances.
- **Impact** : Pas de verification automatisee des CVE dans les dependances.
- **Recommandation** : Regenerer avec `npm i --package-lock-only` et committer.

### INFO

#### I1 — Validation JSON absente sur les routes admin

- **Fichiers** : `app/api/admin/site/route.ts`, `app/api/admin/pages/route.ts`, `app/api/admin/content/route.ts`
- **Description** : Les body JSON des requetes admin sont ecrits directement dans les fichiers JSON sans validation Zod cote serveur. Les types TypeScript n'offrent aucune protection runtime.
- **Impact** : Un admin (ou un attaquant avec session volee) peut corrompre les fichiers de config en envoyant du JSON malformed.
- **Contexte** : Toutes ces routes sont protegees par `withAuth`. Le risque est limite a un admin malveillant ou une session compromise.
- **Recommandation** : Ajouter des schemas Zod pour valider les body avant ecriture. Les schemas existent deja dans `lib/schemas/` — les reutiliser cote serveur.

#### I2 — Editeur de contenu inline = HTML arbitraire par design

- **Description** : Le CMS permet aux admins d'editer du HTML inline (ContentEditor). C'est une fonctionnalite voulue, pas un bug. Cela implique que le contenu des pages peut contenir du HTML/JS arbitraire.
- **Contexte** : Tous les CMS (WordPress, Ghost, etc.) ont ce "probleme". C'est inherent au concept.
- **Recommandation** : Documenter que le backoffice ne doit etre accessible qu'a des personnes de confiance.

---

## Details par etape

### 1. Auth & Sessions — TERMINE

**Fichiers analyses** :
- `lib/auth/session.ts` — config iron-session
- `lib/auth/withAuth.ts` — middleware d'authentification
- `lib/auth/password.ts` — bcrypt verify/hash, priorite hash
- `app/api/auth/login/route.ts` — rate limiting, bcrypt verify
- `app/api/auth/logout/route.ts` — session.destroy()
- `app/api/auth/check/route.ts` — verification session

**Points positifs** :
- iron-session avec cookie httpOnly + sameSite strict
- bcrypt pour le hashing (cout par defaut)
- Rate limiting sur le login (10 tentatives / 15 min)
- Session de 8h max

**Findings** : H1, M1, M2, M3

### 2. Routes API admin — TERMINE

**Resultat** : 31 routes admin analysees, **100% protegees par withAuth**.

Chaque methode HTTP (GET, POST, PUT, DELETE, PATCH) est individuellement wrappee. Aucune route admin non protegee.

**Findings** : aucun

### 3. Upload de fichiers — TERMINE

**Fichiers analyses** :
- `app/api/admin/media/upload/route.ts`
- `app/api/admin/upload/[carouselId]/route.ts`
- `app/api/admin/logo/route.ts`
- `app/api/admin/favicon/route.ts`
- `app/api/admin/social-icon/route.ts`
- `app/uploads/[...path]/route.ts` (serving public)

**Points positifs** :
- Whitelist MIME stricte (image/jpeg, image/png, image/webp, image/svg+xml)
- Limite de taille (5 MB media, 1 MB favicon)
- Noms de fichiers generes (timestamp + random), jamais fournis par l'utilisateur
- Protection path traversal sur le serving (`path.resolve` + `startsWith`)
- `path.basename()` utilise pour la suppression d'images

**Findings** : aucun critique

### 4. Injections — TERMINE

**XSS** :
- 5 usages de `dangerouslySetInnerHTML` trouves
- 2 vulnerables (H2 footer richtext, M5 customRadius)
- 2 securises (scripts hardcodes anti-FOUC)
- 1 securise (DividerRow SVG depuis constantes)
- ContentEditor utilise `innerHTML` avec contenu non sanitise (H3)

**Command injection** : aucun usage de `exec`, `spawn`, `child_process` — SECURISE

**Prototype pollution** : aucun `Object.assign` avec input utilisateur — SECURISE

**Path traversal** : protection en place sur tous les endpoints fichiers — SECURISE

**SSRF** : aucun endpoint qui fait des requetes basees sur des URLs utilisateur — SECURISE

**Findings** : H2, H3, M5

### 5. Exposition de donnees — TERMINE

- `/api/site` (public) retourne la config complete — M4
- `/api/pages` (public) retourne la structure des pages — OK (donnees publiques)
- `/api/carousel/[id]/images` (public) retourne les images — OK (donnees publiques)

**Findings** : M4

### 6. Headers & Config — TERMINE

**Headers presents** (next.config.js) :
- X-Frame-Options: DENY
- X-Content-Type-Options: nosniff
- Referrer-Policy: strict-origin-when-cross-origin
- X-DNS-Prefetch-Control: on

**Manquants** :
- Content-Security-Policy (H4)
- Strict-Transport-Security (HSTS) — si HTTPS est force par Hostinger, OK
- Permissions-Policy

**Findings** : H4, B1

### 7. Dependances — BLOQUE

`package-lock.json` absent — impossible de lancer `npm audit`.

**Findings** : B1

---

## Resume

| Severite | Count | IDs |
|---|---|---|
| CRITIQUE | 0 | — |
| HAUTE | 4 | H1, H2, H3, H4 |
| MOYENNE | 5 | M1, M2, M3, M4, M5 |
| BASSE | 1 | B1 |
| INFO | 2 | I1, I2 |
| **Total** | **12** | |

**Verdict global** : Le code est globalement bien securise pour un mini CMS. Les protections auth (withAuth sur 100% des routes admin), upload (MIME whitelist, safe filenames, path traversal checks) et contact (rate limiting, HTML escaping) sont solides. Les findings principaux concernent le hardcoded secret (H1, facile a corriger), les XSS lies au rich text (H2/H3, inherent a un CMS), et l'absence de CSP (H4).
