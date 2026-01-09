'use client';

import { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Scale, Trophy, Medal, Check, TrendingUp } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Stage2Ranking, AggregateRanking } from '@/lib/types';

interface Stage2DisplayProps {
  rankings: Stage2Ranking[];
  labelToModel?: Record<string, string>;
  aggregateRanking?: AggregateRanking[];
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

export function Stage2Display({
  rankings,
  labelToModel,
  aggregateRanking,
}: Stage2DisplayProps) {
  const [activeTab, setActiveTab] = useState(0);

  if (!rankings || rankings.length === 0) {
    return null;
  }

  const getModelShortName = (model: string) => {
    const parts = model.split('/');
    return parts[parts.length - 1] || model;
  };

  const getRankIcon = (rank: number) => {
    if (rank === 0) return <Trophy className="w-3.5 h-3.5 text-yellow-500" />;
    if (rank === 1) return <Medal className="w-3.5 h-3.5 text-gray-400" />;
    if (rank === 2) return <Medal className="w-3.5 h-3.5 text-amber-700" />;
    return null;
  };

  return (
    <Card className="stage-card stage-2 overflow-hidden border-chart-2/20 bg-gradient-to-br from-chart-2/5 via-background to-background">
      <CardHeader className="pb-4">
        <CardTitle className="text-base flex items-center gap-3">
          <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-chart-2/20">
            <Scale className="h-4 w-4 text-chart-2" />
          </div>
          <div className="flex-1">
            <span className="font-semibold">Stage 2: Peer Rankings</span>
            <p className="text-xs font-normal text-muted-foreground mt-0.5">
              Models evaluate each other&apos;s responses
            </p>
          </div>
        </CardTitle>
        <CardDescription className="text-xs mt-2 p-2 rounded-lg bg-chart-2/5 border border-chart-2/10">
          Each model evaluated all responses anonymously. Model names shown in{' '}
          <strong>bold</strong> for readability.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Evaluator Tabs */}
        <div className="flex flex-wrap gap-2">
          {rankings.map((rank, index) => (
            <Button
              key={index}
              variant="ghost"
              size="sm"
              onClick={() => setActiveTab(index)}
              className={cn(
                'text-xs font-medium transition-all duration-200 rounded-lg',
                activeTab === index
                  ? 'bg-chart-2 text-white shadow-lg shadow-chart-2/25 hover:bg-chart-2/90'
                  : 'bg-muted/50 hover:bg-muted text-muted-foreground hover:text-foreground'
              )}
            >
              {activeTab === index && <Check className="w-3 h-3 mr-1.5" />}
              {rank?.model ? getModelShortName(rank.model) : 'Unknown'}
            </Button>
          ))}
        </div>

        {/* Ranking Content */}
        <div className="rounded-xl border border-border/50 bg-background/50 backdrop-blur-sm overflow-hidden">
          <div className="px-4 py-2 border-b border-border/30 bg-muted/30">
            <code className="text-xs text-muted-foreground font-mono">
              Evaluation by: {rankings[activeTab]?.model || 'Unknown'}
            </code>
          </div>
          <div className="p-4 space-y-4">
            <div className="prose prose-sm dark:prose-invert max-w-none">
              <ReactMarkdown>
                {deAnonymizeText(
                  rankings[activeTab]?.ranking || '',
                  labelToModel
                )}
              </ReactMarkdown>
            </div>

            {/* Parsed Ranking */}
            {rankings[activeTab]?.parsedRanking &&
              rankings[activeTab].parsedRanking.length > 0 && (
                <div className="pt-4 border-t border-border/30">
                  <div className="text-sm font-medium mb-3 flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-chart-2" />
                    Extracted Ranking
                  </div>
                  <div className="space-y-2">
                    {rankings[activeTab]?.parsedRanking?.map((label, i) => (
                      <div
                        key={i}
                        className={cn(
                          'flex items-center gap-3 p-2.5 rounded-lg transition-colors',
                          i === 0
                            ? 'bg-chart-2/10 border border-chart-2/20'
                            : 'bg-muted/30'
                        )}
                      >
                        <div
                          className={cn(
                            'w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold',
                            i === 0
                              ? 'bg-chart-2 text-white'
                              : 'bg-muted text-muted-foreground'
                          )}
                        >
                          {i + 1}
                        </div>
                        <span className="flex-1 text-sm font-medium">
                          {labelToModel && labelToModel[label]
                            ? getModelShortName(labelToModel[label])
                            : label}
                        </span>
                        {getRankIcon(i)}
                      </div>
                    ))}
                  </div>
                </div>
              )}
          </div>
        </div>

        {/* Aggregate Rankings */}
        {aggregateRanking && aggregateRanking.length > 0 && (
          <div className="rounded-xl border border-chart-2/30 bg-gradient-to-br from-chart-2/10 to-transparent overflow-hidden">
            <div className="px-4 py-3 border-b border-chart-2/20 bg-chart-2/5">
              <div className="flex items-center gap-2">
                <Trophy className="h-4 w-4 text-chart-2" />
                <span className="text-sm font-semibold">
                  Aggregate Rankings
                </span>
                <Badge
                  variant="secondary"
                  className="ml-auto bg-chart-2/10 text-chart-2 border-chart-2/20"
                >
                  Street Cred
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Combined results across all peer evaluations (score higher = better)
              </p>
            </div>
            <div className="p-4 space-y-2">
              {aggregateRanking.map((agg, index) => (
                <div
                  key={index}
                  className={cn(
                    'flex items-center gap-3 p-3 rounded-lg transition-all',
                    index === 0
                      ? 'bg-gradient-to-r from-chart-2/20 to-chart-2/5 border border-chart-2/30 shadow-sm'
                      : 'bg-muted/30 hover:bg-muted/50'
                  )}
                >
                  <div
                    className={cn(
                      'w-8 h-8 rounded-lg flex items-center justify-center font-bold text-sm',
                      index === 0
                        ? 'bg-chart-2 text-white shadow-lg shadow-chart-2/30'
                        : 'bg-muted text-muted-foreground'
                    )}
                  >
                    #{index + 1}
                  </div>
                  <span className="font-medium flex-1">
                    {agg?.model ? getModelShortName(agg.model) : 'Unknown'}
                  </span>
                  <div className="text-right">
                    <div className="text-sm font-semibold tabular-nums">
                      {agg?.score != null ? `${agg.score.toFixed(1)}` : '—'}
                      <span className="text-xs font-medium text-muted-foreground ml-1">
                        pts
                      </span>
                    </div>
                    <div className="text-xs text-muted-foreground tabular-nums">
                      Avg rank:{' '}
                      {agg?.averageRank != null
                        ? agg.averageRank.toFixed(2)
                        : 'N/A'}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {agg?.rankingsCount != null
                        ? `${agg.rankingsCount} votes`
                        : 'No votes'}
                    </div>
                  </div>
                  {getRankIcon(index)}
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
