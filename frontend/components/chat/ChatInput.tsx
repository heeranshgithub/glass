'use client';

import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Send, Loader2, Sparkles } from 'lucide-react';
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
  const [isFocused, setIsFocused] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-resize textarea
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

  return (
    <div className="border-t border-border/50 bg-background/80 backdrop-blur-xl p-4">
      <form onSubmit={handleSubmit} className="max-w-4xl mx-auto">
        <div
          className={cn(
            'relative flex items-end gap-3 p-2 rounded-2xl transition-all duration-300',
            'glass border',
            isFocused
              ? 'border-primary/50 shadow-lg shadow-primary/10'
              : 'border-border/50'
          )}
        >
          {/* Animated gradient border on focus */}
          {isFocused && (
            <div className="absolute inset-0 -z-10 rounded-2xl opacity-50">
              <div className="absolute inset-[-1px] rounded-2xl animate-border-flow bg-[length:300%_100%]" />
            </div>
          )}

          <div className="flex-1 relative">
            <Textarea
              ref={textareaRef}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              onFocus={() => setIsFocused(true)}
              onBlur={() => setIsFocused(false)}
              placeholder="Ask the council a question..."
              disabled={isLoading || disabled}
              className={cn(
                'min-h-[48px] max-h-[200px] resize-none border-0 bg-transparent',
                'focus-visible:ring-0 focus-visible:ring-offset-0',
                'placeholder:text-muted-foreground/60',
                'text-foreground'
              )}
              rows={1}
            />
          </div>

          <Button
            type="submit"
            size="icon"
            disabled={!input.trim() || isLoading || disabled}
            className={cn(
              'h-12 w-12 shrink-0 rounded-xl transition-all duration-300',
              'bg-gradient-to-r from-primary to-neon-purple',
              'hover:from-primary/90 hover:to-neon-purple/90',
              'shadow-lg shadow-primary/25 hover:shadow-primary/40',
              'disabled:opacity-50 disabled:shadow-none',
              'group'
            )}
          >
            {isLoading ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <Send className="h-5 w-5 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
            )}
          </Button>
        </div>

        {/* Hints */}
        <div className="flex items-center justify-between mt-3 px-2">
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground/70">
            <Sparkles className="w-3 h-3" />
            <span>3-stage analysis: responses → rankings → synthesis</span>
          </div>
          <div className="text-xs text-muted-foreground/50">
            <kbd className="px-1.5 py-0.5 rounded bg-muted/50 text-[10px] font-mono">
              Shift
            </kbd>
            <span className="mx-1">+</span>
            <kbd className="px-1.5 py-0.5 rounded bg-muted/50 text-[10px] font-mono">
              Enter
            </kbd>
            <span className="ml-1.5">for new line</span>
          </div>
        </div>
      </form>
    </div>
  );
}
