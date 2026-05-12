'use client';

import ReactMarkdown from 'react-markdown';
import { Loader2 } from 'lucide-react';
import type { Stage3Synthesis } from '@/lib/types';

interface Stage3DisplayProps {
  response: Stage3Synthesis;
  isStreaming?: boolean;
}

export function Stage3Display({ response, isStreaming }: Stage3DisplayProps) {
  if (!response) {
    return null;
  }

  const getModelShortName = (model: string | null | undefined) => {
    if (!model) return 'Unknown';
    const parts = model.split('/');
    return parts[parts.length - 1] || model;
  };

  return (
    <section className="space-y-4">
      <header className="grid grid-cols-[3rem_1fr_auto] gap-4 items-baseline">
        <span className="mono-label tabular-nums text-primary">03</span>
        <div>
          <h2 className="display-md leading-none">
            Synthesis<span className="text-primary">.</span>
          </h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Final answer, drawn from peer-ranked responses.
          </p>
        </div>
        <span className="mono-label">
          arbiter / {getModelShortName(response?.model)}
        </span>
      </header>

      <div className="swiss-rule-strong" />

      <div className="grid grid-cols-[3rem_1fr] gap-4">
        <div />
        <div className="prose prose-base dark:prose-invert max-w-none">
          <ReactMarkdown>{response?.response || ''}</ReactMarkdown>
          {isStreaming && (
            <span className="inline-block w-1.5 h-5 bg-primary animate-cursor ml-1 align-text-bottom" />
          )}
          {isStreaming && (
            <div className="not-prose mt-4 flex items-center gap-2 mono-label">
              <Loader2 className="h-3 w-3 animate-spin" />
              <span>Synthesizing</span>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
