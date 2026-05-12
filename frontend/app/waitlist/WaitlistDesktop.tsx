'use client';

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
    <div className="hidden lg:grid lg:grid-cols-2 min-h-screen">
      {/* Left — editorial brand panel */}
      <div className="bg-foreground text-background p-12 flex flex-col justify-between">
        <div className="flex items-baseline justify-between">
          <span className="text-2xl font-bold tracking-tighter">Glass</span>
          <span className="mono-label text-background/60 flex items-center gap-2">
            <span className="h-1.5 w-1.5 bg-primary" />
            Live · Waitlist to scale
          </span>
        </div>

        <div className="space-y-10">
          <h1 className="display-xl">
            Questions
            <br />
            that matter
            <span className="text-primary">.</span>
          </h1>
          <p className="text-base text-background/70 max-w-md leading-relaxed">
            You ask. A council of models answers. They rank each other. An
            arbiter synthesises the best parts into one response.
          </p>

          <div className="grid grid-cols-3 gap-x-6 gap-y-2 max-w-lg">
            {[
              { n: '01', label: 'Responses', body: 'Diverse model takes' },
              { n: '02', label: 'Rankings', body: 'Anonymous peer review' },
              { n: '03', label: 'Synthesis', body: 'One final answer' },
            ].map(s => (
              <div key={s.n} className="space-y-1">
                <div className="text-3xl font-semibold tabular-nums leading-none">
                  {s.n}
                </div>
                <div className="mono-label text-background/60">{s.label}</div>
                <div className="text-xs text-background/70 leading-relaxed pt-1">
                  {s.body}
                </div>
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
      <div className="flex items-center justify-center p-12 bg-background">
        <div className="w-full max-w-sm">
          <WaitlistFormCard {...props} />
        </div>
      </div>
    </div>
  );
}
