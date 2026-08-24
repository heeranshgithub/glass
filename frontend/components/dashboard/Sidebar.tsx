'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import {
  useAppDispatch,
  useAppSelector,
  toggleSidebar,
  closeMobileNav,
  setCurrentConversationId,
  logout,
  useListConversationsQuery,
  useCreateConversationMutation,
  useDeleteConversationMutation,
  useGetCurrentUserQuery,
} from '@/lib/store';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Plus,
  ChevronsLeft,
  ChevronsRight,
  Settings,
  LogOut,
  Sun,
  Moon,
  Trophy,
  Home,
  Loader2,
  MoreHorizontal,
  ExternalLink,
  Trash2,
  X,
} from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import { setTheme } from '@/lib/store/slices/uiSlice';
import { useResolvedTheme } from '@/lib/useResolvedTheme';

export function Sidebar() {
  const router = useRouter();
  const pathname = usePathname();
  const dispatch = useAppDispatch();
  const sidebarOpen = useAppSelector(state => state.ui.sidebarOpen);
  const mobileNavOpen = useAppSelector(state => state.ui.mobileNavOpen);

  // The collapsed rail is a desktop affordance; the mobile drawer always shows
  // its full contents.
  const expanded = mobileNavOpen || sidebarOpen;
  const currentConversationId = useAppSelector(
    state => state.ui.currentConversationId
  );
  const resolvedTheme = useResolvedTheme();

  const { data: conversationsData, isLoading: isLoadingConversations } =
    useListConversationsQuery();
  const { data: user } = useGetCurrentUserQuery();
  const [createConversation, { isLoading: isCreating }] =
    useCreateConversationMutation();
  const [deleteConversation] = useDeleteConversationMutation();
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const conversations = conversationsData?.conversations ?? [];

  const handleNewConversation = async () => {
    try {
      const result = await createConversation().unwrap();
      dispatch(setCurrentConversationId(result.id));
      dispatch(closeMobileNav());
      router.push(`/chat/${result.id}`);
    } catch (error) {
      console.error('Failed to create conversation:', error);
    }
  };

  const handleSelectConversation = (id: string) => {
    dispatch(setCurrentConversationId(id));
    dispatch(closeMobileNav());
    router.push(`/chat/${id}`);
  };

  useEffect(() => {
    const desktop = window.matchMedia('(min-width: 1024px)');
    const sync = () => {
      if (desktop.matches) dispatch(closeMobileNav());
    };
    sync();
    desktop.addEventListener('change', sync);
    return () => desktop.removeEventListener('change', sync);
  }, [dispatch]);

  const navigate = (href: string) => {
    dispatch(closeMobileNav());
    router.push(href);
  };

  // The demo account is shared, so one visitor must not be able to wipe the
  // conversations everyone else sees. Local dev is exempt for convenience.
  const isDemo = user?.isDemo === true;
  const canDelete = !isDemo || process.env.NODE_ENV === 'development';

  const handleDeleteConversation = async (id: string) => {
    // The menu item is disabled too, but that only blocks real pointer input;
    // the server refuses demo deletes regardless.
    if (!canDelete) return;
    setDeleteError(null);
    try {
      await deleteConversation(id).unwrap();
      // Leaving the user on a deleted thread would 404.
      if (currentConversationId === id || pathname === `/chat/${id}`) {
        dispatch(setCurrentConversationId(null));
        router.push('/home');
      }
    } catch (error) {
      // RTK Query rejects with { status, data }, which has no `message` and so
      // logs as `{}`. Pull the API's detail out so the failure is readable.
      const err = error as {
        status?: number | string;
        data?: { detail?: string };
      };
      const detail = err?.data?.detail ?? 'Could not delete the conversation.';
      console.error('Failed to delete conversation:', err?.status, detail);
      setDeleteError(detail);
    }
  };

  const handleLogout = () => {
    dispatch(logout());
    router.push('/login');
  };

  const toggleTheme = () => {
    dispatch(setTheme(resolvedTheme === 'dark' ? 'light' : 'dark'));
  };

  const navItems = [
    { href: '/home', label: 'Home', icon: Home },
    { href: '/leaderboard', label: 'Leaderboard', icon: Trophy },
  ];

  const rowClass = (active: boolean) =>
    cn(
      'flex w-full items-center rounded-xl text-sm transition-colors',
      active
        ? 'bg-muted text-foreground font-medium'
        : 'text-muted-foreground hover:bg-muted/60 hover:text-foreground'
    );

  return (
    <>
      {mobileNavOpen && (
        <div
          className="fixed inset-0 bg-foreground/40 z-40 lg:hidden"
          onClick={() => dispatch(closeMobileNav())}
        />
      )}

      <aside
        className={cn(
          'fixed top-0 left-0 z-50 h-dvh flex flex-col bg-sidebar transition-[width,transform] duration-200 ease-out',
          'pt-[env(safe-area-inset-top)] pb-[env(safe-area-inset-bottom)]',
          // Mobile: full-height drawer, off-canvas until opened.
          'w-[min(19rem,85vw)]',
          mobileNavOpen ? 'translate-x-0' : '-translate-x-full',
          // Desktop: always on-canvas; width follows the collapse state.
          'lg:translate-x-0',
          sidebarOpen ? 'lg:w-72' : 'lg:w-14'
        )}
      >
        {/* Brand row */}
        <div
          className={cn(
            'flex items-center h-14 shrink-0',
            expanded ? 'px-4 justify-between' : 'px-0 justify-center'
          )}
        >
          {expanded ? (
            <>
              <button
                onClick={() => navigate('/home')}
                className="flex items-center px-2 py-3 lg:py-1 text-xl font-bold tracking-tighter leading-none"
              >
                Glass
              </button>
              <button
                onClick={() => dispatch(closeMobileNav())}
                className="flex lg:hidden h-10 w-10 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted/60 hover:text-foreground transition-colors"
                aria-label="Close menu"
              >
                <X className="h-5 w-5" />
              </button>
              <button
                onClick={() => dispatch(toggleSidebar())}
                className="hidden lg:flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted/60 hover:text-foreground transition-colors"
                aria-label="Collapse sidebar"
              >
                <ChevronsLeft className="h-4 w-4" />
              </button>
            </>
          ) : (
            <button
              onClick={() => dispatch(toggleSidebar())}
              className="hidden lg:flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted/60 hover:text-foreground transition-colors"
              aria-label="Expand sidebar"
            >
              <ChevronsRight className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* Actions + nav */}
        <div
          className={cn(
            'flex flex-col gap-0.5',
            expanded ? 'px-3 pt-2' : 'px-2 pt-2 items-center'
          )}
        >
          <button
            onClick={handleNewConversation}
            disabled={isCreating}
            className={cn(
              rowClass(false),
              'text-foreground disabled:opacity-50',
              expanded ? 'gap-3 px-3 h-11 lg:h-10' : 'justify-center h-10 w-10'
            )}
          >
            {isCreating ? (
              <Loader2 className="h-4 w-4 animate-spin shrink-0" />
            ) : (
              <Plus className="h-4 w-4 shrink-0" strokeWidth={2.25} />
            )}
            {expanded && <span className="font-medium">New conversation</span>}
          </button>

          {navItems.map(item => {
            const active = pathname === item.href;
            const Icon = item.icon;
            return (
              <button
                key={item.href}
                onClick={() => navigate(item.href)}
                className={cn(
                  rowClass(active),
                  expanded
                    ? 'gap-3 px-3 h-11 lg:h-10'
                    : 'justify-center h-10 w-10'
                )}
              >
                <Icon
                  className="h-4 w-4 shrink-0"
                  strokeWidth={active ? 2.25 : 1.75}
                />
                {expanded && <span>{item.label}</span>}
              </button>
            );
          })}
        </div>

        {/* Conversation list */}
        <div className="flex-1 overflow-y-auto overflow-x-hidden min-h-0 mt-4">
          {expanded && (
            <>
              <div className="px-6 pb-2 text-xs text-muted-foreground">
                Chats
              </div>

              {deleteError && (
                <div className="mx-3 mb-2 rounded-lg bg-destructive/10 px-3 py-2">
                  <p className="text-xs leading-relaxed text-destructive">
                    {deleteError}
                  </p>
                </div>
              )}

              {isLoadingConversations ? (
                <div className="px-6 py-3">
                  <Loader2 className="h-3.5 w-3.5 animate-spin text-muted-foreground" />
                </div>
              ) : conversations.length === 0 ? (
                <div className="px-6 py-3">
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    No conversations yet.
                  </p>
                  <button
                    onClick={handleNewConversation}
                    className="mt-2 text-sm font-medium text-foreground hover:underline underline-offset-4"
                  >
                    Start the first one
                  </button>
                </div>
              ) : (
                <ul className="px-3 pb-4 space-y-0.5">
                  {conversations.map(conv => {
                    const active = currentConversationId === conv.id;
                    return (
                      <li key={conv.id} className="group/row relative">
                        <button
                          onClick={() => handleSelectConversation(conv.id)}
                          className={cn(
                            rowClass(active),
                            'px-3 h-11 lg:h-9 text-left'
                          )}
                        >
                          <span className="flex-1 truncate pr-6">
                            {conv.title || 'Untitled'}
                          </span>
                        </button>

                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <button
                              aria-label={`Options for ${conv.title || 'Untitled'}`}
                              className={cn(
                                'absolute right-1 top-1/2 -translate-y-1/2',
                                'flex h-10 w-10 lg:h-7 lg:w-7 items-center justify-center rounded-lg',
                                'text-muted-foreground transition-colors',
                                'hover:bg-muted hover:text-foreground',
                                // Touch devices cannot hover, so the control has
                                // to be visible there or it is unreachable.
                                '[@media(hover:hover)]:opacity-0 [@media(hover:hover)]:group-hover/row:opacity-100',
                                'focus-visible:opacity-100',
                                'data-[state=open]:opacity-100 data-[state=open]:bg-muted'
                              )}
                            >
                              <MoreHorizontal className="h-4 w-4" />
                            </button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="start" className="w-48">
                            <DropdownMenuItem
                              onClick={() =>
                                window.open(`/chat/${conv.id}`, '_blank')
                              }
                              className="cursor-pointer"
                            >
                              <ExternalLink
                                className="mr-2 h-4 w-4"
                                strokeWidth={1.75}
                              />
                              Open new tab
                            </DropdownMenuItem>
                            {canDelete ? (
                              <DropdownMenuItem
                                onClick={() =>
                                  handleDeleteConversation(conv.id)
                                }
                                variant="destructive"
                                className="cursor-pointer"
                              >
                                <Trash2
                                  className="mr-2 h-4 w-4"
                                  strokeWidth={1.75}
                                />
                                Delete
                              </DropdownMenuItem>
                            ) : (
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  {/* A disabled item gets pointer-events:none,
                                      so hover can never reach it. The wrapper
                                      receives the hover instead. */}
                                  <span className="block">
                                    <DropdownMenuItem
                                      disabled
                                      className="cursor-not-allowed text-muted-foreground data-[disabled]:opacity-100"
                                    >
                                      <Trash2
                                        className="mr-2 h-4 w-4"
                                        strokeWidth={1.75}
                                      />
                                      Delete
                                    </DropdownMenuItem>
                                  </span>
                                </TooltipTrigger>
                                <TooltipContent side="right">
                                  Deleting is turned off on the shared demo
                                  account
                                </TooltipContent>
                              </Tooltip>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </li>
                    );
                  })}
                </ul>
              )}
            </>
          )}
        </div>

        {/* User footer */}
        <div className={cn('shrink-0', expanded ? 'p-3' : 'p-2')}>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                className={cn(
                  'w-full flex items-center rounded-xl transition-colors hover:bg-muted/60',
                  expanded ? 'gap-3 px-3 py-2.5' : 'justify-center py-2.5'
                )}
              >
                <div className="h-8 w-8 rounded-full bg-muted text-foreground flex items-center justify-center text-xs font-semibold shrink-0">
                  {(user?.fullName || user?.email || 'U')
                    .charAt(0)
                    .toUpperCase()}
                </div>
                {expanded && (
                  <div className="flex-1 text-left min-w-0">
                    <div className="truncate text-sm font-medium leading-tight">
                      {user?.fullName || 'User'}
                    </div>
                    <div className="truncate text-xs text-muted-foreground leading-tight">
                      {user?.email}
                    </div>
                  </div>
                )}
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuItem
                onClick={() => navigate('/settings')}
                className="cursor-pointer"
              >
                <Settings className="mr-2 h-4 w-4" strokeWidth={1.75} />
                Settings
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={toggleTheme}
                className="cursor-pointer"
              >
                {resolvedTheme === 'dark' ? (
                  <Sun className="mr-2 h-4 w-4" strokeWidth={1.75} />
                ) : (
                  <Moon className="mr-2 h-4 w-4" strokeWidth={1.75} />
                )}
                {resolvedTheme === 'dark' ? 'Light mode' : 'Dark mode'}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={handleLogout}
                className="cursor-pointer text-destructive focus:text-destructive"
              >
                <LogOut className="mr-2 h-4 w-4" strokeWidth={1.75} />
                Logout
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </aside>
    </>
  );
}
