/**
 * 使用者興趣 API 客戶端服務
 * 透過 API 端點與後端互動，避免直接操作 Supabase
 */

import { logger } from '@/lib/logger'

export interface ApiResponse<T = unknown> {
  success: boolean
  data?: T
  message?: string
  error?: string
}

export interface InterestToggleResponse {
  userId: string
  productId: string
  action: 'added' | 'removed'
  wasInterested: boolean
  nowInterested: boolean
}

/**
 * 使用者興趣 API 客戶端服務
 */
export class UserInterestsApiService {
  private static readonly API_BASE = '/api/user/interests'

  /**
   * 通用 API 請求處理
   */
  private static async makeRequest<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    try {
      const response = await fetch(`${this.API_BASE}${endpoint}`, {
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
        credentials: 'include', // 包含認證 cookies
        ...options,
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({
          error: `HTTP ${response.status}`,
        }))
        throw new Error(errorData.error || errorData.message || `請求失敗: ${response.status}`)
      }

      const data: ApiResponse<T> = await response.json()

      if (!data.success) {
        throw new Error(data.error || data.message || '操作失敗')
      }

      return data.data as T
    } catch (error) {
      logger.error('API 請求失敗', error as Error, {
        module: 'UserInterestsApiService',
        metadata: { endpoint, options: { method: options.method } },
      })
      throw error
    }
  }

  /**
   * 獲取使用者興趣清單
   */
  static async getUserInterests(): Promise<string[]> {
    try {
      const result = await this.makeRequest<{ interests: string[] }>('')
      return result.interests || []
    } catch (error) {
      logger.error('獲取興趣清單失敗', error as Error, {
        module: 'UserInterestsApiService',
        action: 'getUserInterests',
      })
      return []
    }
  }

  /**
   * 新增產品到興趣清單
   */
  static async addInterest(productId: string): Promise<boolean> {
    try {
      await this.makeRequest('', {
        method: 'POST',
        body: JSON.stringify({ productId }),
      })
      return true
    } catch (error) {
      logger.error('新增興趣失敗', error as Error, {
        module: 'UserInterestsApiService',
        action: 'addInterest',
        metadata: { productId },
      })
      return false
    }
  }

  /**
   * 從興趣清單移除產品
   */
  static async removeInterest(productId: string): Promise<boolean> {
    try {
      await this.makeRequest('', {
        method: 'DELETE',
        body: JSON.stringify({ productId }),
      })
      return true
    } catch (error) {
      logger.error('移除興趣失敗', error as Error, {
        module: 'UserInterestsApiService',
        action: 'removeInterest',
        metadata: { productId },
      })
      return false
    }
  }

  /**
   * 切換產品興趣狀態
   */
  static async toggleInterest(productId: string): Promise<{
    success: boolean
    action?: 'added' | 'removed'
    wasInterested?: boolean
    nowInterested?: boolean
  }> {
    try {
      const result = await this.makeRequest<InterestToggleResponse>('/toggle', {
        method: 'POST',
        body: JSON.stringify({ productId }),
      })

      return {
        success: true,
        action: result.action,
        wasInterested: result.wasInterested,
        nowInterested: result.nowInterested,
      }
    } catch (error) {
      logger.error('切換興趣狀態失敗', error as Error, {
        module: 'UserInterestsApiService',
        action: 'toggleInterest',
        metadata: { productId },
      })
      return { success: false }
    }
  }

  /**
   * 批量新增興趣（用於本地同步）
   */
  static async addMultipleInterests(productIds: string[]): Promise<boolean> {
    try {
      // 批量新增：逐一調用新增 API
      const results = await Promise.all(productIds.map(id => this.addInterest(id)))
      return results.every(result => result)
    } catch (error) {
      logger.error('批量新增興趣失敗', error as Error, {
        module: 'UserInterestsApiService',
        action: 'addMultipleInterests',
        metadata: { count: productIds.length },
      })
      return false
    }
  }

  /**
   * 本地儲存管理（保持與原服務相容）
   */
  static getLocalInterests(): string[] {
    if (typeof window === 'undefined') return []

    try {
      const stored = localStorage.getItem('user_interests')
      return stored ? JSON.parse(stored) : []
    } catch {
      return []
    }
  }

  static setLocalInterests(interests: string[]): void {
    if (typeof window === 'undefined') return

    try {
      localStorage.setItem('user_interests', JSON.stringify(interests))
    } catch (error) {
      logger.error('保存本地興趣失敗', error as Error, {
        module: 'UserInterestsApiService',
        action: 'setLocalInterests',
      })
    }
  }

  static clearLocalInterests(): void {
    if (typeof window === 'undefined') return

    try {
      localStorage.removeItem('user_interests')
    } catch (error) {
      logger.error('清除本地興趣失敗', error as Error, {
        module: 'UserInterestsApiService',
        action: 'clearLocalInterests',
      })
    }
  }

  /**
   * 同步本地興趣到雲端（登入時使用）
   */
  static async syncLocalInterests(): Promise<string[]> {
    try {
      const localInterests = this.getLocalInterests()
      if (localInterests.length === 0) {
        return await this.getUserInterests()
      }

      // 同步本地興趣到雲端
      await this.addMultipleInterests(localInterests)

      // 獲取最新的雲端興趣清單
      const cloudInterests = await this.getUserInterests()

      // 清除本地儲存（已同步到雲端）
      this.clearLocalInterests()

      return cloudInterests
    } catch (error) {
      logger.error('同步本地興趣失敗', error as Error, {
        module: 'UserInterestsApiService',
        action: 'syncLocalInterests',
      })
      return []
    }
  }
}
