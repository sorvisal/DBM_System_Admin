export interface DepotDto {
  id: number;
  organizationId: number;
  name: string;
  code: string;
  address?: string | null;
  phone?: string | null;
  description?: string | null;
  isActive: boolean;
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface DepotCreateRequest {
  name: string;
  code: string;
  address?: string | null;
  phone?: string | null;
  description?: string | null;
}

export interface DepotUpdateRequest {
  name?: string;
  code?: string;
  address?: string | null;
  phone?: string | null;
  description?: string | null;
  isActive?: boolean;
}

export interface DepotTransferDto {
  id: number;
  organizationId: number;
  fromDepotId: number;
  fromDepotName: string;
  toDepotId: number;
  toDepotName: string;
  status: string;
  note?: string | null;
  approvedAt?: string | null;
  receivedAt?: string | null;
  createdAt: string;
  lines: DepotTransferLineDto[];
}

export interface DepotTransferLineDto {
  id: number;
  productId: number;
  productName: string;
  quantity: number;
  stockBatchId?: number | null;
}

export interface DepotTransferCreateRequest {
  fromDepotId: number;
  toDepotId: number;
  note?: string | null;
  lines: Array<{ productId: number; quantity: number; stockBatchId?: number | null }>;
}

export interface DepotMemberAssignmentRequest {
  userId: number;
  depotIds: number[];
}
