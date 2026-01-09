// User Types - matches backend schemas/user.py

export interface UserResponse {
  id: string;
  email: string;
  fullName: string;
  username?: string;
  roles: string[];
  isActive: boolean;
  isVerified: boolean;
  createdAt: string;
  updatedAt: string;
  hasOpenRouterKey: boolean;
}

export interface UserProfileResponse extends UserResponse {
  lastLogin?: string;
}

export interface UserUpdate {
  fullName?: string;
  username?: string;
}

export interface UserListResponse {
  users: UserResponse[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface UserListQuery {
  page?: number;
  pageSize?: number;
  search?: string;
  role?: string;
  isActive?: boolean;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}
