'use client';

import { useRouter, usePathname } from 'next/navigation';
import {
  useAppDispatch,
  useAppSelector,
  toggleSidebar,
  setCurrentConversationId,
  logout,
  useListConversationsQuery,
  useCreateConversationMutation,
  useGetCurrentUserQuery,
} from '@/lib/store';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Plus,
  PanelLeftClose,
  PanelLeftOpen,
  Settings,
  LogOut,
  Sun,
  Moon,
  Home,
  Loader2,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { setTheme } from '@/lib/store/slices/uiSlice';

export function Sidebar() {
  const router = useRouter();
  const pathname = usePathname();
  const dispatch = useAppDispatch();
  const sidebarOpen = useAppSelector(state => state.ui.sidebarOpen);
  const currentConversationId = useAppSelector(
    state => state.ui.currentConversationId
  );
  const theme = useAppSelector(state => state.ui.theme);

  const { data: conversationsData, isLoading: isLoadingConversations } =
    useListConversationsQuery();
  const { data: user } = useGetCurrentUserQuery();
  const [createConversation, { isLoading: isCreating }] =
    useCreateConversationMutation();

  const conversations = conversationsData?.conversations ?? [];

  const handleNewConversation = async () => {
    try {
      const result = await createConversation().unwrap();
      dispatch(setCurrentConversationId(result.id));
      router.push(`/chat/${result.id}`);
    } catch (error) {
      console.error('Failed to create conversation:', error);
    }
  };

  const handleSelectConversation = (id: string) => {
    dispatch(setCurrentConversationId(id));
    router.push(`/chat/${id}`);
  };

  const handleLogout = () => {
    dispatch(logout());
    router.push('/login');
  };

  const toggleTheme = () => {
    dispatch(setTheme(theme === 'dark' ? 'light' : 'dark'));
  };

  const navItems = [
    { href: '/home', label: 'Home', icon: Home },
  ];

  return (
    <>
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-foreground/20 z-40 lg:hidden"
          onClick={() => dispatch(toggleSidebar())}
        />
      )}

      <aside
        className={cn(
          'fixed top-0 left-0 z-50 h-full flex flex-col bg-background border-r border-border transition-[width,transform] duration-200 ease-out',
          sidebarOpen ? 'w-72' : 'w-14',
          'lg:translate-x-0',
          sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        )}
      >
        {/* Brand row */}
        <div
          className={cn(
            'flex items-center h-14 border-b border-border',
            sidebarOpen ? 'px-5 justify-between' : 'px-0 justify-center'
          )}
        >
          {sidebarOpen ? (
            <>
              <button
                onClick={() => router.push('/home')}
                className="flex items-baseline gap-2 group"
              >
                <span className="text-2xl font-bold tracking-tighter leading-none">
                  Glass
                </span>
                <span className="mono-label leading-none">Glass</span>
              </button>
              <button
                onClick={() => dispatch(toggleSidebar())}
                className="hidden lg:flex h-8 w-8 items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
                aria-label="Collapse sidebar"
              >
                <PanelLeftClose className="h-4 w-4" />
              </button>
            </>
          ) : (
            <button
              onClick={() => dispatch(toggleSidebar())}
              className="hidden lg:flex h-8 w-8 items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
              aria-label="Expand sidebar"
            >
              <PanelLeftOpen className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* New conversation */}
        <div className={cn(sidebarOpen ? 'px-5 py-5' : 'px-2 py-3')}>
          <button
            onClick={handleNewConversation}
            disabled={isCreating}
            className={cn(
              'group inline-flex items-center text-sm font-medium transition-colors',
              'text-foreground hover:text-primary disabled:opacity-50',
              sidebarOpen ? 'gap-2' : 'w-full justify-center'
            )}
          >
            {isCreating ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Plus className="h-4 w-4" strokeWidth={2.5} />
            )}
            {sidebarOpen && <span>New conversation</span>}
          </button>
        </div>

        {/* Nav */}
        <nav
          className={cn(
            'flex flex-col',
            sidebarOpen ? 'px-5 pb-5' : 'px-2 pb-3 items-center'
          )}
        >
          {navItems.map(item => {
            const active = pathname === item.href;
            const Icon = item.icon;
            return (
              <button
                key={item.href}
                onClick={() => router.push(item.href)}
                className={cn(
                  'group flex items-center text-sm transition-colors h-9',
                  active
                    ? 'text-foreground font-medium'
                    : 'text-muted-foreground hover:text-foreground',
                  sidebarOpen ? 'gap-3' : 'w-full justify-center'
                )}
              >
                <Icon className="h-4 w-4" strokeWidth={active ? 2.25 : 1.75} />
                {sidebarOpen && <span>{item.label}</span>}
                {sidebarOpen && active && (
                  <span className="ml-auto h-1 w-1 bg-primary" />
                )}
              </button>
            );
          })}
        </nav>

        {/* Conversation list */}
        <div className="flex-1 overflow-y-auto min-h-0">
          {sidebarOpen && (
            <div className="px-5 pt-2 pb-3">
              <span className="eyebrow">Conversations</span>
            </div>
          )}

          {sidebarOpen && <div className="swiss-rule mx-5 mb-1" />}

          {isLoadingConversations
            ? sidebarOpen && (
                <div className="px-5 py-4">
                  <Loader2 className="h-3.5 w-3.5 animate-spin text-muted-foreground" />
                </div>
              )
            : conversations.length === 0
              ? sidebarOpen && (
                  <div className="px-5 py-4">
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      No conversations yet.
                    </p>
                    <button
                      onClick={handleNewConversation}
                      className="mt-2 text-sm font-medium underline underline-offset-4 decoration-foreground/40 hover:decoration-foreground"
                    >
                      Start the first one
                    </button>
                  </div>
                )
              : sidebarOpen && (
                  <ul className="px-5 pt-1 pb-4">
                    {conversations.map(conv => {
                      const active = currentConversationId === conv.id;
                      return (
                        <li key={conv.id}>
                          <button
                            onClick={() => handleSelectConversation(conv.id)}
                            className={cn(
                              'group w-full flex items-baseline gap-2 py-2 text-left transition-colors',
                              active
                                ? 'text-foreground'
                                : 'text-muted-foreground hover:text-foreground'
                            )}
                          >
                            <span
                              className={cn(
                                'flex-1 truncate text-sm',
                                active && 'font-medium'
                              )}
                            >
                              {conv.title || 'Untitled'}
                            </span>
                            {active && (
                              <span className="h-1 w-1 bg-primary shrink-0 self-center" />
                            )}
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                )}
        </div>

        {/* User footer */}
        <div className="border-t border-border">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                className={cn(
                  'w-full flex items-center transition-colors hover:bg-muted',
                  sidebarOpen ? 'gap-3 px-5 py-4' : 'justify-center py-4'
                )}
              >
                <div className="h-7 w-7 bg-foreground text-background flex items-center justify-center text-xs font-semibold shrink-0">
                  {(user?.fullName || user?.email || 'U')
                    .charAt(0)
                    .toUpperCase()}
                </div>
                {sidebarOpen && (
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
            <DropdownMenuContent
              align="end"
              className="w-56 border-border bg-popover"
              style={{ borderRadius: 0 }}
            >
              <DropdownMenuItem
                onClick={() => router.push('/settings')}
                className="cursor-pointer rounded-none focus:bg-muted"
              >
                <Settings className="mr-2 h-4 w-4" strokeWidth={1.75} />
                Settings
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={toggleTheme}
                className="cursor-pointer rounded-none focus:bg-muted"
              >
                {theme === 'dark' ? (
                  <Sun className="mr-2 h-4 w-4" strokeWidth={1.75} />
                ) : (
                  <Moon className="mr-2 h-4 w-4" strokeWidth={1.75} />
                )}
                {theme === 'dark' ? 'Light mode' : 'Dark mode'}
              </DropdownMenuItem>
              <DropdownMenuSeparator className="bg-border" />
              <DropdownMenuItem
                onClick={handleLogout}
                className="cursor-pointer rounded-none text-destructive focus:bg-muted focus:text-destructive"
              >
                <LogOut className="mr-2 h-4 w-4" strokeWidth={1.75} />
                Logout
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </aside>

      {/* Mobile open button */}
      <Button
        variant="ghost"
        size="icon-sm"
        className="fixed top-3 left-3 z-30 lg:hidden"
        onClick={() => dispatch(toggleSidebar())}
      >
        <PanelLeftOpen className="h-4 w-4" />
      </Button>
    </>
  );
}
