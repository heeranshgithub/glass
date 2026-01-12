'use client';

import { Mail, Loader2, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

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
      <Card className="border border-white/10 bg-card/80 shadow-2xl backdrop-blur-xl">
        <CardHeader className="space-y-2 pb-6 px-6 sm:px-8 pt-6 sm:pt-8">
          <div className="flex items-center justify-center mb-2">
            <div className="relative">
              <div className="absolute inset-0 bg-primary/30 blur-2xl rounded-full animate-pulse-glow" />
              <div className="rounded-full bg-primary/10 p-4 relative z-10 border border-primary/30 shadow-lg">
                <CheckCircle2 className="h-12 w-12 text-primary" />
              </div>
            </div>
          </div>
          <CardTitle className="text-2xl sm:text-3xl font-bold text-center">
            You&apos;re on the list!
          </CardTitle>
          <CardDescription className="text-center text-sm sm:text-base">
            Check your email for confirmation. We&apos;ll notify you as soon as
            spots open up.
          </CardDescription>
        </CardHeader>
        <CardFooter className="px-6 sm:px-8 pb-6 sm:pb-8">
          <Button
            onClick={onResetSuccess}
            variant="outline"
            className="w-full border-white/15 bg-background/30 hover:bg-background/45"
          >
            Join another email
          </Button>
        </CardFooter>
      </Card>
    );
  }

  return (
    <Card className="border border-white/10 bg-card/80 shadow-2xl backdrop-blur-xl">
      <CardHeader className="space-y-2 pb-6 px-6 sm:px-8 pt-6 sm:pt-8">
        <CardTitle className="text-2xl sm:text-3xl font-bold">
          Join the Waitlist
        </CardTitle>
        <CardDescription className="text-sm sm:text-base">
          Get priority access to Glass when we open new spots
        </CardDescription>
      </CardHeader>

      <form onSubmit={onSubmit}>
        <CardContent className="space-y-5 sm:space-y-6 px-6 sm:px-8">
          {error && (
            <div className="p-3 rounded-md bg-destructive/10 border border-destructive/20 text-destructive text-sm animate-in fade-in slide-in-from-top-2">
              {error}
            </div>
          )}

          <div className="space-y-2.5">
            <Label
              htmlFor="email"
              className="text-sm font-medium text-foreground/90"
            >
              Email address
            </Label>
            <div className="relative input-glow group">
              <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground z-10 group-focus-within:text-primary transition-colors" />
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="pl-11 h-12 border-white/10 bg-background/30 focus:bg-background/40 focus:border-primary/60 focus:ring-2 focus:ring-primary/20 transition-all"
                required
                autoComplete="email"
                disabled={isLoading}
              />
            </div>
          </div>

          <div className="text-xs sm:text-sm text-muted-foreground leading-relaxed pt-1.5">
            By joining, you agree to receive updates about Glass. We respect your
            privacy and won&apos;t spam you.
          </div>
        </CardContent>

        <CardFooter className="flex flex-col gap-4 mt-2 pt-4 px-6 sm:px-8 pb-6 sm:pb-8">
          <Button
            type="submit"
            className="w-full h-12 text-sm sm:text-base font-medium bg-gradient-to-r from-primary via-primary to-chart-5 hover:opacity-95 shadow-lg hover:shadow-xl transition-all duration-200"
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Joining waitlist...
              </>
            ) : (
              'Join the Waitlist'
            )}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}

