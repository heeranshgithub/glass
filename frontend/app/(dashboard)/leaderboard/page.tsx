'use client';

import { useState } from 'react';
import { useGetLeaderboardQuery } from '@/lib/store/api';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import type { ModelLeaderboardEntry } from '@/lib/types';

function ModelScoreboardTable({ models }: { models: ModelLeaderboardEntry[] }) {
  if (!models || models.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        No model data available yet. Start some conversations to see rankings!
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {models.map((model) => (
        <div
          key={model.model}
          className="flex items-center justify-between p-4 bg-muted/50 rounded-lg hover:bg-muted transition-colors"
        >
          <div className="flex items-center gap-4">
            <div
              className={`flex items-center justify-center w-10 h-10 rounded-full font-bold ${
                model.rank === 1
                  ? 'bg-yellow-500 text-white'
                  : model.rank === 2
                  ? 'bg-gray-400 text-white'
                  : model.rank === 3
                  ? 'bg-amber-700 text-white'
                  : 'bg-primary/10 text-primary'
              }`}
            >
              {model.rank}
            </div>
            <div>
              <div className="font-semibold">{model.model}</div>
              <div className="text-sm text-muted-foreground">
                {model.appearances} appearances
              </div>
            </div>
          </div>
          <div className="text-right">
            <div className="text-xl font-bold">{model.avgScore.toFixed(1)}</div>
            <div className="text-sm text-muted-foreground">
              total: {model.totalScore.toFixed(1)}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

export default function LeaderboardPage() {
  const [activeTab, setActiveTab] = useState<string>('overall');
  const { data: leaderboard, isLoading, error, refetch } = useGetLeaderboardQuery();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-lg">Loading leaderboard...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-lg text-red-500">Error loading leaderboard</div>
      </div>
    );
  }

  const tabs = ['overall', ...(leaderboard?.categories || [])];
  const currentModels =
    activeTab === 'overall'
      ? leaderboard?.overall || []
      : leaderboard?.byCategory?.[activeTab] || [];

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Model Scoreboard</h1>
        <Button onClick={() => refetch()} variant="outline">
          Refresh
        </Button>
      </div>

      {/* Category Tabs */}
      <div className="flex flex-wrap gap-2">
        {tabs.map((tab) => (
          <Button
            key={tab}
            variant={activeTab === tab ? 'default' : 'outline'}
            onClick={() => setActiveTab(tab)}
            className="capitalize"
          >
            {tab === 'overall' ? 'Overall' : tab}
          </Button>
        ))}
      </div>

      {/* Scoreboard */}
      <Card className="p-6">
        <h2 className="text-2xl font-semibold mb-4">
          {activeTab === 'overall' ? 'Overall Rankings' : activeTab}
        </h2>
        <ModelScoreboardTable models={currentModels} />
      </Card>
    </div>
  );
}
