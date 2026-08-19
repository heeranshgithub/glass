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

export function WaitlistMobile(props: Props) {
  return (
    <div className="lg:hidden min-h-screen flex flex-col px-6 py-10">
      <div className="flex items-baseline justify-between">
        <span className="text-2xl font-bold tracking-tighter">Glass</span>
        <span className="mono-label flex items-center gap-2">
          <span className="h-1.5 w-1.5 bg-primary" />
          Live
        </span>
      </div>

      <div className="swiss-rule-strong mt-4 mb-10" />

      <div className="space-y-10 flex-1">
        <h1 className="display-lg">
          Questions
          <br />
          that matter
        </h1>

        <p className="text-base text-muted-foreground leading-relaxed">
          You ask. A council of models answers. They rank each other. An arbiter
          synthesises the best parts into one response.
        </p>

        <div className="swiss-rule" />

        <WaitlistFormCard {...props} />
      </div>

      <div className="pt-10 flex items-baseline justify-between mono-label">
        <span>© {new Date().getFullYear()} Glass</span>
        <span>Waitlist to scale</span>
      </div>
    </div>
  );
}
