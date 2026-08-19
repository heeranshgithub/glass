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
      <div>
        <h2 className="text-lg font-semibold tracking-tight">Responses</h2>
        <p className="mt-0.5 text-sm text-muted-foreground">
          Each model&rsquo;s independent analysis.
        </p>
      </div>

      <div className="flex flex-wrap gap-1.5">
        {responses.map((resp, index) => {
          const active = activeTab === index;
          return (
            <button
              key={index}
              onClick={() => setActiveTab(index)}
              className={cn(
                'rounded-full px-3.5 py-1.5 text-sm transition-colors',
                active
                  ? 'bg-muted text-foreground font-medium'
                  : 'text-muted-foreground hover:bg-muted/50 hover:text-foreground'
              )}
            >
              {getModelShortName(resp?.model)}
            </button>
          );
        })}
      </div>

      <div>
        <div className="text-xs text-muted-foreground mb-2">
          {responses[activeTab]?.model || 'Unknown'}
        </div>
        <div className="prose prose-sm dark:prose-invert max-w-none">
          <ReactMarkdown>{responses[activeTab]?.response || ''}</ReactMarkdown>
          {isStreaming && (
            <span className="inline-block w-1.5 h-4 bg-primary animate-cursor ml-1 align-text-bottom" />
          )}
        </div>
      </div>
    </section>
  );
}
