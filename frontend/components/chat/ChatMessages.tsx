'use client';

import { useEffect, useRef, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import { Stage1Display } from './Stage1Display';
import { Stage2Display } from './Stage2Display';
import { Stage3Display } from './Stage3Display';
import {
  ArrowDown,
  Layers,
  ListOrdered,
  Loader2,
  MessageSquare,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Message, AssistantMessage } from '@/lib/types';

/** Shared chat column */
const chatColumn = 'w-full max-w-3xl mx-auto px-3 sm:px-4';

const EMPTY_STAGES = [
  {
    title: 'Responses',
    body: 'Each model in the council answers independently.',
    Icon: MessageSquare,
  },
  {
    title: 'Rankings',
    body: "Peers rank each other's work, anonymously.",
    Icon: ListOrdered,
  },
  {
    title: 'Synthesis',
    body: 'The arbiter resolves the field into one answer.',
    Icon: Layers,
  },
] as const;

/** Past this many pixels from the bottom, jumping back is worth offering. */
const NEAR_BOTTOM_PX = 240;

/** How long to keep holding the view at the newest message after opening. */
const SETTLE_MS = 1000;

export function ChatMessages({
  messages,
  isLoading,
  conversationId,
}: ChatMessagesProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [showJump, setShowJump] = useState(false);
  // While armed, content growth keeps the view on the newest message.
  const pinToBottom = useRef(true);
  const hasMessages = messages.length > 0;

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;

    const measure = () => {
      const distance = el.scrollHeight - el.scrollTop - el.clientHeight;
      setShowJump(distance > NEAR_BOTTOM_PX);
    };

    // Scrolling is the reader's business: never fight it, only re-measure.
    el.addEventListener('scroll', measure, { passive: true });

    // Any deliberate move hands control back immediately.
    const release = () => {
      pinToBottom.current = false;
    };
    el.addEventListener('wheel', release, { passive: true });
    el.addEventListener('touchmove', release, { passive: true });
    el.addEventListener('keydown', release);

    // Opening a thread should land on the newest message, but the height keeps
    // changing as markdown and the stage blocks render, so a single scroll on
    // mount lands short. Re-pin on every growth until the thread settles.
    const observer = new ResizeObserver(() => {
      if (pinToBottom.current) el.scrollTop = el.scrollHeight;
      measure();
    });
    observer.observe(el);
    if (el.firstElementChild) observer.observe(el.firstElementChild);

    // Then let go, so a later reply cannot yank the view away mid-read.
    const settle = setTimeout(release, SETTLE_MS);

    return () => {
      clearTimeout(settle);
      el.removeEventListener('scroll', measure);
      el.removeEventListener('wheel', release);
      el.removeEventListener('touchmove', release);
      el.removeEventListener('keydown', release);
      observer.disconnect();
    };
  }, [conversationId, hasMessages]);

  // A different thread opens at its own bottom.
  useEffect(() => {
    pinToBottom.current = true;
  }, [conversationId]);

  const scrollToBottom = () => {
    const el = scrollRef.current;
    if (!el) return;
    const reduced = window.matchMedia(
      '(prefers-reduced-motion: reduce)'
    ).matches;
    el.scrollTo({
      top: el.scrollHeight,
      behavior: reduced ? 'auto' : 'smooth',
    });
  };

  if (messages.length === 0) {
    return (
      <div className="flex-1 overflow-y-auto flex items-center">
        <div className={`${chatColumn} py-8`}>
          <div className="space-y-8">
            <div className="space-y-3">
              <h1 className="text-3xl sm:text-4xl font-semibold tracking-tight max-w-[min(100%,36rem)] leading-[1.05] animate-fade-up">
                <span className="block">Three stages.</span>
                <span className="block text-muted-foreground">Many minds.</span>
                <span className="block">One answer</span>
              </h1>
              <p
                className="text-sm text-muted-foreground animate-fade-up"
                style={{ animationDelay: '80ms' }}
              >
                Ask below — the council runs all three stages automatically.
              </p>
            </div>

            <div
              className="grid grid-cols-1 sm:grid-cols-3 gap-4 animate-fade-up"
              style={{ animationDelay: '140ms' }}
            >
              {EMPTY_STAGES.map(s => {
                const Icon = s.Icon;
                return (
                  <div key={s.title} className="rounded-2xl bg-muted/50 p-5">
                    <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-muted text-foreground">
                      <Icon className="h-4 w-4" strokeWidth={1.75} />
                    </span>
                    <h3 className="mt-4 text-base font-semibold tracking-tight">
                      {s.title}
                    </h3>
                    <p className="mt-1.5 text-sm text-muted-foreground leading-relaxed">
                      {s.body}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative flex-1 min-h-0 flex flex-col">
      <div ref={scrollRef} className="flex-1 overflow-y-auto">
        <div className={`${chatColumn} pt-6 pb-10 space-y-10`}>
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
                />
              )}
            </div>
          ))}

          {isLoading && (
            <div className="flex items-center gap-2.5 text-muted-foreground text-sm">
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
              <span>Consulting the council</span>
            </div>
          )}
        </div>
      </div>

      <button
        type="button"
        onClick={scrollToBottom}
        aria-label="Scroll to latest message"
        tabIndex={showJump ? 0 : -1}
        className={cn(
          'absolute bottom-4 left-1/2 -translate-x-1/2 z-10',
          'flex h-11 w-11 lg:h-10 lg:w-10 items-center justify-center rounded-full',
          'bg-card text-foreground border border-border shadow-md',
          'transition-[opacity,transform] duration-200 ease-out',
          'hover:bg-muted',
          showJump
            ? 'opacity-100 translate-y-0'
            : 'pointer-events-none opacity-0 translate-y-2'
        )}
      >
        <ArrowDown className="h-4 w-4" strokeWidth={2} />
      </button>
    </div>
  );
}

interface ChatMessagesProps {
  messages: Message[];
  isLoading: boolean;
  /** Changes when a different thread is opened, re-arming the initial scroll. */
  conversationId?: string;
}

function UserMessage({ content }: { content: string }) {
  return (
    <div className="flex flex-col items-end">
      <div className="w-fit max-w-[min(100%,40rem)] rounded-3xl bg-muted px-5 py-3">
        <div className="prose prose-sm max-w-none dark:prose-invert text-foreground prose-p:my-1 prose-p:first:mt-0 prose-p:last:mb-0 text-left">
          <ReactMarkdown>{content}</ReactMarkdown>
        </div>
      </div>
    </div>
  );
}

function AssistantMessageDisplay({ message }: { message: AssistantMessage }) {
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
    <div className="space-y-8">
      {message.loading?.stage1 && (
        <LoadingStage label="Collecting individual responses" />
      )}
      {stage1Data && (
        <Stage1Display responses={stage1Data} isStreaming={isStage1Streaming} />
      )}

      {message.loading?.stage2 && (
        <LoadingStage label="Running peer rankings" />
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
        <LoadingStage label="Synthesizing final answer" />
      )}
      {stage3Data && (
        <Stage3Display response={stage3Data} isStreaming={isStage3Streaming} />
      )}

      {!hasContent && !hasLoading && (
        <div className="text-sm text-muted-foreground italic">
          Waiting for response&hellip;
        </div>
      )}
    </div>
  );
}

function LoadingStage({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-2.5 text-sm text-muted-foreground">
      <Loader2 className="h-3.5 w-3.5 animate-spin" />
      <span>{label}</span>
    </div>
  );
}
