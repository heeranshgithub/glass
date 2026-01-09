// Common Types - matches backend schemas/common.py

export interface SuccessResponse {
  message: string;
  data?: Record<string, unknown>;
}

export interface ErrorResponse {
  detail: string;
  code?: string;
  field?: string;
}

export interface PaginationParams {
  page?: number;
  pageSize?: number;
}
