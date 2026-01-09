'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { useParams } from 'next/navigation';
import {
  useAppDispatch,
  useAppSelector,
  setCurrentConversationId,
  useGetConversationQuery,
} from '@/lib/store';
import { streamConversationMessage } from '@/lib/store/api/councilApi';
import { ChatMessages } from '@/components/chat/ChatMessages';
import { ChatInput } from '@/components/chat/ChatInput';
import { Loader2 } from 'lucide-react';
import type {
  Message,
  AssistantMessage,
  StreamEvent,
  CouncilMetadata,
} from '@/lib/types';

/**
 * Reconstruct metadata from stored message data.
 * This is needed because metadata is not stored in the database,
 * but we can extract aggregateRanking from stage3 and reconstruct labelToModel from stage1.
 */
function reconstructMetadata(
  message: AssistantMessage
): CouncilMetadata | null {
  if (!message.stage1 || !message.stage2 || !message.stage3) {
    return null;
  }

  // Extract aggregateRanking from stage3.aggregateRanking (handle both camelCase and snake_case)
  const aggregateRanking =
    (message.stage3 as any).aggregateRanking ||
    (message.stage3 as any).aggregate_ranking ||
    [];

  // Reconstruct labelToModel from stage1 data
  // Labels are typically "Response A", "Response B", etc.
  const labelToModel: Record<string, string> = {};
  message.stage1.forEach((response, index) => {
    const label = `Response ${String.fromCharCode(65 + index)}`; // A, B, C, D...
    labelToModel[label] = response.model;
  });

  return {
    labelToModel,
    aggregateRanking,
  };
}

/**
 * Normalize stage2 data to ensure parsedRanking is available (handle both camelCase and snake_case).
 */
function normalizeStage2Data(stage2: any[] | null): any[] | null {
  if (!stage2) return null;
  return stage2.map(ranking => ({
    ...ranking,
    parsedRanking: ranking.parsedRanking || ranking.parsed_ranking || [],
  }));
}

/**
 * Enrich messages with reconstructed metadata when loading from database.
 */
function enrichMessagesWithMetadata(messages: Message[]): Message[] {
  return messages.map(msg => {
    if (msg.role === 'assistant') {
      const assistantMsg = msg as AssistantMessage;

      // Normalize stage2 data to ensure parsedRanking is available
      const normalizedStage2 = normalizeStage2Data(assistantMsg.stage2);
      const normalizedMsg = {
        ...assistantMsg,
        stage2: normalizedStage2,
      };

      // Only add metadata if it's missing and we have the necessary data
      if (
        !normalizedMsg.metadata &&
        normalizedMsg.stage2 &&
        normalizedMsg.stage3
      ) {
        const metadata = reconstructMetadata(normalizedMsg);
        if (metadata) {
          return { ...normalizedMsg, metadata };
        }
      }

      return normalizedMsg;
    }
    return msg;
  });
}

export default function ChatPage() {
  const params = useParams();
  const conversationId = params.id as string;
  const dispatch = useAppDispatch();
  const token = useAppSelector(state => state.auth.accessToken);

  const {
    data: conversation,
    isLoading,
    refetch,
  } = useGetConversationQuery(conversationId);

  const [messages, setMessages] = useState<Message[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Set current conversation ID and initialize messages
  useEffect(() => {
    dispatch(setCurrentConversationId(conversationId));
  }, [conversationId, dispatch]);

  // Sync messages with fetched conversation and enrich with metadata
  useEffect(() => {
    if (conversation?.messages) {
      const enrichedMessages = enrichMessagesWithMetadata(
        conversation.messages
      );
      setMessages(enrichedMessages);
    }
  }, [conversation]);

  const sendMessageStream = useCallback(
    async (content: string) => {
      setIsStreaming(true);

      // Optimistically add user message
      const userMessage: Message = { role: 'user', content };
      setMessages(prev => [...prev, userMessage]);

      // Create initial assistant message
      const assistantMessage: AssistantMessage = {
        role: 'assistant',
        stage1: null,
        stage2: null,
        stage3: null,
        metadata: null,
        loading: {
          stage1: false,
          stage2: false,
          stage3: false,
        },
      };
      setMessages(prev => [...prev, assistantMessage]);

      try {
        abortControllerRef.current = new AbortController();

        const response = await streamConversationMessage({
          conversationId,
          content,
          token,
          signal: abortControllerRef.current.signal,
        });

        if (!response.ok) {
          throw new Error('Failed to send message');
        }

        const reader = response.body?.getReader();
        if (!reader) throw new Error('No response body');

        const decoder = new TextDecoder();

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value);
          const lines = chunk.split('\n');

          for (const line of lines) {
            if (line.startsWith('data: ')) {
              const data = line.slice(6);
              try {
                const event: StreamEvent = JSON.parse(data);
                handleStreamEvent(event);
              } catch {
                console.error('Failed to parse SSE event');
              }
            }
          }
        }
      } catch (error) {
        if ((error as Error).name !== 'AbortError') {
          console.error('Stream error:', error);
          // Remove optimistic messages on error
          setMessages(prev => prev.slice(0, -2));
        }
      } finally {
        setIsStreaming(false);
        abortControllerRef.current = null;
        // Refetch to sync with server
        refetch();
      }
    },
    [conversationId, refetch]
  );

  const handleStreamEvent = (event: StreamEvent) => {
    setMessages(prev => {
      const messages = [...prev];
      const lastMsg = messages[messages.length - 1] as AssistantMessage;

      switch (event.type) {
        case 'stage1Start':
          lastMsg.loading = { ...lastMsg.loading!, stage1: true };
          break;
        case 'stage1Complete':
          lastMsg.stage1 = event.data as AssistantMessage['stage1'];
          lastMsg.loading = { ...lastMsg.loading!, stage1: false };
          break;
        case 'stage2Start':
          lastMsg.loading = { ...lastMsg.loading!, stage2: true };
          break;
        case 'stage2Complete':
          lastMsg.stage2 = event.data as AssistantMessage['stage2'];
          lastMsg.metadata = event.metadata as CouncilMetadata;
          lastMsg.loading = { ...lastMsg.loading!, stage2: false };
          break;
        case 'stage3Start':
          lastMsg.loading = { ...lastMsg.loading!, stage3: true };
          break;
        case 'stage3Complete':
          lastMsg.stage3 = event.data as AssistantMessage['stage3'];
          lastMsg.loading = { ...lastMsg.loading!, stage3: false };
          break;
        case 'error':
          console.error('Stream error:', event.message);
          break;
      }

      return messages;
    });
  };

  const handleSendMessage = (content: string) => {
    if (!content.trim() || isStreaming) return;
    sendMessageStream(content.trim());
  };

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden">
      <ChatMessages messages={messages} isLoading={isStreaming} />
      <ChatInput
        onSendMessage={handleSendMessage}
        isLoading={isStreaming}
        disabled={isStreaming}
      />
    </div>
  );
}
