export interface SupplierDto {
  id: number;
  name: string | null;
  contactPerson: string | null;
  phone: string | null;
  address: string | null;
  photoPath: string | null;
  description: string | null;
}

export interface SupplierRequest {
  name: string | null;
  contactPerson: string | null;
  phone: string | null;
  address: string | null;
  photoPath: string | null;
  photo: string | null;
}

export interface SupplierUpdateRequest {
  name: string | null;
  contactPerson: string | null;
  phone: string | null;
  address: string | null;
}
