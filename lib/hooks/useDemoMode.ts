'use client';

import { useState, useEffect } from 'react';
import type { DemoLimits } from '@/lib/demo';

interface DemoState {
  isDemo: boolean;
  limits: DemoLimits | null;
  bannerText: string;
  loading: boolean;
}

const DEFAULT_LIMITS: DemoLimits = {
  maxPages: 10,
  maxSectionsPerPage: 15,
  maxCustomSections: 10,
  maxThemes: 5,
  maxFolders: 5,
};

// Cache global pour éviter de refetch à chaque mount
let cachedState: DemoState | null = null;
let fetchPromise: Promise<DemoState> | null = null;

async function fetchDemoConfig(): Promise<DemoState> {
  try {
    const res = await fetch('/api/demo/config');
    const data = await res.json();
    if (!data.demo) {
      return { isDemo: false, limits: null, bannerText: '', loading: false };
    }
    return {
      isDemo: true,
      limits: data.limits ?? DEFAULT_LIMITS,
      bannerText: data.bannerText ?? '',
      loading: false,
    };
  } catch {
    return { isDemo: false, limits: null, bannerText: '', loading: false };
  }
}

export function useDemoMode(): DemoState {
  const [state, setState] = useState<DemoState>(
    cachedState ?? { isDemo: false, limits: null, bannerText: '', loading: true }
  );

  useEffect(() => {
    if (cachedState) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setState(cachedState);
      return;
    }

    if (!fetchPromise) {
      fetchPromise = fetchDemoConfig();
    }

    fetchPromise.then((result) => {
      cachedState = result;
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setState(result);
    });
  }, []);

  return state;
}
