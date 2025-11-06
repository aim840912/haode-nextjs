/**
 * Schedule API 客戶端包裝層
 * 提供類型安全的 API 呼叫函數，供客戶端元件使用
 */

import { apiClient } from '@/lib/api-client'
import { apiLogger } from '@/lib/logger'
import { handleApiError } from './common'

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
 * 取得擺攤行程列表
 * @returns 行程陣列
 */
export async function fetchSchedule(): Promise<ScheduleItem[]> {
  try {
    const result = await apiClient.get<ScheduleItem[]>('/api/schedule')

    // 處理統一 API 回應格式（支援舊格式和新格式）
    const data = result.data || (result as unknown as ScheduleItem[])

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
    handleApiError(error, 'fetchSchedule', 'ScheduleAPI')
  }
}

/**
 * 取得單一行程詳情
 * @param id - 行程 ID
 * @returns 行程詳細資料
 */
export async function fetchScheduleById(id: string): Promise<ScheduleItem> {
  try {
    const result = await apiClient.get<ScheduleItem>(`/api/schedule/${id}`)

    if (!result.success || !result.data) {
      throw new Error(result.message || '取得行程詳情失敗')
    }

    apiLogger.info('行程詳情取得成功', {
      metadata: { scheduleId: id },
    })

    return result.data
  } catch (error) {
    handleApiError(error, 'fetchScheduleById', 'ScheduleAPI')
  }
}

/**
 * 行程行事曆事件介面
 */
export interface ScheduleCalendarEvent {
  id: string
  title: string
  start: string
  end?: string
  backgroundColor: string
  borderColor: string
  extendedProps: {
    location: string
    products: string[]
    specialOffer?: string
    weatherNote?: string
    contact: string
    status: 'upcoming' | 'ongoing' | 'completed'
    description: string
  }
}

/**
 * 取得擺攤行程行事曆資料
 * @returns 行事曆事件陣列
 */
export async function fetchScheduleCalendar(): Promise<ScheduleCalendarEvent[]> {
  try {
    const result = await apiClient.get<ScheduleCalendarEvent[]>('/api/schedule/calendar')

    // 處理統一 API 回應格式
    const data = result.data || (result as unknown as ScheduleCalendarEvent[])

    if (!Array.isArray(data)) {
      apiLogger.error('API 回應格式錯誤：calendar data 不是陣列', new Error('非陣列格式'), {
        module: 'ScheduleAPI',
        action: 'fetchScheduleCalendar',
        metadata: { result },
      })
      throw new Error('API 回應格式錯誤')
    }

    apiLogger.info('擺攤行程行事曆資料取得成功', {
      metadata: { eventCount: data.length },
    })

    return data
  } catch (error) {
    handleApiError(error, 'fetchScheduleCalendar', 'ScheduleAPI')
  }
}

/**
 * 更新擺攤行程狀態
 * @param id - 行程 ID
 * @param status - 新狀態
 * @returns 更新後的行程資料
 */
export async function updateScheduleStatus(
  id: string,
  status: 'upcoming' | 'ongoing' | 'completed'
): Promise<ScheduleItem> {
  try {
    const result = await apiClient.put<ScheduleItem>(`/api/schedule/${id}`, { status })

    if (!result.success || !result.data) {
      throw new Error(result.message || '更新行程狀態失敗')
    }

    apiLogger.info('擺攤行程狀態更新成功', {
      metadata: { scheduleId: id, newStatus: status },
    })

    return result.data
  } catch (error) {
    handleApiError(error, 'updateScheduleStatus', 'ScheduleAPI')
  }
}

/**
 * 刪除擺攤行程
 * @param id - 行程 ID
 * @returns 是否刪除成功
 */
export async function deleteSchedule(id: string): Promise<boolean> {
  try {
    const result = await apiClient.delete<unknown>(`/api/schedule/${id}`)

    if (!result.success) {
      throw new Error(result.message || '刪除擺攤行程失敗')
    }

    apiLogger.info('擺攤行程刪除成功', {
      metadata: { scheduleId: id },
    })

    return true
  } catch (error) {
    handleApiError(error, 'deleteSchedule', 'ScheduleAPI')
  }
}
