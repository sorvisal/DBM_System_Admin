import type {
  AdminSummaryDto,
  CreateAdminRequest,
  CreateDepotRequest,
  DepotStatsDto,
  DepotSummaryDto,
  GlobalStatsByOrgDto,
  SuperAdminDashboardStats,
  UpdateAdminRequest,
  UpdateDepotRequest,
} from "@/lib/types";
import { apiDelete, apiGet, apiPost, apiPut, qs } from "./client";

// ── Dashboard ─────────────────────────────────────────────────────────────────

export function getSuperAdminDashboard() {
  return apiGet<SuperAdminDashboardStats>("/superadmin/dashboard");
}

export function getSuperAdminDashboardByOrg() {
  return apiGet<GlobalStatsByOrgDto[]>("/superadmin/dashboard/by-org");
}

// ── Admins ────────────────────────────────────────────────────────────────────

export function listSuperAdmins(params: {
  page?: number;
  pageSize?: number;
  search?: string;
  role?: string;
  active?: string;
  orgId?: number;
}) {
  return apiGet<AdminSummaryDto[]>(
    "/superadmin/admins" +
      qs({
        page: params.page ?? 1,
        pageSize: params.pageSize ?? 20,
        search: params.search,
        role: params.role,
        active: params.active,
        orgId: params.orgId,
      }),
  );
}

export function getSuperAdmin(id: number) {
  return apiGet<{ admin: AdminSummaryDto; depots: any[] }>(`/superadmin/admins/${id}`);
}

export function createSuperAdmin(body: CreateAdminRequest) {
  return apiPost<any>("/superadmin/admins", body);
}

export function updateSuperAdmin(id: number, body: UpdateAdminRequest) {
  return apiPut<any>(`/superadmin/admins/${id}`, body);
}

export function toggleSuperAdmin(id: number) {
  return apiPost<boolean>(`/superadmin/admins/${id}/toggle`);
}

export function resetSuperAdminPassword(id: number, newPassword: string) {
  return apiPost<boolean>(`/superadmin/admins/${id}/password`, { newPassword });
}

export function deleteSuperAdmin(id: number) {
  return apiDelete<boolean>(`/superadmin/admins/${id}`);
}

export function assignDepotsToAdmin(adminId: number, depotIds: number[]) {
  return apiPost<boolean>(`/superadmin/admins/${adminId}/depots`, { depotIds });
}

export function removeDepotFromAdmin(adminId: number, depotId: number) {
  return apiDelete<boolean>(`/superadmin/admins/${adminId}/depots/${depotId}`);
}

// ── Depots ────────────────────────────────────────────────────────────────────

export function listSuperDepots(params: {
  page?: number;
  pageSize?: number;
  search?: string;
  isActive?: string;
  orgId?: number;
}) {
  return apiGet<DepotSummaryDto[]>(
    "/superadmin/depots" +
      qs({
        page: params.page ?? 1,
        pageSize: params.pageSize ?? 20,
        search: params.search,
        isActive: params.isActive,
        orgId: params.orgId,
      }),
  );
}

export function getSuperDepotStats() {
  return apiGet<DepotStatsDto[]>("/superadmin/depots/stats");
}

export function getSuperDepot(id: number) {
  return apiGet<any>(`/superadmin/depots/${id}`);
}

export function createSuperDepot(body: CreateDepotRequest) {
  return apiPost<any>("/superadmin/depots", body);
}

export function updateSuperDepot(id: number, body: UpdateDepotRequest) {
  return apiPut<any>(`/superadmin/depots/${id}`, body);
}

export function toggleSuperDepot(id: number) {
  return apiPost<boolean>(`/superadmin/depots/${id}/toggle`);
}

export function deleteSuperDepot(id: number) {
  return apiDelete<boolean>(`/superadmin/depots/${id}`);
}

// ── Audit Logs ────────────────────────────────────────────────────────────────

export function listAuditLogs(params: {
  page?: number;
  pageSize?: number;
  entityType?: string;
  entityId?: number;
  userId?: number;
  from?: string;
  to?: string;
}) {
  return apiGet<any>(
    "/superadmin/audit-logs" +
      qs({
        page: params.page ?? 1,
        pageSize: params.pageSize ?? 20,
        entityType: params.entityType,
        entityId: params.entityId,
        userId: params.userId,
        from: params.from,
        to: params.to,
      }),
  );
}

// ── Organizations ─────────────────────────────────────────────────────────────

export function listAllOrganizations() {
  return apiGet<any>("/superadmin/organizations");
}
