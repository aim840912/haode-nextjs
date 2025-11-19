/**
 * 單一庫存查詢 API 路由
 * 處理特定庫存查詢單的查詢、更新和刪除
 */

import { NextRequest, NextResponse } from 'next/server'
import { success } from '@/lib/api-response'
import { createServerSupabaseClient } from '@/lib/database/supabase-server'
import { ValidationError, NotFoundError, AuthorizationError } from '@/lib/errors'
import { apiLogger } from '@/lib/logger'
import { withAuthAndError, User } from '@/lib/middleware/api-middleware'
import { InquirySchemas } from '@/lib/validation'
import { inquiryService } from '@/services/core/inquiry/InquiryService'
import { AuditLogger } from '@/services/infrastructure/auditLogService'
import type { Database } from '@/types/database'
import { InquiryUtils } from '@/types/inquiry'
import { validateRouteId, checkAdminRole, logAuditWithErrorHandling } from './helpers'
import type { SupabaseClient } from '@supabase/supabase-js'

/**
 * GET /api/inquiries/:id - 取得單一詢價單
 * - 一般使用者只能查看自己的詢價單
 * - 管理員可使用 ?admin=true 查看所有詢價單（會自動標記已讀）
 */
async function handleGET(request: NextRequest, user: User, context?: unknown) {
  const inquiryId = await validateRouteId(context)
  const { isAdmin } = await checkAdminRole(user.id)

  const { searchParams } = new URL(request.url)
  const adminMode = searchParams.get('admin') === 'true'

  apiLogger.info('查詢單一庫存查詢單', {
    metadata: { userId: user.id, userEmail: user.email, inquiryId, isAdmin, adminMode },
  })

  // 取得庫存查詢單
  const inquiry =
    isAdmin && adminMode
      ? await inquiryService.getInquiryByIdForAdmin(inquiryId)
      : await inquiryService.getInquiryById(user.id, inquiryId)

  if (!inquiry) {
    throw new NotFoundError('找不到庫存查詢單')
  }

  // 管理員查看時自動標記為已讀
  if (isAdmin && adminMode && !inquiry.is_read) {
    try {
      const supabase = await createServerSupabaseClient()
      await (supabase as unknown as SupabaseClient<Database>)
        .from('inquiries')
        .update({ is_read: true, read_at: new Date().toISOString() })
        .eq('id', inquiryId)

      inquiry.is_read = true
      inquiry.read_at = new Date().toISOString()
    } catch (error) {
      apiLogger.warn('標記詢問單已讀失敗', {
        metadata: { inquiryId, error: (error as Error).message },
      })
    }
  }

  return success(inquiry, '查詢成功')
}

/**
 * PUT /api/inquiries/:id - 更新詢價單
 * - 一般使用者可更新：客戶資訊、備註、配送地址
 * - 管理員可額外更新：狀態、讀取/回覆標記
 * - 狀態更新需驗證轉換規則
 */
async function handlePUT(request: NextRequest, user: User, context?: unknown) {
  const inquiryId = await validateRouteId(context)
  const body = await request.json()
  const result = InquirySchemas.update.safeParse(body)

  if (!result.success) {
    const errors = result.error.issues.map(i => `${i.path.join('.')}: ${i.message}`).join(', ')
    throw new ValidationError(`資料驗證失敗: ${errors}`)
  }

  const { isAdmin, role, name } = await checkAdminRole(user.id)

  // 檢查權限
  if (result.data.status && !isAdmin) {
    throw new AuthorizationError('只有管理員可以更新庫存查詢單狀態')
  }
  if ((result.data.is_read !== undefined || result.data.is_replied !== undefined) && !isAdmin) {
    throw new AuthorizationError('只有管理員可以更新庫存查詢單讀取/回覆狀態')
  }

  apiLogger.info('更新庫存查詢單', {
    metadata: { userId: user.id, inquiryId, changes: Object.keys(result.data), isAdmin },
  })

  // 管理員更新狀態
  if (result.data.status && isAdmin) {
    const currentInquiry = await inquiryService.getInquiryByIdForAdmin(inquiryId)
    if (!currentInquiry) throw new NotFoundError('找不到庫存查詢單')

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

    const updatedInquiry = await inquiryService.updateInquiryStatus(inquiryId, result.data.status)

    await logAuditWithErrorHandling(
      AuditLogger.logInquiryStatusChange(
        user.id,
        user.email || 'unknown@email.com',
        name,
        role,
        inquiryId,
        currentInquiry.status,
        result.data.status,
        {
          customer_name: currentInquiry.customer_name,
          customer_email: currentInquiry.customer_email,
        },
        request
      ),
      'logInquiryStatusChange'
    )

    return success(updatedInquiry, '詢問單狀態更新成功')
  }

  // 一般使用者更新
  const previousInquiry = await inquiryService.getInquiryById(user.id, inquiryId)
  if (!previousInquiry) throw new NotFoundError('找不到庫存查詢單')

  const updatedInquiry = await inquiryService.updateInquiry(user.id, inquiryId, result.data)

  await logAuditWithErrorHandling(
    AuditLogger.logInquiryUpdate(
      user.id,
      user.email || 'unknown@email.com',
      name,
      role,
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
    ),
    'logInquiryUpdate'
  )

  return success(updatedInquiry, '詢問單更新成功')
}

/**
 * DELETE /api/inquiries/:id - 刪除詢價單
 * - 僅限管理員操作
 * - 會記錄完整審計日誌
 */
async function handleDELETE(request: NextRequest, user: User, context?: unknown) {
  const inquiryId = await validateRouteId(context)
  const { isAdmin, role, name } = await checkAdminRole(user.id)

  if (!isAdmin) {
    throw new AuthorizationError('只有管理員可以刪除詢問單')
  }

  apiLogger.info('刪除庫存查詢單', {
    metadata: { userId: user.id, inquiryId, adminUser: name },
  })

  const inquiryToDelete = await inquiryService.getInquiryByIdForAdmin(inquiryId)
  if (!inquiryToDelete) throw new NotFoundError('找不到庫存查詢單')

  await inquiryService.deleteInquiry(inquiryId)

  await logAuditWithErrorHandling(
    AuditLogger.logInquiryDelete(
      user.id,
      user.email || 'unknown@email.com',
      name,
      role,
      inquiryId,
      {
        customer_name: inquiryToDelete.customer_name,
        customer_email: inquiryToDelete.customer_email,
        status: inquiryToDelete.status,
        total_estimated_amount: inquiryToDelete.total_estimated_amount,
        items_count: inquiryToDelete.inquiry_items?.length || 0,
      },
      request
    ),
    'logInquiryDelete'
  )

  return success({ id: inquiryId }, '詢問單刪除成功')
}

/**
 * PATCH /api/inquiries/:id - 快速更新詢價單狀態
 * - 僅限管理員操作
 * - 適用於批次標記已讀或已回覆
 * - 自動設定時間戳記
 */
async function handlePATCH(request: NextRequest, user: User, context?: unknown) {
  const inquiryId = await validateRouteId(context)
  const { isAdmin, role, name } = await checkAdminRole(user.id)

  if (!isAdmin) {
    throw new AuthorizationError('只有管理員可以更新庫存查詢單狀態')
  }

  const body = await request.json()
  const result = InquirySchemas.statusUpdate.safeParse(body)

  if (!result.success) {
    const errors = result.error.issues.map(i => `${i.path.join('.')}: ${i.message}`).join(', ')
    throw new ValidationError(`資料驗證失敗: ${errors}`)
  }

  apiLogger.info('快速更新庫存查詢單狀態', {
    metadata: { userId: user.id, inquiryId, changes: Object.keys(result.data), adminUser: name },
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

  const currentInquiry = await inquiryService.getInquiryByIdForAdmin(inquiryId)
  if (!currentInquiry) throw new NotFoundError('找不到庫存查詢單')

  // 執行更新
  const supabase = await createServerSupabaseClient()
  const { data: updatedInquiry, error } = await (supabase as unknown as SupabaseClient<Database>)
    .from('inquiries')
    .update(updateData)
    .eq('id', inquiryId)
    .select(
      `
      *,
      inquiry_items (
        id, product_id, product_name, product_category, quantity,
        unit_price, total_price, notes, created_at
      )
    `
    )
    .single()

  if (error) throw error

  // 記錄審計日誌
  if (result.data.is_read !== undefined || result.data.is_replied !== undefined) {
    const previousStatus = `read:${currentInquiry.is_read},replied:${currentInquiry.is_replied}`
    const newStatus = `read:${updateData.is_read ?? currentInquiry.is_read},replied:${updateData.is_replied ?? currentInquiry.is_replied}`

    await logAuditWithErrorHandling(
      AuditLogger.logInquiryStatusChange(
        user.id,
        user.email || 'unknown@email.com',
        name,
        role,
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
      ),
      'logInquiryStatusChange'
    )
  }

  return success(updatedInquiry, '詢問單更新成功')
}

// 導出處理器 - 使用組合函數：權限檢查 + 錯誤處理
export const GET = withAuthAndError(handleGET, { module: 'InquiryDetailAPI' })
export const PUT = withAuthAndError(handlePUT, { module: 'InquiryDetailAPI', enableAuditLog: true })
export const DELETE = withAuthAndError(handleDELETE, {
  module: 'InquiryDetailAPI',
  enableAuditLog: true,
})
export const PATCH = withAuthAndError(handlePATCH, {
  module: 'InquiryDetailAPI',
  enableAuditLog: true,
})
