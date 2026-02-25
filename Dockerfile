# ─── Stage 1 : Build ───────────────────────────────────────────
FROM node:20-alpine AS builder
WORKDIR /app

# Installer les dépendances
COPY package*.json ./
RUN npm ci

# Copier les sources et builder
COPY . .
RUN npm run build

# ─── Stage 2 : Runner ──────────────────────────────────────────
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

# Utilisateur non-root pour la sécurité
RUN addgroup --system --gid 1001 nodejs \
 && adduser --system --uid 1001 nextjs

# Copier le build standalone (server.js + node_modules runtime + data + locales)
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone/nimble/ ./

# Fichiers statiques et assets publics
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=builder --chown=nextjs:nodejs /app/public ./public

# Sauvegarder les données par défaut (hors admin.json, géré via variables d'env)
RUN cp -r data data-defaults && rm -f data-defaults/admin.json

# Préparer les répertoires persistants (volumes Docker)
RUN mkdir -p data public/uploads \
 && chown -R nextjs:nodejs data data-defaults public/uploads

# Script d'initialisation
COPY --chown=nextjs:nodejs entrypoint.sh ./
RUN chmod +x entrypoint.sh

USER nextjs

EXPOSE 3000

ENTRYPOINT ["./entrypoint.sh"]
