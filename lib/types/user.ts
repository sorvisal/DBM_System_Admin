/**
 * Mirrors the backend role constants from `AuthPolicy.cs`.
 * Only superadmin can create superadmin or admin users.
 */
export type UserRole = "superadmin" | "admin" | "staff" | "user";

export interface AdminUserDto {
  id: number;
  username: string;
  fullName: string;
  email?: string | null;
  phone?: string | null;
  storeName?: string | null;
  role: UserRole;
  isActive: boolean;
  isGoogleLinked: boolean;
  createdAt: string;
  photoPath?: string | null;
  description?: string | null;
}

export interface AdminCreateUserRequest {
  username: string;
  password: string;
  fullName: string;
  email?: string | null;
  phone?: string | null;
  storeName?: string | null;
  role: UserRole;
  photo?: string | null;
  description?: string | null;
}

export interface AdminUpdateUserRequest {
  fullName?: string | null;
  email?: string | null;
  phone?: string | null;
  storeName?: string | null;
  role?: UserRole | null;
  isActive?: boolean | null;
  photo?: string | null;
  description?: string | null;
}

export interface AdminResetPasswordRequest {
  newPassword: string;
}

/** Roles that may create other roles, per backend AuthPolicy. */
export const ROLE_CAN_CREATE: Readonly<Record<UserRole, UserRole[]>> = {
  superadmin: ["superadmin", "admin", "staff", "user"],
  admin: ["staff", "user"],
  staff: ["user"],
  user: [],
};
