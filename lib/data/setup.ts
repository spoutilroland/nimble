import fs from 'fs';
import fsp from 'fs/promises';
import path from 'path';
import type { SetupConfig } from '@/lib/schemas/setup';

const setupFile = path.join(process.cwd(), 'data', 'setup.json');

const defaultSetupConfig: SetupConfig = {
  setupDone: false,
  adminSlug: '',
};

export function readSetupConfig(): SetupConfig {
  try {
    return JSON.parse(fs.readFileSync(setupFile, 'utf8'));
  } catch {
    return defaultSetupConfig;
  }
}

export async function writeSetupConfig(data: SetupConfig): Promise<void> {
  await fsp.writeFile(setupFile, JSON.stringify(data, null, 2));
}
