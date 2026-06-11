'use client';

import { useEffect, useLayoutEffect, useState, useRef, useCallback } from 'react';
import { useParams } from 'next/navigation';
import {
  useAppDispatch,
  useAppSelector,
  setCurrentConversationId,
  useGetConversationQuery,
} from '@/lib/store';
import { streamConversationMessage } from '@/lib/store/api/chatApi';
import { userApi } from '@/lib/store/api/userApi';
import { ChatMessages } from '@/components/chat/ChatMessages';
import { ChatInput } from '@/components/chat/ChatInput';
import { Loader2, AlertCircle, Mail } from 'lucide-react';
import { CHAT_MODELS } from '@/lib/types';
import type { Message, AssistantMessage, StreamEvent, ModelId } from '@/lib/types';

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
  const [selectedModel, setSelectedModel] = useState<ModelId>(CHAT_MODELS[0].id);
  const abortControllerRef = useRef<AbortController | null>(null);
  // Ref guard prevents double-send before React re-renders with isStreaming=true
  const isSubmittingRef = useRef(false);

  const contactEmail =
    process.env.NEXT_PUBLIC_CONTACT_EMAIL || 'heeranshconnect@gmail.com';

  useEffect(() => {
    dispatch(setCurrentConversationId(conversationId));
  }, [conversationId, dispatch]);

  useLayoutEffect(() => {
    if (!conversation) return;
    // Server stores messages with the old `stage1` field name; map to client `responses`.
    const mapped = (conversation.messages ?? []).map(msg => {
      if (msg.role !== 'assistant') return msg;
      const server = msg as any;
      return {
        role: 'assistant' as const,
        responses: server.responses ?? server.stage1 ?? null,
        timestamp: server.timestamp,
      } as AssistantMessage;
    });
    setMessages(mapped);
  }, [conversation]);

  const sendMessageStream = useCallback(
    async (content: string) => {
      setIsStreaming(true);
      setRateLimitError(null);

      const userMessage: Message = { role: 'user', content };
      setMessages(prev => [...prev, userMessage]);

      const assistantMessage: AssistantMessage = {
        role: 'assistant',
        responses: null,
        loading: true,
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
          if (response.status === 429) {
            const errorData = await response.json().catch(() => ({}));
            setRateLimitError(
              errorData.detail || 'Rate limit exceeded. Please try again later.'
            );
            setMessages(prev => prev.slice(0, -2));
            setIsStreaming(false);
            return;
          }
          throw new Error('Failed to send message');
        }

        requestSucceeded = true;

        const reader = response.body?.getReader();
        if (!reader) throw new Error('No response body');

        const decoder = new TextDecoder();
        let buffer = '';

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n');
          buffer = lines.pop() || '';

          for (const line of lines) {
            if (line.startsWith('data: ')) {
              try {
                const event: StreamEvent = JSON.parse(line.slice(6));
                handleStreamEvent(event);
              } catch {
                console.error('Failed to parse SSE event:', line);
              }
            }
          }
        }

        if (buffer.startsWith('data: ')) {
          try {
            const event: StreamEvent = JSON.parse(buffer.slice(6));
            handleStreamEvent(event);
          } catch {
            // incomplete final event — ignore
          }
        }
      } catch (error) {
        if ((error as Error).name !== 'AbortError') {
          console.error('Stream error:', error);
          setMessages(prev => prev.slice(0, -2));
        }
      } finally {
        setIsStreaming(false);
        abortControllerRef.current = null;
        refetch();
        if (requestSucceeded) {
          dispatch(userApi.util.invalidateTags(['User']));
        }
      }
    },
    [conversationId, refetch, token]
  );

  const handleStreamEvent = (event: StreamEvent) => {
    setMessages(prev => {
      const msgs = [...prev];
      const idx = msgs.length - 1;
      const last = msgs[idx] as AssistantMessage;

      const updated: AssistantMessage = {
        ...last,
        streaming: last.streaming
          ? {
              ...last.streaming,
              modelTokens: last.streaming.modelTokens
                ? { ...last.streaming.modelTokens }
                : undefined,
            }
          : undefined,
      };

      switch (event.type) {
        case 'stage1Start':
          updated.loading = true;
          updated.streaming = { modelTokens: {} };
          break;

        case 'stage1Token': {
          const current = updated.streaming?.modelTokens || {};
          updated.streaming = {
            modelTokens: {
              ...current,
              [event.model!]: (current[event.model!] || '') + event.token,
            },
          };
          break;
        }

        case 'stage1Complete':
          updated.responses = (event.data as any[]).map(r => ({
            model: r.model,
            response: r.response,
          }));
          updated.loading = false;
          updated.streaming = { modelTokens: undefined };
          break;

        case 'error':
          console.error('Stream error:', event.message);
          break;

        // stage2/stage3 events are received but not displayed
        default:
          break;
      }

      msgs[idx] = updated;
      return msgs;
    });
  };

  const handleSendMessage = (content: string) => {
    if (!content.trim() || isStreaming || isSubmittingRef.current) return;
    isSubmittingRef.current = true;
    sendMessageStream(content.trim()).finally(() => {
      isSubmittingRef.current = false;
    });
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
      <ChatMessages
        messages={messages}
        isLoading={isStreaming}
        selectedModel={selectedModel}
      />
      {rateLimitError && (
        <div className="border-t border-destructive bg-background">
          <div className="w-full px-2.5 sm:px-3.5 py-2 flex items-start gap-2 text-sm">
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
        selectedModel={selectedModel}
        onModelChange={setSelectedModel}
      />
    </div>
  );
}
