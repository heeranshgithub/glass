'use client';

import ReactMarkdown from 'react-markdown';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { CHAT_MODELS } from '@/lib/types';
import type { Message, AssistantMessage } from '@/lib/types';

interface ChatMessagesProps {
  messages: Message[];
  isLoading: boolean;
  selectedModel: string;
}

const chatColumn = 'w-full px-2.5 sm:px-3.5';

const MODEL_DESCRIPTIONS: Record<string, string> = {
  'openai/gpt-5.1':                "OpenAI's flagship reasoning model",
  'google/gemini-3.1-pro-preview': "Google's multimodal powerhouse",
  'anthropic/claude-sonnet-4.5':   "Anthropic's balanced intelligence",
  'x-ai/grok-4.20':                "xAI's real-time reasoning model",
};

export function ChatMessages({ messages, isLoading, selectedModel }: ChatMessagesProps) {
  if (messages.length === 0) {
    return (
      <div className="flex-1 overflow-y-auto">
        <div className={`${chatColumn} pt-6 pb-6 sm:pt-10 sm:pb-8 max-w-4xl`}>
          <div className="space-y-10 sm:space-y-12">
            <div className="space-y-6">
              <p
                className="mono-label animate-fade-up"
                style={{ animationDelay: '0ms' }}
              >
                Empty thread
              </p>
              <h1 className="display-lg max-w-[min(100%,36rem)] leading-[0.98]">
                <span
                  className="block animate-fade-up"
                  style={{ animationDelay: '40ms' }}
                >
                  Ask anything.
                </span>
                <span
                  className="block text-muted-foreground animate-fade-up"
                  style={{ animationDelay: '90ms' }}
                >
                  Pick a model.
                </span>
                <span
                  className="block animate-fade-up"
                  style={{ animationDelay: '140ms' }}
                >
                  Get an answer<span className="text-primary">.</span>
                </span>
              </h1>
              <div
                className="swiss-rule max-w-md animate-fade-up"
                style={{ animationDelay: '180ms' }}
              />
            </div>

            <div
              className="grid grid-cols-1 sm:grid-cols-2 gap-px bg-border animate-fade-up"
              style={{ animationDelay: '220ms' }}
            >
              {CHAT_MODELS.map((model, i) => (
                <article
                  key={model.id}
                  className={cn(
                    'group relative bg-background p-4 transition-colors duration-200',
                    selectedModel === model.id && 'bg-muted'
                  )}
                >
                  <div className="absolute top-0 left-0 right-0 h-px bg-border transition-colors duration-500 group-hover:bg-foreground" />
                  <div className="absolute top-0 left-0 h-px w-0 bg-primary transition-all duration-700 ease-out group-hover:w-full" />
                  <div className="pt-3 space-y-1">
                    <div className="flex items-baseline justify-between gap-2">
                      <h3 className="text-sm font-semibold tracking-tight group-hover:text-primary transition-colors duration-300">
                        {model.label}
                      </h3>
                      {selectedModel === model.id && (
                        <span className="mono-label text-primary">active</span>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      {MODEL_DESCRIPTIONS[model.id]}
                    </p>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto">
      <div className={`${chatColumn} py-3 sm:py-4 space-y-6`}>
        {messages.map((message, index) => (
          <div
            key={index}
            className="animate-fade-up"
            style={{ animationDelay: `${Math.min(index, 5) * 40}ms` }}
          >
            {message.role === 'user' ? (
              <UserMessage content={message.content} />
            ) : (
              <AssistantMessageDisplay
                message={message as AssistantMessage}
                selectedModel={selectedModel}
                withTopRule={index > 0}
              />
            )}
          </div>
        ))}

        {isLoading && (
          <div className="flex items-center gap-3 text-muted-foreground">
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
            <span className="mono-label">Thinking</span>
            <span className="animate-cursor text-muted-foreground">_</span>
          </div>
        )}
      </div>
    </div>
  );
}

function UserMessage({ content }: { content: string }) {
  return (
    <div className="flex flex-col items-end gap-2">
      <div
        className={cn(
          'w-fit max-w-[min(100%,42rem)] rounded-2xl border border-border',
          'bg-muted px-3 py-2.5 shadow-sm',
          'dark:border-border dark:bg-muted/80'
        )}
      >
        <div className="prose prose-sm max-w-none dark:prose-invert text-foreground prose-p:my-1 prose-p:first:mt-0 prose-p:last:mb-0 text-left">
          <ReactMarkdown>{content}</ReactMarkdown>
        </div>
      </div>
    </div>
  );
}

function AssistantMessageDisplay({
  message,
  selectedModel,
  withTopRule = true,
}: {
  message: AssistantMessage;
  selectedModel: string;
  withTopRule?: boolean;
}) {
  const modelLabel =
    CHAT_MODELS.find(m => m.id === selectedModel)?.label ?? selectedModel.split('/').pop() ?? 'AI';

  const streamingText = message.streaming?.modelTokens?.[selectedModel];
  const completedResponse =
    message.responses?.find(r => r.model === selectedModel)?.response ??
    message.responses?.[0]?.response;

  const responseText = streamingText ?? completedResponse ?? null;
  const isThinking = !responseText && message.loading;

  return (
    <div
      className={cn(
        'space-y-3',
        withTopRule && 'border-t border-border pt-4 mt-0.5'
      )}
    >
      <div className="flex items-baseline justify-between gap-4">
        <span className="mono-label">{modelLabel}</span>
        <div className="swiss-rule flex-1 min-w-0 self-center" />
      </div>

      {isThinking && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
          <span>Thinking</span>
          <span className="animate-cursor">_</span>
        </div>
      )}

      {responseText && (
        <div className="prose prose-sm max-w-none dark:prose-invert text-foreground prose-p:my-1.5 prose-p:first:mt-0 prose-p:last:mb-0 max-w-3xl">
          <ReactMarkdown>{responseText}</ReactMarkdown>
        </div>
      )}

      {!responseText && !isThinking && (
        <div className="text-sm text-muted-foreground italic">
          Waiting for response&hellip;
        </div>
      )}
    </div>
  );
}
