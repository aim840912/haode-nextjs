/**
 * Locations API 客戶端包裝層
 * 提供類型安全的 API 呼叫函數，供客戶端元件使用
 */

import { apiLogger } from '@/lib/logger'
import { Location } from '@/types/location'

/**
 * API 回應格式
 */
interface ApiResponse<T> {
  success: boolean
  data?: T
  message?: string
  error?: string
}

/**
 * 處理 API 錯誤
 */
function handleApiError(error: unknown, operation: string): never {
  const errorMessage = error instanceof Error ? error.message : '未知錯誤'
  apiLogger.error(`Locations API ${operation} 失敗`, error as Error, {
    module: 'LocationsAPI',
    action: operation,
  })
  throw new Error(errorMessage)
}

/**
 * 取得所有門市據點清單
 * @returns 門市陣列
 */
export async function fetchLocations(): Promise<Location[]> {
  try {
    const response = await fetch('/api/locations', {
      method: 'GET',
      credentials: 'include',
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(errorData.error || '取得門市據點清單失敗')
    }

    const result: ApiResponse<Location[]> = await response.json()

    // 處理統一 API 回應格式（支援舊格式和新格式）
    const data = result.data || result

    // 確保 data 是陣列
    if (!Array.isArray(data)) {
      apiLogger.error('API 回應格式錯誤：locations data 不是陣列', new Error('非陣列格式'), {
        module: 'LocationsAPI',
        action: 'fetchLocations',
        metadata: { result },
      })
      throw new Error('API 回應格式錯誤')
    }

    apiLogger.info('門市據點清單取得成功', {
      metadata: { count: data.length },
    })

    return data
  } catch (error) {
    handleApiError(error, 'fetchLocations')
  }
}

/**
 * 取得單一門市據點詳情
 * @param id - 門市 ID
 * @returns 門市詳細資料
 */
export async function fetchLocationById(id: string): Promise<Location> {
  try {
    const response = await fetch(`/api/locations/${id}`, {
      method: 'GET',
      credentials: 'include',
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(errorData.error || '取得門市據點詳情失敗')
    }

    const result: ApiResponse<Location> = await response.json()

    if (!result.success || !result.data) {
      throw new Error(result.message || '取得門市據點詳情失敗')
    }

    apiLogger.info('門市據點詳情取得成功', {
      metadata: { locationId: id },
    })

    return result.data
  } catch (error) {
    handleApiError(error, 'fetchLocationById')
  }
}
