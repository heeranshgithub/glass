import { baseApi, API_BASE_URL } from './baseApi';
import type {
  Conversation,
  ConversationListResponse,
  CouncilHealthResponse,
} from '@/lib/types';

interface StreamMessageArgs {
  conversationId: string;
  content: string;
  token: string | null;
  signal?: AbortSignal;
}

/**
 * Stream a message to a conversation
 * @param args The stream message arguments
 * @returns The fetch Response object for streaming
 */
export async function streamConversationMessage({
  conversationId,
  content,
  token,
  signal,
}: StreamMessageArgs): Promise<Response> {
  const response = await fetch(
    `${API_BASE_URL}/ml/conversations/${conversationId}/messages`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify({ content }),
      signal,
    }
  );

  return response;
}

export const councilApi = baseApi.injectEndpoints({
  endpoints: builder => ({
    listConversations: builder.query<ConversationListResponse, void>({
      query: () => '/ml/conversations',
      providesTags: ['ConversationList'],
    }),

    createConversation: builder.mutation<Conversation, void>({
      query: () => ({
        url: '/ml/conversations',
        method: 'POST',
        body: {},
      }),
      invalidatesTags: ['ConversationList'],
    }),

    getConversation: builder.query<Conversation, string>({
      query: conversationId => `/ml/conversations/${conversationId}`,
      providesTags: (result, error, id) => [{ type: 'Conversation', id }],
    }),

    deleteConversation: builder.mutation<{ message: string }, string>({
      query: conversationId => ({
        url: `/ml/conversations/${conversationId}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['ConversationList'],
    }),

    getCouncilHealth: builder.query<CouncilHealthResponse, void>({
      query: () => '/ml/health',
      providesTags: ['CouncilHealth'],
    }),
  }),
});

export const {
  useListConversationsQuery,
  useCreateConversationMutation,
  useGetConversationQuery,
  useDeleteConversationMutation,
  useGetCouncilHealthQuery,
} = councilApi;
