'use client';

import { StoreProvider } from './StoreProvider';
import { ThemeProvider } from './ThemeProvider';

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <StoreProvider>
      <ThemeProvider>{children}</ThemeProvider>
    </StoreProvider>
  );
}

export { StoreProvider } from './StoreProvider';
export { ThemeProvider } from './ThemeProvider';
