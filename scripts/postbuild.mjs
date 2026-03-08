import { cpSync, mkdirSync, existsSync, readdirSync } from 'fs';
import { join } from 'path';

const standaloneDir = join(process.cwd(), '.next', 'standalone');

// Chercher server.js récursivement dans standalone (source de vérité)
function findServerJs(dir, depth = 0) {
  if (depth > 10) return null;
  if (existsSync(join(dir, 'server.js'))) return dir;
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    if (entry.isDirectory() && entry.name !== 'node_modules' && entry.name !== '.next') {
      const found = findServerJs(join(dir, entry.name), depth + 1);
      if (found) return found;
    }
  }
  return null;
}

const target = findServerJs(standaloneDir) || standaloneDir;

mkdirSync(join(target, '.next'), { recursive: true });
cpSync('public', join(target, 'public'), { recursive: true });
cpSync(join('.next', 'static'), join(target, '.next', 'static'), { recursive: true });

console.log(`[postbuild] Target: ${target}`);
