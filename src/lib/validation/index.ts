/**
 * 驗證 Schema 統一匯出點
 *
 * 架構說明：
 * - base/: 基礎驗證 Schema (StringSchemas, NumberSchemas, DateSchemas)
 * - domain/: 領域模型驗證 Schema (Inquiry, Product, FarmTour...)
 * - api/: API 相關驗證 Schema (Upload, Pagination...)
 *
 * 向後相容性：
 * - 保留了原始 validation-schemas.ts 中較少使用的 Schema 的匯出
 * - 未來可以逐步遷移到模組化結構
 */

// ============================================================================
// 基礎驗證 Schema（已模組化）
// ============================================================================

export { StringSchemas } from './base/string-schemas'
export { NumberSchemas } from './base/number-schemas'
export { DateSchemas } from './base/date-schemas'

// ============================================================================
// 領域模型驗證 Schema（已模組化）
// ============================================================================

export { InquirySchemas, InquiryStatsSchemas } from './domain/inquiry-schemas'
export { ProductSchemas } from './domain/product-schemas'
export { FarmTourSchemas } from './domain/farm-tour-schemas'

// ============================================================================
// API 相關驗證 Schema（已模組化）
// ============================================================================

export { UploadSchemas } from './api/upload-schemas'
export {
  PaginationSchema,
  SortingSchema,
  ApiResponseSchema,
  createPaginatedQuerySchema,
} from './api/pagination-schemas'

// ============================================================================
// 驗證工具函數（從原始檔案重新匯出）
// ============================================================================

export {
  validateData,
  validateRequestData,
  validateSearchParams,
  CommonValidations,
} from '../validation-schemas'

// ============================================================================
// 其他 Schema（暫時從原始檔案重新匯出，未來可逐步遷移）
// ============================================================================

export {
  UserSchemas,
  AdminSchemas,
  LocationSchemas,
  ScheduleSchemas,
  PublicProductSchemas,
  AdminProductSchemas,
  ImageUploadSchemas,
  CultureSchemas,
  MomentSchemas,
  FarmTourActivitySchemas,
  SearchSchemas,
} from '../validation-schemas'
