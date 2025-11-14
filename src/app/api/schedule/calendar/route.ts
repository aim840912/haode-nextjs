/**
 * @api {GET} /api/schedule/calendar 取得擺攤行程行事曆
 * @apiName GetScheduleCalendar
 * @apiGroup Schedule
 * @apiVersion 1.0.0
 *
 * @apiDescription
 * 取得擺攤行程的行事曆格式資料，適用於 FullCalendar 等行事曆元件。
 * 自動將行程轉換為事件格式，並根據狀態設定顏色。
 *
 * @apiPermission public
 *
 * @apiSuccess {Boolean} success 請求是否成功
 * @apiSuccess {Object[]} data 行事曆事件列表
 * @apiSuccess {String} data.id 事件 ID
 * @apiSuccess {String} data.title 事件標題（市集名稱 + 地點）
 * @apiSuccess {String} data.start 開始時間
 * @apiSuccess {String} data.backgroundColor 背景色
 * @apiSuccess {String} data.borderColor 邊框色
 * @apiSuccess {Object} data.extendedProps 擴展屬性
 * @apiSuccess {String} data.extendedProps.location 地點
 * @apiSuccess {String[]} data.extendedProps.products 商品列表
 * @apiSuccess {String} data.extendedProps.status 狀態（upcoming/ongoing/completed）
 * @apiSuccess {String} message 回應訊息
 *
 * @apiSuccessExample {json} 成功回應:
 * HTTP/1.1 200 OK
 * {
 *   "success": true,
 *   "data": [
 *     {
 *       "id": "550e8400-e29b-41d4-a716-446655440000",
 *       "title": "板橋農夫市集 - 新北市板橋區",
 *       "start": "2025-01-15T09:00",
 *       "backgroundColor": "#10b981",
 *       "borderColor": "#059669",
 *       "extendedProps": {
 *         "location": "新北市板橋區",
 *         "products": ["草莓", "芭樂"],
 *         "status": "upcoming",
 *         "contact": "0912345678"
 *       }
 *     }
 *   ],
 *   "message": "成功取得擺攤行程行事曆"
 * }
 *
 * @apiError (錯誤 5xx) {Object} DatabaseError 資料庫查詢失敗
 */

import { success } from '@/lib/api-response'
import { apiLogger } from '@/lib/logger'
import { withErrorHandler } from '@/lib/middleware/error-handler'
import { scheduleServiceSimple } from '@/services/core/content/scheduleServiceSimple'

interface ScheduleCalendarEvent {
  id: string
  title: string // 市集名稱 + 地點
  start: string // 日期時間
  end?: string // 結束時間（如果有）
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

async function handleGET() {
  const scheduleService = scheduleServiceSimple
  const scheduleItems = await scheduleService.getSchedule()

  // 將 ScheduleItem 轉換為 FullCalendar 事件格式
  const events: ScheduleCalendarEvent[] = scheduleItems.map(item => {
    const startDateTime = `${item.date}T${item.time}`

    // 根據狀態設定顏色
    const getColorByStatus = (status: string) => {
      switch (status) {
        case 'upcoming':
          return { bg: '#10b981', border: '#059669' } // 綠色
        case 'ongoing':
          return { bg: '#3b82f6', border: '#2563eb' } // 藍色
        case 'completed':
          return { bg: '#6b7280', border: '#4b5563' } // 灰色
        default:
          return { bg: '#10b981', border: '#059669' } // 預設綠色
      }
    }

    const colors = getColorByStatus(item.status)

    return {
      id: item.id,
      title: `${item.title} - ${item.location}`,
      start: startDateTime,
      backgroundColor: colors.bg,
      borderColor: colors.border,
      extendedProps: {
        location: item.location,
        products: item.products,
        specialOffer: item.specialOffer,
        weatherNote: item.weatherNote,
        contact: item.contact,
        status: item.status,
        description: item.description,
      },
    }
  })

  apiLogger.info(`成功取得擺攤行程行事曆資料: ${events.length} 個事件`)

  return success(events, '成功取得擺攤行程行事曆')
}

export const GET = withErrorHandler(handleGET, {
  module: 'ScheduleCalendar',
  enableAuditLog: false,
})
