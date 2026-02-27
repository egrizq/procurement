// Common types used across the application

export interface ApiResponse<T = unknown> {
  success: boolean;
  message?: string;
  data?: T;
  error?: string;
  errors?: Record<string, string[]> | null;
}

export interface PaginationMeta {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  itemsPerPage: number;
}

export interface PaginatedResponse<T> extends ApiResponse<T> {
  pagination?: PaginationMeta;
}

export interface RequestQuery {
  page?: number;
  limit?: number;
  search?: string;
}

export type UserType = 'Admin' | 'Office' | 'Crew';
export type Department = 'IT' | 'HR' | 'Finance' | 'Deck' | 'Engine';
export type UserStatus = 'Contract' | 'Permanent' | 'Intern' | 'Leave';
export type RequestStatus = 'Waiting' | 'Approved' | 'Rejected';
export type Priority = 'Low' | 'Medium' | 'High';
export type Unit = 'Pcs' | 'Box' | 'Liter' | 'Meter' | 'Kg';
