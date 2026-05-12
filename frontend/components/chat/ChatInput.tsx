'use client';

import { useState, useRef, useEffect } from 'react';
import { Textarea } from '@/components/ui/textarea';
import { ArrowUp, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ChatInputProps {
  onSendMessage: (content: string) => void;
  isLoading: boolean;
  disabled?: boolean;
}

export function ChatInput({
  onSendMessage,
  isLoading,
  disabled,
}: ChatInputProps) {
  const [input, setInput] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      textarea.style.height = Math.min(textarea.scrollHeight, 200) + 'px';
    }
  }, [input]);

  const handleSubmit = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (input.trim() && !isLoading && !disabled) {
      onSendMessage(input.trim());
      setInput('');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const canSend = input.trim().length > 0 && !isLoading && !disabled;

  return (
    <div className="border-t border-border bg-background">
      <form
        onSubmit={handleSubmit}
        className="w-full px-3 sm:px-4 py-2 sm:py-2.5"
      >
        <div className="flex items-end gap-2">
          <div className="flex-1 min-w-0">
            <Textarea
              ref={textareaRef}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask the council—"
              disabled={isLoading || disabled}
              className={cn(
                'min-h-[40px] max-h-[200px] resize-none border-0 bg-transparent shadow-none',
                'rounded-none px-0 py-1 text-base leading-relaxed',
                'focus-visible:ring-0 focus-visible:ring-offset-0',
                'placeholder:text-muted-foreground/50'
              )}
              rows={1}
            />
          </div>

          <button
            type="submit"
            disabled={!canSend}
            aria-label="Send message"
            className={cn(
              'h-10 w-10 shrink-0 flex items-center justify-center transition-colors',
              canSend
                ? 'bg-foreground text-background hover:bg-primary'
                : 'bg-muted text-muted-foreground cursor-not-allowed'
            )}
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <ArrowUp className="h-4 w-4" strokeWidth={2.5} />
            )}
          </button>
        </div>

        <div className="flex items-baseline justify-between mt-1.5 gap-2">
          <span className="mono-label">
            01 · responses → 02 · rankings → 03 · synthesis
          </span>
          <span className="mono-label hidden sm:inline">
            <kbd className="font-mono">↵</kbd> send ·{' '}
            <kbd className="font-mono">⇧↵</kbd> new line
          </span>
        </div>
      </form>
    </div>
  );
}
