import type { AppDispatch, RootState } from './store';
import { streamConversationMessage } from './api/councilApi';
import { councilApi } from './api/councilApi';
import { userApi } from './api/userApi';
import {
  applyStreamEvent,
  clearConversationStreamDraft,
  failConversationStream,
  markStreamSyncing,
  startConversationStream,
} from './slices/chatStreamSlice';
import type { StreamEvent } from '@/lib/types';

interface StartStreamArgs {
  dispatch: AppDispatch;
  getState: () => RootState;
  conversationId: string;
  content: string;
  onRateLimitError?: (message: string) => void;
}

const activeControllers = new Map<string, AbortController>();

const makeRequestId = () => `${Date.now()}-${Math.random().toString(16).slice(2)}`;

export async function startConversationStreamRequest({
  dispatch,
  getState,
  conversationId,
  content,
  onRateLimitError,
}: StartStreamArgs): Promise<void> {
  const currentState = getState().chatStream.byConversationId[conversationId];
  if (currentState?.status === 'streaming') {
    return;
  }

  const token = getState().auth.accessToken;
  const requestId = makeRequestId();
  dispatch(startConversationStream({ conversationId, requestId, content }));

  const abortController = new AbortController();
  activeControllers.set(conversationId, abortController);

  let requestSucceeded = false;

  try {
    const response = await streamConversationMessage({
      conversationId,
      content,
      token,
      signal: abortController.signal,
    });

    if (!response.ok) {
      if (response.status === 429) {
        const errorData = await response.json().catch(() => ({}));
        const errorMessage =
          errorData.detail || 'Rate limit exceeded. Please try again later.';
        onRateLimitError?.(errorMessage);
        dispatch(clearConversationStreamDraft({ conversationId }));
        return;
      }
      throw new Error('Failed to send message');
    }

    requestSucceeded = true;

    const reader = response.body?.getReader();
    if (!reader) {
      throw new Error('No response body');
    }

    const decoder = new TextDecoder();
    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        if (!line.startsWith('data: ')) {
          continue;
        }

        const data = line.slice(6);
        try {
          const event: StreamEvent = JSON.parse(data);
          dispatch(applyStreamEvent({ conversationId, requestId, event }));

          if (event.type === 'error') {
            dispatch(
              failConversationStream({
                conversationId,
                requestId,
                error: event.message ?? 'Streaming failed',
              })
            );
            return;
          }

          if (event.type === 'complete') {
            dispatch(markStreamSyncing({ conversationId, requestId }));
          }
        } catch {
          console.error('Failed to parse SSE event:', data);
        }
      }
    }

    if (buffer.startsWith('data: ')) {
      const data = buffer.slice(6);
      try {
        const event: StreamEvent = JSON.parse(data);
        dispatch(applyStreamEvent({ conversationId, requestId, event }));
        if (event.type === 'complete') {
          dispatch(markStreamSyncing({ conversationId, requestId }));
        }
      } catch {
        // ignore incomplete trailing data
      }
    }
  } catch (error) {
    if ((error as Error).name !== 'AbortError') {
      dispatch(
        failConversationStream({
          conversationId,
          requestId,
          error: 'Failed to stream response',
        })
      );
    }
  } finally {
    const currentController = activeControllers.get(conversationId);
    if (currentController === abortController) {
      activeControllers.delete(conversationId);
    }

    dispatch(
      councilApi.util.invalidateTags([
        { type: 'Conversation', id: conversationId },
        'ConversationList',
      ])
    );

    if (requestSucceeded) {
      dispatch(userApi.util.invalidateTags(['User']));
    }
  }
}

export function abortConversationStreamRequest(conversationId: string): void {
  const controller = activeControllers.get(conversationId);
  if (!controller) {
    return;
  }
  controller.abort();
  activeControllers.delete(conversationId);
}
