import { baseApi } from './baseApi';

export interface WaitlistJoinRequest {
  email: string;
}

export interface WaitlistJoinResponse {
  success: boolean;
  message: string;
}

export const waitlistApi = baseApi.injectEndpoints({
  endpoints: builder => ({
    joinWaitlist: builder.mutation<WaitlistJoinResponse, WaitlistJoinRequest>({
      query: body => ({
        url: '/waitlist/join',
        method: 'POST',
        body,
      }),
    }),
  }),
});

export const { useJoinWaitlistMutation } = waitlistApi;
