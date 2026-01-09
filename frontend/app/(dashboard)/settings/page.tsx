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
  setTheme,
} from '@/lib/store';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  Loader2,
  User,
  Lock,
  Palette,
  Laptop,
  Check,
  Sun,
  Moon,
  Monitor,
  Key,
  Trash2,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';

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

  const [profileForm, setProfileForm] = useState({
    fullName: '',
    username: '',
  });
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [apiKeyForm, setApiKeyForm] = useState({
    apiKey: '',
  });
  const [profileSuccess, setProfileSuccess] = useState(false);
  const [passwordSuccess, setPasswordSuccess] = useState(false);
  const [apiKeySuccess, setApiKeySuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Initialize form when user data loads
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

  const themes = [
    { value: 'light' as const, label: 'Light', icon: Sun },
    { value: 'dark' as const, label: 'Dark', icon: Moon },
    { value: 'system' as const, label: 'System', icon: Monitor },
  ];

  if (isLoadingUser) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-auto">
      <div className="max-w-2xl mx-auto p-6 space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Settings</h1>
          <p className="text-muted-foreground">
            Manage your account settings and preferences
          </p>
        </div>

        {error && (
          <div className="p-3 rounded-md bg-destructive/10 border border-destructive/20 text-destructive text-sm">
            {error}
          </div>
        )}

        {/* Profile Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Profile
            </CardTitle>
            <CardDescription>Update your personal information</CardDescription>
          </CardHeader>
          <form onSubmit={handleProfileUpdate}>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={user?.email || ''}
                  disabled
                  className="bg-muted"
                />
                <p className="text-xs text-muted-foreground">
                  Email cannot be changed
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="fullName">Full Name</Label>
                <Input
                  id="fullName"
                  value={profileForm.fullName || user?.fullName || ''}
                  onChange={e =>
                    setProfileForm(prev => ({
                      ...prev,
                      fullName: e.target.value,
                    }))
                  }
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="username">Username</Label>
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
                />
              </div>

              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <span>Account created:</span>
                <span>
                  {user?.createdAt
                    ? formatDistanceToNow(new Date(user.createdAt), {
                        addSuffix: true,
                      })
                    : 'Unknown'}
                </span>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">Roles:</span>
                {user?.roles.map(role => (
                  <Badge key={role} variant="secondary">
                    {role}
                  </Badge>
                ))}
              </div>
            </CardContent>
            <CardFooter>
              <Button type="submit" disabled={isUpdating}>
                {isUpdating ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : profileSuccess ? (
                  <>
                    <Check className="mr-2 h-4 w-4" />
                    Saved!
                  </>
                ) : (
                  'Save Changes'
                )}
              </Button>
            </CardFooter>
          </form>
        </Card>

        {/* Theme Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Palette className="h-5 w-5" />
              Appearance
            </CardTitle>
            <CardDescription>
              Customize how Glass looks on your device
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-3">
              {themes.map(({ value, label, icon: Icon }) => (
                <button
                  key={value}
                  onClick={() => dispatch(setTheme(value))}
                  className={cn(
                    'flex flex-col items-center gap-2 p-4 rounded-lg border-2 transition-colors',
                    theme === value
                      ? 'border-primary bg-primary/5'
                      : 'border-border hover:border-primary/50'
                  )}
                >
                  <Icon className="h-6 w-6" />
                  <span className="text-sm font-medium">{label}</span>
                </button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Password Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Lock className="h-5 w-5" />
              Password
            </CardTitle>
            <CardDescription>Change your password</CardDescription>
          </CardHeader>
          <form onSubmit={handlePasswordChange}>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="currentPassword">Current Password</Label>
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

              <Separator />

              <div className="space-y-2">
                <Label htmlFor="newPassword">New Password</Label>
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

              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm New Password</Label>
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
            </CardContent>
            <CardFooter>
              <Button type="submit" disabled={isChangingPassword}>
                {isChangingPassword ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Changing...
                  </>
                ) : passwordSuccess ? (
                  <>
                    <Check className="mr-2 h-4 w-4" />
                    Changed!
                  </>
                ) : (
                  'Change Password'
                )}
              </Button>
            </CardFooter>
          </form>
        </Card>

        {/* OpenRouter API Key Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Key className="h-5 w-5" />
              OpenRouter API Key
            </CardTitle>
            <CardDescription>
              Manage your OpenRouter API key for LLM Council features
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {user?.hasOpenRouterKey ? (
              <div className="space-y-4">
                <div className="flex items-center gap-2 p-4 bg-muted rounded-lg">
                  <Check className="h-5 w-5 text-green-600" />
                  <span className="text-sm font-medium">
                    API key is configured
                  </span>
                </div>
                <form
                  onSubmit={async e => {
                    e.preventDefault();
                    setError(null);
                    setApiKeySuccess(false);

                    if (!apiKeyForm.apiKey.trim()) {
                      setError('API key is required');
                      return;
                    }

                    if (!apiKeyForm.apiKey.startsWith('sk-or-')) {
                      setError(
                        'Invalid OpenRouter API key format. Keys must start with "sk-or-"'
                      );
                      return;
                    }

                    try {
                      await setOpenRouterKey({
                        apiKey: apiKeyForm.apiKey.trim(),
                      }).unwrap();
                      setApiKeySuccess(true);
                      setApiKeyForm({ apiKey: '' });
                      setTimeout(() => setApiKeySuccess(false), 3000);
                    } catch (err: any) {
                      const errorMessage =
                        err?.data?.detail ||
                        'Failed to update API key. Please try again.';
                      setError(errorMessage);
                    }
                  }}
                  className="space-y-4"
                >
                  <div className="space-y-2">
                    <Label htmlFor="apiKey">Update API Key</Label>
                    <Input
                      id="apiKey"
                      type="password"
                      placeholder="sk-or-..."
                      value={apiKeyForm.apiKey}
                      onChange={e => {
                        setApiKeyForm(prev => ({
                          ...prev,
                          apiKey: e.target.value,
                        }));
                        setError(null);
                      }}
                      disabled={isSettingKey}
                    />
                    <p className="text-xs text-muted-foreground">
                      Get your API key from{' '}
                      <a
                        href="https://openrouter.ai/keys"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary hover:underline"
                      >
                        openrouter.ai/keys
                      </a>
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button type="submit" disabled={isSettingKey}>
                      {isSettingKey ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Updating...
                        </>
                      ) : apiKeySuccess ? (
                        <>
                          <Check className="mr-2 h-4 w-4" />
                          Updated!
                        </>
                      ) : (
                        'Update Key'
                      )}
                    </Button>
                    <Button
                      type="button"
                      variant="destructive"
                      onClick={async () => {
                        if (
                          confirm(
                            'Are you sure you want to remove your API key? You will not be able to use LLM Council features until you add a new key.'
                          )
                        ) {
                          try {
                            await removeOpenRouterKey().unwrap();
                            setApiKeySuccess(true);
                            setTimeout(() => setApiKeySuccess(false), 3000);
                          } catch (err: any) {
                            const errorMessage =
                              err?.data?.detail ||
                              'Failed to remove API key. Please try again.';
                            setError(errorMessage);
                          }
                        }
                      }}
                      disabled={isRemovingKey}
                    >
                      {isRemovingKey ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Removing...
                        </>
                      ) : (
                        <>
                          <Trash2 className="mr-2 h-4 w-4" />
                          Remove Key
                        </>
                      )}
                    </Button>
                  </div>
                </form>
              </div>
            ) : (
              <form
                onSubmit={async e => {
                  e.preventDefault();
                  setError(null);
                  setApiKeySuccess(false);

                  if (!apiKeyForm.apiKey.trim()) {
                    setError('API key is required');
                    return;
                  }

                  if (!apiKeyForm.apiKey.startsWith('sk-or-')) {
                    setError(
                      'Invalid OpenRouter API key format. Keys must start with "sk-or-"'
                    );
                    return;
                  }

                  try {
                    await setOpenRouterKey({
                      apiKey: apiKeyForm.apiKey.trim(),
                    }).unwrap();
                    setApiKeySuccess(true);
                    setApiKeyForm({ apiKey: '' });
                    setTimeout(() => setApiKeySuccess(false), 3000);
                  } catch (err: any) {
                    const errorMessage =
                      err?.data?.detail ||
                      'Failed to save API key. Please try again.';
                    setError(errorMessage);
                  }
                }}
                className="space-y-4"
              >
                <div className="p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
                  <p className="text-sm text-yellow-600 dark:text-yellow-400">
                    You need to add an OpenRouter API key to use LLM Council
                    features.
                  </p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="apiKey">OpenRouter API Key</Label>
                  <Input
                    id="apiKey"
                    type="password"
                    placeholder="sk-or-..."
                    value={apiKeyForm.apiKey}
                    onChange={e => {
                      setApiKeyForm(prev => ({
                        ...prev,
                        apiKey: e.target.value,
                      }));
                      setError(null);
                    }}
                    disabled={isSettingKey}
                    required
                  />
                  <p className="text-xs text-muted-foreground">
                    Get your API key from{' '}
                    <a
                      href="https://openrouter.ai/keys"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary hover:underline"
                    >
                      openrouter.ai/keys
                    </a>
                  </p>
                </div>
                <Button type="submit" disabled={isSettingKey}>
                  {isSettingKey ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : apiKeySuccess ? (
                    <>
                      <Check className="mr-2 h-4 w-4" />
                      Saved!
                    </>
                  ) : (
                    'Save API Key'
                  )}
                </Button>
              </form>
            )}
          </CardContent>
        </Card>

        {/* Security Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Laptop className="h-5 w-5" />
              Security
            </CardTitle>
            <CardDescription>Manage your active sessions</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
              <div>
                <div className="font-medium">Active Sessions</div>
                <div className="text-sm text-muted-foreground">
                  Sign out from all devices except this one
                </div>
              </div>
              <Button
                variant="destructive"
                onClick={handleLogoutAllDevices}
                disabled={isLoggingOutAll}
              >
                {isLoggingOutAll ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Signing out...
                  </>
                ) : (
                  'Sign out all devices'
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
