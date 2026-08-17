import { readFileSync, existsSync } from 'fs';
import { join } from 'path';
import { getDataDir } from '@/lib/paths';

export interface DemoLimits {
  maxPages: number;
  maxSectionsPerPage: number;
  maxCustomSections: number;
  maxThemes: number;
  maxFolders: number;
}

export interface DemoConfig {
  limits: DemoLimits;
  resetInactivityMinutes: number;
  bannerText: string;
}

const DEMO_CONFIG_PATH = join(getDataDir(), 'demo.json');

const DEFAULT_CONFIG: DemoConfig = {
  limits: {
    maxPages: 10,
    maxSectionsPerPage: 15,
    maxCustomSections: 10,
    maxThemes: 5,
    maxFolders: 5,
  },
  resetInactivityMinutes: 30,
  bannerText: '',
};

/** Vérifie si le mode demo est activé (env var) */
export function isDemoMode(): boolean {
  return process.env.DEMO_MODE === 'true';
}

/** Lit la config demo depuis data/demo.json */
export function readDemoConfig(): DemoConfig {
  if (!existsSync(DEMO_CONFIG_PATH)) return DEFAULT_CONFIG;
  try {
    const raw = readFileSync(DEMO_CONFIG_PATH, 'utf-8');
    return { ...DEFAULT_CONFIG, ...JSON.parse(raw) };
  } catch {
    return DEFAULT_CONFIG;
  }
}
