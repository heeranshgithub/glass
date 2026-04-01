import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import type { AssistantMessage, StreamEvent, UserMessage } from '@/lib/types';
import type { RootState } from '../store';

export type StreamStatus = 'idle' | 'streaming' | 'syncing' | 'error';

export interface ConversationStreamState {
  status: StreamStatus;
  requestId: string | null;
  optimisticUserMessage: UserMessage | null;
  assistantDraft: AssistantMessage | null;
  error: string | null;
}

interface ChatStreamState {
  byConversationId: Record<string, ConversationStreamState>;
}

const createAssistantDraft = (): AssistantMessage => ({
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
});

const createConversationInitialState = (): ConversationStreamState => ({
  status: 'idle',
  requestId: null,
  optimisticUserMessage: null,
  assistantDraft: null,
  error: null,
});

const initialState: ChatStreamState = {
  byConversationId: {},
};

const chatStreamSlice = createSlice({
  name: 'chatStream',
  initialState,
  reducers: {
    startConversationStream: (
      state,
      action: PayloadAction<{
        conversationId: string;
        requestId: string;
        content: string;
      }>
    ) => {
      const { conversationId, requestId, content } = action.payload;
      state.byConversationId[conversationId] = {
        status: 'streaming',
        requestId,
        optimisticUserMessage: { role: 'user', content },
        assistantDraft: createAssistantDraft(),
        error: null,
      };
    },

    applyStreamEvent: (
      state,
      action: PayloadAction<{
        conversationId: string;
        requestId: string;
        event: StreamEvent;
      }>
    ) => {
      const { conversationId, requestId, event } = action.payload;
      const conversationState = state.byConversationId[conversationId];
      if (!conversationState || conversationState.requestId !== requestId) {
        return;
      }

      if (!conversationState.assistantDraft) {
        conversationState.assistantDraft = createAssistantDraft();
      }

      const draft = conversationState.assistantDraft;
      draft.loading = draft.loading ?? { stage1: false, stage2: false, stage3: false };

      switch (event.type) {
        case 'stage1Start':
          draft.loading.stage1 = true;
          draft.streaming = { ...draft.streaming, stage1Models: {} };
          break;
        case 'stage1Token': {
          const modelId = event.model;
          if (!modelId) break;
          const currentModels = draft.streaming?.stage1Models ?? {};
          draft.streaming = {
            ...draft.streaming,
            stage1Models: {
              ...currentModels,
              [modelId]: (currentModels[modelId] ?? '') + (event.token ?? ''),
            },
          };
          break;
        }
        case 'stage1Complete':
          draft.stage1 = (event.data as AssistantMessage['stage1']) ?? null;
          draft.loading.stage1 = false;
          draft.streaming = {
            ...draft.streaming,
            stage1Models: undefined,
          };
          break;
        case 'stage2Start':
          draft.loading.stage2 = true;
          draft.streaming = { ...draft.streaming, stage2Models: {} };
          break;
        case 'stage2Token': {
          const modelId = event.model;
          if (!modelId) break;
          const currentModels = draft.streaming?.stage2Models ?? {};
          draft.streaming = {
            ...draft.streaming,
            stage2Models: {
              ...currentModels,
              [modelId]: (currentModels[modelId] ?? '') + (event.token ?? ''),
            },
          };
          break;
        }
        case 'stage2Complete':
          draft.stage2 = (event.data as AssistantMessage['stage2']) ?? null;
          draft.metadata = (event.metadata as AssistantMessage['metadata']) ?? null;
          draft.loading.stage2 = false;
          draft.streaming = {
            ...draft.streaming,
            stage2Models: undefined,
          };
          break;
        case 'stage3Start':
          draft.loading.stage3 = true;
          draft.streaming = { ...draft.streaming, stage3Text: '' };
          break;
        case 'stage3Token': {
          const currentText = draft.streaming?.stage3Text ?? '';
          draft.streaming = {
            ...draft.streaming,
            stage3Text: currentText + (event.token ?? ''),
          };
          break;
        }
        case 'stage3Complete':
          draft.stage3 = (event.data as AssistantMessage['stage3']) ?? null;
          draft.loading.stage3 = false;
          draft.streaming = {
            ...draft.streaming,
            stage3Text: undefined,
          };
          break;
        case 'error':
          conversationState.status = 'error';
          conversationState.error = event.message ?? 'Streaming failed';
          conversationState.requestId = null;
          conversationState.optimisticUserMessage = null;
          conversationState.assistantDraft = null;
          break;
        default:
          break;
      }
    },

    markStreamSyncing: (
      state,
      action: PayloadAction<{ conversationId: string; requestId: string }>
    ) => {
      const { conversationId, requestId } = action.payload;
      const conversationState = state.byConversationId[conversationId];
      if (!conversationState || conversationState.requestId !== requestId) {
        return;
      }
      conversationState.status = 'syncing';
      conversationState.requestId = null;
      conversationState.error = null;
    },

    failConversationStream: (
      state,
      action: PayloadAction<{ conversationId: string; requestId: string; error: string }>
    ) => {
      const { conversationId, requestId, error } = action.payload;
      const conversationState = state.byConversationId[conversationId];
      if (!conversationState || conversationState.requestId !== requestId) {
        return;
      }
      conversationState.status = 'error';
      conversationState.error = error;
      conversationState.requestId = null;
      conversationState.optimisticUserMessage = null;
      conversationState.assistantDraft = null;
    },

    clearConversationStreamDraft: (
      state,
      action: PayloadAction<{ conversationId: string }>
    ) => {
      const { conversationId } = action.payload;
      state.byConversationId[conversationId] = createConversationInitialState();
    },
  },
});

export const {
  startConversationStream,
  applyStreamEvent,
  markStreamSyncing,
  failConversationStream,
  clearConversationStreamDraft,
} = chatStreamSlice.actions;

export const selectConversationStreamState = (
  state: RootState,
  conversationId: string
): ConversationStreamState =>
  state.chatStream.byConversationId[conversationId] ?? createConversationInitialState();

export default chatStreamSlice.reducer;
