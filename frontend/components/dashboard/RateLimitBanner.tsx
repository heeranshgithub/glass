'use client';

import { AlertCircle, Mail } from 'lucide-react';
import type { UserProfileResponse } from '@/lib/types';

interface RateLimitBannerProps {
  user: UserProfileResponse;
}

export function RateLimitBanner({ user }: RateLimitBannerProps) {
  // Only show for demo users (isDemo === true)
  if (user.isDemo !== true) {
    return null;
  }

  // If no limit is set, don't show banner
  if (user.dailyRequestLimit === null || user.dailyRequestLimit === undefined) {
    return null;
  }

  const remaining = user.dailyRequestLimit - (user.dailyRequestCount || 0);
  const isExhausted = remaining <= 0;
  const isLow = remaining <= 1 && remaining > 0;

  const contactEmail = process.env.NEXT_PUBLIC_CONTACT_EMAIL || 'heeranshconnect@gmail.com';

  return (
    <div
      className={`w-full px-4 py-3 flex items-center justify-center gap-2 text-sm ${
        isExhausted
          ? 'bg-destructive/10 border-b border-destructive/20 text-destructive'
          : isLow
          ? 'bg-yellow-500/10 border-b border-yellow-500/20 text-yellow-600 dark:text-yellow-400'
          : 'bg-primary/10 border-b border-primary/20 text-primary'
      }`}
    >
      <AlertCircle className="h-4 w-4 flex-shrink-0" />
      <span className="font-medium">
        {isExhausted ? (
          <>
            Demo limit exhausted (0 requests remaining).{' '}
            <a
              href={`mailto:${contactEmail}`}
              className="underline hover:opacity-80 inline-flex items-center gap-1"
            >
              <Mail className="h-3 w-3" />
              Contact us at {contactEmail}
            </a>{' '}
            for more requests.
          </>
        ) : (
          <>
            Demo: {remaining} request{remaining !== 1 ? 's' : ''} remaining
            today
          </>
        )}
      </span>
    </div>
  );
}
