/**
 * 詢價 API v1 路由 - 單一詢價操作
 * 處理特定詢價的 CRUD 操作
 *
 * 功能：
 * - 取得單一詢價詳情
 * - 更新詢價資料
 * - 刪除詢價（管理員限定）
 * - 權限控制（使用者只能操作自己的詢價）
 */

import { NextRequest } from 'next/server'
import { requireAuth, requireAdmin, User } from '@/lib/api-middleware'
import { success } from '@/lib/api-response'
import { ValidationError, NotFoundError, AuthorizationError } from '@/lib/errors'
import { apiLogger } from '@/lib/logger'
import { z } from 'zod'
import { inquiryServiceV2 } from '@/services/v2/inquiryService'
import { UpdateInquiryRequest, InquiryUtils } from '@/types/inquiry'

// 更新詢價驗證架構
const UpdateInquirySchema = z.object({
  customer_name: z
    .string()
    .min(1, '客戶姓名不能為空')
    .max(100, '客戶姓名長度不能超過100字元')
    .optional(),
  customer_email: z.string().email('Email格式不正確').optional(),
  customer_phone: z.string().optional(),
  status: z.enum(['pending', 'quoted', 'confirmed', 'completed', 'cancelled']).optional(),
  notes: z.string().max(1000, '備註長度不能超過1000字元').optional(),
  total_estimated_amount: z.number().positive('總估價必須大於0').optional(),
  delivery_address: z.string().max(200, '配送地址長度不能超過200字元').optional(),
  preferred_delivery_date: z.string().optional(),

  // 管理員專用欄位
  is_read: z.boolean().optional(),
  is_replied: z.boolean().optional(),
})

// 管理員更新詢價狀態架構
const AdminUpdateStatusSchema = z.object({
  status: z.enum(['pending', 'quoted', 'confirmed', 'completed', 'cancelled'], {
    required_error: '狀態為必填',
  }),
  notes: z.string().max(1000, '備註長度不能超過1000字元').optional(),
})

/**
 * GET /api/v1/inquiries/[id] - 取得單一詢價詳情
 * 權限：使用者只能查看自己的詢價，管理員可查看所有
 */
async function handleGET(
  request: NextRequest,
  { user, params }: { user: User; params?: Promise<{ id: string }> }
) {
  const { id } = params ? await params : { id: '' }

  if (!id) {
    throw new ValidationError('缺少詢價 ID')
  }

  apiLogger.info('查詢單一詢價', {
    userId: user.id,
    metadata: {
      inquiryId: id,
      userEmail: user.email,
      isAdmin: user.isAdmin,
    },
  })

  let inquiry

  if (user.isAdmin) {
    // 管理員可查看所有詢價
    inquiry = await inquiryServiceV2.getInquiryByIdForAdmin(id)
  } else {
    // 一般使用者只能查看自己的詢價
    inquiry = await inquiryServiceV2.getInquiryById(user.id, id)
  }

  if (!inquiry) {
    throw new NotFoundError('找不到指定的詢價')
  }

  // 如果是管理員查看，標記為已讀
  if (user.isAdmin && !inquiry.is_read) {
    try {
      await inquiryServiceV2.update(id, {
        is_read: true,
        read_at: new Date().toISOString(),
      })
      inquiry.is_read = true
      inquiry.read_at = new Date().toISOString()

      apiLogger.info('詢價已標記為已讀', {
        userId: user.id,
        metadata: { inquiryId: id },
      })
    } catch (error) {
      // 標記已讀失敗不影響主要流程
      apiLogger.warn('標記已讀失敗', {
        metadata: {
          error: error instanceof Error ? error.message : String(error),
          inquiryId: id,
        },
      })
    }
  }

  // 增強返回資料
  const enhancedInquiry = {
    ...inquiry,
    inquiry_number: InquiryUtils.formatInquiryNumber(inquiry),
    total_quantity: InquiryUtils.calculateTotalQuantity(inquiry),
    calculated_total_amount: InquiryUtils.calculateTotalAmount(inquiry),
    read_status: InquiryUtils.getReadStatus(inquiry),
    needs_attention: InquiryUtils.needsAttention(inquiry),
    response_time: InquiryUtils.formatResponseTime(inquiry),
    response_time_hours: InquiryUtils.calculateResponseTime(inquiry),
    priority: InquiryUtils.getPriority(inquiry),
    available_status_transitions: InquiryUtils.getAvailableStatusTransitions(inquiry.status),
  }

  return success(enhancedInquiry, '詢價詳情取得成功')
}

/**
 * PUT /api/v1/inquiries/[id] - 更新詢價資料
 * 權限：使用者只能更新自己的詢價，管理員可更新所有
 */
async function handlePUT(
  request: NextRequest,
  { user, params }: { user: User; params?: Promise<{ id: string }> }
) {
  const { id } = params ? await params : { id: '' }

  if (!id) {
    throw new ValidationError('缺少詢價 ID')
  }

  // 解析並驗證更新資料
  const body = await request.json()
  const result = UpdateInquirySchema.safeParse(body)

  if (!result.success) {
    const errors = result.error.issues
      .map(issue => `${issue.path.join('.')}: ${issue.message}`)
      .join(', ')
    throw new ValidationError(`資料驗證失敗: ${errors}`)
  }

  const updateData = result.data

  // 檢查詢價是否存在及權限
  let existingInquiry
  if (user.isAdmin) {
    existingInquiry = await inquiryServiceV2.getInquiryByIdForAdmin(id)
  } else {
    existingInquiry = await inquiryServiceV2.getInquiryById(user.id, id)
  }

  if (!existingInquiry) {
    throw new NotFoundError('找不到指定的詢價或無權限修改')
  }

  // 狀態轉換驗證
  if (updateData.status && !user.isAdmin) {
    // 非管理員不能直接更新狀態
    throw new AuthorizationError('只有管理員可以更新詢價狀態')
  }

  if (
    updateData.status &&
    !InquiryUtils.isValidStatusTransition(existingInquiry.status, updateData.status)
  ) {
    throw new ValidationError(`無效的狀態轉換: ${existingInquiry.status} -> ${updateData.status}`)
  }

  // 管理員專用欄位權限檢查
  if ((updateData.is_read !== undefined || updateData.is_replied !== undefined) && !user.isAdmin) {
    throw new AuthorizationError('只有管理員可以更新讀取和回覆狀態')
  }

  apiLogger.info('更新詢價', {
    userId: user.id,
    metadata: {
      inquiryId: id,
      updateFields: Object.keys(updateData),
      isAdmin: user.isAdmin,
      statusChange: updateData.status
        ? {
            from: existingInquiry.status,
            to: updateData.status,
          }
        : null,
    },
  })

  // 處理狀態相關的自動更新
  const finalUpdateData = { ...updateData } as UpdateInquiryRequest

  if (updateData.status === 'quoted' && !updateData.is_replied) {
    finalUpdateData.is_replied = true
    finalUpdateData.replied_at = new Date().toISOString()
    // @ts-expect-error - 管理員更新時設置回覆人
    finalUpdateData.replied_by = user.isAdmin ? user.id : undefined
  }

  // 執行更新
  let updatedInquiry
  if (user.isAdmin) {
    updatedInquiry = await inquiryServiceV2.update(id, finalUpdateData)
  } else {
    updatedInquiry = await inquiryServiceV2.updateInquiry(user.id, id, finalUpdateData)
  }

  // 增強返回資料
  const enhancedInquiry = {
    ...updatedInquiry,
    inquiry_number: InquiryUtils.formatInquiryNumber(updatedInquiry),
    total_quantity: InquiryUtils.calculateTotalQuantity(updatedInquiry),
    calculated_total_amount: InquiryUtils.calculateTotalAmount(updatedInquiry),
    read_status: InquiryUtils.getReadStatus(updatedInquiry),
    needs_attention: InquiryUtils.needsAttention(updatedInquiry),
    response_time: InquiryUtils.formatResponseTime(updatedInquiry),
    available_status_transitions: InquiryUtils.getAvailableStatusTransitions(updatedInquiry.status),
  }

  return success(enhancedInquiry, '詢價更新成功')
}

/**
 * PATCH /api/v1/inquiries/[id]/status - 管理員快速更新詢價狀態
 * 權限：僅限管理員
 */
async function handlePATCH(
  request: NextRequest,
  { user, params }: { user: User; isAdmin: true; params?: Promise<{ id: string }> }
) {
  const { id } = params ? await params : { id: '' }

  if (!id) {
    throw new ValidationError('缺少詢價 ID')
  }

  // 解析並驗證狀態更新資料
  const body = await request.json()
  const result = AdminUpdateStatusSchema.safeParse(body)

  if (!result.success) {
    const errors = result.error.issues
      .map(issue => `${issue.path.join('.')}: ${issue.message}`)
      .join(', ')
    throw new ValidationError(`資料驗證失敗: ${errors}`)
  }

  const { status, notes } = result.data

  // 檢查詢價是否存在
  const existingInquiry = await inquiryServiceV2.getInquiryByIdForAdmin(id)
  if (!existingInquiry) {
    throw new NotFoundError('找不到指定的詢價')
  }

  // 驗證狀態轉換
  if (!InquiryUtils.isValidStatusTransition(existingInquiry.status, status)) {
    throw new ValidationError(`無效的狀態轉換: ${existingInquiry.status} -> ${status}`)
  }

  apiLogger.info('管理員快速更新詢價狀態', {
    userId: user.id,
    metadata: {
      inquiryId: id,
      statusChange: {
        from: existingInquiry.status,
        to: status,
      },
      hasNotes: !!notes,
    },
  })

  // 更新狀態
  const updatedInquiry = await inquiryServiceV2.updateInquiryStatus(id, status)

  // 如果有備註，同時更新備註
  if (notes) {
    const finalInquiry = await inquiryServiceV2.update(id, { notes })
    return success(
      {
        ...finalInquiry,
        inquiry_number: InquiryUtils.formatInquiryNumber(finalInquiry),
      },
      '詢價狀態和備註更新成功'
    )
  }

  return success(
    {
      ...updatedInquiry,
      inquiry_number: InquiryUtils.formatInquiryNumber(updatedInquiry),
    },
    '詢價狀態更新成功'
  )
}

/**
 * DELETE /api/v1/inquiries/[id] - 刪除詢價
 * 權限：僅限管理員
 */
async function handleDELETE(
  request: NextRequest,
  { user, params }: { user: User; isAdmin: true; params?: Promise<{ id: string }> }
) {
  const { id } = params ? await params : { id: '' }

  if (!id) {
    throw new ValidationError('缺少詢價 ID')
  }

  // 檢查詢價是否存在
  const existingInquiry = await inquiryServiceV2.getInquiryByIdForAdmin(id)
  if (!existingInquiry) {
    throw new NotFoundError('找不到指定的詢價')
  }

  apiLogger.info('管理員刪除詢價', {
    userId: user.id,
    metadata: {
      inquiryId: id,
      inquiryNumber: InquiryUtils.formatInquiryNumber(existingInquiry),
      customerEmail: existingInquiry.customer_email,
    },
  })

  // 執行刪除
  await inquiryServiceV2.delete(id)

  return success(null, '詢價刪除成功')
}

// 匯出處理器
export const GET = requireAuth(handleGET)
export const PUT = requireAuth(handlePUT)
export const PATCH = requireAdmin(handlePATCH)
export const DELETE = requireAdmin(handleDELETE)
