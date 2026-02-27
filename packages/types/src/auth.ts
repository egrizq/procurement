import type { UserType, Department, UserStatus } from './common.js';

export interface User {
  id: number;
  username: string;
  email: string;
  fullName: string;
  type: UserType;
  department: Department;
  vesselId?: number | null;
  position?: string | null;
  status?: UserStatus | null;
  leaveDate?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface RegisterRequest {
  username: string;
  email: string;
  password: string;
  fullName: string;
  type: UserType;
  department: Department;
  vesselId?: number;
  position?: string;
  status?: UserStatus;
  leaveDate?: Date;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  user: Omit<User, 'password'>;
  token: string;
}
