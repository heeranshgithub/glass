'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
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
      <div className="min-h-dvh flex items-center justify-center bg-background px-6">
        <div className="max-w-sm w-full space-y-5">
          <h1 className="text-3xl font-semibold tracking-tight">
            Demo login failed
          </h1>
          <p className="rounded-xl bg-destructive/10 px-3.5 py-2.5 text-sm text-destructive">
            {error}
          </p>
          <button
            onClick={() => router.push('/login')}
            className="h-10 px-5 rounded-full bg-foreground text-background text-sm font-medium hover:bg-foreground/85 transition-colors"
          >
            Go to login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-dvh flex items-center justify-center bg-background">
      <div className="flex items-center gap-2.5 text-sm text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" />
        <span>Signing in to the demo</span>
      </div>
    </div>
  );
}
