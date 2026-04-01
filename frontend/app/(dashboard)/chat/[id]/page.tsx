'use client';

import { useEffect, useMemo, useState } from 'react';
import { useParams } from 'next/navigation';
import {
  useAppDispatch,
  useAppSelector,
  useAppStore,
  selectConversationStreamState,
  clearConversationStreamDraft,
  setCurrentConversationId,
  useGetConversationQuery,
} from '@/lib/store';
import { startConversationStreamRequest } from '@/lib/store/chatStreamManager';
import { ChatMessages } from '@/components/chat/ChatMessages';
import { ChatInput } from '@/components/chat/ChatInput';
import { Loader2, AlertCircle, Mail } from 'lucide-react';
import type { Message, AssistantMessage, CouncilMetadata } from '@/lib/types';

interface Stage3Shape {
  aggregateRanking?: CouncilMetadata['aggregateRanking'];
  aggregate_ranking?: CouncilMetadata['aggregateRanking'];
}

interface Stage2Shape {
  parsedRanking?: string[];
  parsed_ranking?: string[];
}

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
  const stage3 = message.stage3 as Stage3Shape;
  const aggregateRanking =
    stage3.aggregateRanking || stage3.aggregate_ranking || [];

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
function normalizeStage2Data(stage2: AssistantMessage['stage2']): AssistantMessage['stage2'] {
  if (!stage2) return null;
  return stage2.map(ranking => ({
    ...ranking,
    parsedRanking:
      (ranking as Stage2Shape).parsedRanking ||
      (ranking as Stage2Shape).parsed_ranking ||
      [],
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

function mergeConversationMessages(
  serverMessages: Message[],
  streamState: ReturnType<typeof selectConversationStreamState>
): Message[] {
  const merged = [...serverMessages];
  const { optimisticUserMessage, assistantDraft, status } = streamState;

  if (!optimisticUserMessage || !assistantDraft) {
    return merged;
  }

  const lastServerMessage = merged[merged.length - 1];
  const hasUserAtTail =
    lastServerMessage?.role === 'user' &&
    lastServerMessage.content === optimisticUserMessage.content;

  if (!hasUserAtTail) {
    merged.push(optimisticUserMessage);
  }

  const serverHasFinalAssistant =
    assistantDraft.stage3?.response &&
    merged.some(
      msg =>
        msg.role === 'assistant' &&
        (msg as AssistantMessage).stage3?.response === assistantDraft.stage3?.response
    );

  if ((status === 'streaming' || status === 'syncing') && !serverHasFinalAssistant) {
    merged.push(assistantDraft);
  }

  return merged;
}

export default function ChatPage() {
  const params = useParams();
  const conversationId = params.id as string;
  const dispatch = useAppDispatch();
  const store = useAppStore();
  const streamState = useAppSelector(state =>
    selectConversationStreamState(state, conversationId)
  );

  const {
    data: conversation,
    isLoading,
  } = useGetConversationQuery(conversationId);

  const [rateLimitErrors, setRateLimitErrors] = useState<Record<string, string>>(
    {}
  );

  const contactEmail =
    process.env.NEXT_PUBLIC_CONTACT_EMAIL || 'heeranshconnect@gmail.com';

  // Set current conversation ID and initialize messages
  useEffect(() => {
    dispatch(setCurrentConversationId(conversationId));
  }, [conversationId, dispatch]);

  const serverMessages = useMemo(
    () =>
      conversation?.messages
        ? enrichMessagesWithMetadata(conversation.messages)
        : [],
    [conversation]
  );

  const messages = useMemo(
    () => mergeConversationMessages(serverMessages, streamState),
    [serverMessages, streamState]
  );

  useEffect(() => {
    if (streamState.status !== 'syncing' || !streamState.assistantDraft?.stage3) {
      return;
    }

    const finalResponse = streamState.assistantDraft.stage3.response;
    const serverHasFinalAssistant = serverMessages.some(
      msg =>
        msg.role === 'assistant' &&
        (msg as AssistantMessage).stage3?.response === finalResponse
    );

    if (serverHasFinalAssistant) {
      dispatch(clearConversationStreamDraft({ conversationId }));
    }
  }, [conversationId, dispatch, serverMessages, streamState]);

  const handleSendMessage = (content: string) => {
    if (!content.trim() || streamState.status === 'streaming') return;
    setRateLimitErrors(prev => {
      const next = { ...prev };
      delete next[conversationId];
      return next;
    });
    void startConversationStreamRequest({
      dispatch,
      getState: store.getState,
      conversationId,
      content: content.trim(),
      onRateLimitError: message =>
        setRateLimitErrors(prev => ({ ...prev, [conversationId]: message })),
    });
  };

  const isStreaming = streamState.status === 'streaming';
  const rateLimitError = rateLimitErrors[conversationId] ?? null;

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
      {rateLimitError && (
        <div className="mx-4 mb-2 p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
          <div className="flex items-start gap-2 text-sm">
            <AlertCircle className="h-4 w-4 text-destructive flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-destructive font-medium">{rateLimitError}</p>
              <p className="text-destructive/80 text-xs mt-1">
                Contact us at{' '}
                <a
                  href={`mailto:${contactEmail}`}
                  className="underline hover:opacity-80 inline-flex items-center gap-1"
                >
                  <Mail className="h-3 w-3" />
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
