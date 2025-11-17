/**
 * 詢問單服務基礎類別
 *
 * 提供共用的基礎設施方法:
 * - Supabase 客戶端管理
 * - 統一錯誤處理
 * - 日誌記錄
 */

import { getSupabaseAdmin } from '@/lib/database/supabase-auth'
import { ErrorFactory, DatabaseError } from '@/lib/errors'
import { dbLogger } from '@/lib/logger'
import { ServiceSupabaseClient, ServiceErrorContext } from '@/types/service.types'

/**
 * 詢問單服務基礎類別
 */
export class InquiryServiceBase {
  protected readonly moduleName = 'InquiryService'

  /**
   * 取得 Supabase 客戶端
   */
  protected getSupabaseClient(): ServiceSupabaseClient {
    const client = getSupabaseAdmin()
    if (!client) {
      throw new DatabaseError('Supabase admin client not initialized')
    }
    return client
  }

  /**
   * 處理錯誤
   */
  protected handleError(error: unknown, operation: string, context?: ServiceErrorContext): never {
    dbLogger.error(`詢問服務 ${operation} 操作失敗`, error as Error, {
      module: this.moduleName,
      action: operation,
      metadata: context,
    })

    if (error && typeof error === 'object' && 'code' in error) {
      throw ErrorFactory.fromSupabaseError(error, {
        module: this.moduleName,
        action: operation,
        ...context,
      })
    }

    throw error instanceof Error ? error : new Error(`${operation} 操作失敗`)
  }

  /**
   * 記錄資訊日誌
   */
  protected logInfo(message: string, metadata?: Record<string, unknown>): void {
    dbLogger.info(message, {
      module: this.moduleName,
      ...metadata,
    })
  }
}
