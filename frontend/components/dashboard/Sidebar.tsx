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
  useDeleteConversationMutation,
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
  Hexagon,
  Plus,
  MessageSquare,
  ChevronLeft,
  ChevronRight,
  User,
  Settings,
  LogOut,
  Trash2,
  MoreVertical,
  Loader2,
  Sun,
  Moon,
  Sparkles,
  Trophy,
  Home,
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
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
  const [deleteConversation] = useDeleteConversationMutation();

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

  const handleDeleteConversation = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await deleteConversation(id).unwrap();
      if (currentConversationId === id) {
        dispatch(setCurrentConversationId(null));
        router.push('/');
      }
    } catch (error) {
      console.error('Failed to delete conversation:', error);
    }
  };

  const handleLogout = () => {
    dispatch(logout());
    router.push('/login');
  };

  const toggleTheme = () => {
    dispatch(setTheme(theme === 'dark' ? 'light' : 'dark'));
  };

  return (
    <>
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-background/60 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => dispatch(toggleSidebar())}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          'fixed top-0 left-0 z-50 h-full transition-all duration-300 ease-out flex flex-col',
          'glass border-r border-sidebar-border/50',
          sidebarOpen ? 'w-72' : 'w-16',
          'lg:translate-x-0',
          sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        )}
      >
        {/* Gradient accent line at top */}
        <div className="absolute top-0 left-0 right-0 h-[2px] animate-border-flow opacity-80" />

        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-sidebar-border/30">
          <div
            className={cn(
              'flex items-center gap-3 overflow-hidden',
              !sidebarOpen && 'lg:justify-center'
            )}
          >
            <div className="relative">
              <Hexagon className="h-9 w-9 text-primary hexagon-logo flex-shrink-0" />
              <div className="absolute inset-0 animate-pulse-glow opacity-50">
                <Hexagon className="h-9 w-9 text-primary" />
              </div>
            </div>
            {sidebarOpen && (
              <div className="flex flex-col">
                <span className="text-xl font-bold tracking-tight bg-gradient-to-r from-primary via-neon-purple to-primary bg-clip-text text-transparent">
                  Glass
                </span>
                <span className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground font-medium">
                  AI Council
                </span>
              </div>
            )}
          </div>
          <Button
            variant="ghost"
            size="icon"
            className={cn(
              'hidden lg:flex hover:bg-primary/10 hover:text-primary transition-colors',
              !sidebarOpen && 'lg:hidden'
            )}
            onClick={() => dispatch(toggleSidebar())}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
        </div>

        {/* Collapsed toggle */}
        {!sidebarOpen && (
          <Button
            variant="ghost"
            size="icon"
            className="hidden lg:flex mx-auto my-3 hover:bg-primary/10 hover:text-primary"
            onClick={() => dispatch(toggleSidebar())}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        )}

        {/* New Conversation Button */}
        <div className="p-3">
          <Button
            onClick={handleNewConversation}
            disabled={isCreating}
            className={cn(
              'w-full gap-2 relative overflow-hidden group',
              'bg-gradient-to-r from-primary to-neon-purple hover:from-primary/90 hover:to-neon-purple/90',
              'shadow-lg shadow-primary/20 hover:shadow-primary/30',
              'transition-all duration-300',
              !sidebarOpen && 'lg:w-10 lg:px-0'
            )}
          >
            <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
            {isCreating ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Plus className="h-4 w-4" />
            )}
            {sidebarOpen && (
              <span className="font-medium">New Conversation</span>
            )}
          </Button>
        </div>

        {/* Navigation Links */}
        <div className="px-3 pb-3 space-y-1">
          <Button
            variant="ghost"
            onClick={() => router.push('/home')}
            className={cn(
              'w-full justify-start gap-3 px-2 hover:bg-muted/50 transition-colors',
              pathname === '/home' && 'bg-primary/10 text-primary',
              !sidebarOpen && 'lg:justify-center lg:px-0'
            )}
          >
            <Home className="h-4 w-4 flex-shrink-0" />
            {sidebarOpen && <span>Home</span>}
          </Button>
          <Button
            variant="ghost"
            onClick={() => router.push('/leaderboard')}
            className={cn(
              'w-full justify-start gap-3 px-2 hover:bg-muted/50 transition-colors',
              pathname === '/leaderboard' && 'bg-primary/10 text-primary',
              !sidebarOpen && 'lg:justify-center lg:px-0'
            )}
          >
            <Trophy className="h-4 w-4 flex-shrink-0" />
            {sidebarOpen && <span>Leaderboard</span>}
          </Button>
        </div>

        {/* Conversations List */}
        <div className="flex-1 overflow-y-auto px-3 pb-3">
          {sidebarOpen && (
            <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3 px-2">
              <Sparkles className="h-3 w-3" />
              <span>Conversations</span>
            </div>
          )}

          {isLoadingConversations ? (
            <div className="flex items-center justify-center py-8">
              <div className="relative">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
                <div className="absolute inset-0 animate-ping opacity-30">
                  <Loader2 className="h-6 w-6 text-primary" />
                </div>
              </div>
            </div>
          ) : conversations.length === 0 ? (
            sidebarOpen && (
              <div className="text-center py-8 px-4">
                <div className="w-12 h-12 mx-auto mb-3 rounded-xl bg-gradient-to-br from-primary/20 to-neon-purple/20 flex items-center justify-center">
                  <MessageSquare className="h-6 w-6 text-primary/60" />
                </div>
                <p className="text-muted-foreground text-sm">
                  No conversations yet
                </p>
                <p className="text-muted-foreground/60 text-xs mt-1">
                  Start a new one above
                </p>
              </div>
            )
          ) : (
            <div className="space-y-1">
              {conversations.map(conv => (
                <div
                  key={conv.id}
                  onClick={() => handleSelectConversation(conv.id)}
                  className={cn(
                    'conversation-item group flex items-center gap-3 p-2.5 rounded-lg cursor-pointer transition-all duration-200',
                    currentConversationId === conv.id
                      ? 'active bg-primary/10 text-foreground border border-primary/20'
                      : 'hover:bg-muted/50 text-muted-foreground hover:text-foreground',
                    !sidebarOpen && 'lg:justify-center lg:px-0'
                  )}
                >
                  <div
                    className={cn(
                      'flex items-center justify-center w-8 h-8 rounded-lg flex-shrink-0 transition-colors',
                      currentConversationId === conv.id
                        ? 'bg-primary/20'
                        : 'bg-muted/50 group-hover:bg-muted'
                    )}
                  >
                    <MessageSquare
                      className={cn(
                        'h-4 w-4',
                        currentConversationId === conv.id && 'text-primary'
                      )}
                    />
                  </div>
                  {sidebarOpen && (
                    <>
                      <div className="flex-1 min-w-0">
                        <div className="truncate text-sm font-medium">
                          {conv.title || 'New Conversation'}
                        </div>
                        <div className="text-xs text-muted-foreground/70">
                          {formatDistanceToNow(new Date(conv.createdAt), {
                            addSuffix: true,
                          })}
                        </div>
                      </div>
                      {/* <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-all hover:bg-destructive/10 hover:text-destructive"
                        onClick={e => handleDeleteConversation(conv.id, e)}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button> */}
                    </>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* User Section */}
        <div className="mt-auto border-t border-sidebar-border/30 p-3">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                className={cn(
                  'w-full justify-start gap-3 px-2 hover:bg-muted/50 transition-colors',
                  !sidebarOpen && 'lg:justify-center lg:px-0'
                )}
              >
                <div className="relative">
                  <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-primary/30 to-neon-purple/30 flex items-center justify-center flex-shrink-0 border border-primary/20">
                    <User className="h-4 w-4 text-primary" />
                  </div>
                  <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-neon-green border-2 border-sidebar" />
                </div>
                {sidebarOpen && (
                  <>
                    <div className="flex-1 text-left min-w-0">
                      <div className="truncate text-sm font-medium">
                        {user?.fullName || 'User'}
                      </div>
                      <div className="truncate text-xs text-muted-foreground">
                        {user?.email}
                      </div>
                    </div>
                    <MoreVertical className="h-4 w-4 text-muted-foreground" />
                  </>
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="end"
              className="w-56 glass border-border/50"
            >
              <DropdownMenuItem
                onClick={() => router.push('/settings')}
                className="cursor-pointer focus:bg-primary/10 text-foreground"
              >
                <Settings className="mr-2 h-4 w-4" />
                Settings
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={toggleTheme}
                className="cursor-pointer focus:bg-primary/10 text-foreground"
              >
                {theme === 'dark' ? (
                  <Sun className="mr-2 h-4 w-4" />
                ) : (
                  <Moon className="mr-2 h-4 w-4" />
                )}
                {theme === 'dark' ? 'Light Mode' : 'Dark Mode'}
              </DropdownMenuItem>
              <DropdownMenuSeparator className="bg-border/50" />
              <DropdownMenuItem
                onClick={handleLogout}
                className="cursor-pointer text-destructive focus:bg-destructive/10 focus:text-destructive"
              >
                <LogOut className="mr-2 h-4 w-4" />
                Logout
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </aside>

      {/* Mobile menu button */}
      <Button
        variant="ghost"
        size="icon"
        className="fixed top-4 left-4 z-30 lg:hidden glass hover:bg-primary/10"
        onClick={() => dispatch(toggleSidebar())}
      >
        <ChevronRight className="h-5 w-5" />
      </Button>
    </>
  );
}
