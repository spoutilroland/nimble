import { cpSync, mkdirSync, readdirSync } from 'fs';
import { join } from 'path';

const standaloneDir = join(process.cwd(), '.next', 'standalone');

// Trouver le sous-dossier du projet (varie selon le chemin d'installation)
const entries = readdirSync(standaloneDir, { withFileTypes: true });
const projectDir = entries.find(e => e.isDirectory() && e.name !== 'node_modules');

const target = projectDir ? join(standaloneDir, projectDir.name) : standaloneDir;

mkdirSync(join(target, '.next'), { recursive: true });
cpSync('public', join(target, 'public'), { recursive: true });
cpSync(join('.next', 'static'), join(target, '.next', 'static'), { recursive: true });

console.log(`[postbuild] Static files copied to ${target}`);
