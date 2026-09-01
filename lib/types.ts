/**
 * Legacy re-exports. New code should import from @/lib/types/{auth,user,...}.
 */
export type {
  ApiMeta,
  ApiResponse,
  PagedQuery,
  RevenuePointDto,
  RevenueReportDto,
  ReceivableDto,
} from "./types/common";

export type {
  UserDto,
  AuthResponse,
  LoginRequest,
  RegisterRequest,
  RefreshRequest,
  UpdateProfileRequest,
  ChangePasswordRequest,
  GoogleLinkRequest,
} from "./types/auth";
export { ADMIN_ROLES, STAFF_LIMITED_ROLES, isAdminRole, isSuperAdmin, canAccessAdmin } from "./types/auth";

export type {
  OrganizationDto,
  OrganizationCreateRequest,
  OrganizationUpdateRequest,
} from "./types/organization";

export type {
  AdminUserDto,
  AdminCreateUserRequest,
  AdminUpdateUserRequest,
  AdminResetPasswordRequest,
  UserRole,
} from "./types/user";
export { ROLE_CAN_CREATE } from "./types/user";

export type { CategoryDto, CategoryRequest } from "./types/category";

export type {
  ProductDto,
  ProductUpsertRequest,
  ProductSummaryDto,
  UploadResultDto,
} from "./types/product";

export type {
  CustomerDto,
  CustomerStatsDto,
  CustomerDetailDto,
  CustomerRequest,
  CustomerTypeDto,
  CustomerTypeRequest,
} from "./types/customer";

export type {
  SupplierDto,
  SupplierRequest,
  SupplierUpdateRequest,
} from "./types/supplier";

export type {
  OrderLineDto,
  OrderDto,
  OrderCreateLine,
  OrderCreateRequest,
  OrderUpdateRequest,
  OrderStatusRequest,
  AssignDriverRequest,
  PaymentRequest,
  OrderStatusChangedPayload,
} from "./types/order";
export { OrderStatus } from "./types/order";
export { ORDER_STATUS_META } from "./types/statusEnums";

export type {
  PurchaseLineDto,
  PurchaseOrderDto,
  PurchaseCreateLine,
  PurchaseCreateRequest,
  PurchaseStatusRequest,
  PurchasePaymentRequest,
  StockBatchDto,
  StockBatchSummaryDto,
} from "./types/purchaseOrder";
export { PurchaseOrderStatus } from "./types/purchaseOrder";
export { PO_STATUS_META } from "./types/statusEnums";

export type { StockMovementDto, StockAdjustRequest } from "./types/stockMovement";
export type { FinancialTransactionDto, FinancialSummaryDto, FinancialQueryParams } from "./types/financialTransaction";

export type { NotificationDto, LowStockAlertPayload } from "./types/notification";
