import fs from 'fs';
import fsp from 'fs/promises';
import path from 'path';
import type { SetupConfig } from '@/lib/schemas/setup';
import { isBlobEnabled, readJsonFromBlob, syncJsonToBlob } from '@/lib/storage';

const setupFile = path.join(process.cwd(), 'data', 'setup.json');

const defaultSetupConfig: SetupConfig = {
  setupDone: false,
  adminSlug: '',
};

export async function readSetupConfig(): Promise<SetupConfig> {
  if (isBlobEnabled()) {
    return readJsonFromBlob<SetupConfig>('setup.json', defaultSetupConfig);
  }
  try {
    return JSON.parse(fs.readFileSync(setupFile, 'utf8'));
  } catch {
    return defaultSetupConfig;
  }
}

export async function writeSetupConfig(data: SetupConfig): Promise<void> {
  await fsp.writeFile(setupFile, JSON.stringify(data, null, 2));
  await syncJsonToBlob('setup.json', data).catch(() => {});
}

/** Retourne le slug admin depuis data/setup.json — lu à chaque requête, pas de restart nécessaire */
export async function getAdminSlug(): Promise<string> {
  const config = await readSetupConfig();
  return config.adminSlug || 'back';
}
