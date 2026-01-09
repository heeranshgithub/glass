import { baseApi } from './baseApi';
import type { LeaderboardResponse } from '@/lib/types';

export const leaderboardApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getLeaderboard: builder.query<LeaderboardResponse, void>({
      query: () => '/leaderboard',
      providesTags: ['Leaderboard'],
    }),
    
    rebuildLeaderboard: builder.mutation<
      { message: string; stats: Record<string, number> },
      void
    >({
      query: () => ({
        url: '/leaderboard/rebuild',
        method: 'POST',
      }),
      invalidatesTags: ['Leaderboard'],
    }),
  }),
});

export const {
  useGetLeaderboardQuery,
  useRebuildLeaderboardMutation,
} = leaderboardApi;
