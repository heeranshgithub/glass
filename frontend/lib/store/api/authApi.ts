import { baseApi } from './baseApi';
import type {
  LoginRequest,
  RegisterRequest,
  TokenResponse,
  TokenRefreshRequest,
  PasswordChangeRequest,
  LogoutRequest,
  AuthStatusResponse,
} from '@/lib/types';

export const authApi = baseApi.injectEndpoints({
  endpoints: builder => ({
    login: builder.mutation<TokenResponse, LoginRequest>({
      query: credentials => ({
        url: '/auth/login',
        method: 'POST',
        body: credentials,
      }),
    }),

    register: builder.mutation<TokenResponse, RegisterRequest>({
      query: data => ({
        url: '/auth/register',
        method: 'POST',
        body: data,
      }),
    }),

    refreshToken: builder.mutation<TokenResponse, TokenRefreshRequest>({
      query: data => ({
        url: '/auth/refresh',
        method: 'POST',
        body: data,
      }),
    }),

    logout: builder.mutation<{ message: string }, LogoutRequest>({
      query: data => ({
        url: '/auth/logout',
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['User'],
    }),

    logoutAll: builder.mutation<{ message: string }, void>({
      query: () => ({
        url: '/auth/logout/all',
        method: 'POST',
      }),
      invalidatesTags: ['User'],
    }),

    changePassword: builder.mutation<
      { message: string },
      PasswordChangeRequest
    >({
      query: data => ({
        url: '/auth/password/change',
        method: 'POST',
        body: data,
      }),
    }),

    getAuthStatus: builder.query<AuthStatusResponse, void>({
      query: () => '/auth/status',
      providesTags: ['User'],
    }),

    demoLogin: builder.mutation<TokenResponse, void>({
      query: () => ({
        url: '/auth/demo-login',
        method: 'POST',
      }),
    }),
  }),
});

export const {
  useLoginMutation,
  useRegisterMutation,
  useRefreshTokenMutation,
  useLogoutMutation,
  useLogoutAllMutation,
  useChangePasswordMutation,
  useGetAuthStatusQuery,
  useDemoLoginMutation,
} = authApi;
