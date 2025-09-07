/**
 * 統一服務介面定義
 * 
 * 提供標準化的 CRUD 操作介面：
 * - 統一的方法命名慣例
 * - 一致的回傳類型
 * - 標準化的錯誤處理
 * - 支援泛型和 DTO 模式
 */

/**
 * 分頁結果介面
 */
export interface PaginatedResult<T> {
  items: T[]
  total: number
  page: number
  limit: number
  totalPages: number
  hasNext: boolean
  hasPrev: boolean
}

/**
 * 查詢選項介面
 */
export interface QueryOptions {
  /** 排序欄位 */
  sortBy?: string
  /** 排序方向 */
  sortOrder?: 'asc' | 'desc'
  /** 過濾條件 */
  filters?: Record<string, unknown>
  /** 包含的關聯資料 */
  includes?: string[]
}

/**
 * 分頁查詢選項
 */
export interface PaginatedQueryOptions extends QueryOptions {
  page?: number
  limit?: number
}

/**
 * 基礎服務介面
 * 
 * 所有服務都應實作此介面，確保 API 的一致性
 * 
 * @template T 實體類型
 * @template CreateDTO 建立實體時的 DTO 類型
 * @template UpdateDTO 更新實體時的 DTO 類型
 */
export interface BaseService<T, CreateDTO = Partial<T>, UpdateDTO = Partial<T>> {
  /**
   * 取得所有實體
   * @param options 查詢選項
   * @returns 實體陣列
   */
  findAll(options?: QueryOptions): Promise<T[]>

  /**
   * 根據 ID 取得實體
   * @param id 實體 ID
   * @returns 實體或 null（如果不存在）
   */
  findById(id: string): Promise<T | null>

  /**
   * 建立新實體
   * @param data 建立資料
   * @returns 建立的實體
   */
  create(data: CreateDTO): Promise<T>

  /**
   * 更新實體
   * @param id 實體 ID
   * @param data 更新資料
   * @returns 更新後的實體
   */
  update(id: string, data: UpdateDTO): Promise<T>

  /**
   * 刪除實體
   * @param id 實體 ID
   * @returns void
   */
  delete(id: string): Promise<void>

  /**
   * 檢查實體是否存在
   * @param id 實體 ID
   * @returns 是否存在
   */
  exists?(id: string): Promise<boolean>
}

/**
 * 分頁服務介面
 * 
 * 支援分頁查詢的服務應實作此介面
 */
export interface PaginatedService<T, CreateDTO = Partial<T>, UpdateDTO = Partial<T>> extends BaseService<T, CreateDTO, UpdateDTO> {
  /**
   * 分頁查詢實體
   * @param options 分頁查詢選項
   * @returns 分頁結果
   */
  findAllPaginated(options?: PaginatedQueryOptions): Promise<PaginatedResult<T>>
}

/**
 * 可搜尋服務介面
 * 
 * 支援全文搜尋的服務應實作此介面
 */
export interface SearchableService<T, CreateDTO = Partial<T>, UpdateDTO = Partial<T>> extends BaseService<T, CreateDTO, UpdateDTO> {
  /**
   * 全文搜尋實體
   * @param query 搜尋關鍵字
   * @param options 查詢選項
   * @returns 符合搜尋條件的實體陣列
   */
  search(query: string, options?: QueryOptions): Promise<T[]>

  /**
   * 分頁搜尋實體
   * @param query 搜尋關鍵字
   * @param options 分頁查詢選項
   * @returns 分頁搜尋結果
   */
  searchPaginated?(query: string, options?: PaginatedQueryOptions): Promise<PaginatedResult<T>>
}

/**
 * 可批次操作服務介面
 * 
 * 支援批次操作的服務應實作此介面
 */
export interface BatchService<T, CreateDTO = Partial<T>, UpdateDTO = Partial<T>> extends BaseService<T, CreateDTO, UpdateDTO> {
  /**
   * 批次建立實體
   * @param dataList 建立資料陣列
   * @returns 建立的實體陣列
   */
  createMany(dataList: CreateDTO[]): Promise<T[]>

  /**
   * 批次更新實體
   * @param updates 更新資料陣列，包含 id 和 data
   * @returns 更新後的實體陣列
   */
  updateMany(updates: Array<{ id: string; data: UpdateDTO }>): Promise<T[]>

  /**
   * 批次刪除實體
   * @param ids 實體 ID 陣列
   * @returns void
   */
  deleteMany(ids: string[]): Promise<void>
}

/**
 * 服務配置介面
 */
export interface ServiceConfig {
  /** 是否啟用快取 */
  enableCache?: boolean
  /** 快取 TTL（秒） */
  cacheTTL?: number
  /** 是否啟用審計日誌 */
  enableAuditLog?: boolean
  /** 預設分頁大小 */
  defaultPageSize?: number
  /** 最大分頁大小 */
  maxPageSize?: number
}

/**
 * 服務中繼資料介面
 */
export interface ServiceMetadata {
  /** 服務名稱 */
  name: string
  /** 服務版本 */
  version?: string
  /** 服務描述 */
  description?: string
  /** 支援的功能特性 */
  features?: string[]
}

/**
 * 增強的基礎服務介面
 * 
 * 包含配置和中繼資料支援的完整服務介面
 */
export interface EnhancedBaseService<T, CreateDTO = Partial<T>, UpdateDTO = Partial<T>> 
  extends BaseService<T, CreateDTO, UpdateDTO> {
  /** 服務配置 */
  readonly config: ServiceConfig
  
  /** 服務中繼資料 */
  readonly metadata: ServiceMetadata
  
  /**
   * 取得服務健康狀態
   * @returns 健康狀態資訊
   */
  getHealthStatus?(): Promise<{
    status: 'healthy' | 'degraded' | 'unhealthy'
    timestamp: string
    details?: Record<string, unknown>
  }>

  /**
   * 清除服務快取
   * @returns void
   */
  clearCache?(): Promise<void>
}

/**
 * 服務工廠介面
 * 
 * 用於建立和管理服務實例
 */
export interface ServiceFactory {
  /**
   * 建立服務實例
   * @param serviceName 服務名稱
   * @param config 服務配置
   * @returns 服務實例
   */
  createService<T>(serviceName: string, config?: ServiceConfig): Promise<BaseService<T>>

  /**
   * 取得服務實例（單例模式）
   * @param serviceName 服務名稱
   * @returns 服務實例
   */
  getService<T>(serviceName: string): Promise<BaseService<T> | null>

  /**
   * 註冊服務建構器
   * @param serviceName 服務名稱
   * @param constructor 服務建構器
   */
  registerService<T>(
    serviceName: string, 
    constructor: new (config?: ServiceConfig) => BaseService<T>
  ): void
}

/**
 * 服務錯誤類型
 */
export enum ServiceErrorType {
  NOT_FOUND = 'SERVICE_NOT_FOUND',
  VALIDATION_ERROR = 'SERVICE_VALIDATION_ERROR',
  DUPLICATE_ERROR = 'SERVICE_DUPLICATE_ERROR',
  PERMISSION_DENIED = 'SERVICE_PERMISSION_DENIED',
  EXTERNAL_SERVICE_ERROR = 'EXTERNAL_SERVICE_ERROR',
  INTERNAL_ERROR = 'SERVICE_INTERNAL_ERROR'
}

/**
 * 服務操作結果介面
 */
export interface ServiceResult<T> {
  success: boolean
  data?: T
  error?: {
    type: ServiceErrorType
    message: string
    details?: Record<string, unknown>
  }
}

/**
 * 工具函數：建立分頁結果
 */
export function createPaginatedResult<T>(
  items: T[],
  total: number,
  page: number,
  limit: number
): PaginatedResult<T> {
  const totalPages = Math.ceil(total / limit)
  
  return {
    items,
    total,
    page,
    limit,
    totalPages,
    hasNext: page < totalPages,
    hasPrev: page > 1
  }
}

/**
 * 工具函數：標準化查詢選項
 */
export function normalizeQueryOptions(options?: QueryOptions): Required<QueryOptions> {
  return {
    sortBy: options?.sortBy || 'created_at',
    sortOrder: options?.sortOrder || 'desc',
    filters: options?.filters || {},
    includes: options?.includes || []
  }
}

/**
 * 工具函數：標準化分頁查詢選項
 */
export function normalizePaginatedQueryOptions(
  options?: PaginatedQueryOptions
): Required<PaginatedQueryOptions> {
  return {
    ...normalizeQueryOptions(options),
    page: Math.max(1, options?.page || 1),
    limit: Math.min(100, Math.max(1, options?.limit || 20)) // 限制在 1-100 之間
  }
}