'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAppSelector } from '@/lib/store';
import { useGetCurrentUserQuery } from '@/lib/store/api/userApi';
import { Sidebar } from '@/components/dashboard/Sidebar';
import { OpenRouterKeyModal } from '@/components/modals/OpenRouterKeyModal';
import { RateLimitBanner } from '@/components/dashboard/RateLimitBanner';
import { Hexagon } from 'lucide-react';

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
      <div className="min-h-screen flex items-center justify-center bg-background bg-gradient-radial">
        <div className="flex flex-col items-center gap-4">
          <div className="relative">
            <div className="animate-pulse-glow">
              <Hexagon className="h-16 w-16 text-primary hexagon-logo" />
            </div>
            <div className="absolute inset-0 animate-ping opacity-20">
              <Hexagon className="h-16 w-16 text-primary" />
            </div>
          </div>
          <div className="flex flex-col items-center gap-1">
            <span className="text-2xl font-bold bg-gradient-to-r from-primary to-neon-purple bg-clip-text text-transparent">
              Glass
            </span>
            <span className="text-xs text-muted-foreground uppercase tracking-widest">
              Loading
            </span>
          </div>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <>
      <div className="flex h-screen overflow-hidden bg-background bg-grid-pattern">
        {/* Gradient overlays */}
        <div className="fixed inset-0 pointer-events-none bg-gradient-radial opacity-80" />

        <Sidebar />
        <main
          className={`relative flex-1 flex flex-col overflow-hidden transition-all duration-300 ${
            sidebarOpen ? 'lg:ml-72' : 'lg:ml-16'
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
