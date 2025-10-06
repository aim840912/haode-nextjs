/**
 * 使用者興趣 API 客戶端包裝層
 * 提供類型安全的 API 呼叫函數，供客戶端元件使用
 */

import { apiLogger } from '@/lib/logger'
import { apiClient } from '@/lib/api-client'
import { handleApiError } from './common'

/**
 * 興趣清單回應
 */
interface InterestsResponse {
  interests: string[]
}

/**
 * 同步回應
 */
interface SyncResponse {
  userId: string
  interests: string[]
  syncedCount: number
  totalCount: number
}

/**
 * 操作回應
 */
interface ActionResponse {
  userId: string
  productId: string
  action: string
}

/**
 * 取得使用者興趣清單
 */
export async function fetchUserInterests(): Promise<string[]> {
  try {
    const result = await apiClient.get<InterestsResponse>('/api/user/interests')

    if (!result.success || !result.data) {
      throw new Error(result.message || '取得興趣清單失敗')
    }

    return result.data.interests
  } catch (error) {
    handleApiError(error, 'fetchUserInterests', 'UserInterestsAPI')
  }
}

/**
 * 同步本地興趣清單到雲端
 */
export async function syncLocalInterests(localInterests: string[]): Promise<string[]> {
  try {
    const result = await apiClient.post<SyncResponse>('/api/user/interests/sync', {
      localInterests,
    })

    if (!result.success || !result.data) {
      throw new Error(result.message || '同步興趣清單失敗')
    }

    apiLogger.info('本地興趣同步成功', {
      module: 'UserInterestsAPI',
      action: 'syncLocalInterests',
      metadata: {
        syncedCount: result.data.syncedCount,
        totalCount: result.data.totalCount,
      },
    })

    return result.data.interests
  } catch (error) {
    // 同步失敗時返回本地清單，避免資料遺失
    apiLogger.warn('同步興趣清單失敗，返回本地清單', {
      module: 'UserInterestsAPI',
      action: 'syncLocalInterests',
      metadata: {
        localCount: localInterests.length,
        error: error instanceof Error ? error.message : String(error),
      },
    })
    return localInterests
  }
}

/**
 * 新增產品到興趣清單
 */
export async function addUserInterest(productId: string): Promise<boolean> {
  try {
    const result = await apiClient.post<ActionResponse>('/api/user/interests', { productId })

    if (!result.success) {
      throw new Error(result.message || '新增興趣失敗')
    }

    return true
  } catch (error) {
    handleApiError(error, 'addUserInterest', 'UserInterestsAPI')
  }
}

/**
 * 從興趣清單移除產品
 */
export async function removeUserInterest(productId: string): Promise<boolean> {
  try {
    const result = await apiClient.delete<ActionResponse>('/api/user/interests', {
      body: JSON.stringify({ productId }),
    })

    if (!result.success) {
      throw new Error(result.message || '移除興趣失敗')
    }

    return true
  } catch (error) {
    handleApiError(error, 'removeUserInterest', 'UserInterestsAPI')
  }
}

/**
 * 切換興趣狀態（加入或移除）
 */
export async function toggleUserInterest(productId: string): Promise<{
  action: 'added' | 'removed'
  productId: string
}> {
  try {
    const result = await apiClient.post<ActionResponse>('/api/user/interests/toggle', {
      productId,
    })

    if (!result.success || !result.data) {
      throw new Error(result.message || '切換興趣狀態失敗')
    }

    return {
      action: result.data.action as 'added' | 'removed',
      productId: result.data.productId,
    }
  } catch (error) {
    handleApiError(error, 'toggleUserInterest', 'UserInterestsAPI')
  }
}
