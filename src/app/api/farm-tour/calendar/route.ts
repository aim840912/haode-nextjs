/**
 * @api {GET} /api/farm-tour/calendar 取得農場體驗行事曆
 * @apiName GetFarmTourCalendar
 * @apiGroup FarmTour
 * @apiVersion 1.0.0
 *
 * @apiDescription
 * 取得指定日期範圍內的農場體驗活動預約行事曆資料。
 * 回傳格式化的行事曆事件列表，包含統計資訊。
 * 支援按狀態篩選預約。
 *
 * @apiPermission public
 *
 * @apiQuery {String} start 開始日期（ISO 8601 格式，例如：2025-01-01）
 * @apiQuery {String} end 結束日期（ISO 8601 格式，例如：2025-01-31）
 * @apiQuery {String} [status] 狀態篩選（逗號分隔，可選值：pending,quoted,confirmed,completed,cancelled，all 表示全部）
 *
 * @apiSuccess {Boolean} success 請求是否成功
 * @apiSuccess {Object} data 行事曆資料
 * @apiSuccess {Object[]} data.events 事件列表
 * @apiSuccess {String} data.events.id 事件 ID
 * @apiSuccess {String} data.events.title 事件標題（格式：人數 - 客戶名稱）
 * @apiSuccess {String} data.events.start 開始時間
 * @apiSuccess {String} data.events.backgroundColor 背景色
 * @apiSuccess {String} data.events.borderColor 邊框色
 * @apiSuccess {String} data.events.textColor 文字色
 * @apiSuccess {Object} data.events.extendedProps 擴展屬性
 * @apiSuccess {Object} data.statistics 統計資訊
 * @apiSuccess {Number} data.statistics.total 總預約數
 * @apiSuccess {Object} data.statistics.byStatus 按狀態分組的統計
 * @apiSuccess {Object} data.statistics.byDate 按日期分組的統計
 * @apiSuccess {String} message 回應訊息
 *
 * @apiSuccessExample {json} 成功回應:
 * HTTP/1.1 200 OK
 * {
 *   "success": true,
 *   "data": {
 *     "events": [
 *       {
 *         "id": "550e8400-e29b-41d4-a716-446655440000",
 *         "title": "10人 - 王小明",
 *         "start": "2025-01-15T10:00:00Z",
 *         "backgroundColor": "#10B981",
 *         "borderColor": "#059669",
 *         "textColor": "#FFFFFF",
 *         "extendedProps": {
 *           "inquiry_id": "550e8400-e29b-41d4-a716-446655440000",
 *           "activity_title": "草莓採摘體驗",
 *           "customer_name": "王小明",
 *           "customer_email": "wang@example.com",
 *           "visitor_count": "10",
 *           "status": "confirmed"
 *         }
 *       }
 *     ],
 *     "statistics": {
 *       "total": 5,
 *       "byStatus": {
 *         "pending": 1,
 *         "quoted": 0,
 *         "confirmed": 3,
 *         "completed": 1,
 *         "cancelled": 0
 *       },
 *       "byDate": {
 *         "2025-01-15": 2,
 *         "2025-01-20": 3
 *       }
 *     }
 *   },
 *   "message": "查詢成功"
 * }
 *
 * @apiError (錯誤 4xx) {Object} ValidationError 缺少必要參數或日期格式錯誤
 * @apiError (錯誤 5xx) {Object} DatabaseError 查詢失敗
 *
 * @apiErrorExample {json} 錯誤回應（缺少參數）:
 * HTTP/1.1 400 Bad Request
 * {
 *   "success": false,
 *   "error": "缺少必要參數：start 和 end",
 *   "code": "VALIDATION_ERROR"
 * }
 *
 * @apiErrorExample {json} 錯誤回應（日期格式錯誤）:
 * HTTP/1.1 400 Bad Request
 * {
 *   "success": false,
 *   "error": "日期格式不正確",
 *   "code": "VALIDATION_ERROR"
 * }
 */

/**
 * @api {PUT} /api/farm-tour/calendar 更新預約時間
 * @apiName UpdateFarmTourCalendarEvent
 * @apiGroup FarmTour
 * @apiVersion 1.0.0
 *
 * @apiDescription
 * 更新農場體驗活動預約的參觀日期。
 * 用於行事曆拖曳功能，調整預約時間。
 *
 * @apiPermission public
 *
 * @apiQuery {String} id 詢問單 ID
 *
 * @apiBody {String} visit_date 新的參觀日期（ISO 8601 格式）
 *
 * @apiSuccess {Boolean} success 請求是否成功
 * @apiSuccess {Object} data 更新結果
 * @apiSuccess {String} data.id 詢問單 ID
 * @apiSuccess {String} data.visit_date 更新後的參觀日期
 * @apiSuccess {String} message 回應訊息
 *
 * @apiSuccessExample {json} 成功回應:
 * HTTP/1.1 200 OK
 * {
 *   "success": true,
 *   "data": {
 *     "id": "550e8400-e29b-41d4-a716-446655440000",
 *     "visit_date": "2025-01-20T10:00:00Z"
 *   },
 *   "message": "預約時間更新成功"
 * }
 *
 * @apiError (錯誤 4xx) {Object} ValidationError 缺少必要參數或日期格式錯誤
 * @apiError (錯誤 5xx) {Object} DatabaseError 更新失敗
 *
 * @apiErrorExample {json} 錯誤回應:
 * HTTP/1.1 400 Bad Request
 * {
 *   "success": false,
 *   "error": "缺少詢問單 ID",
 *   "code": "VALIDATION_ERROR"
 * }
 */

'use server'

import { NextRequest } from 'next/server'
import { success } from '@/lib/api-response'
import { createServerSupabaseClient } from '@/lib/database/supabase-server'
import { ValidationError } from '@/lib/errors'
import { apiLogger } from '@/lib/logger'
import { withErrorHandler } from '@/lib/middleware/error-handler'
import type { InquiryWithItems, InquiryStatus } from '@/types/inquiry'

// 行事曆事件介面
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
    status: InquiryStatus
    created_at: string
    updated_at: string
  }
}

// 行事曆統計介面
export interface CalendarStatistics {
  total: number
  byStatus: Record<InquiryStatus, number>
  byDate: Record<string, number>
}

export interface CalendarResponse {
  events: CalendarEvent[]
  statistics: CalendarStatistics
}

// 狀態顏色配置
const eventColors = {
  pending: {
    backgroundColor: '#9CA3AF',
    borderColor: '#6B7280',
    textColor: '#FFFFFF',
  },
  quoted: {
    backgroundColor: '#3B82F6',
    borderColor: '#2563EB',
    textColor: '#FFFFFF',
  },
  confirmed: {
    backgroundColor: '#10B981',
    borderColor: '#059669',
    textColor: '#FFFFFF',
  },
  completed: {
    backgroundColor: '#8B5CF6',
    borderColor: '#7C3AED',
    textColor: '#FFFFFF',
  },
  cancelled: {
    backgroundColor: '#EF4444',
    borderColor: '#DC2626',
    textColor: '#FFFFFF',
  },
} as const

// 轉換詢問單為行事曆事件
function convertInquiryToEvent(inquiry: InquiryWithItems): CalendarEvent {
  const colors = eventColors[inquiry.status]

  return {
    id: inquiry.id,
    title: `${inquiry.visitor_count}人 - ${inquiry.customer_name}`,
    start: inquiry.visit_date || inquiry.created_at,
    backgroundColor: colors.backgroundColor,
    borderColor: colors.borderColor,
    textColor: colors.textColor,
    extendedProps: {
      inquiry_id: inquiry.id,
      activity_title: inquiry.activity_title || '',
      customer_name: inquiry.customer_name,
      customer_email: inquiry.customer_email,
      customer_phone: inquiry.customer_phone,
      visitor_count: inquiry.visitor_count || '1',
      notes: inquiry.notes,
      status: inquiry.status,
      created_at: inquiry.created_at,
      updated_at: inquiry.updated_at,
    },
  }
}

// 計算統計資料
function calculateStatistics(inquiries: InquiryWithItems[]): CalendarStatistics {
  const byStatus: Record<InquiryStatus, number> = {
    pending: 0,
    quoted: 0,
    confirmed: 0,
    completed: 0,
    cancelled: 0,
  }

  const byDate: Record<string, number> = {}

  inquiries.forEach(inquiry => {
    // 按狀態統計
    byStatus[inquiry.status]++

    // 按日期統計
    const date = inquiry.visit_date
      ? inquiry.visit_date.split('T')[0]
      : inquiry.created_at.split('T')[0]
    byDate[date] = (byDate[date] || 0) + 1
  })

  return {
    total: inquiries.length,
    byStatus,
    byDate,
  }
}

async function handleGET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const start = searchParams.get('start')
  const end = searchParams.get('end')
  const statusFilter = searchParams.get('status')

  // 驗證必要參數
  if (!start || !end) {
    throw new ValidationError('缺少必要參數：start 和 end')
  }

  // 驗證日期格式
  const startDate = new Date(start)
  const endDate = new Date(end)

  if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
    throw new ValidationError('日期格式不正確')
  }

  apiLogger.debug('取得農場導覽行事曆資料')

  const supabase = await createServerSupabaseClient()

  // 建立查詢
  let query = supabase
    .from('inquiries')
    .select(
      `
      id,
      customer_name,
      customer_email,
      customer_phone,
      status,
      inquiry_type,
      activity_title,
      visit_date,
      visitor_count,
      notes,
      created_at,
      updated_at
    `
    )
    .eq('inquiry_type', 'farm_tour')
    .gte('visit_date', start)
    .lte('visit_date', end)
    .order('visit_date', { ascending: true })

  // 如果有狀態過濾
  if (statusFilter && statusFilter !== 'all') {
    const statuses = statusFilter.split(',').filter(s => s.length > 0) as InquiryStatus[]
    if (statuses.length > 0) {
      query = query.in('status', statuses)
    }
  }

  const { data: inquiries, error } = await query

  if (error) {
    apiLogger.error('查詢農場導覽預約失敗')
    throw new Error('查詢預約資料失敗')
  }

  if (!inquiries) {
    apiLogger.info('未找到農場導覽預約資料')
    return success<CalendarResponse>(
      {
        events: [],
        statistics: {
          total: 0,
          byStatus: {
            pending: 0,
            quoted: 0,
            confirmed: 0,
            completed: 0,
            cancelled: 0,
          },
          byDate: {},
        },
      },
      '查詢成功'
    )
  }

  // 轉換為行事曆事件
  const events = inquiries.map(inquiry => convertInquiryToEvent(inquiry as InquiryWithItems))
  const statistics = calculateStatistics(inquiries as InquiryWithItems[])

  apiLogger.info('農場導覽行事曆資料取得成功')

  return success<CalendarResponse>(
    {
      events,
      statistics,
    },
    '查詢成功'
  )
}

async function handlePUT(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const inquiryId = searchParams.get('id')

  if (!inquiryId) {
    throw new ValidationError('缺少詢問單 ID')
  }

  const body = await request.json()
  const { visit_date } = body

  if (!visit_date) {
    throw new ValidationError('缺少參觀日期')
  }

  // 驗證日期格式
  const visitDate = new Date(visit_date)
  if (isNaN(visitDate.getTime())) {
    throw new ValidationError('參觀日期格式不正確')
  }

  apiLogger.debug('更新農場導覽預約時間')

  const supabase = await createServerSupabaseClient()

  // 更新預約時間
  const { error } = await (supabase as any)
    .from('inquiries')
    .update({
      visit_date,
      updated_at: new Date().toISOString(),
    })
    .eq('id', inquiryId)
    .eq('inquiry_type', 'farm_tour')

  if (error) {
    apiLogger.error('更新農場導覽預約時間失敗')
    throw new Error('更新預約時間失敗')
  }

  apiLogger.info('農場導覽預約時間更新成功')

  return success(
    {
      id: inquiryId,
      visit_date,
    },
    '預約時間更新成功'
  )
}

// 導出處理函數
export const GET = withErrorHandler(handleGET, {
  module: 'FarmTourCalendarAPI',
  enableAuditLog: false,
})

export const PUT = withErrorHandler(handlePUT, {
  module: 'FarmTourCalendarAPI',
  enableAuditLog: true,
})
