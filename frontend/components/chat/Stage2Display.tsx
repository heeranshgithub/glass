'use client';

import { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import { cn } from '@/lib/utils';
import type { Stage2Ranking, AggregateRanking } from '@/lib/types';

interface Stage2DisplayProps {
  rankings: Stage2Ranking[];
  labelToModel?: Record<string, string>;
  aggregateRanking?: AggregateRanking[];
  isStreaming?: boolean;
}

function deAnonymizeText(
  text: string,
  labelToModel?: Record<string, string>
): string {
  if (!labelToModel) return text;
  let result = text;
  Object.entries(labelToModel).forEach(([label, model]) => {
    const modelShortName = model.split('/').pop() || model;
    result = result.replace(new RegExp(label, 'g'), `**${modelShortName}**`);
  });
  return result;
}

const getModelShortName = (model: string) => {
  const parts = model.split('/');
  return parts[parts.length - 1] || model;
};

export function Stage2Display({
  rankings,
  labelToModel,
  aggregateRanking,
  isStreaming,
}: Stage2DisplayProps) {
  const [activeTab, setActiveTab] = useState(0);

  if (!rankings || rankings.length === 0) {
    return null;
  }

  return (
    <section className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold tracking-tight">Rankings</h2>
        <p className="mt-0.5 text-sm text-muted-foreground">
          Models evaluate each other&rsquo;s responses anonymously.
        </p>
      </div>

      <div className="flex flex-wrap gap-1.5">
        {rankings.map((rank, index) => {
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
              {rank?.model ? getModelShortName(rank.model) : 'Unknown'}
            </button>
          );
        })}
      </div>

      <div>
        <div className="text-xs text-muted-foreground mb-2">
          Evaluation by {rankings[activeTab]?.model || 'Unknown'}
        </div>
        <div className="prose prose-sm dark:prose-invert max-w-none">
          <ReactMarkdown>
            {deAnonymizeText(rankings[activeTab]?.ranking || '', labelToModel)}
          </ReactMarkdown>
          {isStreaming && (
            <span className="inline-block w-1.5 h-4 bg-primary animate-cursor ml-1 align-text-bottom" />
          )}
        </div>

        {rankings[activeTab]?.parsedRanking &&
          rankings[activeTab].parsedRanking.length > 0 && (
            <div className="mt-6 rounded-2xl bg-muted/50 p-4">
              <div className="text-xs text-muted-foreground mb-2.5">
                Extracted ranking
              </div>
              <ol className="space-y-1.5">
                {rankings[activeTab]?.parsedRanking?.map((label, i) => (
                  <li key={i} className="flex items-baseline gap-3 text-sm">
                    <span className="tabular-nums w-5 shrink-0 text-muted-foreground">
                      {i + 1}
                    </span>
                    <span className={cn(i === 0 && 'font-semibold')}>
                      {labelToModel && labelToModel[label]
                        ? getModelShortName(labelToModel[label])
                        : label}
                    </span>
                  </li>
                ))}
              </ol>
            </div>
          )}
      </div>

      {aggregateRanking && aggregateRanking.length > 0 && (
        <div className="pt-2">
          <div className="flex items-baseline justify-between mb-2.5">
            <h3 className="text-sm font-semibold">Aggregate ranking</h3>
            <span className="text-xs text-muted-foreground">
              Combined across all evaluators
            </span>
          </div>
          <div className="overflow-x-auto rounded-2xl bg-muted/50">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs text-muted-foreground">
                  <th className="font-normal py-2.5 pl-4 pr-4 w-10">#</th>
                  <th className="font-normal py-2.5 pr-4">Model</th>
                  <th className="font-normal py-2.5 pr-4 text-right tabular-nums">
                    Score
                  </th>
                  <th className="font-normal py-2.5 pr-4 text-right tabular-nums">
                    Avg
                  </th>
                  <th className="font-normal py-2.5 pr-4 text-right tabular-nums">
                    Votes
                  </th>
                </tr>
              </thead>
              <tbody>
                {aggregateRanking.map((agg, index) => (
                  <tr
                    key={index}
                    className={cn(index === 0 && 'font-semibold')}
                  >
                    <td className="py-2.5 pl-4 pr-4 tabular-nums">
                      {index === 0 ? (
                        <span className="text-primary">{index + 1}</span>
                      ) : (
                        index + 1
                      )}
                    </td>
                    <td className="py-2.5 pr-4">
                      {agg?.model ? getModelShortName(agg.model) : 'Unknown'}
                    </td>
                    <td className="py-2.5 pr-4 text-right tabular-nums">
                      {agg?.score != null ? agg.score.toFixed(1) : '—'}
                    </td>
                    <td className="py-2.5 pr-4 text-right tabular-nums text-muted-foreground">
                      {agg?.averageRank != null
                        ? agg.averageRank.toFixed(2)
                        : '—'}
                    </td>
                    <td className="py-2.5 pr-4 text-right tabular-nums text-muted-foreground">
                      {agg?.rankingsCount ?? 0}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </section>
  );
}
