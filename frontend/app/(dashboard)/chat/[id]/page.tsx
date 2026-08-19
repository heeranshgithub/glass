'use client';

import {
  useEffect,
  useLayoutEffect,
  useState,
  useRef,
  useCallback,
} from 'react';
import { useParams } from 'next/navigation';
import {
  useAppDispatch,
  useAppSelector,
  setCurrentConversationId,
  useGetConversationQuery,
} from '@/lib/store';
import { streamConversationMessage } from '@/lib/store/api/councilApi';
import { userApi } from '@/lib/store/api/userApi';
import { ChatMessages } from '@/components/chat/ChatMessages';
import { ChatInput } from '@/components/chat/ChatInput';
import { Loader2, AlertCircle, Mail } from 'lucide-react';
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
  const [rateLimitError, setRateLimitError] = useState<string | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const contactEmail =
    process.env.NEXT_PUBLIC_CONTACT_EMAIL || 'heeranshconnect@gmail.com';

  // Set current conversation ID and initialize messages
  useEffect(() => {
    dispatch(setCurrentConversationId(conversationId));
  }, [conversationId, dispatch]);

  // Sync messages with fetched conversation before paint so cached conversations
  // never flash the empty-thread UI while local state is still [].
  useLayoutEffect(() => {
    if (!conversation) return;
    const raw = conversation.messages ?? [];
    setMessages(enrichMessagesWithMetadata(raw));
  }, [conversation]);

  const sendMessageStream = useCallback(
    async (content: string) => {
      setIsStreaming(true);
      setRateLimitError(null);

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

      let requestSucceeded = false;
      try {
        abortControllerRef.current = new AbortController();

        const response = await streamConversationMessage({
          conversationId,
          content,
          token,
          signal: abortControllerRef.current.signal,
        });

        if (!response.ok) {
          // Check for rate limit error
          if (response.status === 429) {
            const errorData = await response.json().catch(() => ({}));
            const errorMessage =
              errorData.detail ||
              'Rate limit exceeded. Please try again later.';
            setRateLimitError(errorMessage);
            // Remove optimistic messages
            setMessages(prev => prev.slice(0, -2));
            setIsStreaming(false);
            return;
          }
          throw new Error('Failed to send message');
        }

        // Response is OK, which means rate limit check passed and count was incremented
        requestSucceeded = true;

        const reader = response.body?.getReader();
        if (!reader) throw new Error('No response body');

        const decoder = new TextDecoder();
        let buffer = ''; // Buffer to handle partial SSE lines across chunks

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          // Append new chunk to buffer
          buffer += decoder.decode(value, { stream: true });

          // Split by newlines but keep track of incomplete lines
          const lines = buffer.split('\n');

          // The last element might be incomplete (no trailing newline)
          // Keep it in the buffer for the next iteration
          buffer = lines.pop() || '';

          for (const line of lines) {
            if (line.startsWith('data: ')) {
              const data = line.slice(6);
              try {
                const event: StreamEvent = JSON.parse(data);
                handleStreamEvent(event);
              } catch {
                console.error('Failed to parse SSE event:', data);
              }
            }
          }
        }

        // Process any remaining data in buffer after stream ends
        if (buffer.startsWith('data: ')) {
          const data = buffer.slice(6);
          try {
            const event: StreamEvent = JSON.parse(data);
            handleStreamEvent(event);
          } catch {
            // Ignore incomplete final event
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
        // Invalidate user data to update rate limit banner
        // Only invalidate if request succeeded (response was OK), meaning the count was incremented
        if (requestSucceeded) {
          dispatch(userApi.util.invalidateTags(['User']));
        }
      }
    },
    [conversationId, refetch, token]
  );

  const handleStreamEvent = (event: StreamEvent) => {
    setMessages(prev => {
      const messages = [...prev];
      const lastMsgIndex = messages.length - 1;
      const lastMsg = messages[lastMsgIndex] as AssistantMessage;

      // Create a deep copy of the last message to ensure immutability
      // This is critical for React StrictMode which calls updaters twice
      const updatedMsg: AssistantMessage = {
        ...lastMsg,
        loading: lastMsg.loading ? { ...lastMsg.loading } : undefined,
        streaming: lastMsg.streaming
          ? {
              ...lastMsg.streaming,
              stage1Models: lastMsg.streaming.stage1Models
                ? { ...lastMsg.streaming.stage1Models }
                : undefined,
              stage2Models: lastMsg.streaming.stage2Models
                ? { ...lastMsg.streaming.stage2Models }
                : undefined,
            }
          : undefined,
      };

      switch (event.type) {
        case 'stage1Start':
          updatedMsg.loading = { ...updatedMsg.loading!, stage1: true };
          updatedMsg.streaming = {
            ...updatedMsg.streaming,
            stage1Models: {},
          };
          break;

        case 'stage1Token': {
          const modelId = event.model!;
          const currentModels = updatedMsg.streaming?.stage1Models || {};
          updatedMsg.streaming = {
            ...updatedMsg.streaming,
            stage1Models: {
              ...currentModels,
              [modelId]: (currentModels[modelId] || '') + event.token,
            },
          };
          break;
        }

        case 'stage1Complete':
          updatedMsg.stage1 = event.data as AssistantMessage['stage1'];
          updatedMsg.loading = { ...updatedMsg.loading!, stage1: false };
          updatedMsg.streaming = {
            ...updatedMsg.streaming,
            stage1Models: undefined,
          };
          break;

        case 'stage2Start':
          updatedMsg.loading = { ...updatedMsg.loading!, stage2: true };
          updatedMsg.streaming = {
            ...updatedMsg.streaming,
            stage2Models: {},
          };
          break;

        case 'stage2Token': {
          const modelId = event.model!;
          const currentModels = updatedMsg.streaming?.stage2Models || {};
          updatedMsg.streaming = {
            ...updatedMsg.streaming,
            stage2Models: {
              ...currentModels,
              [modelId]: (currentModels[modelId] || '') + event.token,
            },
          };
          break;
        }

        case 'stage2Complete':
          updatedMsg.stage2 = event.data as AssistantMessage['stage2'];
          updatedMsg.metadata = event.metadata as CouncilMetadata;
          updatedMsg.loading = { ...updatedMsg.loading!, stage2: false };
          updatedMsg.streaming = {
            ...updatedMsg.streaming,
            stage2Models: undefined,
          };
          break;

        case 'stage3Start':
          updatedMsg.loading = { ...updatedMsg.loading!, stage3: true };
          updatedMsg.streaming = {
            ...updatedMsg.streaming,
            stage3Text: '',
          };
          break;

        case 'stage3Token': {
          const currentText = updatedMsg.streaming?.stage3Text || '';
          updatedMsg.streaming = {
            ...updatedMsg.streaming,
            stage3Text: currentText + event.token,
          };
          break;
        }

        case 'stage3Complete':
          updatedMsg.stage3 = event.data as AssistantMessage['stage3'];
          updatedMsg.loading = { ...updatedMsg.loading!, stage3: false };
          updatedMsg.streaming = {
            ...updatedMsg.streaming,
            stage3Text: undefined,
          };
          break;

        case 'error':
          console.error('Stream error:', event.message);
          break;
      }

      messages[lastMsgIndex] = updatedMsg;
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
        <div className="flex items-center gap-3">
          <Loader2 className="h-3.5 w-3.5 animate-spin text-foreground" />
          <span className="mono-label">Loading conversation</span>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden">
      <ChatMessages messages={messages} isLoading={isStreaming} />
      {rateLimitError && (
        <div className="w-full max-w-3xl mx-auto px-3 sm:px-4 pb-1">
          <div className="rounded-2xl bg-destructive/10 px-4 py-3 flex items-start gap-2 text-sm">
            <AlertCircle
              className="h-4 w-4 text-destructive flex-shrink-0 mt-0.5"
              strokeWidth={2}
            />
            <div className="flex-1">
              <p className="font-medium text-destructive">{rateLimitError}</p>
              <p className="text-muted-foreground mt-1">
                Contact us at{' '}
                <a
                  href={`mailto:${contactEmail}`}
                  className="underline underline-offset-4 decoration-foreground/40 hover:decoration-foreground text-foreground inline-flex items-center gap-1"
                >
                  <Mail className="h-3 w-3" strokeWidth={1.75} />
                  {contactEmail}
                </a>{' '}
                to request more access.
              </p>
            </div>
          </div>
        </div>
      )}
      <ChatInput
        onSendMessage={handleSendMessage}
        isLoading={isStreaming}
        disabled={isStreaming}
      />
    </div>
  );
}
