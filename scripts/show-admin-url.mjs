import { existsSync, readFileSync } from 'fs';

// Affiche l'URL du back office au démarrage du serveur
const setupFile = 'data/setup.json';

if (existsSync(setupFile)) {
  try {
    const setup = JSON.parse(readFileSync(setupFile, 'utf-8'));
    if (setup.setupDone && setup.adminSlug) {
      console.log(`\n  Back office  ->  http://localhost:3000/${setup.adminSlug}\n`);
    } else {
      console.log(`\n  Setup wizard ->  http://localhost:3000/setup\n`);
    }
  } catch {
    // setup.json illisible, on ignore silencieusement
  }
} else {
  console.log(`\n  Setup wizard ->  http://localhost:3000/setup\n`);
}
