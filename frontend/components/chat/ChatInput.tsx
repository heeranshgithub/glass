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
    <div>
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-3xl mx-auto px-3 sm:px-4 pt-2 pb-[max(0.5rem,calc(env(safe-area-inset-bottom)*0.7))]"
      >
        <div className="flex items-end gap-2 rounded-[26px] border border-border bg-muted/50 pl-5 pr-2 py-2 transition-colors focus-within:border-input">
          <div className="flex-1 min-w-0">
            <Textarea
              ref={textareaRef}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask the council anything"
              disabled={isLoading || disabled}
              className={cn(
                'min-h-[36px] max-h-[200px] resize-none border-0 bg-transparent shadow-none dark:bg-transparent',
                'rounded-none px-0 py-1.5 text-base leading-relaxed',
                'focus-visible:ring-0 focus-visible:ring-offset-0 focus-visible:border-0',
                'placeholder:text-muted-foreground/70'
              )}
              rows={1}
            />
          </div>

          <button
            type="submit"
            disabled={!canSend}
            aria-label="Send message"
            className={cn(
              'h-9 w-9 shrink-0 flex items-center justify-center rounded-full transition-colors',
              canSend
                ? 'bg-foreground text-background hover:bg-foreground/85'
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
      </form>
    </div>
  );
}
