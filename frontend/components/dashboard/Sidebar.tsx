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
  Trophy,
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
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-foreground/20 z-40 lg:hidden"
          onClick={() => dispatch(toggleSidebar())}
        />
      )}

      <aside
        className={cn(
          'fixed top-0 left-0 z-50 h-full flex flex-col bg-sidebar transition-[width,transform] duration-200 ease-out',
          sidebarOpen ? 'w-72' : 'w-14',
          'lg:translate-x-0',
          sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        )}
      >
        {/* Brand row */}
        <div
          className={cn(
            'flex items-center h-14 shrink-0',
            sidebarOpen ? 'px-4 justify-between' : 'px-0 justify-center'
          )}
        >
          {sidebarOpen ? (
            <>
              <button
                onClick={() => router.push('/home')}
                className="px-2 text-xl font-bold tracking-tighter leading-none"
              >
                Glass
              </button>
              <button
                onClick={() => dispatch(toggleSidebar())}
                className="hidden lg:flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted/60 hover:text-foreground transition-colors"
                aria-label="Collapse sidebar"
              >
                <PanelLeftClose className="h-4 w-4" />
              </button>
            </>
          ) : (
            <button
              onClick={() => dispatch(toggleSidebar())}
              className="hidden lg:flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted/60 hover:text-foreground transition-colors"
              aria-label="Expand sidebar"
            >
              <PanelLeftOpen className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* Actions + nav */}
        <div
          className={cn(
            'flex flex-col gap-0.5',
            sidebarOpen ? 'px-3 pt-2' : 'px-2 pt-2 items-center'
          )}
        >
          <button
            onClick={handleNewConversation}
            disabled={isCreating}
            className={cn(
              rowClass(false),
              'text-foreground disabled:opacity-50',
              sidebarOpen ? 'gap-3 px-3 h-10' : 'justify-center h-10 w-10'
            )}
          >
            {isCreating ? (
              <Loader2 className="h-4 w-4 animate-spin shrink-0" />
            ) : (
              <Plus className="h-4 w-4 shrink-0" strokeWidth={2.25} />
            )}
            {sidebarOpen && (
              <span className="font-medium">New conversation</span>
            )}
          </button>

          {navItems.map(item => {
            const active = pathname === item.href;
            const Icon = item.icon;
            return (
              <button
                key={item.href}
                onClick={() => router.push(item.href)}
                className={cn(
                  rowClass(active),
                  sidebarOpen ? 'gap-3 px-3 h-10' : 'justify-center h-10 w-10'
                )}
              >
                <Icon
                  className="h-4 w-4 shrink-0"
                  strokeWidth={active ? 2.25 : 1.75}
                />
                {sidebarOpen && <span>{item.label}</span>}
              </button>
            );
          })}
        </div>

        {/* Conversation list */}
        <div className="flex-1 overflow-y-auto overflow-x-hidden min-h-0 mt-4">
          {sidebarOpen && (
            <>
              <div className="px-6 pb-2 text-xs text-muted-foreground">
                Chats
              </div>

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
                      <li key={conv.id}>
                        <button
                          onClick={() => handleSelectConversation(conv.id)}
                          className={cn(rowClass(active), 'px-3 h-9 text-left')}
                        >
                          <span className="flex-1 truncate">
                            {conv.title || 'Untitled'}
                          </span>
                        </button>
                      </li>
                    );
                  })}
                </ul>
              )}
            </>
          )}
        </div>

        {/* User footer */}
        <div className={cn('shrink-0', sidebarOpen ? 'p-3' : 'p-2')}>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                className={cn(
                  'w-full flex items-center rounded-xl transition-colors hover:bg-muted/60',
                  sidebarOpen ? 'gap-3 px-3 py-2.5' : 'justify-center py-2.5'
                )}
              >
                <div className="h-8 w-8 rounded-full bg-muted text-foreground flex items-center justify-center text-xs font-semibold shrink-0">
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
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuItem
                onClick={() => router.push('/settings')}
                className="cursor-pointer"
              >
                <Settings className="mr-2 h-4 w-4" strokeWidth={1.75} />
                Settings
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={toggleTheme}
                className="cursor-pointer"
              >
                {theme === 'dark' ? (
                  <Sun className="mr-2 h-4 w-4" strokeWidth={1.75} />
                ) : (
                  <Moon className="mr-2 h-4 w-4" strokeWidth={1.75} />
                )}
                {theme === 'dark' ? 'Light mode' : 'Dark mode'}
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
