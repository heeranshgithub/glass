import { baseApi, API_BASE_URL } from './baseApi';
import type { Conversation, ConversationListResponse } from '@/lib/types';

interface StreamMessageArgs {
  conversationId: string;
  content: string;
  token: string | null;
  signal?: AbortSignal;
}

export async function streamConversationMessage({
  conversationId,
  content,
  token,
  signal,
}: StreamMessageArgs): Promise<Response> {
  return fetch(
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
}

export const chatApi = baseApi.injectEndpoints({
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
  }),
});

export const {
  useListConversationsQuery,
  useCreateConversationMutation,
  useGetConversationQuery,
  useDeleteConversationMutation,
} = chatApi;
