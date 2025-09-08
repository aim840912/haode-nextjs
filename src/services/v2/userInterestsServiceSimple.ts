/**
 * 使用者興趣服務 v2 簡化實作
 * 基於統一架構的使用者興趣管理服務
 *
 * 功能：
 * - 標準化 CRUD 操作
 * - 統一錯誤處理和日誌記錄
 * - 支援批量操作和本地同步
 * - 內建重複資料防護
 */

// 動態匯入服務端客戶端以避免客戶端環境問題
import { dbLogger } from '@/lib/logger'
import { ErrorFactory, ValidationError } from '@/lib/errors'
import { supabase } from '@/lib/supabase-auth'
import type { UserInterest } from '../userInterestsService'
import type { Database } from '@/types/database'

/**
 * 資料庫記錄類型
 */
interface SupabaseUserInterestRecord {
  id: string
  user_id: string
  product_id: string
  created_at: string
}

/**
 * 使用者興趣服務 v2 簡化實作
 */
export class UserInterestsServiceV2Simple {
  private readonly moduleName = 'UserInterestsServiceV2'

  /**
   * 取得 Supabase 客戶端（使用統一的 Proxy 物件）
   */
  private getSupabaseClient() {
    // 使用已經處理環境檢測的 supabase Proxy 物件
    return supabase
  }

  /**
   * 處理錯誤
   */
  private handleError(error: unknown, operation: string, context?: Record<string, unknown>): never {
    dbLogger.error(`使用者興趣服務 ${operation} 操作失敗`, error as Error, {
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
   * 轉換資料庫記錄為實體
   */
  private transformFromDB(dbRecord: SupabaseUserInterestRecord): UserInterest {
    return {
      id: dbRecord.id,
      user_id: dbRecord.user_id,
      product_id: dbRecord.product_id,
      created_at: dbRecord.created_at,
    }
  }

  /**
   * 驗證使用者ID和產品ID
   */
  private validateInputs(userId: string, productId?: string): void {
    if (!userId?.trim()) {
      throw new ValidationError('使用者ID不能為空')
    }

    if (productId !== undefined && !productId?.trim()) {
      throw new ValidationError('產品ID不能為空')
    }
  }

  // === 公開 API 方法 ===

  /**
   * 取得使用者的興趣產品 ID 清單
   */
  async getUserInterests(userId: string): Promise<string[]> {
    try {
      this.validateInputs(userId)

      const client = this.getSupabaseClient()!
      const { data, error } = await client
        .from('user_interests')
        .select('product_id')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })

      if (error) {
        this.handleError(error, 'getUserInterests', { userId })
      }

      const result = data?.map((item: { product_id: string }) => item.product_id) || []

      dbLogger.info('取得使用者興趣列表成功', {
        module: this.moduleName,
        action: 'getUserInterests',
        metadata: { userId, count: result.length },
      })

      return result
    } catch (error) {
      // 對於關鍵的公開 API，我們記錄錯誤但返回空陣列
      dbLogger.error(
        '取得使用者興趣列表失敗',
        error instanceof Error ? error : new Error('Unknown error'),
        {
          module: this.moduleName,
          action: 'getUserInterests',
          metadata: { userId },
        }
      )
      return []
    }
  }

  /**
   * 新增興趣產品
   */
  async addInterest(userId: string, productId: string): Promise<boolean> {
    try {
      this.validateInputs(userId, productId)

      const client = this.getSupabaseClient()!
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error } = await (client as any).from('user_interests').insert({
        user_id: userId,
        product_id: productId,
      } satisfies Database['public']['Tables']['user_interests']['Insert'])

      if (error) {
        // 如果是重複插入錯誤（unique constraint），視為成功
        if (error.code === '23505') {
          dbLogger.info('興趣產品已存在，跳過插入', {
            module: this.moduleName,
            action: 'addInterest',
            metadata: { userId, productId, reason: 'duplicate' },
          })
          return true
        }
        this.handleError(error, 'addInterest', { userId, productId })
      }

      dbLogger.info('新增興趣產品成功', {
        module: this.moduleName,
        action: 'addInterest',
        metadata: { userId, productId },
      })

      return true
    } catch (error) {
      dbLogger.error(
        '新增興趣產品失敗',
        error instanceof Error ? error : new Error('Unknown error'),
        {
          module: this.moduleName,
          action: 'addInterest',
          metadata: { userId, productId },
        }
      )
      return false
    }
  }

  /**
   * 移除興趣產品
   */
  async removeInterest(userId: string, productId: string): Promise<boolean> {
    try {
      this.validateInputs(userId, productId)

      const client = this.getSupabaseClient()!
      const { error } = await client
        .from('user_interests')
        .delete()
        .eq('user_id', userId)
        .eq('product_id', productId)

      if (error) {
        this.handleError(error, 'removeInterest', { userId, productId })
      }

      dbLogger.info('移除興趣產品成功', {
        module: this.moduleName,
        action: 'removeInterest',
        metadata: { userId, productId },
      })

      return true
    } catch (error) {
      dbLogger.error(
        '移除興趣產品失敗',
        error instanceof Error ? error : new Error('Unknown error'),
        {
          module: this.moduleName,
          action: 'removeInterest',
          metadata: { userId, productId },
        }
      )
      return false
    }
  }

  /**
   * 批量新增興趣產品
   */
  async addMultipleInterests(userId: string, productIds: string[]): Promise<boolean> {
    try {
      this.validateInputs(userId)

      if (productIds.length === 0) {
        dbLogger.debug('無需新增興趣產品，列表為空', {
          module: this.moduleName,
          action: 'addMultipleInterests',
          metadata: { userId, count: 0 },
        })
        return true
      }

      // 驗證產品ID列表
      for (const productId of productIds) {
        this.validateInputs(userId, productId)
      }

      const interests = productIds.map(
        productId =>
          ({
            user_id: userId,
            product_id: productId,
          }) satisfies Database['public']['Tables']['user_interests']['Insert']
      )

      const client = this.getSupabaseClient()!
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error } = await (client as any)
        .from('user_interests')
        .upsert(interests, { onConflict: 'user_id,product_id' })

      if (error) {
        this.handleError(error, 'addMultipleInterests', {
          userId,
          productIdCount: productIds.length,
        })
      }

      dbLogger.info('批量新增興趣產品成功', {
        module: this.moduleName,
        action: 'addMultipleInterests',
        metadata: { userId, count: productIds.length },
      })

      return true
    } catch (error) {
      dbLogger.error(
        '批量新增興趣產品失敗',
        error instanceof Error ? error : new Error('Unknown error'),
        {
          module: this.moduleName,
          action: 'addMultipleInterests',
          metadata: { userId, productIdCount: productIds.length },
        }
      )
      return false
    }
  }

  /**
   * 切換興趣狀態（加入或移除）
   */
  async toggleInterest(userId: string, productId: string): Promise<boolean> {
    try {
      this.validateInputs(userId, productId)

      // 先檢查是否已存在
      const client = this.getSupabaseClient()!
      const { data: existing, error: checkError } = await client
        .from('user_interests')
        .select('id')
        .eq('user_id', userId)
        .eq('product_id', productId)
        .single()

      if (checkError && checkError.code !== 'PGRST116') {
        // PGRST116 是找不到記錄的錯誤，其他錯誤才需要處理
        this.handleError(checkError, 'toggleInterest:check', { userId, productId })
      }

      const exists = !!existing
      const action = exists ? 'remove' : 'add'
      const success = exists
        ? await this.removeInterest(userId, productId)
        : await this.addInterest(userId, productId)

      dbLogger.info('切換興趣狀態成功', {
        module: this.moduleName,
        action: 'toggleInterest',
        metadata: { userId, productId, action, exists, success },
      })

      return success
    } catch (error) {
      dbLogger.error(
        '切換興趣狀態失敗',
        error instanceof Error ? error : new Error('Unknown error'),
        {
          module: this.moduleName,
          action: 'toggleInterest',
          metadata: { userId, productId },
        }
      )
      return false
    }
  }

  /**
   * 同步本地興趣清單到雲端（登入時使用）
   */
  async syncLocalInterests(userId: string, localInterests: string[]): Promise<string[]> {
    try {
      this.validateInputs(userId)

      // 驗證本地興趣清單
      for (const productId of localInterests) {
        this.validateInputs(userId, productId)
      }

      // 取得雲端興趣清單
      const cloudInterests = await this.getUserInterests(userId)

      // 合併本地和雲端興趣清單（去重）
      const mergedInterests = Array.from(new Set([...cloudInterests, ...localInterests]))

      // 如果有新的興趣需要同步到雲端
      const newInterests = localInterests.filter(id => !cloudInterests.includes(id))
      if (newInterests.length > 0) {
        const syncSuccess = await this.addMultipleInterests(userId, newInterests)
        if (!syncSuccess) {
          dbLogger.warn('部分本地興趣同步失敗，返回本地清單', {
            module: this.moduleName,
            action: 'syncLocalInterests',
            metadata: { userId, failedSyncCount: newInterests.length },
          })
          return localInterests // 如果同步失敗，返回本地清單
        }
      }

      dbLogger.info('本地興趣同步完成', {
        module: this.moduleName,
        action: 'syncLocalInterests',
        metadata: {
          userId,
          localCount: localInterests.length,
          cloudCount: cloudInterests.length,
          mergedCount: mergedInterests.length,
          syncedCount: newInterests.length,
        },
      })

      return mergedInterests
    } catch (error) {
      dbLogger.error(
        '本地興趣同步失敗',
        error instanceof Error ? error : new Error('Unknown error'),
        {
          module: this.moduleName,
          action: 'syncLocalInterests',
          metadata: { userId, localInterestCount: localInterests.length },
        }
      )
      return localInterests // 如果同步失敗，返回本地清單
    }
  }

  // === 客戶端相關方法（保持相容性） ===

  /**
   * 清除本地儲存的興趣清單
   */
  clearLocalInterests(): void {
    try {
      if (typeof localStorage !== 'undefined') {
        localStorage.removeItem('interestedProducts')
        // 觸發事件通知其他元件更新
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('interestedProductsUpdated'))
        }
      }

      dbLogger.debug('本地興趣清單已清除', {
        module: this.moduleName,
        action: 'clearLocalInterests',
      })
    } catch (error) {
      dbLogger.error(
        '清除本地興趣清單失敗',
        error instanceof Error ? error : new Error('Unknown error'),
        {
          module: this.moduleName,
          action: 'clearLocalInterests',
        }
      )
    }
  }

  /**
   * 取得本地儲存的興趣清單
   */
  getLocalInterests(): string[] {
    try {
      if (typeof localStorage === 'undefined') {
        return []
      }

      const saved = localStorage.getItem('interestedProducts')
      const result = saved ? JSON.parse(saved) : []

      dbLogger.debug('取得本地興趣清單', {
        module: this.moduleName,
        action: 'getLocalInterests',
        metadata: { count: result.length },
      })

      return result
    } catch (error) {
      dbLogger.error(
        '取得本地興趣清單失敗',
        error instanceof Error ? error : new Error('Unknown error'),
        {
          module: this.moduleName,
          action: 'getLocalInterests',
        }
      )
      return []
    }
  }

  /**
   * 設定本地儲存的興趣清單
   */
  setLocalInterests(interests: string[]): void {
    try {
      if (typeof localStorage === 'undefined') {
        return
      }

      localStorage.setItem('interestedProducts', JSON.stringify(interests))
      // 觸發事件通知其他元件更新
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('interestedProductsUpdated'))
      }

      dbLogger.debug('設定本地興趣清單', {
        module: this.moduleName,
        action: 'setLocalInterests',
        metadata: { count: interests.length },
      })
    } catch (error) {
      dbLogger.error(
        '設定本地興趣清單失敗',
        error instanceof Error ? error : new Error('Unknown error'),
        {
          module: this.moduleName,
          action: 'setLocalInterests',
          metadata: { interestCount: interests.length },
        }
      )
    }
  }

  /**
   * 取得服務健康狀態
   */
  async getHealthStatus(): Promise<{
    status: 'healthy' | 'degraded' | 'unhealthy'
    timestamp: string
    details?: Record<string, unknown>
  }> {
    try {
      // 簡單的連線測試
      const client = this.getSupabaseClient()!
      const { error } = await client.from('user_interests').select('id').limit(1)

      const isHealthy = !error || error.code === 'PGRST116' // 表格可能為空

      return {
        status: isHealthy ? 'healthy' : 'degraded',
        timestamp: new Date().toISOString(),
        details: {
          moduleName: this.moduleName,
          tableName: 'user_interests',
          error: error?.message,
        },
      }
    } catch (error) {
      return {
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        details: {
          moduleName: this.moduleName,
          error: (error as Error).message,
        },
      }
    }
  }
}

// 建立並匯出服務實例
export const userInterestsServiceV2Simple = new UserInterestsServiceV2Simple()
