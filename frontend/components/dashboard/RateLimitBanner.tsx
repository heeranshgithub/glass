'use client';

import { Mail } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { UserProfileResponse } from '@/lib/types';

interface RateLimitBannerProps {
  user: UserProfileResponse;
}

export function RateLimitBanner({ user }: RateLimitBannerProps) {
  if (user.isDemo !== true) return null;
  if (user.dailyRequestLimit === null || user.dailyRequestLimit === undefined)
    return null;

  const remaining = user.dailyRequestLimit - (user.dailyRequestCount || 0);
  const isExhausted = remaining <= 0;
  const isLow = remaining <= 1 && remaining > 0;

  const contactEmail =
    process.env.NEXT_PUBLIC_CONTACT_EMAIL || 'heeranshconnect@gmail.com';

  return (
    <div
      className={cn(
        'w-full border-b text-sm',
        isExhausted
          ? 'bg-background border-destructive text-destructive'
          : isLow
            ? 'bg-background border-foreground text-foreground'
            : 'bg-background border-border text-foreground'
      )}
    >
      <div className="max-w-7xl mx-auto px-3 sm:px-4 py-2.5 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <span
            className={cn(
              'mono-label',
              isExhausted ? 'text-destructive' : 'text-foreground'
            )}
          >
            Demo
          </span>
          <span
            className={cn(
              'h-1 w-1',
              isExhausted
                ? 'bg-destructive'
                : isLow
                  ? 'bg-primary'
                  : 'bg-foreground'
            )}
          />
          <span className="text-sm">
            {isExhausted ? (
              <>Daily limit exhausted</>
            ) : (
              <>
                <span className="tabular-nums font-medium">{remaining}</span>{' '}
                request{remaining !== 1 ? 's' : ''} remaining today
              </>
            )}
          </span>
        </div>
        {isExhausted && (
          <a
            href={`mailto:${contactEmail}`}
            className="inline-flex items-center gap-1.5 text-sm underline underline-offset-4 decoration-destructive/40 hover:decoration-destructive"
          >
            <Mail className="h-3 w-3" strokeWidth={1.75} />
            Request more
          </a>
        )}
      </div>
    </div>
  );
}
