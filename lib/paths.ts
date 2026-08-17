import path from 'path';

/**
 * Sur Vercel (serverless), le filesystem est read-only sauf /tmp.
 * On redirige data/ et uploads/ vers /tmp pour permettre les écritures.
 * Le bootstrap (instrumentation.ts) restaure les données depuis Vercel Blob au démarrage.
 */
const isVercel = !!process.env.VERCEL;

const root = isVercel ? '/tmp' : process.cwd();

export function getDataDir(): string {
  return path.join(root, 'data');
}

export function getUploadsDir(): string {
  return path.join(root, 'uploads');
}
