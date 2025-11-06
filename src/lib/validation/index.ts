/**
 * 驗證 Schema 統一匯出點
 *
 * 架構說明：
 * - base/: 基礎驗證 Schema (StringSchemas, NumberSchemas, DateSchemas)
 * - domain/: 領域模型驗證 Schema (Inquiry, Product, FarmTour, Location, User...)
 * - api/: API 相關驗證 Schema (Upload, Pagination, Common...)
 * - utils.ts: 驗證工具函數
 */

// ============================================================================
// 基礎驗證 Schema
// ============================================================================

export { StringSchemas } from './base/string-schemas'
export { NumberSchemas } from './base/number-schemas'
export { DateSchemas } from './base/date-schemas'

// ============================================================================
// 領域模型驗證 Schema
// ============================================================================

export { InquirySchemas, InquiryStatsSchemas } from './domain/inquiry-schemas'
export { ProductSchemas, PublicProductSchemas, AdminProductSchemas } from './domain/product-schemas'
export {
  FarmTourSchemas,
  CultureSchemas,
  MomentSchemas,
  FarmTourActivitySchemas,
} from './domain/farm-tour-schemas'
export { LocationSchemas, ScheduleSchemas } from './domain/location-schemas'
export { UserSchemas, AdminSchemas } from './domain/user-schemas'

// ============================================================================
// API 相關驗證 Schema
// ============================================================================

export { UploadSchemas, ImageUploadSchemas } from './api/upload-schemas'
export {
  PaginationSchema,
  SortingSchema,
  ApiResponseSchema,
  createPaginatedQuerySchema,
} from './api/pagination-schemas'
export { CommonValidations, SearchSchemas } from './api/common-schemas'

// ============================================================================
// 驗證工具函數
// ============================================================================

export { validateData, validateRequestData, validateSearchParams, sanitizeHtml } from './utils'
