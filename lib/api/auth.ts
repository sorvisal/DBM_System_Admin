import type {
  AuthResponse,
  LoginRequest,
  RegisterRequest,
  UserDto,
  UpdateProfileRequest,
  ChangePasswordRequest,
  GoogleLinkRequest,
} from "@/lib/types";
import { canAccessAdmin } from "@/lib/types";
import { apiGet, apiPost, apiPut, ApiError, clearTokens, setStoredUser, API_BASE } from "./client";

function assertAdminAccess(data: AuthResponse): AuthResponse {
  if (!canAccessAdmin(data.user?.role)) {
    throw new ApiError("This account is not allowed to access the admin dashboard.", 403);
  }
  return data;
}

export async function login(credentials: LoginRequest): Promise<AuthResponse> {
  const json = await apiPost<AuthResponse>("/auth/login", credentials);
  if (!json.success || !json.data) throw new ApiError(json.error || "Login failed");
  return assertAdminAccess(json.data);
}

export async function register(body: RegisterRequest): Promise<AuthResponse> {
  const json = await apiPost<AuthResponse>("/auth/register", body);
  if (!json.success || !json.data) throw new ApiError(json.error || "Registration failed");
  return assertAdminAccess(json.data);
}

export function googleLoginUrl(redirect?: string): string {
  const origin = typeof window !== "undefined" ? window.location.origin : "";
  const params = new URLSearchParams({
    client: "admin-web",
    redirect: redirect || origin,
  });
  return API_BASE + "/auth/google-login?" + params.toString();
}

export async function logout() {
  try {
    await apiPost("/auth/logout");
  } catch {
    // ignore network/auth errors on logout
  }
  clearTokens();
  setStoredUser(null);
}

export async function getMe() {
  return apiGet<UserDto>("/auth/me");
}

export async function updateMe(body: UpdateProfileRequest) {
  return apiPut<UserDto>("/auth/me", body);
}

export async function changePassword(body: ChangePasswordRequest) {
  return apiPut<boolean>("/auth/me/password", {
    currentPassword: body.currentPassword,
    newPassword: body.newPassword,
  });
}

export async function linkGoogle(body: GoogleLinkRequest) {
  return apiPost<UserDto>("/auth/google/link", body);
}

export async function unlinkGoogle() {
  return apiPost<UserDto>("/auth/google/unlink");
}
