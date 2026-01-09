'use client';

import { useState } from 'react';
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useSetOpenRouterKeyMutation } from '@/lib/store/api/userApi';
import { Loader2, Key } from 'lucide-react';

interface OpenRouterKeyModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export function OpenRouterKeyModal({
  open,
  onOpenChange,
  onSuccess,
}: OpenRouterKeyModalProps) {
  const [apiKey, setApiKey] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [setOpenRouterKey, { isLoading }] = useSetOpenRouterKeyMutation();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validate API key format
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
      setApiKey('');
      onSuccess?.();
      onOpenChange(false);
    } catch (err: any) {
      // Handle different error formats
      let errorMessage = 'Failed to save API key. Please try again.';

      if (err?.data) {
        // Handle Pydantic validation errors (array format)
        if (Array.isArray(err.data.detail)) {
          errorMessage = err.data.detail
            .map((item: any) => item?.msg || String(item))
            .join(', ');
        }
        // Handle string error messages
        else if (typeof err.data.detail === 'string') {
          errorMessage = err.data.detail;
        }
        // Handle error object
        else if (err.data.detail && typeof err.data.detail === 'object') {
          errorMessage = err.data.detail.msg || JSON.stringify(err.data.detail);
        }
      } else if (err?.message) {
        errorMessage = err.message;
      }

      setError(errorMessage);
    }
  };

  const handleSkip = () => {
    setApiKey('');
    setError(null);
    onOpenChange(false);
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent size="default" className="sm:max-w-md">
        <AlertDialogHeader>
          <div className="flex items-center justify-center mb-2">
            <Key className="h-8 w-8 text-primary" />
          </div>
          <AlertDialogTitle>Add OpenRouter API Key</AlertDialogTitle>
          <AlertDialogDescription>
            To use the LLM Council features, you need to provide your OpenRouter
            API key. Your key will be encrypted and stored securely. You can add
            or update it later in settings.
          </AlertDialogDescription>
        </AlertDialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="api-key">OpenRouter API Key</Label>
            <Input
              id="api-key"
              type="password"
              placeholder="sk-or-..."
              value={apiKey}
              onChange={e => {
                setApiKey(e.target.value);
                setError(null);
              }}
              disabled={isLoading}
              autoFocus
            />
            {error && <p className="text-sm text-destructive">{error}</p>}
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

          <AlertDialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={handleSkip}
              disabled={isLoading}
            >
              Skip for now
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                'Save Key'
              )}
            </Button>
          </AlertDialogFooter>
        </form>
      </AlertDialogContent>
    </AlertDialog>
  );
}
