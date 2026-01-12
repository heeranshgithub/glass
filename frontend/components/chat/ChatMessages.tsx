'use client';

import { useEffect, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import { Stage1Display } from './Stage1Display';
import { Stage2Display } from './Stage2Display';
import { Stage3Display } from './Stage3Display';
import { User, Brain, Loader2, Sparkles, Hexagon } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Message, AssistantMessage } from '@/lib/types';

interface ChatMessagesProps {
  messages: Message[];
  isLoading: boolean;
}

export function ChatMessages({ messages, isLoading }: ChatMessagesProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  if (messages.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center p-8 bg-gradient-radial">
        <div className="text-center space-y-6 max-w-lg">
          {/* Animated logo */}
          <div className="relative mx-auto w-24 h-24">
            <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-primary/20 to-neon-purple/20 animate-pulse-glow" />
            <div className="absolute inset-0 flex items-center justify-center">
              <Hexagon className="h-12 w-12 text-primary hexagon-logo" />
            </div>
            <div className="absolute -inset-4 rounded-3xl border border-primary/10 animate-pulse opacity-50" />
          </div>

          <div className="space-y-3">
            <h2 className="text-3xl font-bold tracking-tight">
              <span className="bg-gradient-to-r from-foreground via-primary to-foreground bg-clip-text text-transparent">
                Start a Conversation
              </span>
            </h2>
            <p className="text-muted-foreground leading-relaxed">
              Ask the{' '}
              <span className="text-primary font-medium">LLM Council</span> a
              question. Multiple AI models will analyze your query, rank each
              other&apos;s responses, and synthesize the best answer.
            </p>
          </div>

          {/* Feature pills */}
          <div className="flex flex-wrap justify-center gap-2 pt-2">
            {['Multi-Model Analysis', 'Peer Ranking', 'Synthesized Answer'].map(
              (feature, i) => (
                <div
                  key={feature}
                  className="px-3 py-1.5 rounded-full text-xs font-medium glass border border-border/50 text-muted-foreground"
                  style={{ animationDelay: `${i * 100}ms` }}
                >
                  <Sparkles className="inline-block w-3 h-3 mr-1.5 text-primary" />
                  {feature}
                </div>
              )
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto bg-gradient-radial">
      <div className="max-w-8xl mx-auto p-6 space-y-8">
        {messages.map((message, index) => (
          <div
            key={index}
            className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500"
            style={{ animationDelay: `${index * 50}ms` }}
          >
            {message.role === 'user' ? (
              <UserMessage content={message.content} />
            ) : (
              <AssistantMessageDisplay message={message as AssistantMessage} />
            )}
          </div>
        ))}

        {isLoading && (
          <div className="flex items-center gap-3 text-muted-foreground animate-in fade-in duration-300">
            <div className="relative">
              <Loader2 className="h-5 w-5 animate-spin text-primary" />
              <div className="absolute inset-0 animate-ping opacity-20">
                <Loader2 className="h-5 w-5 text-primary" />
              </div>
            </div>
            <span className="text-sm font-medium">
              Consulting the council
              <span className="inline-flex">
                <span
                  className="animate-bounce"
                  style={{ animationDelay: '0ms' }}
                >
                  .
                </span>
                <span
                  className="animate-bounce"
                  style={{ animationDelay: '150ms' }}
                >
                  .
                </span>
                <span
                  className="animate-bounce"
                  style={{ animationDelay: '300ms' }}
                >
                  .
                </span>
              </span>
            </span>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>
    </div>
  );
}

function UserMessage({ content }: { content: string }) {
  return (
    <div className="flex gap-4 group">
      <div className="relative">
        <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-primary to-neon-purple flex items-center justify-center flex-shrink-0 shadow-lg shadow-primary/20">
          <User className="h-5 w-5 text-primary-foreground" />
        </div>
      </div>
      <div className="flex-1 pt-1">
        <div className="flex items-center gap-2 mb-2">
          <span className="font-semibold text-foreground">You</span>
        </div>
        <div className="glass rounded-2xl rounded-tl-sm p-4 border border-border/30">
          <div className="prose prose-sm dark:prose-invert max-w-none">
            <ReactMarkdown>{content}</ReactMarkdown>
          </div>
        </div>
      </div>
    </div>
  );
}

function AssistantMessageDisplay({ message }: { message: AssistantMessage }) {
  const hasContent = message.stage1 || message.stage2 || message.stage3;
  const hasLoading =
    message.loading?.stage1 ||
    message.loading?.stage2 ||
    message.loading?.stage3;

  return (
    <div className="flex gap-4 group">
      <div className="relative">
        <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-muted to-muted/50 flex items-center justify-center flex-shrink-0 border border-border/50">
          <Brain className="h-5 w-5 text-primary" />
        </div>
        <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full bg-neon-cyan border-2 border-background flex items-center justify-center">
          <Sparkles className="w-2 h-2 text-background" />
        </div>
      </div>
      <div className="flex-1 pt-1 space-y-4">
        <div className="flex items-center gap-2">
          <span className="font-semibold bg-gradient-to-r from-primary to-neon-purple bg-clip-text text-transparent">
            LLM Council
          </span>
          <div className="h-px flex-1 bg-gradient-to-r from-border/50 to-transparent" />
        </div>

        {/* Stage 1 */}
        {message.loading?.stage1 && (
          <LoadingStage
            label="Stage 1: Collecting individual responses..."
            stage={1}
          />
        )}
        {/* Show streaming Stage 1 */}
        {message.streaming?.stage1Models &&
          Object.keys(message.streaming.stage1Models).length > 0 && (
            <StreamingStage1Display models={message.streaming.stage1Models} />
          )}
        {message.stage1 && <Stage1Display responses={message.stage1} />}

        {/* Stage 2 */}
        {message.loading?.stage2 && (
          <LoadingStage label="Stage 2: Running peer rankings..." stage={2} />
        )}
        {/* Show streaming Stage 2 */}
        {message.streaming?.stage2Models &&
          Object.keys(message.streaming.stage2Models).length > 0 && (
            <StreamingStage2Display models={message.streaming.stage2Models} />
          )}
        {message.stage2 && (
          <Stage2Display
            rankings={message.stage2}
            labelToModel={message.metadata?.labelToModel}
            aggregateRanking={message.metadata?.aggregateRanking}
          />
        )}

        {/* Stage 3 */}
        {message.loading?.stage3 && (
          <LoadingStage
            label="Stage 3: Synthesizing final answer..."
            stage={3}
          />
        )}
        {/* Show streaming Stage 3 */}
        {message.streaming?.stage3Text && (
          <StreamingStage3Display text={message.streaming.stage3Text} />
        )}
        {message.stage3 && <Stage3Display response={message.stage3} />}

        {!hasContent && !hasLoading && (
          <div className="glass rounded-xl p-4 text-muted-foreground italic border border-border/30">
            Waiting for response...
          </div>
        )}
      </div>
    </div>
  );
}

function LoadingStage({ label, stage }: { label: string; stage: number }) {
  const colors = {
    1: 'from-chart-1/20 to-chart-1/5 border-chart-1/30',
    2: 'from-chart-2/20 to-chart-2/5 border-chart-2/30',
    3: 'from-chart-3/20 to-chart-3/5 border-chart-3/30',
  };

  const iconColors = {
    1: 'text-chart-1',
    2: 'text-chart-2',
    3: 'text-chart-3',
  };

  return (
    <div
      className={cn(
        'flex items-center gap-4 p-4 rounded-xl border',
        'bg-gradient-to-r',
        colors[stage as keyof typeof colors]
      )}
    >
      <div className="relative">
        <Loader2
          className={cn(
            'h-5 w-5 animate-spin',
            iconColors[stage as keyof typeof iconColors]
          )}
        />
        <div className="absolute inset-0 animate-ping opacity-30">
          <Loader2
            className={cn(
              'h-5 w-5',
              iconColors[stage as keyof typeof iconColors]
            )}
          />
        </div>
      </div>
      <span className="text-sm font-medium">{label}</span>
      <div className="flex-1 h-1 rounded-full bg-muted overflow-hidden">
        <div className="h-full w-1/3 rounded-full animate-shimmer bg-gradient-to-r from-transparent via-primary/40 to-transparent" />
      </div>
    </div>
  );
}

function StreamingStage1Display({
  models,
}: {
  models: Record<string, string>;
}) {
  const getModelShortName = (model: string) => {
    const parts = model.split('/');
    return parts[parts.length - 1] || model;
  };

  return (
    <div className="glass rounded-xl border border-chart-1/30 overflow-hidden bg-gradient-to-br from-chart-1/5 to-transparent">
      <div className="px-4 py-3 border-b border-chart-1/20 bg-chart-1/5 flex items-center gap-3">
        <Brain className="h-4 w-4 text-chart-1" />
        <span className="text-sm font-medium">Stage 1: Models Responding...</span>
      </div>
      <div className="p-4 space-y-4">
        {Object.entries(models).map(([model, text]) => (
          <div key={model} className="space-y-2">
            <div className="flex items-center gap-2">
              <code className="text-xs text-muted-foreground font-mono">
                {getModelShortName(model)}
              </code>
              <Loader2 className="h-3 w-3 animate-spin text-chart-1" />
            </div>
            <div className="prose prose-sm dark:prose-invert max-w-none">
              <ReactMarkdown>{text}</ReactMarkdown>
              <span className="inline-block w-2 h-4 bg-chart-1 animate-pulse ml-1" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function StreamingStage2Display({
  models,
}: {
  models: Record<string, string>;
}) {
  const getModelShortName = (model: string) => {
    const parts = model.split('/');
    return parts[parts.length - 1] || model;
  };

  return (
    <div className="glass rounded-xl border border-chart-2/30 overflow-hidden bg-gradient-to-br from-chart-2/5 to-transparent">
      <div className="px-4 py-3 border-b border-chart-2/20 bg-chart-2/5 flex items-center gap-3">
        <Brain className="h-4 w-4 text-chart-2" />
        <span className="text-sm font-medium">Stage 2: Models Ranking...</span>
      </div>
      <div className="p-4 space-y-4">
        {Object.entries(models).map(([model, text]) => (
          <div key={model} className="space-y-2">
            <div className="flex items-center gap-2">
              <code className="text-xs text-muted-foreground font-mono">
                {getModelShortName(model)}
              </code>
              <Loader2 className="h-3 w-3 animate-spin text-chart-2" />
            </div>
            <div className="prose prose-sm dark:prose-invert max-w-none text-sm">
              <ReactMarkdown>{text}</ReactMarkdown>
              <span className="inline-block w-2 h-4 bg-chart-2 animate-pulse ml-1" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function StreamingStage3Display({ text }: { text: string }) {
  return (
    <div className="glass rounded-xl border border-chart-3/30 overflow-hidden bg-gradient-to-br from-chart-3/5 to-transparent">
      <div className="px-4 py-3 border-b border-chart-3/20 bg-chart-3/5 flex items-center gap-3">
        <Sparkles className="h-4 w-4 text-chart-3" />
        <span className="text-sm font-medium">Stage 3: Final Answer...</span>
        <Loader2 className="h-3 w-3 animate-spin text-chart-3 ml-auto" />
      </div>
      <div className="p-5">
        <div className="prose prose-sm dark:prose-invert max-w-none">
          <ReactMarkdown>{text}</ReactMarkdown>
          <span className="inline-block w-2 h-4 bg-chart-3 animate-pulse ml-1" />
        </div>
      </div>
    </div>
  );
}
