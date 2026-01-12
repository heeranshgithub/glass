'use client';

import { useState } from 'react';
import { useJoinWaitlistMutation } from '@/lib/store/api/waitlistApi';
import { WaitlistMobile } from './WaitlistMobile';
import { WaitlistDesktop } from './WaitlistDesktop';

export default function WaitlistPage() {
  const [email, setEmail] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [joinWaitlist, { isLoading }] = useJoinWaitlistMutation();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    try {
      await joinWaitlist({ email }).unwrap();
      setIsSuccess(true);
      setEmail('');
    } catch (err) {
      const error = err as { data?: { detail?: string } };
      setError(error.data?.detail || 'Something went wrong. Please try again.');
    }
  };

  const sharedProps = {
    email,
    setEmail,
    isLoading,
    isSuccess,
    error,
    onSubmit: handleSubmit,
    onResetSuccess: () => setIsSuccess(false),
  };

  return (
    // Force dark theme at first paint for /waitlist (no light-mode flash)
    <div className="dark" style={{ colorScheme: 'dark' }}>
      <div className="min-h-screen bg-background text-foreground">
        <WaitlistMobile {...sharedProps} />
        <WaitlistDesktop {...sharedProps} />
      </div>
    </div>
  );
}
