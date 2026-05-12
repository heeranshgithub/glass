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
import { Loader2 } from 'lucide-react';

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
      <AlertDialogContent
        size="default"
        className="sm:max-w-md"
        style={{ borderRadius: 0 }}
      >
        <AlertDialogHeader>
          <span className="mono-label">Required / OpenRouter</span>
          <AlertDialogTitle className="text-2xl font-semibold tracking-tight">
            Add your API key
          </AlertDialogTitle>
          <AlertDialogDescription className="leading-relaxed">
            The council uses OpenRouter to call multiple models. Your key is
            encrypted at rest and can be updated in settings.
          </AlertDialogDescription>
        </AlertDialogHeader>

        <form onSubmit={handleSubmit} className="space-y-5 pt-2">
          <div className="space-y-1.5">
            <Label htmlFor="api-key" className="mono-label">
              API key
            </Label>
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
            {error && (
              <p className="text-sm text-destructive pt-1">{error}</p>
            )}
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

          <AlertDialogFooter className="gap-2">
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
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Saving
                </>
              ) : (
                'Save key'
              )}
            </Button>
          </AlertDialogFooter>
        </form>
      </AlertDialogContent>
    </AlertDialog>
  );
}
