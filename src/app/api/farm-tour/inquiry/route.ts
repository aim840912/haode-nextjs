/**
 * 農場參觀預約詢問 API 路由
 * 處理農場參觀預約詢問的建立
 */

import { NextRequest } from 'next/server'
import { createServerSupabaseClient } from '@/lib/database/supabase-server'
import { inquiryService } from '@/services/core/inquiry/inquiryService'
import { AuditLogger } from '@/services/infrastructure/auditLogService'
import { withRateLimit, IdentifierStrategy } from '@/lib/rate-limiter'
import { withAuthAndError, User } from '@/lib/middleware/api-middleware'
import { CreateInquiryRequest, InquiryUtils } from '@/types/inquiry'
import { ValidationError, MethodNotAllowedError } from '@/lib/errors'
import { created } from '@/lib/api-response'
import { apiLogger } from '@/lib/logger'

// 農場參觀預約詢問的資料介面
interface FarmTourInquiryRequest {
  customer_name: string
  customer_email: string
  customer_phone?: string
  activity_title: string
  visit_date: string
  visitor_count: string
  notes?: string
}

// POST /api/farm-tour/inquiry - 建立農場參觀預約詢問
async function handlePOST(request: NextRequest, user: User) {
  // 取得使用者資訊
  const supabase = await createServerSupabaseClient()
  const { data: profile } = (await supabase
    .from('profiles')
    .select('role, name')
    .eq('id', user.id)
    .single()) as { data: { role: string; name: string } | null; error: Error | null }

  // 解析請求資料
  let farmTourData: FarmTourInquiryRequest
  try {
    farmTourData = await request.json()
  } catch {
    throw new ValidationError('請求資料格式錯誤')
  }

  // 轉換為詢問單格式
  const inquiryData: CreateInquiryRequest = {
    customer_name: farmTourData.customer_name,
    customer_email: farmTourData.customer_email,
    customer_phone: farmTourData.customer_phone,
    inquiry_type: 'farm_tour',
    activity_title: farmTourData.activity_title,
    visit_date: farmTourData.visit_date,
    visitor_count: farmTourData.visitor_count,
    notes: farmTourData.notes,
    // 農場參觀詢問不需要商品項目
    items: [],
  }

  // 驗證請求資料
  const validation = InquiryUtils.validateInquiryRequest(inquiryData)
  if (!validation.isValid) {
    throw new ValidationError(`資料驗證失敗: ${validation.errors.join(', ')}`)
  }

  // 建立詢問單
  const inquiry = await inquiryService.createInquiry(user.id, inquiryData)

  // 記錄農場參觀預約詢問建立的審計日誌
  AuditLogger.logInquiryCreate(
    user.id,
    user.email || 'unknown@email.com',
    profile?.name,
    profile?.role,
    inquiry.id,
    {
      customer_name: inquiry.customer_name,
      customer_email: inquiry.customer_email,
      inquiry_type: 'farm_tour',
      activity_title: inquiry.activity_title,
      visit_date: inquiry.visit_date,
      visitor_count: inquiry.visitor_count,
    },
    request
  ).catch(error => {
    // Note: Audit logging errors are handled silently to not break the main flow
    apiLogger.error('農場參觀詢問審計日誌記錄失敗', error as Error, {
      module: 'FarmTourInquiryAPI',
      metadata: { inquiryId: inquiry.id },
    })
  })

  return created(
    inquiry as unknown as Record<string, unknown>,
    '農場參觀預約詢問已成功提交，我們將盡快與您聯繫'
  )
}

// 套用認證中間件與 Rate Limiting 並導出 API 處理器
const authenticatedPOST = withAuthAndError(handlePOST, {
  module: 'FarmTourInquiryAPI',
  enableAuditLog: true,
})

export const POST = withRateLimit(authenticatedPOST, {
  maxRequests: 5,
  windowMs: 15 * 60 * 1000, // 15 分鐘
  strategy: IdentifierStrategy.COMBINED,
  enableAuditLog: true,
  includeHeaders: true,
  message: '農場參觀預約提交過於頻繁，請等待 15 分鐘後重試',
})

// 處理其他不支援的 HTTP 方法
async function handleUnsupportedMethods(): Promise<never> {
  throw new MethodNotAllowedError('不支援的請求方法')
}

export const GET = withAuthAndError(handleUnsupportedMethods, { module: 'FarmTourInquiryAPI' })
export const PUT = withAuthAndError(handleUnsupportedMethods, { module: 'FarmTourInquiryAPI' })
export const DELETE = withAuthAndError(handleUnsupportedMethods, { module: 'FarmTourInquiryAPI' })
export const PATCH = withAuthAndError(handleUnsupportedMethods, { module: 'FarmTourInquiryAPI' })
