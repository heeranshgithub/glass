// Council/ML Types - matches backend schemas/ml.py

export interface Stage1Response {
  model: string;
  response: string;
}

export interface Stage2Ranking {
  model: string;
  ranking: string;
  parsedRanking: string[];
}

export interface Stage3Synthesis {
  model: string;
  response: string;
  aggregateRanking?: AggregateRanking[];
}

export interface AggregateRanking {
  model: string;
  averageRank: number;
  rankingsCount: number;
  // Higher is better. Normalized within the conversation (0-100).
  score?: number;
}

export interface CouncilMetadata {
  labelToModel: Record<string, string>;
  aggregateRanking: AggregateRanking[];
}

export interface CouncilResponse {
  stage1: Stage1Response[];
  stage2: Stage2Ranking[];
  stage3: Stage3Synthesis;
  metadata: CouncilMetadata;
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
  stage1: Stage1Response[] | null;
  stage2: Stage2Ranking[] | null;
  stage3: Stage3Synthesis | null;
  metadata?: CouncilMetadata | null;
  timestamp?: string;
  loading?: {
    stage1: boolean;
    stage2: boolean;
    stage3: boolean;
  };
  // Streaming state - accumulates tokens as they arrive
  streaming?: {
    stage1Models?: Record<string, string>; // modelId -> accumulated text
    stage2Models?: Record<string, string>; // modelId -> accumulated text
    stage3Text?: string; // accumulated final response
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

export interface CouncilHealthResponse {
  status: string;
  councilModels: string[];
  arbiterModel: string;
  openrouterConfigured: boolean;
}

// Streaming Event Types
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
  model?: string; // For identifying which model in parallel streams (stage1Token, stage2Token)
  token?: string; // For token content (stage1Token, stage2Token, stage3Token)
  metadata?: CouncilMetadata;
  message?: string;
}
