import { baseApi } from './baseApi';
import type {
  UserProfileResponse,
  UserUpdate,
  UserResponse,
  UserListResponse,
  UserListQuery,
} from '@/lib/types';

export const userApi = baseApi.injectEndpoints({
  endpoints: builder => ({
    getCurrentUser: builder.query<UserProfileResponse, void>({
      query: () => '/users/me',
      providesTags: ['User'],
    }),

    updateCurrentUser: builder.mutation<UserProfileResponse, UserUpdate>({
      query: data => ({
        url: '/users/me',
        method: 'PATCH',
        body: data,
      }),
      invalidatesTags: ['User'],
    }),

    // Admin endpoints
    listUsers: builder.query<UserListResponse, UserListQuery>({
      query: params => ({
        url: '/users',
        params,
      }),
    }),

    getUser: builder.query<UserResponse, string>({
      query: userId => `/users/${userId}`,
    }),

    updateUser: builder.mutation<
      UserResponse,
      { userId: string; data: Partial<UserResponse> }
    >({
      query: ({ userId, data }) => ({
        url: `/users/${userId}`,
        method: 'PATCH',
        body: data,
      }),
    }),

    deleteUser: builder.mutation<{ message: string }, string>({
      query: userId => ({
        url: `/users/${userId}`,
        method: 'DELETE',
      }),
    }),

    addUserRole: builder.mutation<
      UserResponse,
      { userId: string; role: string }
    >({
      query: ({ userId, role }) => ({
        url: `/users/${userId}/roles/${role}`,
        method: 'POST',
      }),
    }),

    removeUserRole: builder.mutation<
      UserResponse,
      { userId: string; role: string }
    >({
      query: ({ userId, role }) => ({
        url: `/users/${userId}/roles/${role}`,
        method: 'DELETE',
      }),
    }),

    // OpenRouter API Key Management
    setOpenRouterKey: builder.mutation<{ message: string }, { apiKey: string }>(
      {
        query: data => ({
          url: '/users/me/openrouter-key',
          method: 'POST',
          body: data,
        }),
        invalidatesTags: ['User'],
      }
    ),

    removeOpenRouterKey: builder.mutation<{ message: string }, void>({
      query: () => ({
        url: '/users/me/openrouter-key',
        method: 'DELETE',
      }),
      invalidatesTags: ['User'],
    }),

    // Admin: Reset demo user's daily limit
    resetDemoLimit: builder.mutation<UserResponse, void>({
      query: () => ({
        url: '/users/demo/reset-limit',
        method: 'POST',
      }),
    }),
  }),
});

export const {
  useGetCurrentUserQuery,
  useUpdateCurrentUserMutation,
  useListUsersQuery,
  useGetUserQuery,
  useUpdateUserMutation,
  useDeleteUserMutation,
  useAddUserRoleMutation,
  useRemoveUserRoleMutation,
  useSetOpenRouterKeyMutation,
  useRemoveOpenRouterKeyMutation,
  useResetDemoLimitMutation,
} = userApi;
