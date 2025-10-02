/**
 * Validation Schemas 統一匯出點
 *
 * 提供所有驗證 schema 的集中匯入位置
 */

// 基礎 Schema
export { StringSchemas, NumberSchemas, DateSchemas } from './base'

// 詢問單相關
export { InquirySchemas, InquiryStatsSchemas } from './inquiry'

// 產品相關
export { ProductSchemas, PublicProductSchemas, AdminProductSchemas } from './product'

// 農場導覽與體驗活動
export {
  FarmTourSchemas,
  CultureSchemas,
  MomentSchemas,
  FarmTourActivitySchemas,
} from './farm-tour'

// 使用者與管理員
export { UserSchemas, AdminSchemas } from './user'

// 地點與行程
export { LocationSchemas, ScheduleSchemas } from './location'

// 通用功能
export {
  UploadSchemas,
  ImageUploadSchemas,
  CommonValidations,
  SearchSchemas,
  PaginationSchema,
  SortingSchema,
  ApiResponseSchema,
} from './common'

// 工具函數 (從 base.ts 匯出)
export {
  validateData,
  validateRequestData,
  validateSearchParams,
  sanitizeHtml,
  createPaginatedQuerySchema,
} from './base'
