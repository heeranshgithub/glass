'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useLoginMutation } from '@/lib/store';
import { useAppDispatch } from '@/lib/store';
import { setTokens } from '@/lib/store';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ArrowRight, Loader2, ShieldCheck, Sparkles } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const [login, { isLoading }] = useLoginMutation();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    try {
      const result = await login({ email, password }).unwrap();
      dispatch(setTokens(result));
      router.push('/');
    } catch (err) {
      const error = err as { data?: { detail?: string } };
      setError(
        error.data?.detail || 'Failed to login. Please check your credentials.'
      );
    }
  };

  return (
    <div className="space-y-10">
      {/* Mobile mark */}
      <div className="lg:hidden flex items-baseline gap-2">
        <span className="text-2xl font-bold tracking-tighter">Glass</span>
      </div>

      <div className="space-y-4">
        <div className="rounded-2xl border border-border/60 bg-gradient-to-br from-primary/10 via-primary/5 to-transparent p-5">
          <div className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-background/80 px-3 py-1 text-xs font-medium text-foreground/80">
            <Sparkles className="h-3.5 w-3.5 text-primary" />
            Consensus mode enabled
          </div>
          <h2 className="display-md leading-none pt-4">
            Welcome
            <br />
            back<span className="text-primary">.</span>
          </h2>
          <p className="pt-3 text-sm text-muted-foreground">
            Sign in to continue routing prompts through your model council.
          </p>
        </div>
      </div>

      <form
        onSubmit={handleSubmit}
        className="space-y-6 rounded-2xl border border-border/70 bg-card/70 p-5 shadow-sm"
      >
        {error && (
          <div
            className="flex items-start gap-2 rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive"
            role="alert"
          >
            <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0" />
            <span>{error}</span>
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
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="password" className="mono-label">
            Password
          </Label>
          <Input
            id="password"
            type="password"
            placeholder="••••••••"
            value={password}
            onChange={e => setPassword(e.target.value)}
            required
            autoComplete="current-password"
          />
        </div>

        <Button
          type="submit"
          size="lg"
          className="w-full group transition-all"
          disabled={isLoading}
        >
          {isLoading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Signing in
            </>
          ) : (
            <>
              Sign in
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
            </>
          )}
        </Button>

        {process.env.NODE_ENV !== 'production' && (
          <p className="text-sm text-muted-foreground">
            Don&rsquo;t have an account?{' '}
            <Link
              href="/register"
              className="text-foreground font-medium underline underline-offset-4 decoration-foreground/40 hover:decoration-foreground"
            >
              Create one
            </Link>
          </p>
        )}
      </form>
    </div>
  );
}
