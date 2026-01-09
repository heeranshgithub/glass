// Auth Types - matches backend schemas/auth.py

export interface TokenResponse {
  accessToken: string;
  refreshToken: string;
  tokenType: string;
  expiresIn: number;
}

export interface TokenRefreshRequest {
  refreshToken: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  fullName: string;
  username?: string;
}

export interface PasswordChangeRequest {
  currentPassword: string;
  newPassword: string;
}

export interface LogoutRequest {
  refreshToken?: string;
}

export interface AuthStatusResponse {
  authenticated: boolean;
  userId?: string;
  email?: string;
  fullName?: string;
  roles: string[];
}
