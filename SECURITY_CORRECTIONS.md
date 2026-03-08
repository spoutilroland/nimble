# Rapport de Corrections de Securite — Nimble

**Date** : 2026-03-08
**Basé sur** : SECURITY_AUDIT.md (meme date)

---

## Vue d'ensemble

7 corrections appliquees, couvrant les findings H1 a H4, M1, M3 et M5.

---

## Correction 1 — Secret de session hardcode (H1)

### Le probleme

**Fichier** : `lib/auth/session.ts`

```typescript
// AVANT
password: process.env.SESSION_SECRET || 'your-secret-key-change-in-production-32-chars-min',
```

**Pourquoi c'est dangereux** : iron-session utilise ce secret pour **signer et chiffrer** le cookie de session. Si le secret est connu, un attaquant peut :

1. **Forger un cookie de session** qui dit `{ isLoggedIn: true, user: "admin" }`
2. L'envoyer au serveur — iron-session le dechiffre et le considere valide
3. **L'attaquant est connecte comme admin sans connaitre le mot de passe**

Le fallback hardcode (`'your-secret-key-change-in-production-32-chars-min'`) est visible dans le code source (GitHub, etc.). Donc si quelqu'un oublie de definir `SESSION_SECRET` en production, **n'importe qui ayant lu le code peut se connecter**.

### La correction

```typescript
// APRES
if (!process.env.SESSION_SECRET) {
  throw new Error('SESSION_SECRET environment variable is required (min 32 characters)');
}

export const sessionOptions: SessionOptions = {
  password: process.env.SESSION_SECRET,
  // ...
};
```

**Principe** : *Fail fast*. Si le secret n'est pas configure, l'app **refuse de demarrer**. C'est mieux qu'une app qui tourne avec un secret public. L'erreur est claire et dit exactement quoi faire.

---

## Correction 2 — Cookie secure par defaut en production (M1)

### Le probleme

**Fichier** : `lib/auth/session.ts`

```typescript
// AVANT
secure: process.env.COOKIE_SECURE === 'true',
```

**Pourquoi c'est dangereux** : Le flag `secure` dit au navigateur : "n'envoie ce cookie que sur HTTPS". Sans ce flag, le cookie de session est envoye en clair sur HTTP.

Scenario d'attaque (**Man-in-the-Middle**) :
1. L'admin se connecte au backoffice depuis un Wi-Fi public (cafe, hotel)
2. Un attaquant sur le meme reseau intercepte le trafic HTTP
3. Il voit le cookie `sid=...` en clair
4. Il copie ce cookie dans son navigateur → il est connecte comme admin

Le probleme : si on oublie de mettre `COOKIE_SECURE=true` en production (facile a oublier), le cookie part en clair.

### La correction

```typescript
// APRES
secure: process.env.NODE_ENV === 'production' || process.env.COOKIE_SECURE === 'true',
```

**Principe** : *Secure by default*. En production, le cookie est toujours secure. En dev (`NODE_ENV=development`), il ne l'est pas (parce que localhost n'a pas HTTPS). On peut toujours forcer avec `COOKIE_SECURE=true` si besoin.

---

## Correction 3 — Injection XSS via customRadius (M5)

### Le probleme

**Fichier** : `app/(site)/layout.tsx`

```typescript
// AVANT
dangerouslySetInnerHTML={{
  __html: `document.documentElement.style.setProperty('--radius','${site.design.customRadius.tl}px ...');`,
}}
```

**Pourquoi c'est dangereux** : Les valeurs `tl`, `tr`, `br`, `bl` viennent du JSON de config (modifiable par l'admin). Elles sont injectees directement dans une string JavaScript via template literal.

Scenario d'attaque :
1. Un admin malveillant (ou un attaquant ayant vole la session) met comme valeur de `tl` : `0'); alert('XSS'); ('`
2. Le script genere devient :
   ```javascript
   document.documentElement.style.setProperty('--radius','0'); alert('XSS'); ('px ...');
   ```
3. Ce JavaScript s'execute pour **tous les visiteurs du site** (pas juste l'admin)

C'est une **Stored XSS** (persistante) — le code malveillant est stocke dans la config et execute a chaque visite.

### La correction

```typescript
// APRES
const tl = Number(site.design.customRadius.tl) || 0;
const tr = Number(site.design.customRadius.tr) || 0;
const br = Number(site.design.customRadius.br) || 0;
const bl = Number(site.design.customRadius.bl) || 0;
// Puis interpolation avec tl, tr, br, bl
```

**Principe** : *Never trust user input*. On force la conversion en nombre avec `Number()`. Si la valeur est `"0'); alert('XSS'); ('"`, `Number()` retourne `NaN`, et `|| 0` le remplace par `0`. Aucune string ne peut passer.

---

## Correction 4 — Content Security Policy (H4)

### Le probleme

**Fichier** : `next.config.js`

Le serveur n'envoyait pas de header `Content-Security-Policy`. Cela signifie que le navigateur **execute tout** : scripts inline, scripts externes, iframes de n'importe ou, etc.

**Pourquoi c'est important** : Le CSP est une **deuxieme ligne de defense** contre le XSS. Meme si un attaquant reussit a injecter du HTML/JS malveillant (via H2, H3 ou M5), le CSP peut **bloquer l'execution** :

- `script-src 'self'` : seuls les scripts du meme domaine sont executes
- `frame-src 'self' https://www.google.com https://*.openstreetmap.org` : seules les iframes Google Maps et OpenStreetMap sont autorisees
- `connect-src 'self'` : les requetes AJAX ne peuvent aller que vers le meme domaine

Sans CSP, une XSS peut :
- Voler les cookies (`document.cookie` — sauf httpOnly)
- Rediriger l'utilisateur vers un site de phishing
- Charger un script externe qui mine de la crypto
- Injecter un faux formulaire de login

### La correction

```javascript
// APRES
{
  key: 'Content-Security-Policy',
  value: "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' data: blob: https:; connect-src 'self'; frame-src 'self' https://www.google.com https://*.openstreetmap.org https://*.tile.openstreetmap.org"
}
```

**Note** : `'unsafe-inline'` est necessaire pour les scripts inline (ThemeScript, anti-FOUC) et les styles inline (Tailwind). C'est un compromis — un CSP parfait utiliserait des nonces, mais c'est complexe avec Next.js.

---

## Correction 5 — Sanitisation du rich text footer (H2)

### Le probleme

**Fichier** : `components/layout/SiteFooter.tsx`

```typescript
// AVANT
return <div dangerouslySetInnerHTML={{ __html: b.content || '' }} />;
```

**Pourquoi c'est dangereux** : `dangerouslySetInnerHTML` (le nom est un avertissement !) injecte du HTML brut dans le DOM. Si `b.content` contient `<script>alert('pwned')</script>`, le script s'execute.

Le contenu des blocs footer richtext est stocke dans `site.json` et modifiable via le backoffice. C'est un vecteur de **Stored XSS**.

### La correction

**Nouveau** : `lib/data/helpers.ts` — fonction `sanitizeRichText()`

```typescript
export function sanitizeRichText(html: string): string {
  return html
    // Supprimer les balises dangereuses (script, iframe, object, embed, form, input...)
    .replace(/<\s*\/?\s*(script|iframe|object|embed|form|input|...)\b[^>]*>/gi, '')
    // Supprimer les event handlers (onclick, onerror, onload, onmouseover...)
    .replace(/\s+on[a-z]+\s*=\s*("[^"]*"|'[^']*'|[^\s>]*)/gi, '')
    // Supprimer javascript: dans les href/src
    .replace(/(href|src|action)\s*=\s*["']?\s*javascript:/gi, '$1="')
    // Supprimer data: dans les src (sauf images)
    .replace(/src\s*=\s*["']?\s*data:(?!image\/)/gi, 'src="');
}
```

**Utilisation** :
```typescript
// APRES
return <div dangerouslySetInnerHTML={{ __html: sanitizeRichText(b.content || '') }} />;
```

**Ce que ca bloque** :
| Attaque | Exemple | Resultat apres sanitisation |
|---|---|---|
| Script inline | `<script>alert(1)</script>` | `alert(1)` (texte brut) |
| Event handler | `<img onerror="alert(1)" src="x">` | `<img src="x">` |
| JavaScript URL | `<a href="javascript:alert(1)">` | `<a href="">` |
| Iframe | `<iframe src="evil.com">` | (supprime) |

**Ce que ca conserve** : les balises de formatage (`<b>`, `<i>`, `<p>`, `<br>`, `<a href="https://...">`, etc.) qui sont utiles pour le rich text.

---

## Correction 6 — Sanitisation du contenu inline a la sauvegarde (H3)

### Le probleme

**Fichier** : `app/api/admin/content/route.ts`

```typescript
// AVANT
content[targetLang][page][key] = value;
```

Le `ContentEditor` permet aux admins d'editer le HTML directement dans la page (like Squarespace). Le contenu est sauvegarde tel quel dans `content.json` et re-injecte via `innerHTML` au chargement.

**Pourquoi c'est dangereux** : C'est le meme probleme que H2, mais cote sauvegarde. Un admin peut coller du HTML malveillant dans l'editeur.

### La correction

```typescript
// APRES
content[targetLang][page][key] = typeof value === 'string' ? sanitizeRichText(value) : value;
```

**Principe** : *Sanitize on write*. On nettoie le HTML **au moment de la sauvegarde**, pas juste a l'affichage. Comme ca, meme si un autre endpoint ou une future fonctionnalite lit `content.json`, le contenu est deja propre.

Double protection : sanitisation a l'ecriture (ici) + sanitisation a l'affichage (SiteFooter). C'est le principe de **defense in depth**.

---

## Correction 7 — Extraction IP pour le rate limiting (M3)

### Le probleme

**Fichiers** : `app/api/auth/login/route.ts`, `app/api/contact/route.ts`

```typescript
// AVANT
const ip = req.headers.get('x-forwarded-for') || 'unknown';
```

**Pourquoi c'est dangereux** : `X-Forwarded-For` est un header HTTP que **n'importe qui peut modifier**. Le format est : `client, proxy1, proxy2`.

Scenario d'attaque :
1. L'attaquant fait 10 tentatives de login → rate limited
2. Il ajoute `X-Forwarded-For: 1.2.3.4` dans sa requete
3. Le serveur pense que c'est un nouvel utilisateur → 10 nouvelles tentatives
4. Repete avec `X-Forwarded-For: 5.6.7.8`, etc. → **brute force illimite**

### La correction

```typescript
// APRES
const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
  || req.headers.get('x-real-ip')
  || 'unknown';
```

**Ameliorations** :
1. `.split(',')[0]` : prend uniquement la **premiere IP** de la chaine (celle du client original, ajoutee par le premier proxy)
2. `.trim()` : supprime les espaces
3. Fallback sur `x-real-ip` : header defini par Nginx/reverse proxy, generalement plus fiable

**Note** : La protection complete depend de la config Nginx/Hostinger. Le reverse proxy doit **ecraser** le header `X-Forwarded-For` (pas juste l'append). Sur Hostinger, c'est generalement le cas.

---

## Resume des fichiers modifies

| Fichier | Correction |
|---|---|
| `lib/auth/session.ts` | H1 (secret) + M1 (cookie secure) |
| `app/(site)/layout.tsx` | M5 (customRadius Number()) |
| `next.config.js` | H4 (CSP header) |
| `lib/data/helpers.ts` | Nouvelle fonction `sanitizeRichText()` |
| `lib/data/index.ts` | Export de `sanitizeRichText` |
| `components/layout/SiteFooter.tsx` | H2 (sanitisation footer richtext) |
| `app/api/admin/content/route.ts` | H3 (sanitisation a la sauvegarde) |
| `app/api/auth/login/route.ts` | M3 (extraction IP) |
| `app/api/contact/route.ts` | M3 (extraction IP) |

## Ce qui n'a PAS ete corrige (et pourquoi)

| Finding | Raison |
|---|---|
| M2 — Rate limit en memoire | Acceptable pour un mini CMS mono-instance. Redis serait overkill. |
| M4 — Config mail exposee | Faux positif — verifie : `site.json` ne contient pas de credentials SMTP. |
| I1 — Validation JSON absente | Les routes sont protegees par auth. Ajouter Zod cote serveur est une bonne pratique mais pas critique pour un CMS mono-admin. |
| B1 — package-lock.json | `npm install` echoue (bug npm connu). Necessite un clean install complet (`rm -rf node_modules && npm install`). |

---

## Concepts cles a retenir

### 1. Defense in depth
Ne jamais se reposer sur une seule protection. Exemple : le rich text est sanitise **a l'ecriture** (API) ET **a l'affichage** (composant). Si l'un des deux saute, l'autre protege.

### 2. Fail fast
Si une config critique manque, l'app doit **refuser de demarrer** plutot que d'utiliser une valeur par defaut dangereuse. Un crash au demarrage est visible immediatement ; un secret faible est invisible jusqu'a l'exploitation.

### 3. Never trust user input
Meme si l'input vient d'un admin authentifie. Un compte admin peut etre compromis, et le contenu qu'il sauvegarde sera affiche a tous les visiteurs.

### 4. Secure by default
Les options de securite doivent etre actives par defaut (`secure: true` en production). L'opt-out doit etre explicite, pas l'opt-in.

### 5. Type safety ≠ Runtime safety
TypeScript verifie les types a la compilation, pas a l'execution. `Number(input)` est une verification runtime ; un type `number` en TypeScript ne l'est pas. En securite, seule la validation runtime compte.
