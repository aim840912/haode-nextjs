/**
 * Rate Limiter Types
 *
 * 集中管理所有 Rate Limiting 相關的型別定義
 */

/**
 * Rate Limiting 識別策略
 */
export enum IdentifierStrategy {
  /** 基於 IP 地址 */
  IP = 'ip',
  /** 基於用戶 ID */
  USER_ID = 'user_id',
  /** 基於 API Key */
  API_KEY = 'api_key',
  /** 組合識別（IP + User-Agent） */
  COMBINED = 'combined',
}

/**
 * Rate Limiting 配置介面
 */
export interface RateLimitConfig {
  /** 最大請求數 */
  maxRequests: number
  /** 時間窗口（毫秒） */
  windowMs: number
  /** 識別策略 */
  strategy: IdentifierStrategy
  /** 是否記錄超限請求到審計日誌 */
  enableAuditLog?: boolean
  /** 自訂錯誤訊息 */
  message?: string
  /** 是否跳過成功的請求 */
  skipSuccessfulRequests?: boolean
  /** 是否跳過失敗的請求 */
  skipFailedRequests?: boolean
  /** 白名單 IP 列表 */
  whitelist?: string[]
  /** 回應標頭包含剩餘請求數 */
  includeHeaders?: boolean
}

/**
 * Rate Limiting 結果
 */
export interface RateLimitResult {
  /** 是否允許請求 */
  allowed: boolean
  /** 剩餘請求數 */
  remaining: number
  /** 總限制數 */
  limit: number
  /** 重置時間（Unix 時間戳） */
  resetTime: number
  /** 當前時間窗口的請求數 */
  currentRequests: number
  /** 識別符 */
  identifier: string
  /** 超限原因（如果適用） */
  reason?: string
}

/**
 * 存儲介面
 *
 * 統一的 key-value 存儲抽象,支援多種後端實作
 */
export interface RateLimitStore {
  /**
   * 獲取鍵值
   * @param key 鍵名
   * @returns 值或 null
   */
  get(key: string): Promise<string | null>

  /**
   * 設置鍵值
   * @param key 鍵名
   * @param value 值
   * @param ttl 過期時間（毫秒）
   */
  set(key: string, value: string, ttl: number): Promise<void>

  /**
   * 原子性增加計數器
   * @param key 鍵名
   * @returns 新的計數值
   */
  incr(key: string): Promise<number>

  /**
   * 設置過期時間
   * @param key 鍵名
   * @param ttl 過期時間（毫秒）
   */
  expire(key: string, ttl: number): Promise<void>
}
