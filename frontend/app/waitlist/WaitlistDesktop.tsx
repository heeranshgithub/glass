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

export function WaitlistDesktop(props: Props) {
  return (
    <div className="hidden lg:flex min-h-screen">
      {/* Left Panel - Branding / preview */}
      <div className="w-1/2 bg-gradient-to-br from-primary/80 via-primary/70 to-chart-5/60 relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-10" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />

        {/* Floating “preview” glow */}
        <div className="absolute -top-24 -left-24 h-72 w-72 rounded-full bg-white/10 blur-3xl" />
        <div className="absolute -bottom-24 -right-24 h-72 w-72 rounded-full bg-white/10 blur-3xl" />

        <div className="relative z-10 flex flex-col justify-between p-12 text-primary-foreground h-full">
          <div className="flex items-center gap-3">
            <Hexagon className="h-10 w-10 hexagon-logo" />
            <span className="text-2xl font-bold tracking-tight">Glass</span>
            <span className="ml-3 px-2.5 py-1 rounded-full text-xs bg-black/20 border border-white/15 backdrop-blur">
              Live • Waitlist to scale
            </span>
          </div>

          <div className="space-y-6">
            <h1 className="text-5xl font-bold leading-tight">
              Questions that matters
            </h1>
            <p className="text-xl text-primary-foreground/80 max-w-lg leading-relaxed">
              You ask. A council of models answers. They rank each other. An
              arbiter synthesizes the best parts into one response.
            </p>
            <p className="text-lg text-primary-foreground/70 max-w-lg">
              Users are already using Glass—we&apos;re scaling infra to open more
              seats. Join for priority access.
            </p>

            {/* “What you’re signing up for” preview */}
            <div className="grid grid-cols-3 gap-4 pt-4">
              <div className="stage-card stage-1 rounded-xl bg-black/15 border border-white/10 backdrop-blur p-4">
                <div className="text-sm font-semibold">Stage 1</div>
                <div className="text-xs text-primary-foreground/70 mt-1">
                  Diverse model takes
                </div>
              </div>
              <div className="stage-card stage-2 rounded-xl bg-black/15 border border-white/10 backdrop-blur p-4">
                <div className="text-sm font-semibold">Stage 2</div>
                <div className="text-xs text-primary-foreground/70 mt-1">
                  Anonymous peer ranking
                </div>
              </div>
              <div className="stage-card stage-3 rounded-xl bg-black/15 border border-white/10 backdrop-blur p-4">
                <div className="text-sm font-semibold">Stage 3</div>
                <div className="text-xs text-primary-foreground/70 mt-1">
                  Final synthesis
                </div>
              </div>
            </div>

            {/* Mini “mock” cards */}
            <div className="mt-6 space-y-3 max-w-lg">
              <div className="rounded-2xl bg-black/20 border border-white/10 backdrop-blur p-4">
                <div className="text-xs text-primary-foreground/70">
                  Example question
                </div>
                <div className="mt-1 text-sm font-medium">
                  “What should I optimize first: latency, cost, or reliability?”
                </div>
              </div>
              <div className="rounded-2xl bg-black/15 border border-white/10 backdrop-blur p-4">
                <div className="text-xs text-primary-foreground/70">
                  Council output
                </div>
                <div className="mt-1 text-sm text-primary-foreground/85 leading-relaxed">
                  A ranked set of tradeoffs, then a single synthesis you can act
                  on.
                </div>
              </div>
            </div>
          </div>

          <div className="text-sm text-primary-foreground/50">
            © 2026 Glass. Production-ready LLM infrastructure.
          </div>
        </div>
      </div>

      {/* Right Panel - Form */}
      <div className="w-1/2 flex items-center justify-center p-10 bg-background">
        <div className="w-full max-w-md">
          <WaitlistFormCard {...props} />
        </div>
      </div>
    </div>
  );
}

