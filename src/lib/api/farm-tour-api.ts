/**
 * 農場體驗 API 客戶端包裝層
 * 提供類型安全的 API 呼叫函數，供客戶端元件使用
 */

import { apiLogger } from '@/lib/logger'
import { apiClient } from '@/lib/api-client'
import { FarmTourActivity } from '@/types/farmTour'
import { handleApiError } from './common'

/**
 * 農場參觀預約詢問資料
 */
export interface FarmTourInquiryData {
  customer_name: string
  customer_email: string
  customer_phone?: string
  activity_title: string
  visit_date: string
  visitor_count: string
  notes?: string
}

/**
 * 詢問建立回應
 */
interface InquiryCreatedResponse {
  id: string
}

/**
 * 取得農場體驗活動清單
 * @param forceRefresh - 是否強制刷新（不使用快取）
 * @returns 農場體驗活動陣列
 */
export async function fetchFarmTourActivities(
  forceRefresh: boolean = false
): Promise<FarmTourActivity[]> {
  try {
    // 加上時間戳避免快取
    const timestamp = Date.now()
    const endpoint = forceRefresh
      ? `/api/farm-tour?t=${timestamp}&nocache=true`
      : `/api/farm-tour?t=${timestamp}`

    const result = await apiClient.get<FarmTourActivity[]>(endpoint)

    if (!result.success || !result.data) {
      throw new Error(result.message || '取得農場體驗活動失敗')
    }

    apiLogger.info('農場體驗活動清單取得成功', {
      metadata: { count: result.data.length },
    })

    return result.data
  } catch (error) {
    handleApiError(error, 'fetchFarmTourActivities', 'FarmTourAPI')
  }
}

/**
 * 建立農場參觀預約詢問
 * @param data - 預約詢問資料
 * @returns 建立的詢問單 ID
 */
export async function createFarmTourInquiry(
  data: FarmTourInquiryData
): Promise<InquiryCreatedResponse> {
  try {
    const result = await apiClient.post<InquiryCreatedResponse>(
      '/api/farm-tour/inquiry',
      data as unknown as Record<string, unknown>
    )

    if (!result.success || !result.data) {
      throw new Error(result.message || '提交預約詢問失敗')
    }

    apiLogger.info('農場參觀預約詢問建立成功', {
      metadata: { inquiryId: result.data.id, activityTitle: data.activity_title },
    })

    return result.data
  } catch (error) {
    handleApiError(error, 'createFarmTourInquiry', 'FarmTourAPI')
  }
}

/**
 * 行事曆事件介面
 */
export interface CalendarEvent {
  id: string
  title: string
  start: string
  end?: string
  backgroundColor: string
  borderColor: string
  textColor: string
  extendedProps: {
    inquiry_id: string
    activity_title: string
    customer_name: string
    customer_email: string
    customer_phone?: string
    visitor_count: string
    notes?: string
    status: string
    created_at: string
    updated_at: string
  }
}

/**
 * 行事曆統計資料介面
 */
export interface CalendarStatistics {
  total: number
  byStatus: Record<string, number>
}

/**
 * 行事曆回應介面
 */
export interface CalendarResponse {
  events: CalendarEvent[]
  statistics: CalendarStatistics
}

/**
 * 取得農場導覽行事曆資料
 * @param start - 起始日期
 * @param end - 結束日期
 * @param status - 狀態過濾（可選）
 * @returns 行事曆資料（事件和統計）
 */
export async function fetchFarmTourCalendar(
  start: Date,
  end: Date,
  status?: string
): Promise<CalendarResponse> {
  try {
    const params = new URLSearchParams({
      start: start.toISOString(),
      end: end.toISOString(),
    })

    if (status && status !== 'all') {
      params.append('status', status)
    }

    const endpoint = `/api/farm-tour/calendar?${params}`
    const result = await apiClient.get<CalendarResponse>(endpoint)

    if (!result.success || !result.data) {
      throw new Error(result.message || '取得農場導覽行事曆資料失敗')
    }

    apiLogger.info('農場導覽行事曆資料取得成功', {
      metadata: { eventCount: result.data.events.length },
    })

    return result.data
  } catch (error) {
    handleApiError(error, 'fetchFarmTourCalendar', 'FarmTourAPI')
  }
}

/**
 * 更新農場導覽預約時間
 * @param eventId - 事件 ID
 * @param newDate - 新的預約日期
 * @returns 是否更新成功
 */
export async function updateFarmTourVisitDate(eventId: string, newDate: Date): Promise<boolean> {
  try {
    const result = await apiClient.put<unknown>(`/api/farm-tour/calendar?id=${eventId}`, {
      visit_date: newDate.toISOString(),
    })

    if (!result.success) {
      throw new Error(result.message || '更新預約時間失敗')
    }

    apiLogger.info('農場導覽預約時間更新成功', {
      metadata: { eventId, newDate: newDate.toISOString() },
    })

    return true
  } catch (error) {
    handleApiError(error, 'updateFarmTourVisitDate', 'FarmTourAPI')
  }
}

/**
 * 刪除農場體驗活動
 * @param id - 活動 ID
 * @returns 刪除結果（包含圖片清理資訊）
 */
export async function deleteFarmTour(
  id: string
): Promise<{ imageCleanup?: { deletedCount: number } }> {
  try {
    const result = await apiClient.delete<{ imageCleanup?: { deletedCount: number } }>(
      `/api/admin-proxy/farm-tour/${id}`
    )

    if (!result.success) {
      throw new Error(result.message || '刪除農場體驗活動失敗')
    }

    apiLogger.info('農場體驗活動刪除成功', {
      metadata: {
        farmTourId: id,
        deletedImages: result.data?.imageCleanup?.deletedCount || 0,
      },
    })

    return result.data || {}
  } catch (error) {
    handleApiError(error, 'deleteFarmTour', 'FarmTourAPI')
  }
}

/**
 * 更新農場體驗活動
 * @param id - 活動 ID
 * @param data - 要更新的資料
 * @returns 更新後的活動資料
 */
export async function updateFarmTour(
  id: string,
  data: Partial<FarmTourActivity>
): Promise<FarmTourActivity> {
  try {
    const result = await apiClient.put<FarmTourActivity>(
      `/api/farm-tour/${id}`,
      data as unknown as Record<string, unknown>
    )

    if (!result.success || !result.data) {
      throw new Error(result.message || '更新農場體驗活動失敗')
    }

    apiLogger.info('農場體驗活動更新成功', {
      metadata: { farmTourId: id, updatedFields: Object.keys(data) },
    })

    return result.data
  } catch (error) {
    handleApiError(error, 'updateFarmTour', 'FarmTourAPI')
  }
}
