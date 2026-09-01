/**
 * Legacy compatibility re-exports. New code should import from
 * @/lib/api/{auth,products,customers,...} or @/lib/types directly.
 */
export {
  API_BASE,
  API_ORIGIN,
  SWAGGER_URL,
  getTokens,
  setTokens,
  clearTokens,
  setStoredUser,
  uploadsUrl,
  fileToBase64,
} from "./api/client";
export {
  login,
  register,
  logout,
  getMe,
  googleLoginUrl,
} from "./api/auth";
export {
  getProductSummary,
} from "./api/products";
export { getCustomerCount } from "./api/customers";
export { getOrderCount } from "./api/orders";
export { listStockMovements } from "./api/stockMovements";
export {
  getRevenue,
  getRevenueChart,
  getReceivables,
} from "./api/reports";
