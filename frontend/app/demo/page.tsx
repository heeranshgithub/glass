'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useDemoLoginMutation } from '@/lib/store/api/authApi';
import { useAppDispatch } from '@/lib/store';
import { setTokens } from '@/lib/store/slices/authSlice';

export default function DemoPage() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const [demoLogin] = useDemoLoginMutation();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const performDemoLogin = async () => {
      try {
        const tokens = await demoLogin().unwrap();
        dispatch(setTokens(tokens));
        router.push('/home');
      } catch (err: any) {
        console.error('Demo login failed:', err);
        setError(
          err?.data?.detail ||
            'Failed to login to demo account. Please try again later.'
        );
      }
    };

    performDemoLogin();
  }, [demoLogin, dispatch, router]);

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background px-6">
        <div className="max-w-sm w-full space-y-6">
          <span className="mono-label">Glass / Demo</span>
          <div className="swiss-rule-strong" />
          <h1 className="display-md leading-none">
            Demo login
            <br />
            failed<span className="text-primary">.</span>
          </h1>
          <p className="text-sm text-destructive">{error}</p>
          <button
            onClick={() => router.push('/login')}
            className="h-10 px-4 bg-foreground text-background text-sm font-medium hover:bg-primary transition-colors"
          >
            Go to login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="flex flex-col items-start gap-2">
        <span className="mono-label">Glass / Demo</span>
        <span className="display-md">
          Signing in<span className="animate-cursor text-primary">_</span>
        </span>
      </div>
    </div>
  );
}
