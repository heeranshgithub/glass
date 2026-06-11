export interface ModelResponse {
  model: string;
  response: string;
}

export interface ConversationMetadata {
  id: string;
  createdAt: string;
  title: string;
  messageCount: number;
}

export interface UserMessage {
  role: 'user';
  content: string;
  timestamp?: string;
}

export interface AssistantMessage {
  role: 'assistant';
  responses: ModelResponse[] | null;
  timestamp?: string;
  loading?: boolean;
  streaming?: {
    modelTokens?: Record<string, string>; // modelId -> accumulated text
  };
}

export type Message = UserMessage | AssistantMessage;

export interface Conversation {
  id: string;
  userId: string;
  createdAt: string;
  updatedAt: string;
  title: string;
  messages: Message[];
}

export interface ConversationListResponse {
  conversations: ConversationMetadata[];
  total: number;
}

export interface SendMessageRequest {
  content: string;
}

export const CHAT_MODELS = [
  { id: 'openai/gpt-5.1',                label: 'GPT-5.1' },
  { id: 'google/gemini-3.1-pro-preview', label: 'Gemini 3.1 Pro' },
  { id: 'anthropic/claude-sonnet-4.5',   label: 'Claude Sonnet' },
  { id: 'x-ai/grok-4.20',               label: 'Grok 4' },
] as const;

export type ModelId = typeof CHAT_MODELS[number]['id'];

// SSE stream event types — matches backend SSE events
export type StreamEventType =
  | 'stage1Start'
  | 'stage1Token'
  | 'stage1Complete'
  | 'stage2Start'
  | 'stage2Token'
  | 'stage2Complete'
  | 'stage3Start'
  | 'stage3Token'
  | 'stage3Complete'
  | 'titleComplete'
  | 'complete'
  | 'error';

export interface StreamEvent {
  type: StreamEventType;
  data?: unknown;
  model?: string;
  token?: string;
  message?: string;
}
