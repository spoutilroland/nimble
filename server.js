const { readdirSync, existsSync } = require('fs');
const { join } = require('path');

// Empêcher le process de mourir silencieusement
process.on('uncaughtException', (err) => {
  console.error('[Nimble] Uncaught exception:', err);
});
process.on('unhandledRejection', (err) => {
  console.error('[Nimble] Unhandled rejection:', err);
});

// Chercher server.js récursivement dans standalone
function findServerJs(dir, depth) {
  if (depth > 10) return null;
  const candidate = join(dir, 'server.js');
  if (existsSync(candidate)) return candidate;
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    if (entry.isDirectory() && entry.name !== 'node_modules' && entry.name !== '.next') {
      const found = findServerJs(join(dir, entry.name), depth + 1);
      if (found) return found;
    }
  }
  return null;
}

const standaloneDir = join(__dirname, '.next', 'standalone');
const serverPath = findServerJs(standaloneDir, 0);

if (!serverPath) {
  console.error('[Nimble] server.js introuvable dans .next/standalone/');
  process.exit(1);
}

console.log('[Nimble] Loading', serverPath);
require(serverPath);
