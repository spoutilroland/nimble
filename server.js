// Empêcher le process de mourir silencieusement
process.on('uncaughtException', (err) => {
  console.error('[Nimble] Uncaught exception:', err);
});
process.on('unhandledRejection', (err) => {
  console.error('[Nimble] Unhandled rejection:', err);
});

// Charger le serveur standalone généré par Next.js
require('./.next/standalone/nimble/server.js');
