/**
 * Leaderboard-related types
 */

export interface ModelLeaderboardEntry {
  model: string;
  totalScore: number;
  avgScore: number;
  appearances: number;
  rank: number;
  category?: string | null;
}

export interface LeaderboardResponse {
  overall: ModelLeaderboardEntry[];
  byCategory: Record<string, ModelLeaderboardEntry[]>;
  categories: string[];
}
