**[FR](CONTRIBUTING.fr.md) | EN**

# Contributing to Nimble

Thank you for your interest in the project! Here's how to contribute.

## Before you start

- Check that an [issue](https://github.com/spoutilroland/nimble/issues) doesn't already exist for your problem or suggestion
- For significant changes, open an issue first to discuss it

## Workflow

1. **Fork** the repo and clone your fork
2. **Create a branch** from `main`:
   ```bash
   git checkout -b fix/bug-name
   # or
   git checkout -b feat/feature-name
   ```
3. **Code** your change
4. **Verify** the project builds without errors:
   ```bash
   npm ci
   npm run lint
   npm run build
   ```
5. **Commit** with a clear message (see convention below)
6. **Open a Pull Request** to `main`

## Commit convention

```
feat: add video block support
fix: fix favicon upload on Safari
docs: update README
refactor: extract ThemeSection logic into a hook
```

## What we accept

- Bug fixes ✅
- Performance improvements ✅
- New sections or content blocks ✅
- Translations (FR/EN or other languages) ✅
- Documentation improvements ✅

## What we don't accept

- Adding a database (JSON storage is an intentional constraint)
- Heavy dependencies without prior discussion

## Local development

**Requirements**: Node.js 20+

```bash
git clone <your-fork> nimble
cd nimble
npm install
cp .env.example .env
npm run dev
```

Back-office available at `http://localhost:3000/back` (login: `admin` / `changeme123`).
