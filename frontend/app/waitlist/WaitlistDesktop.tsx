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
      <div className="w-1/2 bg-gradient-to-br from-primary via-primary to-chart-5 relative overflow-hidden shadow-2xl">
        <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-20" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />

        {/* Floating "preview" glow */}
        <div className="absolute -top-24 -left-24 h-80 w-80 rounded-full bg-gradient-to-br from-purple-400/30 to-pink-400/20 blur-3xl animate-pulse-glow" />
        <div className="absolute -bottom-24 -right-24 h-80 w-80 rounded-full bg-gradient-to-tl from-cyan-400/30 to-blue-400/20 blur-3xl animate-pulse-glow" />

        <div className="relative z-10 flex flex-col justify-between p-12 text-primary-foreground h-full">
          <div className="flex items-center gap-3">
            <Hexagon className="h-10 w-10 hexagon-logo drop-shadow-lg" />
            <span className="text-2xl font-bold tracking-tight drop-shadow-lg">
              Glass
            </span>
            <span className="ml-3 px-3 py-1.5 rounded-full text-xs font-medium bg-gradient-to-r from-emerald-500/30 to-cyan-500/30 border border-emerald-400/50 backdrop-blur-xl shadow-xl shadow-emerald-500/30">
              <span className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse shadow-xl shadow-emerald-400/80" />
                <span className="text-black font-semibold drop-shadow-md">
                  Live • Waitlist to scale
                </span>
              </span>
            </span>
          </div>

          <div className="space-y-6">
            <h1 className="text-5xl font-bold leading-tight drop-shadow-lg">
              Questions that matter
            </h1>
            <p className="text-xl max-w-lg leading-relaxed drop-shadow-md">
              You ask. A council of models answers. They rank each other. An
              arbiter synthesizes the best parts into one response.
            </p>
            <p className="text-lg max-w-lg drop-shadow-md">
              Users are already using Glass—we&apos;re scaling infra to open
              more seats. Join for priority access.
            </p>

            {/* "What you're signing up for" preview */}
            <div className="grid grid-cols-3 gap-4 pt-4">
              <div className="stage-card stage-1 group rounded-xl bg-black/50 border border-violet-500/30 backdrop-blur-xl p-4 shadow-lg shadow-violet-500/10 transition-all duration-300 hover:bg-black/70 hover:border-violet-400/60 hover:shadow-[0_0_30px_-5px_rgba(139,92,246,0.5)] hover:scale-105">
                <div className="flex items-center gap-2 mb-1.5">
                  <div className="h-2 w-2 rounded-full bg-violet-400 shadow-[0_0_10px_rgba(167,139,250,0.8)]" />
                  <div className="text-xs font-bold text-violet-200 uppercase tracking-wide">
                    Stage 1
                  </div>
                </div>
                <div className="text-xs text-white/90 font-medium leading-relaxed group-hover:text-white transition-colors">
                  Diverse model takes
                </div>
              </div>

              <div className="stage-card stage-2 group rounded-xl bg-black/50 border border-cyan-500/30 backdrop-blur-xl p-4 shadow-lg shadow-cyan-500/10 transition-all duration-300 hover:bg-black/70 hover:border-cyan-400/60 hover:shadow-[0_0_30px_-5px_rgba(6,182,212,0.5)] hover:scale-105">
                <div className="flex items-center gap-2 mb-1.5">
                  <div className="h-2 w-2 rounded-full bg-cyan-400 shadow-[0_0_10px_rgba(34,211,238,0.8)]" />
                  <div className="text-xs font-bold text-cyan-200 uppercase tracking-wide">
                    Stage 2
                  </div>
                </div>
                <div className="text-xs text-white/90 font-medium leading-relaxed group-hover:text-white transition-colors">
                  Anonymous peer ranking
                </div>
              </div>

              <div className="stage-card stage-3 group rounded-xl bg-black/50 border border-emerald-500/30 backdrop-blur-xl p-4 shadow-lg shadow-emerald-500/10 transition-all duration-300 hover:bg-black/70 hover:border-emerald-400/60 hover:shadow-[0_0_30px_-5px_rgba(16,185,129,0.5)] hover:scale-105">
                <div className="flex items-center gap-2 mb-1.5">
                  <div className="h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_10px_rgba(52,211,153,0.8)]" />
                  <div className="text-xs font-bold text-emerald-200 uppercase tracking-wide">
                    Stage 3
                  </div>
                </div>
                <div className="text-xs text-white/90 font-medium leading-relaxed group-hover:text-white transition-colors">
                  Final synthesis
                </div>
              </div>
            </div>

            {/* Mini "mock" cards */}
            <div className="mt-6 space-y-3 max-w-lg">
              <div className="group rounded-2xl bg-gradient-to-r from-white/15 to-white/10 border border-white/20 backdrop-blur-xl p-5 shadow-lg transition-all duration-300 hover:border-white/30 hover:from-white/20 hover:to-white/15 hover:shadow-xl hover:scale-[1.02]">
                <div className="text-[10px] font-bold text-white/70 uppercase tracking-widest mb-2">
                  Example Question
                </div>
                <div className="text-sm font-medium text-white leading-relaxed font-mono drop-shadow-md">
                  "What is the essence of human creativity, and how might AI
                  enhance or redefine it?"
                </div>
              </div>

              <div className="group rounded-2xl bg-black/50 border border-purple-500/30 backdrop-blur-xl p-5 shadow-lg shadow-purple-500/10 transition-all duration-300 hover:border-purple-400/50 hover:shadow-[0_0_40px_-10px_rgba(168,85,247,0.4)] hover:scale-[1.02] relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

                <div className="relative">
                  <div className="flex items-center gap-2 mb-2">
                    <Hexagon className="w-3.5 h-3.5 text-purple-400 fill-purple-400/30 drop-shadow-lg" />
                    <div className="text-[10px] font-bold text-purple-300 uppercase tracking-widest">
                      Council Output
                    </div>
                  </div>
                  <div className="text-sm text-white/95 leading-relaxed drop-shadow-md">
                    <span className="text-white font-medium">
                      A ranked set of tradeoffs
                    </span>
                    , then a single synthesis you can act on.
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="text-sm text-white/60 mt-4 drop-shadow-md">
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
