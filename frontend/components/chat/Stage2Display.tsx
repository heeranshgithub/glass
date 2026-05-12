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
      <header className="grid grid-cols-[3rem_1fr_auto] gap-4 items-baseline">
        <span className="mono-label tabular-nums">02</span>
        <div>
          <h2 className="display-md leading-none">Rankings</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Models evaluate each other&rsquo;s responses anonymously.
          </p>
        </div>
        <span className="mono-label tabular-nums">
          {String(rankings.length).padStart(2, '0')} / evaluators
        </span>
      </header>

      <div className="swiss-rule" />

      <div className="grid grid-cols-[3rem_1fr] gap-4">
        <div />
        <div className="space-y-8">
          {/* Evaluator tabs */}
          <div className="space-y-4">
            <div className="flex flex-wrap gap-x-5 gap-y-1">
              {rankings.map((rank, index) => {
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
                    <span
                      className={cn(
                        'font-mono',
                        active && 'border-b border-primary pb-0.5'
                      )}
                    >
                      {rank?.model ? getModelShortName(rank.model) : 'Unknown'}
                    </span>
                  </button>
                );
              })}
            </div>

            <div>
              <div className="mono-label mb-3">
                Evaluation by {rankings[activeTab]?.model || 'Unknown'}
              </div>
              <div className="prose prose-sm dark:prose-invert max-w-none">
                <ReactMarkdown>
                  {deAnonymizeText(
                    rankings[activeTab]?.ranking || '',
                    labelToModel
                  )}
                </ReactMarkdown>
                {isStreaming && (
                  <span className="inline-block w-1.5 h-4 bg-primary animate-cursor ml-1 align-text-bottom" />
                )}
              </div>

              {rankings[activeTab]?.parsedRanking &&
                rankings[activeTab].parsedRanking.length > 0 && (
                  <div className="mt-6 pt-4 border-t border-border">
                    <div className="mono-label mb-3">Extracted ranking</div>
                    <ol className="space-y-1">
                      {rankings[activeTab]?.parsedRanking?.map((label, i) => (
                        <li
                          key={i}
                          className="flex items-baseline gap-4 text-sm"
                        >
                          <span className="mono-label tabular-nums w-8 shrink-0">
                            {String(i + 1).padStart(2, '0')}
                          </span>
                          <span
                            className={cn(
                              'font-mono',
                              i === 0 && 'font-semibold text-foreground'
                            )}
                          >
                            {labelToModel && labelToModel[label]
                              ? getModelShortName(labelToModel[label])
                              : label}
                          </span>
                          {i === 0 && (
                            <span className="h-1 w-1 bg-primary self-center" />
                          )}
                        </li>
                      ))}
                    </ol>
                  </div>
                )}
            </div>
          </div>

          {/* Aggregate */}
          {aggregateRanking && aggregateRanking.length > 0 && (
            <div>
              <div className="flex items-baseline justify-between mb-3">
                <h3 className="text-sm font-semibold">Aggregate ranking</h3>
                <span className="mono-label">
                  Combined across all evaluators
                </span>
              </div>
              <div className="swiss-rule mb-3" />
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left">
                    <th className="mono-label font-normal py-1 pr-4 w-10">#</th>
                    <th className="mono-label font-normal py-1 pr-4">Model</th>
                    <th className="mono-label font-normal py-1 pr-4 text-right tabular-nums">
                      Score
                    </th>
                    <th className="mono-label font-normal py-1 pr-4 text-right tabular-nums">
                      Avg
                    </th>
                    <th className="mono-label font-normal py-1 text-right tabular-nums">
                      Votes
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {aggregateRanking.map((agg, index) => (
                    <tr
                      key={index}
                      className={cn(
                        'border-t border-border',
                        index === 0 && 'font-semibold'
                      )}
                    >
                      <td className="py-2.5 pr-4 tabular-nums">
                        {index === 0 ? (
                          <span className="text-primary">
                            {String(index + 1).padStart(2, '0')}
                          </span>
                        ) : (
                          String(index + 1).padStart(2, '0')
                        )}
                      </td>
                      <td className="py-2.5 pr-4 font-mono">
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
                      <td className="py-2.5 text-right tabular-nums text-muted-foreground">
                        {agg?.rankingsCount ?? 0}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
