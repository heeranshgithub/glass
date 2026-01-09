'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAppSelector } from '@/lib/store';
import { Hexagon } from 'lucide-react';

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
        <div className="animate-pulse">
          <Hexagon className="h-12 w-12 text-primary" />
        </div>
      </div>
    );
  }

  if (isAuthenticated) {
    return null;
  }

  return (
    <div className="min-h-screen flex">
      {/* Left Panel - Branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-primary/90 via-primary to-chart-5 relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-10" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />

        <div className="relative z-10 flex flex-col justify-between p-12 text-primary-foreground">
          <div className="flex items-center gap-3">
            <Hexagon className="h-10 w-10" />
            <span className="text-2xl font-bold tracking-tight">Glass</span>
          </div>

          <div className="space-y-6">
            <h1 className="text-4xl font-bold leading-tight">
              Multi-Model Consensus
              <br />
              <span className="text-primary-foreground/80">
                Through Council
              </span>
            </h1>
            <p className="text-lg text-primary-foreground/70 max-w-md">
              Harness the collective intelligence of multiple LLMs through our
              innovative 3-stage council process. Get balanced, well-reasoned
              answers backed by peer review.
            </p>

            <div className="grid grid-cols-3 gap-4 pt-4">
              <div className="space-y-1">
                <div className="text-3xl font-bold">Stage 1</div>
                <div className="text-sm text-primary-foreground/60">
                  Individual Responses
                </div>
              </div>
              <div className="space-y-1">
                <div className="text-3xl font-bold">Stage 2</div>
                <div className="text-sm text-primary-foreground/60">
                  Peer Rankings
                </div>
              </div>
              <div className="space-y-1">
                <div className="text-3xl font-bold">Stage 3</div>
                <div className="text-sm text-primary-foreground/60">
                  Final Synthesis
                </div>
              </div>
            </div>
          </div>

          <div className="text-sm text-primary-foreground/50">
            © 2025 Glass. Production-ready LLM infrastructure.
          </div>
        </div>
      </div>

      {/* Right Panel - Auth Form */}
      <div className="flex-1 flex items-center justify-center p-8 bg-background">
        <div className="w-full max-w-md">{children}</div>
      </div>
    </div>
  );
}
