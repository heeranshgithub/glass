'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAppSelector } from '@/lib/store';

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const { isAuthenticated, isInitialized } = useAppSelector(
    state => state.auth
  );

  useEffect(() => {
    if (isInitialized && isAuthenticated) {
      router.push('/');
    }
  }, [isAuthenticated, isInitialized, router]);

  if (!isInitialized) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <span className="mono-label">Loading</span>
      </div>
    );
  }

  if (isAuthenticated) {
    return null;
  }

  return (
    <div className="min-h-screen grid lg:grid-cols-2">
      {/* Left — editorial brand panel */}
      <div className="hidden lg:flex flex-col justify-between bg-foreground text-background p-12 relative">
        <div className="flex items-baseline justify-between">
          <span className="text-2xl font-bold tracking-tighter">Glass</span>
          <span className="mono-label text-background/60">/ Council</span>
        </div>

        <div className="space-y-8">
          <h1 className="display-lg">
            Multi-model
            <br />
            consensus<span className="text-primary">.</span>
          </h1>
          <p className="text-base text-background/70 max-w-md leading-relaxed">
            Many models respond, peer-rank each other, and an arbiter
            synthesises a single, well-reasoned answer.
          </p>

          <div className="grid grid-cols-3 gap-4 pt-6 max-w-md">
            {[
              { n: '01', label: 'Responses' },
              { n: '02', label: 'Rankings' },
              { n: '03', label: 'Synthesis' },
            ].map(s => (
              <div key={s.n} className="space-y-1">
                <div className="text-3xl font-semibold tabular-nums leading-none">
                  {s.n}
                </div>
                <div className="mono-label text-background/60">{s.label}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="flex items-baseline justify-between mono-label text-background/50">
          <span>© {new Date().getFullYear()} Glass</span>
          <span>Production-ready LLM infrastructure</span>
        </div>
      </div>

      {/* Right — form */}
      <div className="flex items-center justify-center p-6 lg:p-12 bg-background">
        <div className="w-full max-w-sm">{children}</div>
      </div>
    </div>
  );
}
