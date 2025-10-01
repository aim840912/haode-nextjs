/**
 * Schedule API 客戶端包裝層
 * 提供類型安全的 API 呼叫函數，供客戶端元件使用
 */

import { apiLogger } from '@/lib/logger'

/**
 * 行程項目介面
 */
export interface ScheduleItem {
  id: string
  title: string
  location: string
  date: string
  time: string
  status: 'upcoming' | 'ongoing' | 'completed'
  products: string[]
  description: string
  contact: string
  specialOffer: string
  weatherNote: string
  createdAt: string
  updatedAt: string
}

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
  apiLogger.error(`Schedule API ${operation} 失敗`, error as Error, {
    module: 'ScheduleAPI',
    action: operation,
  })
  throw new Error(errorMessage)
}

/**
 * 取得擺攤行程列表
 * @returns 行程陣列
 */
export async function fetchSchedule(): Promise<ScheduleItem[]> {
  try {
    const response = await fetch('/api/schedule', {
      method: 'GET',
      credentials: 'include',
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(errorData.error || '取得擺攤行程列表失敗')
    }

    const result: ApiResponse<ScheduleItem[]> = await response.json()

    // 處理統一 API 回應格式（支援舊格式和新格式）
    const data = result.data || result

    // 確保 data 是陣列
    if (!Array.isArray(data)) {
      apiLogger.error('API 回應格式錯誤：schedule data 不是陣列', new Error('非陣列格式'), {
        module: 'ScheduleAPI',
        action: 'fetchSchedule',
        metadata: { result },
      })
      throw new Error('API 回應格式錯誤')
    }

    apiLogger.info('擺攤行程列表取得成功', {
      metadata: { count: data.length },
    })

    return data
  } catch (error) {
    handleApiError(error, 'fetchSchedule')
  }
}

/**
 * 取得單一行程詳情
 * @param id - 行程 ID
 * @returns 行程詳細資料
 */
export async function fetchScheduleById(id: string): Promise<ScheduleItem> {
  try {
    const response = await fetch(`/api/schedule/${id}`, {
      method: 'GET',
      credentials: 'include',
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(errorData.error || '取得行程詳情失敗')
    }

    const result: ApiResponse<ScheduleItem> = await response.json()

    if (!result.success || !result.data) {
      throw new Error(result.message || '取得行程詳情失敗')
    }

    apiLogger.info('行程詳情取得成功', {
      metadata: { scheduleId: id },
    })

    return result.data
  } catch (error) {
    handleApiError(error, 'fetchScheduleById')
  }
}
