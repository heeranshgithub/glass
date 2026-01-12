'use client';

import { Hexagon } from 'lucide-react';
import { WaitlistFormCard } from './WaitlistFormCard';

type Props = {
  email: string;
  setEmail: (value: string) => void;
  isLoading: boolean;
  isSuccess: boolean;
  error: string | null;
  onSubmit: (e: React.FormEvent) => void;
  onResetSuccess: () => void;
};

export function WaitlistMobile(props: Props) {
  return (
    <div className="lg:hidden min-h-screen flex items-center justify-center px-4 py-10 relative overflow-hidden">
      {/* Futuristic background layers */}
      <div className="fixed inset-0 bg-background -z-20" />
      <div className="fixed inset-0 bg-gradient-to-br from-primary/15 via-background to-chart-5/10 -z-20" />
      <div className="fixed inset-0 bg-gradient-radial opacity-50 -z-20" />
      <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-[0.06] -z-10" />

      <div className="w-full max-w-md space-y-8">
        {/* Brand header */}
        <div className="text-center space-y-4">
          <div className="inline-flex items-center justify-center gap-3">
            <div className="relative">
              <div className="absolute inset-0 bg-primary/35 blur-2xl rounded-full animate-pulse" />
              <Hexagon className="h-14 w-14 text-primary relative z-10 hexagon-logo drop-shadow-lg" />
            </div>
            <span className="text-4xl font-bold tracking-tight bg-gradient-to-r from-primary via-primary to-chart-5 bg-clip-text text-transparent">
              Glass
            </span>
          </div>

          <div className="space-y-3">
            <h1 className="text-4xl font-bold leading-tight bg-gradient-to-r from-foreground via-foreground to-foreground/70 bg-clip-text text-transparent">
              Questions that matters
            </h1>
            <p className="text-base text-muted-foreground leading-relaxed">
              Glass is live. We&apos;re scaling infrastructure to bring more
              people in—join the waitlist for priority access.
            </p>
          </div>

          {/* Tiny “product preview” chips */}
          <div className="flex flex-wrap justify-center gap-2 pt-2">
            <span className="px-3 py-1.5 rounded-full text-xs bg-background/30 border border-white/10 backdrop-blur">
              Multi-model council
            </span>
            <span className="px-3 py-1.5 rounded-full text-xs bg-background/30 border border-white/10 backdrop-blur">
              Peer ranking
            </span>
            <span className="px-3 py-1.5 rounded-full text-xs bg-background/30 border border-white/10 backdrop-blur">
              Final synthesis
            </span>
          </div>
        </div>

        {/* Form */}
        <WaitlistFormCard {...props} />

        {/* Footer microcopy */}
        <div className="text-center text-xs text-muted-foreground">
          Limited seats while we scale. Early access goes out in waves.
        </div>
      </div>
    </div>
  );
}

