'use client';

import ReactMarkdown from 'react-markdown';
import { Stage1Display } from './Stage1Display';
import { Stage2Display } from './Stage2Display';
import { Stage3Display } from './Stage3Display';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Message, AssistantMessage } from '@/lib/types';

interface ChatMessagesProps {
  messages: Message[];
  isLoading: boolean;
}

/** Shared chat column: full width of main, slight edge gutter */
const chatColumn = 'w-full px-3 sm:px-4';

export function ChatMessages({ messages, isLoading }: ChatMessagesProps) {
  if (messages.length === 0) {
    return (
      <div className="flex-1 overflow-y-auto">
        <div className={`${chatColumn} pt-6 pb-4 sm:pt-8`}>
          <div className="space-y-6">
            <div>
              <span className="mono-label">Glass / Council</span>
              <div className="swiss-rule mt-2" />
            </div>

            <h1 className="display-lg max-w-2xl">
              Three stages.
              <br />
              <span className="text-muted-foreground">Many minds.</span>
              <br />
              One answer<span className="text-primary">.</span>
            </h1>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-x-4 gap-y-5 max-w-2xl">
              {[
                {
                  n: '01',
                  title: 'Responses',
                  body: 'Each model in the council answers independently.',
                },
                {
                  n: '02',
                  title: 'Rankings',
                  body: 'Peers rank each other&rsquo;s work, anonymously.',
                },
                {
                  n: '03',
                  title: 'Synthesis',
                  body: 'The arbiter resolves the field into one answer.',
                },
              ].map(s => (
                <div key={s.n} className="space-y-2">
                  <span className="mono-label">{s.n}</span>
                  <h3 className="text-base font-semibold">{s.title}</h3>
                  <p
                    className="text-sm text-muted-foreground leading-relaxed"
                    dangerouslySetInnerHTML={{ __html: s.body }}
                  />
                </div>
              ))}
            </div>

            <p className="text-base text-muted-foreground max-w-lg leading-relaxed">
              Start by asking a question below.
            </p>
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
