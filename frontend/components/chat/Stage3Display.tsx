'use client';

import ReactMarkdown from 'react-markdown';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Sparkles, Crown, CheckCircle2, Loader2 } from 'lucide-react';
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
    <Card className="stage-card stage-3 overflow-hidden border-chart-3/20 bg-gradient-to-br from-chart-3/5 via-background to-background">
      <CardHeader className="pb-4">
        <CardTitle className="text-base flex items-center gap-3">
          <div className="relative">
            <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-chart-3/20">
              <Sparkles className="h-4 w-4 text-chart-3" />
            </div>
            <div className="absolute -top-1 -right-1">
              <CheckCircle2 className="w-4 h-4 text-chart-3 fill-background" />
            </div>
          </div>
          <div className="flex-1">
            <span className="font-semibold">Stage 3: Final Council Answer</span>
            <p className="text-xs font-normal text-muted-foreground mt-0.5">
              Synthesized from all perspectives
            </p>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="rounded-xl border border-chart-3/30 bg-gradient-to-br from-chart-3/5 to-transparent overflow-hidden">
          {/* Arbiter header */}
          <div className="px-4 py-3 border-b border-chart-3/20 bg-chart-3/5 flex items-center gap-3">
            <div className="flex items-center justify-center w-7 h-7 rounded-full bg-chart-3/20">
              <Crown className="h-3.5 w-3.5 text-chart-3" />
            </div>
            <div className="flex-1">
              <span className="text-xs font-medium text-muted-foreground">
                Council Arbiter
              </span>
            </div>
            <Badge
              variant="outline"
              className="border-chart-3/40 text-chart-3 bg-chart-3/5"
            >
              {getModelShortName(response?.model)}
            </Badge>
          </div>

          {/* Response content */}
          <div className="p-5">
            <div className="prose prose-sm dark:prose-invert max-w-none">
              <ReactMarkdown>{response?.response || ''}</ReactMarkdown>
              {isStreaming && (
                <span className="inline-block w-2 h-4 bg-chart-3 animate-pulse ml-1" />
              )}
            </div>
            {isStreaming && (
              <div className="flex items-center gap-2 mt-3 text-xs text-chart-3">
                <Loader2 className="h-3 w-3 animate-spin" />
                <span className="font-medium">
                  Synthesizing final answer...
                </span>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="px-4 py-2 border-t border-chart-3/10 bg-chart-3/5">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              {isStreaming ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 text-chart-3 animate-spin" />
                  <span>Streaming answer...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5 text-chart-3" />
                  <span>
                    Answer synthesized from peer-ranked model responses
                  </span>
                </>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
