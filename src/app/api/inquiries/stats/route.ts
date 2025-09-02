/**
 * 庫存查詢統計 API 路由
 * 提供庫存查詢單統計資料給管理員使用
 * 已整合統一驗證和錯誤處理系統
 */

import { NextRequest } from 'next/server'
import { createServerSupabaseClient, getCurrentUser } from '@/lib/supabase-server'
import { success } from '@/lib/api-response'
import { apiLogger } from '@/lib/logger'
import { InquiryStatsSchemas } from '@/lib/validation-schemas'
import { ValidationError, AuthorizationError } from '@/lib/errors'
import { withErrorHandler } from '@/lib/error-handler'

/**
 * GET /api/inquiries/stats - 取得詢價統計資料（僅管理員）
 */
async function handleGET(request: NextRequest) {
  const startTime = Date.now()

  // 驗證使用者認證
  const user = await getCurrentUser()
  if (!user) {
    throw new AuthorizationError('未認證或會話已過期')
  }

  // 檢查是否為管理員
  const supabase = await createServerSupabaseClient()
  const { data: profile } = await supabase
    .from('profiles')
    .select('role, name')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'admin') {
    throw new AuthorizationError('只有管理員可以查看統計資料')
  }

  // 解析並驗證查詢參數
  const { searchParams } = new URL(request.url)
  const params = Object.fromEntries(searchParams.entries())
  const result = InquiryStatsSchemas.query.safeParse(params)

  if (!result.success) {
    const errors = result.error.issues
      .map(issue => `${issue.path.join('.')}: ${issue.message}`)
      .join(', ')
    throw new ValidationError(`查詢參數驗證失敗: ${errors}`)
  }

  apiLogger.info('查詢庫存查詢統計', {
    metadata: {
      userId: user.id,
      userEmail: user.email,
      timeframeDays: result.data.timeframe
    }
  })

  const daysAgo = result.data.timeframe

  // 計算日期範圍
  const startDate = new Date()
  startDate.setDate(startDate.getDate() - daysAgo)
  const startDateISO = startDate.toISOString()

  // 查詢基本統計
  const { data: basicStats, error: queryError } = await supabase
    .from('inquiries')
    .select('id, status, is_read, is_replied, created_at, replied_at')
    .gte('created_at', startDateISO)

  if (queryError) {
    apiLogger.error('查詢統計資料錯誤', queryError, {
      metadata: { userId: user.id }
    })
    throw new Error(queryError.message)
  }

  if (!basicStats) {
    throw new ValidationError('無法取得統計資料')
  }

  // 計算統計資料
  const totalInquiries = basicStats.length
  const unreadCount = basicStats.filter(i => !i.is_read).length
  const unrepliedCount = basicStats.filter(i => !i.is_replied && i.status !== 'cancelled').length
  const completedCount = basicStats.filter(i => i.status === 'completed').length
  const cancelledCount = basicStats.filter(i => i.status === 'cancelled').length

  // 計算平均回覆時間（小時）
  const repliedInquiries = basicStats.filter(i => i.replied_at)
  const avgResponseTime = repliedInquiries.length > 0 
    ? repliedInquiries.reduce((sum, inquiry) => {
        const createdTime = new Date(inquiry.created_at).getTime()
        const repliedTime = new Date(inquiry.replied_at!).getTime()
        return sum + (repliedTime - createdTime) / (1000 * 60 * 60) // 轉換為小時
      }, 0) / repliedInquiries.length
    : 0

  // 計算各狀態統計
  const statusStats = {
    pending: basicStats.filter(i => i.status === 'pending').length,
    quoted: basicStats.filter(i => i.status === 'quoted').length,
    confirmed: basicStats.filter(i => i.status === 'confirmed').length,
    completed: completedCount,
    cancelled: cancelledCount
  }

  // 計算每日統計（最近 7 天）
  const dailyStats = []
  for (let i = 6; i >= 0; i--) {
    const date = new Date()
    date.setDate(date.getDate() - i)
    const dayStart = new Date(date.setHours(0, 0, 0, 0))
    const dayEnd = new Date(date.setHours(23, 59, 59, 999))

    const dayInquiries = basicStats.filter(inquiry => {
      const inquiryDate = new Date(inquiry.created_at)
      return inquiryDate >= dayStart && inquiryDate <= dayEnd
    })

    const dayReplied = dayInquiries.filter(i => {
      if (!i.replied_at) return false
      const repliedDate = new Date(i.replied_at)
      return repliedDate >= dayStart && repliedDate <= dayEnd
    })

    dailyStats.push({
      date: dayStart.toISOString().split('T')[0],
      total_inquiries: dayInquiries.length,
      replied_inquiries: dayReplied.length,
      reply_rate: dayInquiries.length > 0 
        ? Math.round((dayReplied.length / dayInquiries.length) * 100) 
        : 0
    })
  }

  // 組合回應資料
  const statsData = {
    summary: {
      total_inquiries: totalInquiries,
      unread_count: unreadCount,
      unreplied_count: unrepliedCount,
      read_rate: totalInquiries > 0 ? Math.round(((totalInquiries - unreadCount) / totalInquiries) * 100) : 0,
      reply_rate: totalInquiries > 0 ? Math.round(((totalInquiries - unrepliedCount) / totalInquiries) * 100) : 0,
      completion_rate: totalInquiries > 0 ? Math.round((completedCount / totalInquiries) * 100) : 0,
      cancellation_rate: totalInquiries > 0 ? Math.round((cancelledCount / totalInquiries) * 100) : 0,
      avg_response_time_hours: Math.round(avgResponseTime * 10) / 10 // 保留一位小數
    },
    status_breakdown: statusStats,
    daily_trends: dailyStats,
    timeframe_days: daysAgo
  }

  // 記錄請求處理時間
  const processingTime = Date.now() - startTime
  
  apiLogger.info('統計資料查詢完成', {
    metadata: {
      userId: user.id,
      processingTimeMs: processingTime,
      totalInquiries,
      timeframeDays: daysAgo
    }
  })

  return success(
    statsData, 
    `統計資料已成功取得 (處理時間: ${processingTime}ms)`
  )
}

// 導出處理器 - 使用統一的錯誤處理系統
export const GET = withErrorHandler(handleGET, {
  module: 'InquiryStatsAPI',
  enableAuditLog: false
})