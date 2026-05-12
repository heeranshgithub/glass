'use client';

import ReactMarkdown from 'react-markdown';
import { Stage1Display } from './Stage1Display';
import { Stage2Display } from './Stage2Display';
import { Stage3Display } from './Stage3Display';
import { ArrowDown, Layers, ListOrdered, Loader2, MessageSquare } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Message, AssistantMessage } from '@/lib/types';

interface ChatMessagesProps {
  messages: Message[];
  isLoading: boolean;
}

/** Shared chat column: full width of main, slight edge gutter */
const chatColumn = 'w-full px-2.5 sm:px-3.5';

const EMPTY_STAGES = [
  {
    n: '01',
    title: 'Responses',
    body: 'Each model in the council answers independently.',
    Icon: MessageSquare,
  },
  {
    n: '02',
    title: 'Rankings',
    body: "Peers rank each other's work, anonymously.",
    Icon: ListOrdered,
  },
  {
    n: '03',
    title: 'Synthesis',
    body: 'The arbiter resolves the field into one answer.',
    Icon: Layers,
  },
] as const;

export function ChatMessages({ messages, isLoading }: ChatMessagesProps) {
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
                  Three stages.
                </span>
                <span
                  className="block text-muted-foreground animate-fade-up"
                  style={{ animationDelay: '90ms' }}
                >
                  Many minds.
                </span>
                <span
                  className="block animate-fade-up"
                  style={{ animationDelay: '140ms' }}
                >
                  One answer
                  <span className="text-primary">.</span>
                </span>
              </h1>
              <div
                className="swiss-rule max-w-md animate-fade-up"
                style={{ animationDelay: '180ms' }}
              />
            </div>

            <div
              className="grid grid-cols-1 sm:grid-cols-3 gap-x-8 gap-y-8 sm:gap-y-10"
              style={{ animationDelay: '200ms' }}
            >
              {EMPTY_STAGES.map((s, i) => {
                const Icon = s.Icon;
                return (
                  <article
                    key={s.n}
                    className="group relative animate-fade-up"
                    style={{ animationDelay: `${220 + i * 60}ms` }}
                  >
                    <div className="absolute top-0 left-0 right-0 h-px bg-border transition-colors duration-500 group-hover:bg-foreground" />
                    <div className="absolute top-0 left-0 h-px w-0 bg-primary transition-all duration-700 ease-out group-hover:w-full" />

                    <div className="pt-6 space-y-4">
                      <div className="flex items-start justify-between gap-3">
                        <span className="text-3xl font-light tabular-nums text-muted-foreground transition-colors duration-500 group-hover:text-foreground">
                          {s.n}
                        </span>
                        <span className="flex h-9 w-9 shrink-0 items-center justify-center border border-border text-muted-foreground transition-colors duration-300 group-hover:border-foreground group-hover:text-foreground">
                          <Icon className="h-4 w-4" strokeWidth={1.75} />
                        </span>
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold tracking-tight transition-colors duration-500 group-hover:text-primary">
                          {s.title}
                        </h3>
                        <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
                          {s.body}
                        </p>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>

            <div
              className="flex flex-wrap items-center gap-x-3 gap-y-2 border-l-2 border-primary pl-4 py-1 animate-fade-up"
              style={{ animationDelay: '420ms' }}
            >
              <ArrowDown
                className="h-4 w-4 shrink-0 text-primary"
                strokeWidth={1.75}
                aria-hidden
              />
              <p className="text-sm text-muted-foreground leading-relaxed">
                <span className="mono-label text-foreground mr-2">Input</span>
                Type your question in the field below—the council runs all
                three stages automatically.
              </p>
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
                withTopRule={index > 0}
              />
            )}
          </div>
        ))}

        {isLoading && (
          <div className="flex items-center gap-3 text-muted-foreground">
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
            <span className="mono-label">Consulting the council</span>
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
  withTopRule = true,
}: {
  message: AssistantMessage;
  withTopRule?: boolean;
}) {
  const isStage1Streaming =
    !message.stage1 &&
    !!message.streaming?.stage1Models &&
    Object.keys(message.streaming.stage1Models).length > 0;
  const isStage2Streaming =
    !message.stage2 &&
    !!message.streaming?.stage2Models &&
    Object.keys(message.streaming.stage2Models).length > 0;
  const isStage3Streaming = !message.stage3 && !!message.streaming?.stage3Text;

  const stage1Data =
    message.stage1 ||
    (isStage1Streaming
      ? Object.entries(message.streaming!.stage1Models!).map(
          ([model, response]) => ({ model, response })
        )
      : null);

  const stage2Data =
    message.stage2 ||
    (isStage2Streaming
      ? Object.entries(message.streaming!.stage2Models!).map(
          ([model, ranking]) => ({ model, ranking, parsedRanking: [] })
        )
      : null);

  const stage3Data =
    message.stage3 ||
    (isStage3Streaming
      ? { model: '', response: message.streaming!.stage3Text! }
      : null);

  const hasContent = stage1Data || stage2Data || stage3Data;
  const hasLoading =
    message.loading?.stage1 ||
    message.loading?.stage2 ||
    message.loading?.stage3;

  return (
    <div
      className={cn(
        'space-y-4',
        withTopRule && 'border-t border-border pt-4 mt-0.5'
      )}
    >
      <div className="flex items-baseline justify-between gap-4">
        <span className="mono-label">Council</span>
        <div className="swiss-rule flex-1 min-w-0 self-center" />
      </div>

      <div className="space-y-4">
        {message.loading?.stage1 && (
          <LoadingStage label="Collecting individual responses" stage={1} />
        )}
        {stage1Data && (
          <Stage1Display
            responses={stage1Data}
            isStreaming={isStage1Streaming}
          />
        )}

        {message.loading?.stage2 && (
          <LoadingStage label="Running peer rankings" stage={2} />
        )}
        {stage2Data && (
          <Stage2Display
            rankings={stage2Data}
            labelToModel={message.metadata?.labelToModel}
            aggregateRanking={message.metadata?.aggregateRanking}
            isStreaming={isStage2Streaming}
          />
        )}

        {message.loading?.stage3 && (
          <LoadingStage label="Synthesizing final answer" stage={3} />
        )}
        {stage3Data && (
          <Stage3Display
            response={stage3Data}
            isStreaming={isStage3Streaming}
          />
        )}

        {!hasContent && !hasLoading && (
          <div className="text-sm text-muted-foreground italic">
            Waiting for response&hellip;
          </div>
        )}
      </div>
    </div>
  );
}

function LoadingStage({ label, stage }: { label: string; stage: number }) {
  return (
    <div className="flex items-center gap-4">
      <span className="mono-label tabular-nums">
        {String(stage).padStart(2, '0')}
      </span>
      <div className="flex items-center gap-2 text-sm text-foreground">
        <Loader2 className="h-3.5 w-3.5 animate-spin" />
        <span>{label}</span>
        <span className="animate-cursor text-muted-foreground">_</span>
      </div>
      <div className={cn('flex-1 h-px bg-border')} />
    </div>
  );
}
