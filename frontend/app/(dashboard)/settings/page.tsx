'use client';

import { useState, useEffect } from 'react';
import {
  useAppDispatch,
  useAppSelector,
  useGetCurrentUserQuery,
  useUpdateCurrentUserMutation,
  useChangePasswordMutation,
  useLogoutAllMutation,
  useSetOpenRouterKeyMutation,
  useRemoveOpenRouterKeyMutation,
  useResetDemoLimitMutation,
  setTheme,
} from '@/lib/store';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, Check, Sun, Moon, Monitor } from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';

function SectionHeader({
  number,
  title,
  description,
}: {
  number?: string;
  title: string;
  description?: string;
}) {
  const titleBlock = (
    <div>
      <h2 className="text-xl font-semibold tracking-tight">{title}</h2>
      {description && (
        <p className="mt-1 text-sm text-muted-foreground">{description}</p>
      )}
    </div>
  );

  if (number == null) {
    return <header>{titleBlock}</header>;
  }

  return (
    <header className="grid grid-cols-[2.5rem_1fr] gap-3 items-baseline">
      <span className="mono-label tabular-nums">{number}</span>
      {titleBlock}
    </header>
  );
}

function SectionBody({
  children,
  numbered = true,
}: {
  children: React.ReactNode;
  numbered?: boolean;
}) {
  if (!numbered) {
    return <div className="space-y-4 max-w-xl">{children}</div>;
  }
  return (
    <div className="grid grid-cols-[2.5rem_1fr] gap-3">
      <div />
      <div className="space-y-4 max-w-xl">{children}</div>
    </div>
  );
}

export default function SettingsPage() {
  const dispatch = useAppDispatch();
  const theme = useAppSelector(state => state.ui.theme);

  const { data: user, isLoading: isLoadingUser } = useGetCurrentUserQuery();
  const [updateUser, { isLoading: isUpdating }] =
    useUpdateCurrentUserMutation();
  const [changePassword, { isLoading: isChangingPassword }] =
    useChangePasswordMutation();
  const [logoutAll, { isLoading: isLoggingOutAll }] = useLogoutAllMutation();
  const [setOpenRouterKey, { isLoading: isSettingKey }] =
    useSetOpenRouterKeyMutation();
  const [removeOpenRouterKey, { isLoading: isRemovingKey }] =
    useRemoveOpenRouterKeyMutation();
  const [resetDemoLimit, { isLoading: isResettingDemoLimit }] =
    useResetDemoLimitMutation();

  const [profileForm, setProfileForm] = useState({
    fullName: '',
    username: '',
  });
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [apiKeyForm, setApiKeyForm] = useState({ apiKey: '' });
  const [profileSuccess, setProfileSuccess] = useState(false);
  const [passwordSuccess, setPasswordSuccess] = useState(false);
  const [apiKeySuccess, setApiKeySuccess] = useState(false);
  const [demoResetSuccess, setDemoResetSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isDemo = user?.isDemo === true;
  const isAdmin = user?.roles?.includes('admin') || false;

  useEffect(() => {
    if (user) {
      setProfileForm({
        fullName: user.fullName || '',
        username: user.username || '',
      });
    }
  }, [user]);

  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setProfileSuccess(false);
    try {
      await updateUser({
        fullName: profileForm.fullName || undefined,
        username: profileForm.username || undefined,
      }).unwrap();
      setProfileSuccess(true);
      setTimeout(() => setProfileSuccess(false), 3000);
    } catch (err) {
      const error = err as { data?: { detail?: string } };
      setError(error.data?.detail || 'Failed to update profile');
    }
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setPasswordSuccess(false);
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setError('New passwords do not match');
      return;
    }
    try {
      await changePassword({
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword,
      }).unwrap();
      setPasswordSuccess(true);
      setPasswordForm({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      });
      setTimeout(() => setPasswordSuccess(false), 3000);
    } catch (err) {
      const error = err as { data?: { detail?: string } };
      setError(error.data?.detail || 'Failed to change password');
    }
  };

  const handleLogoutAllDevices = async () => {
    try {
      await logoutAll().unwrap();
    } catch (err) {
      console.error('Failed to logout all devices:', err);
    }
  };

  const handleResetDemoLimit = async () => {
    setError(null);
    setDemoResetSuccess(false);
    try {
      await resetDemoLimit().unwrap();
      setDemoResetSuccess(true);
      setTimeout(() => setDemoResetSuccess(false), 3000);
    } catch (err: any) {
      setError(
        err?.data?.detail || 'Failed to reset demo limit. Please try again.'
      );
    }
  };

  const submitApiKey = async (apiKey: string) => {
    setError(null);
    setApiKeySuccess(false);
    if (!apiKey.trim()) {
      setError('API key is required');
      return;
    }
    if (!apiKey.startsWith('sk-or-')) {
      setError(
        'Invalid OpenRouter API key format. Keys must start with "sk-or-"'
      );
      return;
    }
    try {
      await setOpenRouterKey({ apiKey: apiKey.trim() }).unwrap();
      setApiKeySuccess(true);
      setApiKeyForm({ apiKey: '' });
      setTimeout(() => setApiKeySuccess(false), 3000);
    } catch (err: any) {
      setError(err?.data?.detail || 'Failed to save API key.');
    }
  };

  const themes = [
    { value: 'light' as const, label: 'Light', icon: Sun },
    { value: 'dark' as const, label: 'Dark', icon: Moon },
    { value: 'system' as const, label: 'System', icon: Monitor },
  ];

  if (isLoadingUser) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="flex items-center gap-3">
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
          <span className="mono-label">Loading settings</span>
        </div>
      </div>
    );
  }

  let sectionIndex = 0;
  const nextNumber = () => String(++sectionIndex).padStart(2, '0');

  return (
    <div className="flex-1 overflow-auto">
      <div className="max-w-4xl mx-auto px-2 sm:px-3 py-6 lg:py-10">
        <div className="flex items-baseline justify-between mb-4">
          <span className="mono-label">{user?.email}</span>
        </div>
        <div className="swiss-rule-strong mb-8" />

        <div className="grid grid-cols-12 gap-5 lg:gap-6 mb-8 lg:mb-10">
          <div className="col-span-12 lg:col-span-8">
            <h1 className="display-lg leading-none">Settings</h1>
          </div>
          <div className="col-span-12 lg:col-span-4 lg:col-start-9 flex items-end">
            <p className="text-sm text-muted-foreground leading-relaxed">
              Manage your account, appearance and integrations.
            </p>
          </div>
        </div>

        {error && (
          <div
            className="border-l-2 border-destructive pl-3 py-1 mb-6 text-sm text-destructive"
            role="alert"
          >
            {error}
          </div>
        )}

        <div className="space-y-10 lg:space-y-12">
          {/* Profile */}
          <section className="space-y-4">
            <SectionHeader
              title="Profile"
              description="Your personal information."
            />
            <div className="swiss-rule" />
            <SectionBody numbered={false}>
              <form onSubmit={handleProfileUpdate} className="space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="email" className="mono-label">
                    Email
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    value={user?.email || ''}
                    disabled
                  />
                  <p className="text-xs text-muted-foreground">
                    Email cannot be changed.
                  </p>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="fullName" className="mono-label">
                    Full name
                  </Label>
                  <Input
                    id="fullName"
                    value={profileForm.fullName || user?.fullName || ''}
                    onChange={e =>
                      setProfileForm(prev => ({
                        ...prev,
                        fullName: e.target.value,
                      }))
                    }
                    disabled={isDemo}
                  />
                  {isDemo && (
                    <p className="text-xs text-muted-foreground">
                      Profile editing is disabled for demo accounts.
                    </p>
                  )}
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="username" className="mono-label">
                    Username
                  </Label>
                  <Input
                    id="username"
                    value={profileForm.username || user?.username || ''}
                    onChange={e =>
                      setProfileForm(prev => ({
                        ...prev,
                        username: e.target.value,
                      }))
                    }
                    placeholder="Optional"
                    disabled={isDemo}
                  />
                </div>

                <div className="flex flex-wrap items-baseline gap-x-6 gap-y-1 pt-2 mono-label">
                  <span>
                    Created{' '}
                    {user?.createdAt
                      ? formatDistanceToNow(new Date(user.createdAt), {
                          addSuffix: true,
                        })
                      : 'unknown'}
                  </span>
                </div>

                {!isDemo && (
                  <div>
                    <Button type="submit" disabled={isUpdating}>
                      {isUpdating ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" />
                          Saving
                        </>
                      ) : profileSuccess ? (
                        <>
                          <Check className="h-4 w-4" />
                          Saved
                        </>
                      ) : (
                        'Save changes'
                      )}
                    </Button>
                  </div>
                )}
              </form>
            </SectionBody>
          </section>

          {/* Appearance */}
          <section className="space-y-4">
            <SectionHeader
              title="Appearance"
              description="How Glass looks on your device."
            />
            <div className="swiss-rule" />
            <SectionBody numbered={false}>
              <div className="grid grid-cols-3 gap-3">
                {themes.map(({ value, label, icon: Icon }) => (
                  <button
                    key={value}
                    onClick={() => dispatch(setTheme(value))}
                    className={cn(
                      'flex flex-col items-start gap-2 p-3 border transition-colors text-left',
                      theme === value
                        ? 'border-foreground bg-foreground text-background'
                        : 'border-border hover:border-foreground'
                    )}
                  >
                    <Icon className="h-4 w-4" strokeWidth={1.75} />
                    <span className="text-sm font-medium">{label}</span>
                  </button>
                ))}
              </div>
            </SectionBody>
          </section>

          {/* Password */}
          {!isDemo && (
            <section className="space-y-4">
              <SectionHeader
                number={nextNumber()}
                title="Password"
                description="Change the password used to sign in."
              />
              <div className="swiss-rule" />
              <SectionBody>
                <form onSubmit={handlePasswordChange} className="space-y-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="currentPassword" className="mono-label">
                      Current password
                    </Label>
                    <Input
                      id="currentPassword"
                      type="password"
                      value={passwordForm.currentPassword}
                      onChange={e =>
                        setPasswordForm(prev => ({
                          ...prev,
                          currentPassword: e.target.value,
                        }))
                      }
                      required
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="newPassword" className="mono-label">
                      New password
                    </Label>
                    <Input
                      id="newPassword"
                      type="password"
                      value={passwordForm.newPassword}
                      onChange={e =>
                        setPasswordForm(prev => ({
                          ...prev,
                          newPassword: e.target.value,
                        }))
                      }
                      required
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="confirmPassword" className="mono-label">
                      Confirm new password
                    </Label>
                    <Input
                      id="confirmPassword"
                      type="password"
                      value={passwordForm.confirmPassword}
                      onChange={e =>
                        setPasswordForm(prev => ({
                          ...prev,
                          confirmPassword: e.target.value,
                        }))
                      }
                      required
                    />
                  </div>
                  <div>
                    <Button type="submit" disabled={isChangingPassword}>
                      {isChangingPassword ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" />
                          Changing
                        </>
                      ) : passwordSuccess ? (
                        <>
                          <Check className="h-4 w-4" />
                          Changed
                        </>
                      ) : (
                        'Change password'
                      )}
                    </Button>
                  </div>
                </form>
              </SectionBody>
            </section>
          )}

          {/* API Key */}
          {!isDemo && (
            <section className="space-y-4">
              <SectionHeader
                number={nextNumber()}
                title="OpenRouter API key"
                description="Required to use the council. Encrypted at rest."
              />
              <div className="swiss-rule" />
              <SectionBody>
                {user?.hasOpenRouterKey || isDemo ? (
                  <p className="mono-label flex items-center gap-2">
                    <span className="h-1.5 w-1.5 bg-foreground" />
                    Configured
                  </p>
                ) : (
                  <p className="mono-label flex items-center gap-2 text-primary">
                    <span className="h-1.5 w-1.5 bg-primary" />
                    Not configured
                  </p>
                )}

                <form
                  onSubmit={e => {
                    e.preventDefault();
                    submitApiKey(apiKeyForm.apiKey);
                  }}
                  className="space-y-4"
                >
                  <div className="space-y-1.5">
                    <Label htmlFor="apiKey" className="mono-label">
                      {user?.hasOpenRouterKey ? 'Update key' : 'API key'}
                    </Label>
                    <Input
                      id="apiKey"
                      type="password"
                      placeholder="sk-or-..."
                      value={apiKeyForm.apiKey}
                      onChange={e => {
                        setApiKeyForm({ apiKey: e.target.value });
                        setError(null);
                      }}
                      disabled={isSettingKey}
                      required={!user?.hasOpenRouterKey}
                    />
                    <p className="text-xs text-muted-foreground">
                      Get your key from{' '}
                      <a
                        href="https://openrouter.ai/keys"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-foreground underline underline-offset-4 decoration-foreground/40 hover:decoration-foreground"
                      >
                        openrouter.ai/keys
                      </a>
                      .
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-3">
                    <Button type="submit" disabled={isSettingKey}>
                      {isSettingKey ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" />
                          Saving
                        </>
                      ) : apiKeySuccess ? (
                        <>
                          <Check className="h-4 w-4" />
                          Saved
                        </>
                      ) : user?.hasOpenRouterKey ? (
                        'Update key'
                      ) : (
                        'Save key'
                      )}
                    </Button>
                    {user?.hasOpenRouterKey && (
                      <Button
                        type="button"
                        variant="destructive"
                        onClick={async () => {
                          if (
                            confirm(
                              'Remove your API key? You will not be able to use the council until you add a new key.'
                            )
                          ) {
                            try {
                              await removeOpenRouterKey().unwrap();
                            } catch (err: any) {
                              setError(
                                err?.data?.detail || 'Failed to remove API key.'
                              );
                            }
                          }
                        }}
                        disabled={isRemovingKey}
                      >
                        {isRemovingKey ? (
                          <>
                            <Loader2 className="h-4 w-4 animate-spin" />
                            Removing
                          </>
                        ) : (
                          'Remove key'
                        )}
                      </Button>
                    )}
                  </div>
                </form>
              </SectionBody>
            </section>
          )}

          {/* Admin */}
          {isAdmin && (
            <section className="space-y-4">
              <SectionHeader
                number={nextNumber()}
                title="Admin"
                description="Manage demo account settings."
              />
              <div className="swiss-rule" />
              <SectionBody>
                <div className="flex items-baseline justify-between gap-6">
                  <div>
                    <div className="text-sm font-medium">
                      Reset demo daily limit
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      Reset the demo user&rsquo;s daily request count to zero.
                    </p>
                  </div>
                  <Button
                    onClick={handleResetDemoLimit}
                    disabled={isResettingDemoLimit}
                    variant="outline"
                  >
                    {isResettingDemoLimit ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Resetting
                      </>
                    ) : demoResetSuccess ? (
                      <>
                        <Check className="h-4 w-4" />
                        Reset
                      </>
                    ) : (
                      'Reset limit'
                    )}
                  </Button>
                </div>
              </SectionBody>
            </section>
          )}

          {/* Security */}
          {!isDemo && (
            <section className="space-y-4">
              <SectionHeader
                number={nextNumber()}
                title="Security"
                description="Manage your active sessions."
              />
              <div className="swiss-rule" />
              <SectionBody>
                <div className="flex items-baseline justify-between gap-6">
                  <div>
                    <div className="text-sm font-medium">Active sessions</div>
                    <p className="text-xs text-muted-foreground mt-1">
                      Sign out from all devices except this one.
                    </p>
                  </div>
                  <Button
                    variant="destructive"
                    onClick={handleLogoutAllDevices}
                    disabled={isLoggingOutAll}
                  >
                    {isLoggingOutAll ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Signing out
                      </>
                    ) : (
                      'Sign out all devices'
                    )}
                  </Button>
                </div>
              </SectionBody>
            </section>
          )}
        </div>
      </div>
    </div>
  );
}
