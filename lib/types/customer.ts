export interface CustomerDto {
  id: number;
  name: string | null;
  phone: string | null;
  address: string | null;
  status: string | null;
  balance: number;
  createdAt: string;
  photoPath: string | null;
  description: string | null;
  customerTypeId: number | null;
  customerTypeName: string | null;
}

export interface CustomerStatsDto {
  orderCount: number;
  balance: number;
  totalSpent: number;
}

export interface CustomerDetailDto {
  customer: CustomerDto;
  stats: CustomerStatsDto;
}

export interface CustomerRequest {
  name: string | null;
  phone: string | null;
  address: string | null;
  status: string | null;
  customerTypeId: number | null;
  photo: string | null;
  description: string | null;
}

export interface CustomerTypeDto {
  id: number;
  name: string | null;
  description: string | null;
}

export interface CustomerTypeRequest {
  name: string | null;
  description: string | null;
}
