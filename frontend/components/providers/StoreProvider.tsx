'use client';

import { useRef, useEffect } from 'react';
import { Provider } from 'react-redux';
import { makeStore, AppStore, initializeAuth, initializeUI } from '@/lib/store';

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const storeRef = useRef<AppStore | null>(null);

  if (!storeRef.current) {
    storeRef.current = makeStore();
  }

  useEffect(() => {
    if (storeRef.current) {
      storeRef.current.dispatch(initializeAuth());
      storeRef.current.dispatch(initializeUI());
    }
  }, []);

  return <Provider store={storeRef.current}>{children}</Provider>;
}
