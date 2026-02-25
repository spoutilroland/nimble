#!/bin/sh
set -e

# Initialiser les données par défaut si le volume data/ est vide
# admin.json est volontairement exclu : il est géré via ADMIN_PASSWORD dans .env
for file in /app/data-defaults/*.json; do
  filename=$(basename "$file")
  if [ ! -f "/app/data/$filename" ]; then
    echo "[nimble] Init $filename"
    cp "$file" "/app/data/$filename"
  fi
done

echo "[nimble] Démarrage sur le port $PORT..."
exec node server.js
