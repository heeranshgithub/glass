'use client';

import { Loader2, ArrowRight } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

type Props = {
  email: string;
  setEmail: (value: string) => void;
  isLoading: boolean;
  isSuccess: boolean;
  error: string | null;
  onSubmit: (e: React.FormEvent) => void;
  onResetSuccess: () => void;
};

export function WaitlistFormCard({
  email,
  setEmail,
  isLoading,
  isSuccess,
  error,
  onSubmit,
  onResetSuccess,
}: Props) {
  if (isSuccess) {
    return (
      <div className="space-y-5">
        <div className="space-y-2">
          <span className="mono-label">Confirmed</span>
          <h2 className="display-md leading-none">
            You&rsquo;re
            <br />
            on the list<span className="text-primary">.</span>
          </h2>
        </div>
        <p className="text-sm text-muted-foreground leading-relaxed">
          Check your email for confirmation. We&rsquo;ll be in touch as soon as
          spots open.
        </p>
        <button
          type="button"
          onClick={onResetSuccess}
          className="text-sm font-medium text-foreground underline underline-offset-4 decoration-foreground/40 hover:decoration-foreground"
        >
          Join another email →
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="space-y-6">
      <div className="space-y-2">
        <span className="mono-label">Early access</span>
        <h2 className="display-md leading-none">
          Join the
          <br />
          waitlist<span className="text-primary">.</span>
        </h2>
      </div>

      <p className="text-sm text-muted-foreground leading-relaxed max-w-sm">
        Glass is live. We&rsquo;re scaling infrastructure to bring more people
        in—join for priority access.
      </p>

      {error && (
        <div className="border-l-2 border-destructive pl-3 py-1 text-sm text-destructive">
          {error}
        </div>
      )}

      <div className="space-y-1.5">
        <Label htmlFor="email" className="mono-label">
          Email
        </Label>
        <Input
          id="email"
          type="email"
          placeholder="you@example.com"
          value={email}
          onChange={e => setEmail(e.target.value)}
          required
          autoComplete="email"
          disabled={isLoading}
        />
      </div>

      <button
        type="submit"
        disabled={isLoading}
        className="group inline-flex items-center gap-3 h-12 px-6 bg-foreground text-background text-sm font-medium hover:bg-primary transition-colors disabled:opacity-50"
      >
        {isLoading ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            Joining
          </>
        ) : (
          <>
            Join the waitlist
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
          </>
        )}
      </button>

      <p className="text-xs text-muted-foreground/80 leading-relaxed">
        By joining, you agree to receive updates about Glass. We respect your
        privacy and won&rsquo;t spam.
      </p>
    </form>
  );
}
