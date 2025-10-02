/**
 * API Client 統一錯誤處理
 *
 * 提供客戶端 API 呼叫的標準化錯誤處理函數
 */

import { apiLogger } from '@/lib/logger'

/**
 * 處理 API 客戶端錯誤
 *
 * @param error - 捕獲的錯誤物件
 * @param operation - 操作名稱（用於記錄）
 * @param module - 模組名稱（用於記錄）
 * @throws 總是拋出錯誤，讓呼叫方處理
 */
export function handleApiError(error: unknown, operation: string, module: string = 'API'): never {
  const errorMessage = error instanceof Error ? error.message : '未知錯誤'

  apiLogger.error(`${module} ${operation} 失敗`, error as Error, {
    module,
    action: operation,
  })

  throw new Error(errorMessage)
}
