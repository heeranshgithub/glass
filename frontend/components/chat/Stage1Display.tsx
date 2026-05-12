'use client';

import { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import { cn } from '@/lib/utils';
import type { Stage1Response } from '@/lib/types';

interface Stage1DisplayProps {
  responses: Stage1Response[];
  isStreaming?: boolean;
}

const getModelShortName = (model: string | null | undefined) => {
  if (!model) return 'Unknown';
  const parts = model.split('/');
  return parts[parts.length - 1] || model;
};

export function Stage1Display({ responses, isStreaming }: Stage1DisplayProps) {
  const [activeTab, setActiveTab] = useState(0);

  if (!responses || responses.length === 0) {
    return null;
  }

  return (
    <section className="space-y-4">
      <header className="grid grid-cols-[3rem_1fr_auto] gap-4 items-baseline">
        <span className="mono-label tabular-nums">01</span>
        <div>
          <h2 className="display-md leading-none">Responses</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Each model&rsquo;s independent analysis.
          </p>
        </div>
        <span className="mono-label tabular-nums">
          {String(responses.length).padStart(2, '0')} / models
        </span>
      </header>

      <div className="swiss-rule" />

      <div className="grid grid-cols-[3rem_1fr] gap-4">
        <div />
        <div className="space-y-4">
          {/* Model tabs */}
          <div className="flex flex-wrap gap-x-5 gap-y-1">
            {responses.map((resp, index) => {
              const active = activeTab === index;
              return (
                <button
                  key={index}
                  onClick={() => setActiveTab(index)}
                  className={cn(
                    'group inline-flex items-baseline gap-2 text-sm transition-colors',
                    active
                      ? 'text-foreground'
                      : 'text-muted-foreground hover:text-foreground'
                  )}
                >
                  <span className="mono-label tabular-nums">
                    {String.fromCharCode(65 + index)}
                  </span>
                  <span
                    className={cn(
                      'font-mono',
                      active && 'border-b border-primary pb-0.5'
                    )}
                  >
                    {getModelShortName(resp?.model)}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Active response */}
          <div>
            <div className="mono-label mb-3">
              {responses[activeTab]?.model || 'Unknown'}
            </div>
            <div className="prose prose-sm dark:prose-invert max-w-none">
              <ReactMarkdown>
                {responses[activeTab]?.response || ''}
              </ReactMarkdown>
              {isStreaming && (
                <span className="inline-block w-1.5 h-4 bg-primary animate-cursor ml-1 align-text-bottom" />
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
