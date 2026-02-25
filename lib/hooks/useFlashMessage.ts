'use client';

import { useState, useCallback, useRef } from 'react';

export interface FlashMessage {
  text: string;
  type: 'success' | 'error';
}

export function useFlashMessage(duration = 3000) {
  const [message, setMessage] = useState<FlashMessage | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  const show = useCallback((text: string, type: FlashMessage['type']) => {
    if (timerRef.current) clearTimeout(timerRef.current);
    setMessage({ text, type });
    if (type === 'success') {
      timerRef.current = setTimeout(() => setMessage(null), duration);
    }
  }, [duration]);

  const clear = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    setMessage(null);
  }, []);

  return { message, show, clear } as const;
}
