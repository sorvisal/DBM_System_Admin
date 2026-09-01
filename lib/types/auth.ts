export interface UserDto {
  id: number;
  username: string;
  fullName: string;
  phone?: string | null;
  storeName?: string | null;
  role: string;
  isGoogleLinked: boolean;
  photoPath?: string | null;
}

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  accessTokenExpiresAt: string;
  user: UserDto;
}

export interface LoginRequest {
  usernameOrEmail: string;
  password: string;
}

export interface RegisterRequest {
  username: string;
  password: string;
  fullName: string;
  email?: string | null;
  phone?: string | null;
  storeName?: string | null;
}

export interface RefreshRequest {
  refreshToken: string;
}

export interface UpdateProfileRequest {
  fullName: string;
  phone?: string | null;
  storeName?: string | null;
  photo?: string | null;
}

export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

export interface GoogleLinkRequest {
  idToken: string | null;
  token: string | null;
}

export const ADMIN_ROLES = ["superadmin", "admin", "staff"] as const;
export const STAFF_LIMITED_ROLES = ["staff"] as const;

export function isAdminRole(role?: string | null): boolean {
  return role === "superadmin" || role === "admin";
}

export function isSuperAdmin(role?: string | null): boolean {
  return role === "superadmin";
}

export function canAccessAdmin(role?: string | null): boolean {
  return role === "superadmin" || role === "admin" || role === "staff";
}
