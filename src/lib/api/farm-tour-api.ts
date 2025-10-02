/**
 * 農場體驗 API 客戶端包裝層
 * 提供類型安全的 API 呼叫函數，供客戶端元件使用
 */

import { apiLogger } from '@/lib/logger'
import { FarmTourActivity } from '@/types/farmTour'
import { ApiResponse, handleApiError } from './common'

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
    const url = forceRefresh
      ? `/api/farm-tour?t=${timestamp}&nocache=true`
      : `/api/farm-tour?t=${timestamp}`

    const response = await fetch(url, {
      method: 'GET',
      credentials: 'include',
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(errorData.message || '取得農場體驗活動失敗')
    }

    const result: ApiResponse<FarmTourActivity[]> = await response.json()

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
    const response = await fetch('/api/farm-tour/inquiry', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify(data),
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(errorData.message || '提交預約詢問失敗')
    }

    const result: ApiResponse<InquiryCreatedResponse> = await response.json()

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
