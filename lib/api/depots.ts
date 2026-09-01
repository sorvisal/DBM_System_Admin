import { API_BASE, apiGet, apiPost, apiPut } from "./client";
import type {
  DepotDto,
  DepotCreateRequest,
  DepotUpdateRequest,
  DepotTransferDto,
  DepotTransferCreateRequest,
  DepotMemberAssignmentRequest,
} from "@/lib/types/depot";

export async function getDepots(orgId: number) {
  return apiGet<DepotDto[]>(`/organizations/${orgId}/depots`);
}

export async function getDepot(orgId: number, depotId: number) {
  return apiGet<DepotDto>(`/organizations/${orgId}/depots/${depotId}`);
}

export async function createDepot(orgId: number, data: DepotCreateRequest) {
  return apiPost<DepotDto>(`/organizations/${orgId}/depots`, data);
}

export async function updateDepot(orgId: number, depotId: number, data: DepotUpdateRequest) {
  return apiPut<DepotDto>(`/organizations/${orgId}/depots/${depotId}`, data);
}

export async function setDefaultDepot(orgId: number, depotId: number) {
  return apiPost<boolean>(`/organizations/${orgId}/depots/${depotId}/set-default`);
}

export async function deleteDepot(orgId: number, depotId: number) {
  return apiPost<boolean>(`/organizations/${orgId}/depots/${depotId}`);
}

export async function getDepotUsers(orgId: number, depotId: number) {
  return apiGet<Array<{ id: number; username: string; fullName: string; role: string; isOrganizationWide: boolean; isActive: boolean }>>(
    `/organizations/${orgId}/depots/${depotId}/users`
  );
}

export async function assignDepotMembers(orgId: number, depotId: number, data: DepotMemberAssignmentRequest) {
  return apiPost<boolean>(`/organizations/${orgId}/depots/${depotId}/members`, data);
}

export async function removeDepotMember(orgId: number, depotId: number, userId: number) {
  return apiPost<boolean>(`/organizations/${orgId}/depots/${depotId}/members/${userId}`);
}

export async function getCurrentDepot(orgId: number) {
  return apiGet<{ currentDepot: DepotDto | null; availableDepots: DepotDto[]; isOrganizationWide: boolean }>(
    `/organizations/${orgId}/depots/current`
  );
}

export async function getDepotTransfers(orgId: number, params?: { depotId?: number; page?: number; pageSize?: number }) {
  const qs = new URLSearchParams();
  if (params?.depotId) qs.set("depotId", String(params.depotId));
  if (params?.page) qs.set("page", String(params.page));
  if (params?.pageSize) qs.set("pageSize", String(params.pageSize));
  return apiGet<DepotTransferDto[]>(`/organizations/${orgId}/depot-transfers?${qs}`);
}

export async function createDepotTransfer(orgId: number, data: DepotTransferCreateRequest) {
  return apiPost<DepotTransferDto>(`/organizations/${orgId}/depot-transfers`, data);
}

export async function approveDepotTransfer(orgId: number, transferId: number) {
  return apiPost<DepotTransferDto>(`/organizations/${orgId}/depot-transfers/${transferId}/approve`);
}

export async function dispatchDepotTransfer(orgId: number, transferId: number) {
  return apiPost<DepotTransferDto>(`/organizations/${orgId}/depot-transfers/${transferId}/dispatch`);
}

export async function receiveDepotTransfer(orgId: number, transferId: number) {
  return apiPost<DepotTransferDto>(`/organizations/${orgId}/depot-transfers/${transferId}/receive`);
}

export async function cancelDepotTransfer(orgId: number, transferId: number) {
  return apiPost<DepotTransferDto>(`/organizations/${orgId}/depot-transfers/${transferId}/cancel`);
}
