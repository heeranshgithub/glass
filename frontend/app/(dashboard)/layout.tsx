'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAppSelector } from '@/lib/store';
import { useGetCurrentUserQuery } from '@/lib/store/api/userApi';
import { Sidebar } from '@/components/dashboard/Sidebar';
import { OpenRouterKeyModal } from '@/components/modals/OpenRouterKeyModal';
import { RateLimitBanner } from '@/components/dashboard/RateLimitBanner';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const { isAuthenticated, isInitialized } = useAppSelector(
    state => state.auth
  );
  const sidebarOpen = useAppSelector(state => state.ui.sidebarOpen);
  const [showApiKeyModal, setShowApiKeyModal] = useState(false);

  // Fetch user profile to check for API key
  const { data: user, isLoading: isLoadingUser } = useGetCurrentUserQuery(
    undefined,
    {
      skip: !isAuthenticated,
    }
  );

  useEffect(() => {
    if (isInitialized && !isAuthenticated) {
      router.push('/login');
    }
  }, [isAuthenticated, isInitialized, router]);

  // Show modal if user is authenticated and doesn't have API key
  useEffect(() => {
    if (isAuthenticated && user && !isLoadingUser && !user.hasOpenRouterKey) {
      setShowApiKeyModal(true);
    }
  }, [isAuthenticated, user, isLoadingUser]);

  if (!isInitialized) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-start gap-2">
          <span className="mono-label">Glass</span>
          <span className="display-md">Loading<span className="animate-cursor text-primary">_</span></span>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <>
      <div className="flex h-screen overflow-hidden bg-background">
        <Sidebar />
        <main
          className={`relative flex-1 flex flex-col overflow-hidden transition-[margin] duration-200 ${
            sidebarOpen ? 'lg:ml-72' : 'lg:ml-14'
          }`}
        >
          {user && <RateLimitBanner user={user} />}
          {children}
        </main>
      </div>
      <OpenRouterKeyModal
        open={showApiKeyModal}
        onOpenChange={setShowApiKeyModal}
        onSuccess={() => {
          // Modal will close and user profile will be refetched automatically
        }}
      />
    </>
  );
}
