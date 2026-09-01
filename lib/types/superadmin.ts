export interface SuperAdminDashboardStats {
  totalAdmins: number;
  activeAdmins: number;
  totalDepots: number;
  activeDepots: number;
  totalCustomers: number;
  totalProducts: number;
  totalInventory: number;
  lowStockProducts: number;
  expiredBatches: number;
  totalPurchaseOrders: number;
  totalCustomerOrders: number;
  pendingOrders: number;
  completedOrders: number;
  totalRevenue: number;
  pendingPayments: number;
  completedPayments: number;
}

export interface GlobalStatsByOrgDto {
  organizationId: number;
  organizationName: string | null;
  organizationSlug: string | null;
  adminCount: number;
  activeDepotCount: number;
  customerCount: number;
  pendingOrders: number;
  revenue: number;
}

export interface AdminSummaryDto {
  id: number;
  username: string;
  fullName: string;
  email?: string | null;
  phone?: string | null;
  role: string;
  isActive: boolean;
  organizationId: number;
  createdAt: string;
  lastLoginAt?: string | null;
}

export interface DepotAssignmentDto {
  depotId: number;
  depotName: string;
  depotCode: string;
  organizationId: number;
  isActive: boolean;
}

export interface DepotSummaryDto {
  id: number;
  name: string;
  code: string;
  organizationId: number;
  organizationName: string;
  isActive: boolean;
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface DepotStatsDto {
  id: number;
  name: string;
  code: string;
  organizationName: string;
  organizationSlug: string;
  isActive: boolean;
  isDefault: boolean;
  memberCount: number;
  orderCount: number;
  batchCount: number;
}

export interface CreateAdminRequest {
  username: string;
  fullName: string;
  email?: string | null;
  phone?: string | null;
  role: string;
  depotId?: number | null;
  organizationId?: number | null;
}

export interface UpdateAdminRequest {
  fullName?: string | null;
  email?: string | null;
  phone?: string | null;
  role?: string | null;
  isActive?: boolean | null;
}

export interface AssignDepotsRequest {
  depotIds: number[];
}

export interface CreateDepotRequest {
  name: string;
  code: string;
  address?: string | null;
  phone?: string | null;
  description?: string | null;
  organizationId: number;
}

export interface UpdateDepotRequest {
  name?: string | null;
  code?: string | null;
  address?: string | null;
  phone?: string | null;
  description?: string | null;
  isActive?: boolean | null;
}

export interface AuditLogDto {
  id: number;
  organizationId?: number | null;
  userId?: number | null;
  platformUserId?: string | null;
  entityType: string;
  entityId: number;
  action: string;
  oldValues?: string | null;
  newValues?: string | null;
  ipAddress?: string | null;
  userAgent?: string | null;
  createdAt: string;
}
