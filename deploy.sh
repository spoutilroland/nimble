#!/bin/bash
# ═══════════════════════════════════════════════════════════════
#  Nimble — Script de déploiement initial
#  Usage : bash deploy.sh
# ═══════════════════════════════════════════════════════════════
set -e

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

info()    { echo -e "${GREEN}[✓]${NC} $1"; }
warn()    { echo -e "${YELLOW}[!]${NC} $1"; }
error()   { echo -e "${RED}[✗]${NC} $1"; exit 1; }

echo ""
echo "  Nimble CMS — Déploiement"
echo "════════════════════════════════"
echo ""

# ── Vérifications prérequis ──────────────────────────────────
command -v docker >/dev/null 2>&1  || error "Docker n'est pas installé. Voir https://docs.docker.com/engine/install/"
command -v git    >/dev/null 2>&1  || error "Git n'est pas installé."
info "Docker $(docker --version | cut -d' ' -f3 | tr -d ',')"

# ── Fichier .env ─────────────────────────────────────────────
if [ ! -f ".env" ]; then
  if [ -f ".env.example" ]; then
    cp .env.example .env
    warn "Fichier .env créé depuis .env.example"
    warn "→ Éditez .env avant de continuer (SESSION_SECRET, SMTP, mot de passe)."
    echo ""
    read -p "  Appuyez sur Entrée après avoir édité .env..." _
  else
    error "Aucun fichier .env ni .env.example trouvé."
  fi
else
  info "Fichier .env trouvé"
fi

# ── Vérification SESSION_SECRET ──────────────────────────────
SESSION_SECRET=$(grep -E "^SESSION_SECRET=" .env | cut -d'=' -f2 | tr -d '"' | tr -d "'")
if [ "${#SESSION_SECRET}" -lt 32 ]; then
  error "SESSION_SECRET trop court (minimum 32 caractères). Générez-en un avec : openssl rand -base64 32"
fi
info "SESSION_SECRET validé (${#SESSION_SECRET} caractères)"

# ── Build + démarrage ────────────────────────────────────────
info "Build de l'image Docker..."
docker compose build --no-cache

info "Démarrage du container..."
docker compose up -d

echo ""
info "Déploiement terminé !"
echo ""
echo "  → Application accessible sur : http://$(hostname -I | awk '{print $1}'):3000"
echo "  → Back-office : http://$(hostname -I | awk '{print $1}'):3000/back"
echo ""
echo "  Commandes utiles :"
echo "    docker compose logs -f     # Voir les logs"
echo "    docker compose down         # Arrêter"
echo "    docker compose up -d --build  # Mettre à jour après git pull"
echo ""
