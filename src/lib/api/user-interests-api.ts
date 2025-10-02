/**
 * 使用者興趣 API 客戶端包裝層
 * 提供類型安全的 API 呼叫函數，供客戶端元件使用
 */

import { apiLogger } from '@/lib/logger'
import { ApiResponse, handleApiError } from './common'

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
    const response = await fetch('/api/user/interests', {
      method: 'GET',
      credentials: 'include',
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(errorData.message || '取得興趣清單失敗')
    }

    const result: ApiResponse<InterestsResponse> = await response.json()

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
    const response = await fetch('/api/user/interests/sync', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify({ localInterests }),
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(errorData.message || '同步興趣清單失敗')
    }

    const result: ApiResponse<SyncResponse> = await response.json()

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
    const response = await fetch('/api/user/interests', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify({ productId }),
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(errorData.message || '新增興趣失敗')
    }

    const result: ApiResponse<ActionResponse> = await response.json()

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
    const response = await fetch('/api/user/interests', {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify({ productId }),
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(errorData.message || '移除興趣失敗')
    }

    const result: ApiResponse<ActionResponse> = await response.json()

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
    const response = await fetch('/api/user/interests/toggle', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify({ productId }),
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(errorData.message || '切換興趣狀態失敗')
    }

    const result: ApiResponse<ActionResponse> = await response.json()

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
