/**
 * 庫存查詢 API 路由
 * 處理庫存查詢單的建立和查詢
 * 已整合統一權限中間件系統
 */

import { NextRequest } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { createInquiryService } from '@/services/inquiryService'
import { supabaseServerInquiryService } from '@/services/supabaseInquiryService'
import { AuditLogger } from '@/services/auditLogService'
import { requireAuth, User } from '@/lib/api-middleware'
import { success, created } from '@/lib/api-response'
import { apiLogger } from '@/lib/logger'

// 建立庫存查詢服務實例
const inquiryService = createInquiryService(supabaseServerInquiryService)

// GET /api/inquiries - 取得庫存查詢單清單
async function handleGET(request: NextRequest, { user }: { user: User }) {
  // 解析查詢參數
  const url = new URL(request.url)
  const statusParam = url.searchParams.get('status')
  const queryParams = {
    page: parseInt(url.searchParams.get('page') || '1'),
    limit: parseInt(url.searchParams.get('limit') || '10'),
    search: url.searchParams.get('search') || undefined,
    status:
      statusParam &&
      ['pending', 'quoted', 'confirmed', 'completed', 'cancelled'].includes(statusParam)
        ? (statusParam as 'pending' | 'quoted' | 'confirmed' | 'completed' | 'cancelled')
        : undefined,
    admin: url.searchParams.get('admin') === 'true',
  }

  // 檢查是否為管理員
  const supabase = await createServerSupabaseClient()
  const { data: profile } = await supabase
    .from('profiles')
    .select('role, name')
    .eq('id', user.id)
    .single()

  const isAdmin = profile?.role === 'admin'
  const adminMode = queryParams.admin === true

  // 取得庫存查詢單清單
  let inquiries
  if (isAdmin && adminMode) {
    inquiries = await inquiryService.getAllInquiries(queryParams)
  } else {
    inquiries = await inquiryService.getUserInquiries(user.id, queryParams)
  }

  return success(inquiries, '庫存查詢單清單取得成功')
}

// POST /api/inquiries - 建立新庫存查詢單
async function handlePOST(request: NextRequest, { user }: { user: User }) {
  // 取得使用者資訊用於審計日誌
  const supabase = await createServerSupabaseClient()
  const { data: profile } = await supabase
    .from('profiles')
    .select('role, name')
    .eq('id', user.id)
    .single()

  // 解析請求資料
  const requestData = await request.json()

  // 建立庫存查詢單
  const inquiry = await inquiryService.createInquiry(user.id, requestData)

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

// 導出 API 處理器 - 使用新的權限中間件系統
export const GET = requireAuth(handleGET)
export const POST = requireAuth(handlePOST)
