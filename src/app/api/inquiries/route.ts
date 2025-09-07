/**
 * 庫存查詢 API 路由
 * 處理庫存查詢單的建立和查詢
 * 已整合統一權限中間件系統
 */

import { NextRequest } from 'next/server'
import { createServerSupabaseClient, getCurrentUser } from '@/lib/supabase-server'
import { inquiryServiceAdapter } from '@/services/inquiryServiceAdapter'
import { AuditLogger } from '@/services/auditLogService'
import { success, created } from '@/lib/api-response'
import { apiLogger } from '@/lib/logger'
import { InquirySchemas } from '@/lib/validation-schemas'
import { ValidationError, AuthorizationError } from '@/lib/errors'
import { withErrorHandler } from '@/lib/error-handler'

// 使用統一的詢問服務適配器
const inquiryService = inquiryServiceAdapter

// GET /api/inquiries - 取得庫存查詢單清單
async function handleGET(request: NextRequest) {
  // 驗證使用者認證
  const user = await getCurrentUser()
  if (!user) {
    throw new AuthorizationError('未認證或會話已過期')
  }
  // 解析並驗證查詢參數
  const url = new URL(request.url)
  const searchParams = Object.fromEntries(url.searchParams.entries())
  const result = InquirySchemas.query.safeParse(searchParams)

  if (!result.success) {
    const errors = result.error.issues
      .map(issue => `${issue.path.join('.')}: ${issue.message}`)
      .join(', ')
    throw new ValidationError(`查詢參數驗證失敗: ${errors}`)
  }

  // 檢查是否為管理員
  const supabase = await createServerSupabaseClient()
  const { data: profile } = await supabase
    .from('profiles')
    .select('role, name')
    .eq('id', user.id)
    .single() as { data: { role: string; name: string } | null; error: Error | null }

  const isAdmin = profile?.role === 'admin'
  const adminMode = result.data.admin === true

  apiLogger.info('查詢庫存查詢單清單', {
    metadata: {
      userId: user.id,
      userEmail: user.email,
      isAdmin,
      adminMode,
      queryParams: result.data,
    },
  })

  // 取得庫存查詢單清單
  let inquiries
  if (isAdmin && adminMode) {
    inquiries = await inquiryService.getAllInquiries(result.data)
  } else {
    inquiries = await inquiryService.getUserInquiries(user.id, result.data)
  }

  return success(inquiries, '庫存查詢單清單取得成功')
}

// POST /api/inquiries - 建立新庫存查詢單
async function handlePOST(request: NextRequest) {
  // 驗證使用者認證
  const user = await getCurrentUser()
  if (!user) {
    throw new AuthorizationError('未認證或會話已過期')
  }
  // 取得使用者資訊用於審計日誌
  const supabase = await createServerSupabaseClient()
  const { data: profile } = await supabase
    .from('profiles')
    .select('role, name')
    .eq('id', user.id)
    .single() as { data: { role: string; name: string } | null; error: Error | null }

  // 解析並驗證請求資料
  const body = await request.json()
  const result = InquirySchemas.create.safeParse(body)

  if (!result.success) {
    const errors = result.error.issues
      .map(issue => `${issue.path.join('.')}: ${issue.message}`)
      .join(', ')
    throw new ValidationError(`資料驗證失敗: ${errors}`)
  }

  apiLogger.info('創建庫存查詢單', {
    metadata: {
      userId: user.id,
      userEmail: user.email,
      inquiryType: result.data.inquiry_type,
      itemsCount: result.data.items?.length || 0,
    },
  })

  // 建立庫存查詢單
  const inquiry = await inquiryService.createInquiry(user.id, result.data)

  // 記錄詢問提交指標
  const { recordInquirySubmit } = await import('@/lib/metrics')
  recordInquirySubmit(result.data.inquiry_type || '一般詢問', user.id)

  // 記錄詢問單建立的審計日誌
  AuditLogger.logInquiryCreate(
    user.id,
    user.email || 'unknown@email.com',
    profile?.name,
    profile?.role,
    inquiry.id,
    {
      customer_name: inquiry.customer_name,
      customer_email: inquiry.customer_email,
      total_estimated_amount: inquiry.total_estimated_amount,
      items_count: inquiry.inquiry_items?.length || 0,
    },
    request
  ).catch(error => {
    // 非同步記錄失敗，不影響主要流程
    apiLogger.warn('審計日誌記錄失敗', {
      module: 'AuditLog',
      action: 'logInquiryCreate',
      metadata: { error: (error as Error).message },
    })
  })

  return created(inquiry, '詢問單建立成功')
}

// 導出 API 處理器 - 使用統一的錯誤處理系統
export const GET = withErrorHandler(handleGET, {
  module: 'InquiryAPI',
  enableAuditLog: false,
})

export const POST = withErrorHandler(handlePOST, {
  module: 'InquiryAPI',
  enableAuditLog: true,
})
