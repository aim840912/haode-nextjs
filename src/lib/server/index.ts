/**
 * Server Actions 基礎設施統一導出
 *
 * 提供所有 Server-only 工具的統一入口:
 * - 認證工具 (auth, requireAuth, requireAdmin)
 * - 回應格式 (success, error, validationError)
 * - 速率限制 (checkRateLimit, withRateLimit)
 * - 審計日誌 (logAudit, logCreate, logUpdate, logDelete)
 */

// 認證工具
export { auth, requireAuth, requireAdmin, isAuthenticated, isAdmin, type ServerUser } from './auth'

// 回應格式
export {
  success,
  error,
  validationError,
  unauthorized,
  forbidden,
  successWithPagination,
  withActionErrorHandler,
  ActionResponseBuilder,
  type ActionResponse,
  type ActionSuccess,
  type ActionError,
  type ActionValidationError,
  type PaginatedData,
} from './action-response'

// 速率限制
export {
  checkRateLimit,
  getRemainingRequests,
  resetRateLimit,
  withRateLimit,
  defaultRateLimits,
  type RateLimitConfig,
} from './rate-limit'

// 審計日誌
export {
  logAudit,
  logCreate,
  logUpdate,
  logDelete,
  logStatusChange,
  withAuditLog,
  type ServerAuditLogParams,
} from './audit-log'
