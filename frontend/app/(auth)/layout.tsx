'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAppSelector } from '@/lib/store';

const STAGES = [
  { title: 'Responses', body: 'Every model answers independently.' },
  { title: 'Rankings', body: 'Peers rank each other, anonymously.' },
  { title: 'Synthesis', body: 'An arbiter writes the final answer.' },
];

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
      <div className="min-h-dvh flex items-center justify-center bg-background">
        <span className="text-sm text-muted-foreground">Loading…</span>
      </div>
    );
  }

  if (isAuthenticated) {
    return null;
  }

  return (
    <div className="min-h-dvh lg:h-dvh lg:overflow-hidden grid lg:grid-cols-2 bg-background">
      {/* Left — brand panel */}
      <div className="hidden lg:flex flex-col justify-between bg-sidebar p-12 overflow-y-auto">
        <button
          onClick={() => router.push('/')}
          className="w-fit text-xl font-bold tracking-tighter leading-none"
        >
          Glass
        </button>

        <div className="space-y-8 max-w-md">
          <h1 className="text-5xl font-semibold tracking-tight leading-[1.05]">
            Multi-model consensus
          </h1>
          <p className="text-base text-muted-foreground leading-relaxed">
            Many models respond, peer-rank each other, and an arbiter
            synthesises a single, well-reasoned answer.
          </p>

          <div className="space-y-2">
            {STAGES.map((s, i) => (
              <div
                key={s.title}
                className="flex items-center gap-4 rounded-2xl bg-muted/60 px-5 py-4"
              >
                <span className="text-sm tabular-nums text-muted-foreground">
                  {i + 1}
                </span>
                <div>
                  <div className="text-sm font-medium">{s.title}</div>
                  <div className="text-sm text-muted-foreground">{s.body}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="flex items-baseline justify-between text-xs text-muted-foreground">
          <span>© {new Date().getFullYear()} Glass</span>
          <span>An experiment in consensus</span>
        </div>
      </div>

      {/* Right — form */}
      <div className="flex items-center justify-center overflow-y-auto p-6 lg:px-12 lg:py-10">
        <div className="w-full max-w-sm">{children}</div>
      </div>
    </div>
  );
}
