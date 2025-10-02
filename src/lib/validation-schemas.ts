/**
 * Zod 驗證 Schema 庫
 *
 * 提供統一的輸入驗證 schema，用於 API 路由和表單驗證
 * 包含常用的驗證規則和自定義驗證器
 *
 * @deprecated 此檔案已被拆分為多個模組以提升可維護性
 * 建議從 '@/lib/validation-schemas/[module]' 直接匯入需要的 schema
 * 例如: import { InquirySchemas } from '@/lib/validation-schemas/inquiry'
 *
 * 為保持向後相容，此檔案將繼續 re-export 所有 schema
 */

// 基礎 Schema
export {
  StringSchemas,
  NumberSchemas,
  DateSchemas,
  PaginationSchema,
  SortingSchema,
  ApiResponseSchema,
  createPaginatedQuerySchema,
  validateData,
  validateRequestData,
  validateSearchParams,
  sanitizeHtml,
} from './validation-schemas/base'

// 詢問單相關
export { InquirySchemas, InquiryStatsSchemas } from './validation-schemas/inquiry'

// 產品相關
export {
  ProductSchemas,
  PublicProductSchemas,
  AdminProductSchemas,
} from './validation-schemas/product'

// 農場導覽與體驗活動
export {
  FarmTourSchemas,
  CultureSchemas,
  MomentSchemas,
  FarmTourActivitySchemas,
} from './validation-schemas/farm-tour'

// 使用者與管理員
export { UserSchemas, AdminSchemas } from './validation-schemas/user'

// 地點與行程
export { LocationSchemas, ScheduleSchemas } from './validation-schemas/location'

// 通用功能
export {
  UploadSchemas,
  ImageUploadSchemas,
  CommonValidations,
  SearchSchemas,
} from './validation-schemas/common'
