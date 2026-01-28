'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useDemoLoginMutation } from '@/lib/store/api/authApi';
import { useAppDispatch } from '@/lib/store';
import { setTokens } from '@/lib/store/slices/authSlice';
import { Hexagon, AlertCircle } from 'lucide-react';

export default function DemoPage() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const [demoLogin, { isLoading }] = useDemoLoginMutation();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const performDemoLogin = async () => {
      try {
        const tokens = await demoLogin().unwrap();

        // Store tokens in Redux (TokenResponse shape)
        dispatch(setTokens(tokens));

        // Redirect to home
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
      <div className="min-h-screen flex items-center justify-center bg-background bg-gradient-radial px-4">
        <div className="max-w-md w-full">
          <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-6 space-y-4">
            <div className="flex items-center gap-3">
              <AlertCircle className="h-6 w-6 text-destructive flex-shrink-0" />
              <div>
                <h2 className="text-lg font-semibold text-destructive">
                  Demo Login Failed
                </h2>
                <p className="text-sm text-destructive/80 mt-1">{error}</p>
              </div>
            </div>
            <button
              onClick={() => router.push('/login')}
              className="w-full py-2 px-4 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
            >
              Go to Login
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background bg-gradient-radial">
      <div className="flex flex-col items-center gap-4">
        <div className="relative">
          <div className="animate-pulse-glow">
            <Hexagon className="h-16 w-16 text-primary hexagon-logo" />
          </div>
          <div className="absolute inset-0 animate-ping opacity-20">
            <Hexagon className="h-16 w-16 text-primary" />
          </div>
        </div>
        <div className="flex flex-col items-center gap-1">
          <span className="text-2xl font-bold bg-gradient-to-r from-primary to-neon-purple bg-clip-text text-transparent">
            Glass
          </span>
          <span className="text-xs text-muted-foreground uppercase tracking-widest">
            Logging in to demo...
          </span>
        </div>
      </div>
    </div>
  );
}
