/**
 * Locations API 客戶端包裝層
 * 提供類型安全的 API 呼叫函數，供客戶端元件使用
 */

import { apiLogger } from '@/lib/logger'
import { apiClient } from '@/lib/api-client'
import { Location } from '@/types/location'
import { handleApiError } from './common'

/**
 * 取得所有門市據點清單
 * @returns 門市陣列
 */
export async function fetchLocations(): Promise<Location[]> {
  try {
    const result = await apiClient.get<Location[]>('/api/locations')

    // 處理統一 API 回應格式（支援舊格式和新格式）
    const data = result.data || (result as unknown as Location[])

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
    handleApiError(error, 'fetchLocations', 'LocationsAPI')
  }
}

/**
 * 取得單一門市據點詳情
 * @param id - 門市 ID
 * @returns 門市詳細資料
 */
export async function fetchLocationById(id: string): Promise<Location> {
  try {
    const result = await apiClient.get<Location>(`/api/locations/${id}`)

    if (!result.success || !result.data) {
      throw new Error(result.message || '取得門市據點詳情失敗')
    }

    apiLogger.info('門市據點詳情取得成功', {
      metadata: { locationId: id },
    })

    return result.data
  } catch (error) {
    handleApiError(error, 'fetchLocationById', 'LocationsAPI')
  }
}

/**
 * 刪除門市據點
 * @param id - 門市 ID
 * @returns 刪除結果（包含圖片清理資訊）
 */
export async function deleteLocation(
  id: string
): Promise<{ imageCleanup?: { deletedCount: number } }> {
  try {
    const result = await apiClient.delete<{ imageCleanup?: { deletedCount: number } }>(
      `/api/admin-proxy/locations?id=${id}`
    )

    if (!result.success) {
      throw new Error(result.message || '刪除門市據點失敗')
    }

    apiLogger.info('門市據點刪除成功', {
      metadata: {
        locationId: id,
        deletedImages: result.data?.imageCleanup?.deletedCount || 0,
      },
    })

    return result.data || {}
  } catch (error) {
    handleApiError(error, 'deleteLocation', 'LocationsAPI')
  }
}
