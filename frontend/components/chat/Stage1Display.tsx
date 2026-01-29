'use client';

import { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Brain, Cpu, Check, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Stage1Response } from '@/lib/types';

interface Stage1DisplayProps {
  responses: Stage1Response[];
  isStreaming?: boolean;
}

export function Stage1Display({ responses, isStreaming }: Stage1DisplayProps) {
  const [activeTab, setActiveTab] = useState(0);

  if (!responses || responses.length === 0) {
    return null;
  }

  const getModelShortName = (model: string | null | undefined) => {
    if (!model) return 'Unknown';
    const parts = model.split('/');
    return parts[parts.length - 1] || model;
  };

  return (
    <Card className="stage-card stage-1 overflow-hidden border-chart-1/20 bg-gradient-to-br from-chart-1/5 via-background to-background">
      <CardHeader className="pb-4">
        <CardTitle className="text-base flex items-center gap-3">
          <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-chart-1/20">
            <Brain className="h-4 w-4 text-chart-1" />
          </div>
          <div className="flex-1">
            <span className="font-semibold">Stage 1: Individual Responses</span>
            <p className="text-xs font-normal text-muted-foreground mt-0.5">
              Each model&apos;s independent analysis
            </p>
          </div>
          <Badge
            variant="secondary"
            className="bg-chart-1/10 text-chart-1 border-chart-1/20 hover:bg-chart-1/20"
          >
            <Cpu className="w-3 h-3 mr-1" />
            {responses.length} models
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Model Tabs */}
        <div className="flex flex-wrap gap-2">
          {responses.map((resp, index) => (
            <Button
              key={index}
              variant="ghost"
              size="sm"
              onClick={() => setActiveTab(index)}
              className={cn(
                'text-xs font-medium transition-all duration-200 rounded-lg',
                activeTab === index
                  ? 'bg-chart-1 text-white shadow-lg shadow-chart-1/25 hover:bg-chart-1/90'
                  : 'bg-muted/50 hover:bg-muted text-muted-foreground hover:text-foreground'
              )}
            >
              {activeTab === index && <Check className="w-3 h-3 mr-1.5" />}
              {getModelShortName(resp?.model)}
            </Button>
          ))}
        </div>

        {/* Response Content */}
        <div className="rounded-xl border border-border/50 bg-background/50 backdrop-blur-sm overflow-hidden">
          <div className="px-4 py-2 border-b border-border/30 bg-muted/30">
            <code className="text-xs text-muted-foreground font-mono">
              {responses[activeTab]?.model || 'Unknown'}
            </code>
          </div>
          <div className="p-4">
            <div className="prose prose-sm dark:prose-invert max-w-none">
              <ReactMarkdown>
                {responses[activeTab]?.response || ''}
              </ReactMarkdown>
              {isStreaming && (
                <span className="inline-block w-2 h-4 bg-chart-1 animate-pulse ml-1" />
              )}
            </div>
            {isStreaming && (
              <div className="flex items-center gap-2 mt-3 text-xs text-chart-1">
                <Loader2 className="h-3 w-3 animate-spin" />
                <span className="font-medium">Streaming response...</span>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
