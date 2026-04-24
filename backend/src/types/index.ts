export enum UserRole {
  RECRUIT = 'recruit',
  MENTOR = 'mentor',
  COMMANDER = 'commander',
  PSYCHOLOGIST = 'psychologist',
  ADMIN = 'admin',
  SUPERADMIN = 'superadmin',
}

export enum AccessLevel {
  PUBLIC = 'public',
  RECRUIT = 'recruit',
  MENTOR = 'mentor',
  COMMANDER = 'commander',
  PSYCHOLOGIST = 'psychologist',
  ADMIN = 'admin',
}

export interface JWTPayload {
  userId: string;
  email: string;
  role: UserRole;
  unitId?: string;
  iat?: number;
  exp?: number;
}

export interface PaginationParams {
  page: number;
  limit: number;
  sort?: string;
  order?: 'ASC' | 'DESC';
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  timestamp: Date;
}

export interface SyncData {
  id: string;
  userId: string;
  data: any;
  version: number;
  syncedAt: Date;
  createdAt: Date;
  updatedAt: Date;
}
