import { cpSync, existsSync, mkdirSync } from 'fs';
import path from 'path';
import { getDataDir, getUploadsDir } from '@/lib/paths';

/**
 * Sur Vercel, /tmp est vide à chaque cold start.
 * Copie les données du repo (process.cwd()/data et /uploads) vers /tmp
 * pour servir de base. Si Blob est configuré, il écrasera ensuite avec
 * des données plus récentes.
 */
export async function copyRepoDataToTmp() {
  const repoData = path.join(process.cwd(), 'data');
  const repoUploads = path.join(process.cwd(), 'uploads');
  const tmpData = getDataDir();
  const tmpUploads = getUploadsDir();

  // Copier data/ si le dossier source existe et que /tmp/data n'existe pas encore
  if (existsSync(repoData) && !existsSync(tmpData)) {
    mkdirSync(tmpData, { recursive: true });
    cpSync(repoData, tmpData, { recursive: true });
  }

  // Copier uploads/ si le dossier source existe et que /tmp/uploads n'existe pas encore
  if (existsSync(repoUploads) && !existsSync(tmpUploads)) {
    mkdirSync(tmpUploads, { recursive: true });
    cpSync(repoUploads, tmpUploads, { recursive: true });
  }
}
