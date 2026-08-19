'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useRegisterMutation } from '@/lib/store';
import { useAppDispatch } from '@/lib/store';
import { setTokens } from '@/lib/store';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ArrowRight, Loader2, Check, X, UserPlus } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function RegisterPage() {
  if (process.env.NODE_ENV === 'production') {
    const router = useRouter();
    router.push('/login');
    return null;
  }

  const router = useRouter();
  const dispatch = useAppDispatch();
  const [register, { isLoading }] = useRegisterMutation();

  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    fullName: '',
    username: '',
  });
  const [error, setError] = useState<string | null>(null);

  const passwordRequirements = [
    { label: 'At least 8 characters', met: formData.password.length >= 8 },
    { label: 'One uppercase letter', met: /[A-Z]/.test(formData.password) },
    { label: 'One lowercase letter', met: /[a-z]/.test(formData.password) },
    { label: 'One number', met: /\d/.test(formData.password) },
  ];

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (!passwordRequirements.every(req => req.met)) {
      setError('Password does not meet requirements');
      return;
    }

    try {
      const result = await register({
        email: formData.email,
        password: formData.password,
        fullName: formData.fullName,
        username: formData.username || undefined,
      }).unwrap();
      dispatch(setTokens(result));
      router.push('/');
    } catch (err) {
      const error = err as { data?: { detail?: string } };
      setError(error.data?.detail || 'Registration failed. Please try again.');
    }
  };

  return (
    <div className="space-y-6">
      <div className="lg:hidden flex items-baseline gap-2">
        <span className="text-2xl font-bold tracking-tighter">Glass</span>
      </div>

      <div className="space-y-2">
        <h2 className="text-3xl font-semibold tracking-tight">
          Join the council
        </h2>
        <p className="text-sm text-muted-foreground">
          Create your profile and start orchestrating multi-model responses in
          minutes.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        {error && (
          <div
            className="rounded-xl bg-destructive/10 px-3.5 py-2.5 text-sm text-destructive"
            role="alert"
          >
            {error}
          </div>
        )}

        <div className="space-y-3">
          <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
            <UserPlus className="h-3.5 w-3.5" />
            Profile basics
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="fullName">Full name</Label>
            <Input
              id="fullName"
              name="fullName"
              type="text"
              placeholder="John Doe"
              value={formData.fullName}
              onChange={handleChange}
              required
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              name="email"
              type="email"
              placeholder="you@example.com"
              value={formData.email}
              onChange={handleChange}
              required
              autoComplete="email"
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="password">Password</Label>
          <Input
            id="password"
            name="password"
            type="password"
            placeholder="••••••••"
            value={formData.password}
            onChange={handleChange}
            required
            autoComplete="new-password"
          />
          {formData.password && (
            <div className="grid grid-cols-2 gap-x-4 gap-y-1 rounded-xl bg-muted/50 p-3">
              {passwordRequirements.map((req, i) => (
                <div
                  key={i}
                  className={cn(
                    'flex items-center gap-1.5 text-xs',
                    req.met ? 'text-foreground' : 'text-muted-foreground'
                  )}
                >
                  {req.met ? (
                    <Check className="h-3 w-3 text-primary" strokeWidth={2.5} />
                  ) : (
                    <X className="h-3 w-3" strokeWidth={1.75} />
                  )}
                  {req.label}
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="confirmPassword">Confirm password</Label>
          <Input
            id="confirmPassword"
            name="confirmPassword"
            type="password"
            placeholder="••••••••"
            value={formData.confirmPassword}
            onChange={handleChange}
            required
            autoComplete="new-password"
          />
          {formData.confirmPassword &&
            formData.password !== formData.confirmPassword && (
              <p className="text-xs text-destructive flex items-center gap-1.5 pt-1">
                <X className="h-3 w-3" strokeWidth={2} />
                Passwords do not match
              </p>
            )}
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
              Creating account
            </>
          ) : (
            <>
              Create account
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
            </>
          )}
        </Button>

        <p className="text-sm text-muted-foreground">
          Already have an account?{' '}
          <Link
            href="/login"
            className="text-foreground font-medium underline underline-offset-4 decoration-foreground/40 hover:decoration-foreground"
          >
            Sign in
          </Link>
        </p>
      </form>
    </div>
  );
}
