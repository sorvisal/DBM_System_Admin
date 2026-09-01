import type {
  AdminCreateUserRequest,
  AdminResetPasswordRequest,
  AdminUpdateUserRequest,
  AdminUserDto,
} from "@/lib/types";
import { apiDelete, apiGet, apiPost, apiPut, qs } from "./client";

export function listUsers(params: {
  page?: number;
  pageSize?: number;
  search?: string;
  role?: string;
  active?: string;
}) {
  return apiGet<AdminUserDto[]>(
    "/users" +
      qs({
        page: params.page ?? 1,
        pageSize: params.pageSize ?? 20,
        search: params.search,
        role: params.role,
        active: params.active,
      }),
  );
}

export function getUserCount(params?: { search?: string; role?: string; active?: string }) {
  return apiGet<number>(
    "/users/count" + qs({ search: params?.search, role: params?.role, active: params?.active }),
  );
}

export function getUser(id: number) {
  return apiGet<AdminUserDto>(`/users/${id}`);
}

export function createUser(body: AdminCreateUserRequest) {
  return apiPost<AdminUserDto>("/users", body);
}

export function updateUser(id: number, body: AdminUpdateUserRequest) {
  return apiPut<AdminUserDto>(`/users/${id}`, body);
}

export function resetUserPassword(id: number, body: AdminResetPasswordRequest) {
  return apiPut<boolean>(`/users/${id}/password`, body);
}

export function deleteUser(id: number) {
  return apiDelete<boolean>(`/users/${id}`);
}
