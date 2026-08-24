'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAppSelector } from '@/lib/store';

export default function RootPage() {
  const router = useRouter();
  const { isAuthenticated, isInitialized } = useAppSelector(
    state => state.auth
  );

  useEffect(() => {
    if (isInitialized) {
      if (isAuthenticated) {
        router.replace('/home');
      } else {
        router.replace('/login');
      }
    }
  }, [isAuthenticated, isInitialized, router]);

  return (
    <div className="min-h-dvh flex items-center justify-center bg-background">
      <span className="text-sm text-muted-foreground">Loading…</span>
    </div>
  );
}
