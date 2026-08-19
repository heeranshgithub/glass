'use client';

import { useSyncExternalStore } from 'react';
import { useAppSelector } from '@/lib/store';

const QUERY = '(prefers-color-scheme: dark)';

function subscribe(onChange: () => void) {
  const query = window.matchMedia(QUERY);
  query.addEventListener('change', onChange);
  return () => query.removeEventListener('change', onChange);
}

const getSnapshot = () => window.matchMedia(QUERY).matches;

// No OS preference is readable while rendering on the server.
const getServerSnapshot = () => false;

/**
 * The theme actually on screen, as opposed to the stored preference.
 *
 * The preference can be 'system', which resolves to light or dark depending on
 * the OS. UI that reflects or toggles the *current* appearance must use this;
 * comparing the raw preference to 'dark' is wrong whenever it is 'system'.
 */
export function useResolvedTheme(): 'light' | 'dark' {
  const theme = useAppSelector(state => state.ui.theme);
  const systemPrefersDark = useSyncExternalStore(
    subscribe,
    getSnapshot,
    getServerSnapshot
  );

  if (theme === 'system') {
    return systemPrefersDark ? 'dark' : 'light';
  }
  return theme;
}
