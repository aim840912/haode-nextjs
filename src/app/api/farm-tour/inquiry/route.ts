/**
 * 農場參觀預約詢問 API 路由
 * 處理農場參觀預約詢問的建立
 */

import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient, getCurrentUser } from '@/lib/supabase-server'
import { inquiryServiceAdapter } from '@/services/inquiryServiceAdapter'
import { AuditLogger } from '@/services/auditLogService'
import { withRateLimit, IdentifierStrategy } from '@/lib/rate-limiter'
import { withErrorHandler } from '@/lib/error-handler'
import { CreateInquiryRequest, InquiryUtils } from '@/types/inquiry'
import { AuthorizationError, ValidationError, MethodNotAllowedError } from '@/lib/errors'
import { created } from '@/lib/api-response'

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

// 使用統一的詢問服務適配器
const inquiryService = inquiryServiceAdapter

// POST /api/farm-tour/inquiry - 建立農場參觀預約詢問
async function handlePOST(request: NextRequest) {
  // 驗證使用者認證
  const user = await getCurrentUser()
  if (!user) {
    throw new AuthorizationError('未認證或會話已過期')
  }

  // 取得使用者資訊
  const supabase = await createServerSupabaseClient()
  const { data: profile } = await supabase
    .from('profiles')
    .select('role, name')
    .eq('id', user.id)
    .single() as { data: { role: string; name: string } | null; error: any }

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
    console.error('農場參觀詢問審計日誌記錄失敗:', error)
  })

  return created(
    inquiry as unknown as Record<string, unknown>,
    '農場參觀預約詢問已成功提交，我們將盡快與您聯繫'
  )
}

// 套用錯誤處理與 Rate Limiting 並導出 API 處理器
const wrappedPOST = withErrorHandler(handlePOST, {
  module: 'FarmTourInquiry',
  enableAuditLog: true,
})

export const POST = withRateLimit(wrappedPOST, {
  maxRequests: 5,
  windowMs: 15 * 60 * 1000, // 15 分鐘
  strategy: IdentifierStrategy.COMBINED,
  enableAuditLog: true,
  includeHeaders: true,
  message: '農場參觀預約提交過於頻繁，請等待 15 分鐘後重試',
})

// 處理其他不支援的 HTTP 方法

async function handleUnsupportedMethods(request: NextRequest): Promise<never> {
  throw new MethodNotAllowedError('不支援的請求方法')
}

export const GET = withErrorHandler(handleUnsupportedMethods, {
  module: 'FarmTourInquiry',
  enableAuditLog: false,
})

export const PUT = withErrorHandler(handleUnsupportedMethods, {
  module: 'FarmTourInquiry',
  enableAuditLog: false,
})

export const DELETE = withErrorHandler(handleUnsupportedMethods, {
  module: 'FarmTourInquiry',
  enableAuditLog: false,
})

export const PATCH = withErrorHandler(handleUnsupportedMethods, {
  module: 'FarmTourInquiry',
  enableAuditLog: false,
})
