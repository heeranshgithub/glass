'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAppDispatch, useAppSelector, toggleMobileNav } from '@/lib/store';
import { Menu } from 'lucide-react';
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
  const dispatch = useAppDispatch();
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
        <span className="text-sm text-muted-foreground">Loading…</span>
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
          {/* Mobile header: the drawer needs a permanent way in, and a
              floating button would sit on top of every page's content. */}
          <header className="lg:hidden flex items-center gap-1 h-14 shrink-0 px-2">
            <button
              onClick={() => dispatch(toggleMobileNav())}
              aria-label="Open menu"
              className="flex h-11 w-11 items-center justify-center rounded-xl text-muted-foreground hover:bg-muted/60 hover:text-foreground transition-colors"
            >
              <Menu className="h-5 w-5" />
            </button>
            <span className="text-lg font-bold tracking-tighter leading-none">
              Glass
            </span>
          </header>

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
