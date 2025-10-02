/**
 * API Client 共用型別定義
 *
 * 此檔案重新匯出專案標準的 API 回應型別，
 * 供客戶端 API client 層使用，確保型別一致性
 */

// 從標準 API 回應模組匯出核心型別
export type {
  ApiResponse,
  ResponseMeta,
  PaginationParams,
  PaginatedResult,
} from '@/lib/api-response'
