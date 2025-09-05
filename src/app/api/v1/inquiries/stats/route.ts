/**
 * 詢價統計 API v1 路由
 * 提供詢價相關的統計資料和分析
 *
 * 功能：
 * - 管理員詢價統計儀表板
 * - 使用者個人詢價統計
 * - 趨勢分析和效能指標
 * - 可自定義時間範圍
 */

import { NextRequest } from 'next/server'
import { requireAuth, User } from '@/lib/api-middleware'
import { success } from '@/lib/api-response'
import { ValidationError } from '@/lib/errors'
import { apiLogger } from '@/lib/logger'
import { z } from 'zod'
import { inquiryServiceV2 } from '@/services/v2/inquiryService'
import { InquiryStatus, InquiryType, InquiryUtils } from '@/types/inquiry'

// 統計資料介面定義
interface InquiryBasicStats {
  total_inquiries: number
  unread_count: number
  unreplied_count: number
  completed_count: number
  cancelled_count: number
  read_rate: number
  reply_rate: number
  completion_rate: number
  cancellation_rate: number
  avg_response_time_hours: number
}

interface StatusBreakdownItem {
  count: number
  total_amount: number
  percentage: number
}

interface TypeBreakdownItem {
  count: number
  total_amount: number
  percentage: number
}

interface TrendItem {
  date: string
  total_inquiries: number
  replied_inquiries: number
  reply_rate: number
  total_amount: number
}

// 統計計算用的簡化詢價介面
interface SimpleInquiry {
  id: string
  status: InquiryStatus
  inquiry_type: InquiryType
  is_read: boolean
  is_replied: boolean
  created_at: string
  replied_at?: string
  total_estimated_amount: number
}

// 統計回應資料介面
interface StatsResponseData {
  summary: InquiryBasicStats
  timeframe: {
    days: number
    start_date: string
    end_date: string
  }
  status_breakdown?: Record<InquiryStatus, StatusBreakdownItem>
  type_breakdown?: Record<InquiryType, TypeBreakdownItem>
  trends?: TrendItem[]
  recent_trends?: TrendItem[]
}

// 統計查詢參數驗證架構
const StatsQuerySchema = z.object({
  // 時間範圍（天數）
  timeframe: z.coerce.number().int().positive().max(365).default(30),

  // 詳細程度
  detail_level: z.enum(['summary', 'detailed', 'full']).default('summary'),

  // 分組方式
  group_by: z.enum(['day', 'week', 'month', 'status', 'type']).default('day'),

  // 管理員模式
  admin_mode: z.coerce.boolean().default(false),

  // 特定篩選
  status: z.enum(['pending', 'quoted', 'confirmed', 'completed', 'cancelled']).optional(),
  inquiry_type: z.enum(['product', 'farm_tour']).optional(),
})

// 使用者統計查詢架構（較簡化）
const UserStatsQuerySchema = z.object({
  timeframe: z.coerce.number().int().positive().max(365).default(30),
  group_by: z.enum(['day', 'week', 'month']).default('day'),
})

/**
 * 計算統計資料的輔助函數
 */
class InquiryStatsCalculator {
  /**
   * 計算基礎統計
   */
  static calculateBasicStats(inquiries: SimpleInquiry[]): InquiryBasicStats {
    const total = inquiries.length
    const unread = inquiries.filter(i => !i.is_read).length
    const unreplied = inquiries.filter(i => !i.is_replied && i.status !== 'cancelled').length
    const completed = inquiries.filter(i => i.status === 'completed').length
    const cancelled = inquiries.filter(i => i.status === 'cancelled').length

    // 計算回覆時間
    const repliedInquiries = inquiries.filter(i => i.replied_at)
    const avgResponseTime =
      repliedInquiries.length > 0
        ? repliedInquiries.reduce((sum, inquiry) => {
            return (
              sum +
              (InquiryUtils.calculateResponseTime({
                ...inquiry,
                inquiry_items: [],
                user_id: '',
                customer_name: '',
                customer_email: '',
                updated_at: inquiry.created_at,
              }) ?? 0)
            )
          }, 0) / repliedInquiries.length
        : 0

    return {
      total_inquiries: total,
      unread_count: unread,
      unreplied_count: unreplied,
      completed_count: completed,
      cancelled_count: cancelled,
      read_rate: total > 0 ? Math.round(((total - unread) / total) * 100) : 0,
      reply_rate: total > 0 ? Math.round(((total - unreplied) / total) * 100) : 0,
      completion_rate: total > 0 ? Math.round((completed / total) * 100) : 0,
      cancellation_rate: total > 0 ? Math.round((cancelled / total) * 100) : 0,
      avg_response_time_hours: Math.round(avgResponseTime * 10) / 10,
    }
  }

  /**
   * 按狀態分組統計
   */
  static calculateStatusBreakdown(
    inquiries: SimpleInquiry[]
  ): Record<InquiryStatus, StatusBreakdownItem> {
    const statuses: InquiryStatus[] = ['pending', 'quoted', 'confirmed', 'completed', 'cancelled']

    return statuses.reduce(
      (acc, status) => {
        const statusInquiries = inquiries.filter(i => i.status === status)
        const totalAmount = statusInquiries.reduce(
          (sum, i) => sum + (i.total_estimated_amount || 0),
          0
        )

        acc[status] = {
          count: statusInquiries.length,
          total_amount: totalAmount,
          percentage:
            inquiries.length > 0
              ? Math.round((statusInquiries.length / inquiries.length) * 100)
              : 0,
        }
        return acc
      },
      {} as Record<InquiryStatus, StatusBreakdownItem>
    )
  }

  /**
   * 按類型分組統計
   */
  static calculateTypeBreakdown(
    inquiries: SimpleInquiry[]
  ): Record<InquiryType, TypeBreakdownItem> {
    const types: InquiryType[] = ['product', 'farm_tour']

    return types.reduce(
      (acc, type) => {
        const typeInquiries = inquiries.filter(i => i.inquiry_type === type)
        const totalAmount = typeInquiries.reduce(
          (sum, i) => sum + (i.total_estimated_amount || 0),
          0
        )

        acc[type] = {
          count: typeInquiries.length,
          total_amount: totalAmount,
          percentage:
            inquiries.length > 0 ? Math.round((typeInquiries.length / inquiries.length) * 100) : 0,
        }
        return acc
      },
      {} as Record<InquiryType, TypeBreakdownItem>
    )
  }

  /**
   * 計算時間趨勢
   */
  static calculateTrends(
    inquiries: SimpleInquiry[],
    days: number,
    groupBy: string = 'day'
  ): TrendItem[] {
    const trends: TrendItem[] = []
    const now = new Date()

    for (let i = days - 1; i >= 0; i--) {
      const date = new Date(now)
      date.setDate(date.getDate() - i)

      let dateStart: Date, dateEnd: Date, dateKey: string

      if (groupBy === 'day') {
        dateStart = new Date(date.setHours(0, 0, 0, 0))
        dateEnd = new Date(date.setHours(23, 59, 59, 999))
        dateKey = dateStart.toISOString().split('T')[0]
      } else if (groupBy === 'week') {
        // 簡化：按週第一天分組
        const weekStart = new Date(date)
        weekStart.setDate(date.getDate() - date.getDay())
        dateStart = new Date(weekStart.setHours(0, 0, 0, 0))
        dateEnd = new Date(weekStart.setDate(weekStart.getDate() + 6))
        dateEnd.setHours(23, 59, 59, 999)
        dateKey = dateStart.toISOString().split('T')[0]
      } else {
        // month
        dateStart = new Date(date.getFullYear(), date.getMonth(), 1)
        dateEnd = new Date(date.getFullYear(), date.getMonth() + 1, 0, 23, 59, 59, 999)
        dateKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
      }

      const periodInquiries = inquiries.filter(inquiry => {
        const inquiryDate = new Date(inquiry.created_at)
        return inquiryDate >= dateStart && inquiryDate <= dateEnd
      })

      const repliedCount = periodInquiries.filter(i => {
        if (!i.replied_at) return false
        const repliedDate = new Date(i.replied_at)
        return repliedDate >= dateStart && repliedDate <= dateEnd
      }).length

      trends.push({
        date: dateKey,
        total_inquiries: periodInquiries.length,
        replied_inquiries: repliedCount,
        reply_rate:
          periodInquiries.length > 0
            ? Math.round((repliedCount / periodInquiries.length) * 100)
            : 0,
        total_amount: periodInquiries.reduce((sum, i) => sum + (i.total_estimated_amount || 0), 0),
      })
    }

    return trends
  }
}

/**
 * GET /api/v1/inquiries/stats - 取得詢價統計資料
 * 權限：使用者登入（管理員看全部，使用者看自己的）
 */
async function handleGET(request: NextRequest, user: User) {
  const startTime = Date.now()

  // 解析並驗證查詢參數
  const url = new URL(request.url)
  const queryParams = Object.fromEntries(url.searchParams.entries())

  // 根據使用者權限選擇驗證架構
  const schema = user.isAdmin ? StatsQuerySchema : UserStatsQuerySchema
  const result = schema.safeParse(queryParams)

  if (!result.success) {
    const errors = result.error.issues
      .map(issue => `${issue.path.join('.')}: ${issue.message}`)
      .join(', ')
    throw new ValidationError(`查詢參數驗證失敗: ${errors}`)
  }

  const params = result.data

  // 檢查管理員模式權限
  if ('admin_mode' in params && params.admin_mode && !user.isAdmin) {
    throw new ValidationError('管理員模式需要管理員權限')
  }

  apiLogger.info('查詢詢價統計', {
    userId: user.id,
    metadata: {
      timeframeDays: params.timeframe,
      detailLevel: 'detail_level' in params ? params.detail_level : 'summary',
      groupBy: params.group_by,
      isAdminMode: 'admin_mode' in params ? params.admin_mode : false,
      userEmail: user.email,
    },
  })

  // 計算查詢日期範圍
  const endDate = new Date()
  const startDate = new Date()
  startDate.setDate(startDate.getDate() - params.timeframe)

  // 根據權限取得資料
  let inquiries
  if (user.isAdmin && 'admin_mode' in params && params.admin_mode) {
    // 管理員模式：查詢所有詢價
    inquiries = await inquiryServiceV2.getAllInquiries({
      start_date: startDate.toISOString(),
      end_date: endDate.toISOString(),
      status: 'status' in params ? (params as { status: InquiryStatus }).status : undefined,
      inquiry_type:
        'inquiry_type' in params
          ? (params as { inquiry_type: InquiryType }).inquiry_type
          : undefined,
    })
  } else {
    // 一般使用者模式：只查詢自己的詢價
    inquiries = await inquiryServiceV2.getUserInquiries(user.id, {
      start_date: startDate.toISOString(),
      end_date: endDate.toISOString(),
    })
  }

  // 轉換為簡單的統計格式
  const simpleInquiries = inquiries.map(i => ({
    id: i.id,
    status: i.status,
    inquiry_type: i.inquiry_type,
    is_read: i.is_read,
    is_replied: i.is_replied,
    created_at: i.created_at,
    replied_at: i.replied_at,
    total_estimated_amount: i.total_estimated_amount || 0,
  }))

  // 計算基礎統計
  const basicStats = InquiryStatsCalculator.calculateBasicStats(simpleInquiries)

  // 構建回應資料
  const statsData: StatsResponseData = {
    summary: basicStats,
    timeframe: {
      days: params.timeframe,
      start_date: startDate.toISOString().split('T')[0],
      end_date: endDate.toISOString().split('T')[0],
    },
  }

  // 根據詳細程度添加額外資料
  if (user.isAdmin && 'detail_level' in params) {
    if (params.detail_level === 'detailed' || params.detail_level === 'full') {
      statsData.status_breakdown = InquiryStatsCalculator.calculateStatusBreakdown(simpleInquiries)
      statsData.type_breakdown = InquiryStatsCalculator.calculateTypeBreakdown(simpleInquiries)
    }

    if (params.detail_level === 'full') {
      statsData.trends = InquiryStatsCalculator.calculateTrends(
        simpleInquiries,
        Math.min(params.timeframe, 30), // 最多30天的趨勢
        params.group_by
      )
    }
  }

  // 添加趨勢資料（簡化版本給一般使用者）
  if (!user.isAdmin || !('detail_level' in params) || params.detail_level === 'summary') {
    statsData.recent_trends = InquiryStatsCalculator.calculateTrends(
      simpleInquiries,
      7, // 最近7天
      'day'
    )
  }

  const processingTime = Date.now() - startTime

  apiLogger.info('詢價統計查詢完成', {
    userId: user.id,
    metadata: {
      processingTimeMs: processingTime,
      inquiriesCount: inquiries.length,
      timeframeDays: params.timeframe,
    },
  })

  return success(
    statsData,
    `統計資料查詢成功 (${inquiries.length} 筆詢價，處理時間 ${processingTime}ms)`
  )
}

// 匯出處理器
export const GET = requireAuth(handleGET)
