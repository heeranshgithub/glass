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
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="flex flex-col items-start gap-2">
        <span className="mono-label">Glass</span>
        <span className="display-md">
          Loading<span className="animate-cursor text-primary">_</span>
        </span>
      </div>
    </div>
  );
}
