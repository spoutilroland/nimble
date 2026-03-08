const { readdirSync } = require('fs');
const { join } = require('path');

// Empêcher le process de mourir silencieusement
process.on('uncaughtException', (err) => {
  console.error('[Nimble] Uncaught exception:', err);
});
process.on('unhandledRejection', (err) => {
  console.error('[Nimble] Unhandled rejection:', err);
});

// Trouver le sous-dossier du projet (varie selon le chemin d'installation)
const standaloneDir = join(__dirname, '.next', 'standalone');
const entries = readdirSync(standaloneDir, { withFileTypes: true });
const projectDir = entries.find(e => e.isDirectory() && e.name !== 'node_modules');
const serverPath = projectDir
  ? join(standaloneDir, projectDir.name, 'server.js')
  : join(standaloneDir, 'server.js');

require(serverPath);
