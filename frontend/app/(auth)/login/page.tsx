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
import { Loader2 } from 'lucide-react';

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
        <span className="mono-label">/ Council</span>
      </div>

      <div className="space-y-3">
        <span className="mono-label">01 / Sign in</span>
        <h2 className="display-md leading-none">
          Welcome
          <br />
          back<span className="text-primary">.</span>
        </h2>
        <p className="text-sm text-muted-foreground">
          Enter your credentials to access the council.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {error && (
          <div
            className="border-l-2 border-destructive pl-3 py-1 text-sm text-destructive"
            role="alert"
          >
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
          className="w-full"
          disabled={isLoading}
        >
          {isLoading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Signing in
            </>
          ) : (
            'Sign in'
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
