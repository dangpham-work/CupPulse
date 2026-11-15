/** Hợp đồng dữ liệu xác thực (SRS FR-09 → FR-11). */
export type Role = 'CUSTOMER' | 'STAFF' | 'MANAGER';

export interface PublicUser {
  id: string;
  email: string;
  fullName: string;
  role: Role;
}

export interface RegisterInput {
  email: string;
  password: string;
  fullName: string;
  phone?: string;
}

export interface LoginInput {
  email: string;
  password: string;
}

export interface LoginResult {
  accessToken: string;
  /** Giây. */
  expiresIn: number;
  user: PublicUser;
}
