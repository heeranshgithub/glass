'use client';

import { useState } from 'react';
import { useGetLeaderboardQuery } from '@/lib/store/api';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { ModelLeaderboardEntry } from '@/lib/types';

function ModelScoreboardTable({ models }: { models: ModelLeaderboardEntry[] }) {
  if (!models || models.length === 0) {
    return (
      <p className="text-sm text-muted-foreground py-6">
        No model data available yet. Start some conversations to see rankings.
      </p>
    );
  }

  return (
    <div className="overflow-x-auto rounded-2xl bg-muted/40">
      <table className="w-full text-sm">
        <thead>
          <tr className="text-left text-xs text-muted-foreground">
            <th className="font-normal py-3 pl-5 pr-3 w-14">Rank</th>
            <th className="font-normal py-3 pr-3">Model</th>
            <th className="font-normal py-3 pr-3 text-right tabular-nums">
              Avg
            </th>
            <th className="font-normal py-3 pr-3 text-right tabular-nums">
              Total
            </th>
            <th className="font-normal py-3 pr-5 text-right tabular-nums">
              Appearances
            </th>
          </tr>
        </thead>
        <tbody>
          {models.map(model => (
            <tr
              key={model.model}
              className={cn(
                'transition-colors hover:bg-muted/70',
                model.rank === 1 && 'font-semibold'
              )}
            >
              <td className="py-3 pl-5 pr-3 tabular-nums text-muted-foreground">
                {model.rank}
              </td>
              <td className="py-3 pr-3 font-mono">{model.model}</td>
              <td className="py-3 pr-3 text-right tabular-nums">
                {model.avgScore.toFixed(2)}
              </td>
              <td className="py-3 pr-3 text-right tabular-nums text-muted-foreground">
                {model.totalScore.toFixed(1)}
              </td>
              <td className="py-3 pr-5 text-right tabular-nums text-muted-foreground">
                {model.appearances}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function LeaderboardPage() {
  const [activeTab, setActiveTab] = useState<string>('overall');
  const {
    data: leaderboard,
    isLoading,
    error,
    // Refetch on arrival instead of offering a manual refresh control.
  } = useGetLeaderboardQuery(undefined, { refetchOnMountOrArgChange: true });

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="flex items-center gap-3">
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
          <span className="text-sm text-muted-foreground">
            Loading leaderboard
          </span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <p className="text-sm text-destructive">Error loading leaderboard.</p>
      </div>
    );
  }

  const tabs = ['overall', ...(leaderboard?.categories || [])];
  const currentModels =
    activeTab === 'overall'
      ? leaderboard?.overall || []
      : leaderboard?.byCategory?.[activeTab] || [];

  return (
    <div className="flex-1 overflow-auto">
      <div className="max-w-6xl mx-auto px-3 sm:px-4 py-6 lg:py-10">
        <div className="grid grid-cols-12 gap-5 lg:gap-6 mb-8">
          <div className="col-span-12 lg:col-span-8">
            <h1 className="text-3xl font-semibold tracking-tight">
              Model Scoreboard
            </h1>
          </div>
          <div className="col-span-12 lg:col-span-4 lg:col-start-9 flex items-end">
            <p className="text-sm text-muted-foreground leading-relaxed">
              Ranked by average peer score across all council evaluations.
              Higher is better.
            </p>
          </div>
        </div>

        {/* Category tabs */}
        <div className="flex flex-wrap items-center gap-1.5 mb-4">
          {tabs.map(tab => {
            const active = activeTab === tab;
            return (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={cn(
                  'rounded-full px-3.5 py-1.5 text-sm transition-colors capitalize',
                  active
                    ? 'bg-muted text-foreground font-medium'
                    : 'text-muted-foreground hover:bg-muted/50 hover:text-foreground'
                )}
              >
                {tab === 'overall' ? 'Overall' : tab}
              </button>
            );
          })}
        </div>

        <ModelScoreboardTable models={currentModels} />
      </div>
    </div>
  );
}
