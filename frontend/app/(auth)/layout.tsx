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
      <div className="hidden lg:flex flex-col justify-between bg-foreground text-background p-12 relative overflow-hidden">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute -top-24 -left-20 h-72 w-72 rounded-full bg-primary/30 blur-3xl" />
          <div className="absolute top-1/3 -right-24 h-80 w-80 rounded-full bg-background/10 blur-3xl" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_1px_1px,rgba(255,255,255,0.12)_1px,transparent_0)] [background-size:28px_28px] opacity-40" />
          <div className="absolute inset-0 bg-gradient-to-br from-transparent via-background/5 to-background/20" />
        </div>

        <div className="relative z-10 flex min-h-[2.5rem] items-baseline">
          <span className="text-2xl font-bold tracking-tighter">Glass</span>
        </div>

        <div className="relative z-10 space-y-8">
          <div className="inline-flex items-center gap-2 rounded-full border border-background/25 bg-background/10 px-3 py-1 text-xs text-background/85">
            Multi-agent orchestration
          </div>

          <div className="space-y-4">
            <h1 className="display-lg max-w-xl">Multi-model consensus</h1>
            <p className="text-base text-background/75 max-w-md leading-relaxed">
              Many models respond, peer-rank each other, and an arbiter
              synthesises a single, well-reasoned answer.
            </p>
          </div>

          <div className="grid grid-cols-3 gap-3 pt-4 max-w-md">
            {[
              { n: '01', label: 'Responses' },
              { n: '02', label: 'Rankings' },
              { n: '03', label: 'Synthesis' },
            ].map(s => (
              <div
                key={s.n}
                className="space-y-1 rounded-xl border border-background/20 bg-background/10 px-4 py-3 backdrop-blur-sm"
              >
                <div className="text-3xl font-semibold tabular-nums leading-none">
                  {s.n}
                </div>
                <div className="mono-label text-background/65">{s.label}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="relative z-10 flex items-baseline justify-between mono-label text-background/55">
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
