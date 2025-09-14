/**
 * 單一庫存查詢 API 路由
 * 處理特定庫存查詢單的查詢、更新和刪除
 * 已整合統一驗證和錯誤處理系統
 */

import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient, getCurrentUser } from '@/lib/supabase-server'
import { inquiryServiceV2Simple as inquiryServiceAdapter } from '@/services/v2/inquiryServiceSimple'
import { AuditLogger } from '@/services/auditLogService'
import { InquiryUtils } from '@/types/inquiry'
import { success } from '@/lib/api-response'
import { apiLogger } from '@/lib/logger'
import { InquirySchemas, CommonValidations } from '@/lib/validation-schemas'
import { ValidationError, NotFoundError, AuthorizationError } from '@/lib/errors'
import { withErrorHandler } from '@/lib/error-handler'
import type { Database } from '@/types/database'
import type { SupabaseClient } from '@supabase/supabase-js'

// 使用統一的詢問服務適配器
const inquiryService = inquiryServiceAdapter

/**
 * GET /api/inquiries/[id] - 取得特定庫存查詢單
 */
async function handleGET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id: inquiryId } = await params

  // 驗證使用者認證
  const user = await getCurrentUser()
  if (!user) {
    throw new AuthorizationError('未認證或會話已過期')
  }

  // 驗證 UUID 格式
  const paramResult = CommonValidations.uuidParam.safeParse({ id: inquiryId })
  if (!paramResult.success) {
    const errors = paramResult.error.issues
      .map(issue => `${issue.path.join('.')}: ${issue.message}`)
      .join(', ')
    throw new ValidationError(`參數驗證失敗: ${errors}`)
  }

  // 檢查是否為管理員
  const supabase = await createServerSupabaseClient()
  const { data: profile } = (await supabase
    .from('profiles')
    .select('role, name')
    .eq('id', user.id)
    .single()) as { data: { role: string; name: string } | null; error: Error | null }

  const isAdmin = profile?.role === 'admin'
  const { searchParams } = new URL(request.url)
  const adminMode = searchParams.get('admin') === 'true'

  apiLogger.info('查詢單一庫存查詢單', {
    metadata: {
      userId: user.id,
      userEmail: user.email,
      inquiryId,
      isAdmin,
      adminMode,
    },
  })

  // 取得庫存查詢單
  let inquiry
  if (isAdmin && adminMode) {
    // 管理員可以查看任何庫存查詢單
    inquiry = await inquiryServiceAdapter.getInquiryByIdForAdmin(inquiryId)
  } else {
    // 一般使用者只能查看自己的庫存查詢單
    inquiry = await inquiryService.getInquiryById(user.id, inquiryId)
  }

  if (!inquiry) {
    throw new NotFoundError('找不到庫存查詢單')
  }

  // 管理員查看庫存查詢單時自動標記為已讀
  if (isAdmin && adminMode && !inquiry.is_read) {
    try {
      await (supabase as unknown as SupabaseClient<Database>)
        .from('inquiries')
        .update({
          is_read: true,
          read_at: new Date().toISOString(),
        })
        .eq('id', inquiryId)

      // 更新本地資料物件
      inquiry.is_read = true
      inquiry.read_at = new Date().toISOString()
    } catch (error) {
      apiLogger.warn('標記詢問單已讀失敗', {
        metadata: { inquiryId, error: (error as Error).message },
      })
    }
  }

  // 記錄庫存查詢單查看的審計日誌
  AuditLogger.logInquiryView(
    user.id,
    user.email || 'unknown@email.com',
    profile?.name,
    profile?.role,
    inquiryId,
    {
      customer_name: inquiry.customer_name,
      customer_email: inquiry.customer_email,
      status: inquiry.status,
      admin_mode: isAdmin && adminMode,
      marked_as_read: isAdmin && adminMode && !inquiry.is_read,
    },
    request
  ).catch(error => {
    apiLogger.warn('審計日誌記錄失敗', {
      module: 'AuditLog',
      action: 'logInquiryView',
      metadata: { error: (error as Error).message },
    })
  })

  return success(inquiry, '查詢成功')
}

/**
 * PUT /api/inquiries/[id] - 更新庫存查詢單
 */
async function handlePUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id: inquiryId } = await params

  // 驗證使用者認證
  const user = await getCurrentUser()
  if (!user) {
    throw new AuthorizationError('未認證或會話已過期')
  }

  // 驗證 UUID 格式
  const paramResult = CommonValidations.uuidParam.safeParse({ id: inquiryId })
  if (!paramResult.success) {
    const errors = paramResult.error.issues
      .map(issue => `${issue.path.join('.')}: ${issue.message}`)
      .join(', ')
    throw new ValidationError(`參數驗證失敗: ${errors}`)
  }

  // 解析並驗證請求資料
  const body = await request.json()
  const result = InquirySchemas.update.safeParse(body)

  if (!result.success) {
    const errors = result.error.issues
      .map(issue => `${issue.path.join('.')}: ${issue.message}`)
      .join(', ')
    throw new ValidationError(`資料驗證失敗: ${errors}`)
  }

  // 檢查是否為管理員
  const supabase = await createServerSupabaseClient()
  const { data: profile } = (await supabase
    .from('profiles')
    .select('role, name')
    .eq('id', user.id)
    .single()) as { data: { role: string; name: string } | null; error: Error | null }

  const isAdmin = profile?.role === 'admin'

  // 如果是狀態更新，檢查管理員權限
  if (result.data.status && !isAdmin) {
    throw new AuthorizationError('只有管理員可以更新庫存查詢單狀態')
  }

  // 如果是讀取/回覆狀態更新，檢查管理員權限
  if ((result.data.is_read !== undefined || result.data.is_replied !== undefined) && !isAdmin) {
    throw new AuthorizationError('只有管理員可以更新庫存查詢單讀取/回覆狀態')
  }

  apiLogger.info('更新庫存查詢單', {
    metadata: {
      userId: user.id,
      userEmail: user.email,
      inquiryId,
      changes: Object.keys(result.data),
      isAdmin,
    },
  })

  // 如果有狀態更新，驗證狀態轉換
  if (result.data.status && isAdmin) {
    // 先取得當前庫存查詢單
    const currentInquiry = await inquiryServiceAdapter.getInquiryByIdForAdmin(inquiryId)
    if (!currentInquiry) {
      throw new NotFoundError('找不到庫存查詢單')
    }

    // 驗證狀態轉換
    if (!InquiryUtils.isValidStatusTransition(currentInquiry.status, result.data.status)) {
      return NextResponse.json(
        {
          error: `無法從 ${currentInquiry.status} 轉換到 ${result.data.status}`,
          availableTransitions: InquiryUtils.getAvailableStatusTransitions(currentInquiry.status),
          success: false,
        },
        { status: 400 }
      )
    }

    // 管理員更新狀態
    const updatedInquiry = await inquiryService.updateInquiryStatus(inquiryId, result.data.status)

    // 記錄詢問單狀態變更的審計日誌
    AuditLogger.logInquiryStatusChange(
      user.id,
      user.email || 'unknown@email.com',
      profile?.name,
      profile?.role,
      inquiryId,
      currentInquiry.status,
      result.data.status,
      {
        customer_name: currentInquiry.customer_name,
        customer_email: currentInquiry.customer_email,
      },
      request
    ).catch(error => {
      apiLogger.warn('審計日誌記錄失敗', {
        module: 'AuditLog',
        action: 'logInquiryStatusChange',
        metadata: { error: (error as Error).message },
      })
    })

    return success(updatedInquiry, '詢問單狀態更新成功')
  }

  // 取得更新前的詢問單資料（用於審計日誌）
  const previousInquiry = await inquiryService.getInquiryById(user.id, inquiryId)
  if (!previousInquiry) {
    throw new NotFoundError('找不到庫存查詢單')
  }

  // 一般使用者更新詢問單
  const updatedInquiry = await inquiryService.updateInquiry(user.id, inquiryId, result.data)

  // 記錄詢問單更新的審計日誌
  AuditLogger.logInquiryUpdate(
    user.id,
    user.email || 'unknown@email.com',
    profile?.name,
    profile?.role,
    inquiryId,
    {
      customer_name: previousInquiry.customer_name,
      customer_email: previousInquiry.customer_email,
      notes: previousInquiry.notes,
      delivery_address: previousInquiry.delivery_address,
    },
    {
      customer_name: updatedInquiry.customer_name,
      customer_email: updatedInquiry.customer_email,
      notes: updatedInquiry.notes,
      delivery_address: updatedInquiry.delivery_address,
    },
    request
  ).catch(error => {
    apiLogger.warn('審計日誌記錄失敗', {
      module: 'AuditLog',
      action: 'logInquiryUpdate',
      metadata: { error: (error as Error).message },
    })
  })

  return success(updatedInquiry, '詢問單更新成功')
}

/**
 * DELETE /api/inquiries/[id] - 刪除詢問單（僅管理員）
 */
async function handleDELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id: inquiryId } = await params

  // 驗證使用者認證
  const user = await getCurrentUser()
  if (!user) {
    throw new AuthorizationError('未認證或會話已過期')
  }

  // 驗證 UUID 格式
  const paramResult = CommonValidations.uuidParam.safeParse({ id: inquiryId })
  if (!paramResult.success) {
    const errors = paramResult.error.issues
      .map(issue => `${issue.path.join('.')}: ${issue.message}`)
      .join(', ')
    throw new ValidationError(`參數驗證失敗: ${errors}`)
  }

  // 檢查是否為管理員
  const supabase = await createServerSupabaseClient()
  const { data: profile } = (await supabase
    .from('profiles')
    .select('role, name')
    .eq('id', user.id)
    .single()) as { data: { role: string; name: string } | null; error: Error | null }

  if (profile?.role !== 'admin') {
    throw new AuthorizationError('只有管理員可以刪除詢問單')
  }

  apiLogger.info('刪除庫存查詢單', {
    metadata: {
      userId: user.id,
      userEmail: user.email,
      inquiryId,
      adminUser: profile?.name,
    },
  })

  // 先取得詢問單資料（用於審計日誌）
  const inquiryToDelete = await inquiryServiceAdapter.getInquiryByIdForAdmin(inquiryId)
  if (!inquiryToDelete) {
    throw new NotFoundError('找不到庫存查詢單')
  }

  // 刪除詢問單
  await inquiryService.deleteInquiry(inquiryId)

  // 記錄詢問單刪除的審計日誌
  AuditLogger.logInquiryDelete(
    user.id,
    user.email || 'unknown@email.com',
    profile?.name,
    profile?.role,
    inquiryId,
    {
      customer_name: inquiryToDelete.customer_name,
      customer_email: inquiryToDelete.customer_email,
      status: inquiryToDelete.status,
      total_estimated_amount: inquiryToDelete.total_estimated_amount,
      items_count: inquiryToDelete.inquiry_items?.length || 0,
    },
    request
  ).catch(error => {
    apiLogger.warn('審計日誌記錄失敗', {
      module: 'AuditLog',
      action: 'logInquiryDelete',
      metadata: { error: (error as Error).message },
    })
  })

  return success({ id: inquiryId }, '詢問單刪除成功')
}

/**
 * PATCH /api/inquiries/[id] - 快速更新詢問單讀取/回覆狀態（僅管理員）
 */
async function handlePATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id: inquiryId } = await params

  // 驗證使用者認證
  const user = await getCurrentUser()
  if (!user) {
    throw new AuthorizationError('未認證或會話已過期')
  }

  // 驗證 UUID 格式
  const paramResult = CommonValidations.uuidParam.safeParse({ id: inquiryId })
  if (!paramResult.success) {
    const errors = paramResult.error.issues
      .map(issue => `${issue.path.join('.')}: ${issue.message}`)
      .join(', ')
    throw new ValidationError(`參數驗證失敗: ${errors}`)
  }

  // 檢查是否為管理員
  const supabase = await createServerSupabaseClient()
  const { data: profile } = (await supabase
    .from('profiles')
    .select('role, name')
    .eq('id', user.id)
    .single()) as { data: { role: string; name: string } | null; error: Error | null }

  if (profile?.role !== 'admin') {
    throw new AuthorizationError('只有管理員可以更新庫存查詢單狀態')
  }

  // 解析並驗證請求資料
  const body = await request.json()
  const result = InquirySchemas.statusUpdate.safeParse(body)

  if (!result.success) {
    const errors = result.error.issues
      .map(issue => `${issue.path.join('.')}: ${issue.message}`)
      .join(', ')
    throw new ValidationError(`資料驗證失敗: ${errors}`)
  }

  apiLogger.info('快速更新庫存查詢單狀態', {
    metadata: {
      userId: user.id,
      userEmail: user.email,
      inquiryId,
      changes: Object.keys(result.data),
      adminUser: profile?.name,
    },
  })

  // 準備更新資料
  const updateData: Record<string, unknown> = {}

  if (result.data.is_read !== undefined) {
    updateData.is_read = result.data.is_read
    if (result.data.is_read && !updateData.read_at) {
      updateData.read_at = new Date().toISOString()
    }
  }

  if (result.data.is_replied !== undefined) {
    updateData.is_replied = result.data.is_replied
    if (result.data.is_replied && !updateData.replied_at) {
      updateData.replied_at = new Date().toISOString()
      updateData.replied_by = user.id
    }
  }

  if (result.data.status !== undefined) {
    updateData.status = result.data.status
  }

  // 先取得當前詢問單資料
  const currentInquiry = await inquiryServiceAdapter.getInquiryByIdForAdmin(inquiryId)
  if (!currentInquiry) {
    throw new NotFoundError('找不到庫存查詢單')
  }

  // 執行更新
  const { data: updatedInquiry, error } = await (supabase as unknown as SupabaseClient<Database>)
    .from('inquiries')
    .update(updateData)
    .eq('id', inquiryId)
    .select(
      `
      *, 
      inquiry_items (
        id,
        product_id,
        product_name,
        product_category,
        quantity,
        unit_price,
        total_price,
        notes,
        created_at
      )
    `
    )
    .single()

  if (error) {
    throw error
  }

  // 記錄審計日誌
  if (result.data.is_read !== undefined || result.data.is_replied !== undefined) {
    const previousStatus = `read:${currentInquiry.is_read},replied:${currentInquiry.is_replied}`
    const newStatus = `read:${updateData.is_read ?? currentInquiry.is_read},replied:${updateData.is_replied ?? currentInquiry.is_replied}`

    AuditLogger.logInquiryStatusChange(
      user.id,
      user.email || 'unknown@email.com',
      profile?.name,
      profile?.role,
      inquiryId,
      previousStatus,
      newStatus,
      {
        customer_name: currentInquiry.customer_name,
        customer_email: currentInquiry.customer_email,
        is_read_changed: result.data.is_read !== undefined,
        is_replied_changed: result.data.is_replied !== undefined,
      },
      request
    ).catch(error => {
      apiLogger.warn('審計日誌記錄失敗', {
        module: 'AuditLog',
        action: 'logInquiryStatusChange',
        metadata: { error: (error as Error).message },
      })
    })
  }

  return success(updatedInquiry, '詢問單更新成功')
}

// 導出處理器 - 使用統一的錯誤處理系統
export const GET = withErrorHandler(handleGET, {
  module: 'InquiryDetailAPI',
  enableAuditLog: false,
})

export const PUT = withErrorHandler(handlePUT, {
  module: 'InquiryDetailAPI',
  enableAuditLog: true,
})

export const DELETE = withErrorHandler(handleDELETE, {
  module: 'InquiryDetailAPI',
  enableAuditLog: true,
})

export const PATCH = withErrorHandler(handlePATCH, {
  module: 'InquiryDetailAPI',
  enableAuditLog: true,
})
