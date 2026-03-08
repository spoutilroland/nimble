/**
 * Rate limiter en mémoire (par IP).
 * Utilisé sur les routes sensibles (login, auth check).
 */

const hits = new Map<string, { count: number; resetAt: number }>();

// Nettoyage périodique des entrées expirées (toutes les 60s)
setInterval(() => {
  const now = Date.now();
  for (const [key, val] of hits) {
    if (now > val.resetAt) hits.delete(key);
  }
}, 60_000);

interface RateLimitOptions {
  windowMs?: number; // Fenêtre en ms (défaut: 60s)
  max?: number;      // Requêtes max par fenêtre (défaut: 30)
}

/**
 * Vérifie si une IP a dépassé la limite.
 * Retourne { limited: false } si OK, { limited: true, retryAfter } sinon.
 */
export function checkRateLimit(
  ip: string,
  opts: RateLimitOptions = {}
): { limited: boolean; retryAfter?: number } {
  const { windowMs = 60_000, max = 30 } = opts;
  const now = Date.now();
  const entry = hits.get(ip);

  if (!entry || now > entry.resetAt) {
    hits.set(ip, { count: 1, resetAt: now + windowMs });
    return { limited: false };
  }

  entry.count++;
  if (entry.count > max) {
    const retryAfter = Math.ceil((entry.resetAt - now) / 1000);
    return { limited: true, retryAfter };
  }

  return { limited: false };
}
