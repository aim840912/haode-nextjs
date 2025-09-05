/**
 * 詢價 API v1 路由 - 主要端點
 * 提供現代化的詢價管理 API，使用統一權限中間件
 *
 * 功能：
 * - 取得詢價列表（支援分頁、篩選、搜尋）
 * - 建立新詢價
 * - 統一錯誤處理和日誌記錄
 * - 支援管理員和一般使用者不同權限
 */

import { NextRequest } from 'next/server'
import { requireAuth, User } from '@/lib/api-middleware'
import { created, successWithPagination } from '@/lib/api-response'
import { ValidationError } from '@/lib/errors'
import { apiLogger } from '@/lib/logger'
import { z } from 'zod'
import { inquiryServiceV2 } from '@/services/v2/inquiryService'
import { InquiryQueryParams, CreateInquiryRequest, InquiryUtils } from '@/types/inquiry'

// 查詢參數驗證架構
const QueryInquiriesSchema = z.object({
  // 分頁參數
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),

  // 篩選參數
  status: z.enum(['pending', 'quoted', 'confirmed', 'completed', 'cancelled']).optional(),
  inquiry_type: z.enum(['product', 'farm_tour']).optional(),
  customer_email: z.string().email('Email格式不正確').optional(),

  // 日期範圍篩選
  start_date: z.string().datetime('開始日期格式不正確').optional(),
  end_date: z.string().datetime('結束日期格式不正確').optional(),

  // 排序參數
  sort_by: z.enum(['created_at', 'updated_at', 'total_estimated_amount']).default('created_at'),
  sort_order: z.enum(['asc', 'desc']).default('desc'),

  // 特殊篩選
  unread_only: z.coerce.boolean().optional(),
  unreplied_only: z.coerce.boolean().optional(),

  // 管理員模式（需要管理員權限）
  admin_mode: z.coerce.boolean().optional(),

  // 搜尋
  search: z.string().optional(),
})

// 建立詢價驗證架構
const CreateInquirySchema = z
  .object({
    customer_name: z.string().min(1, '客戶姓名不能為空').max(100, '客戶姓名長度不能超過100字元'),
    customer_email: z.string().email('Email格式不正確'),
    customer_phone: z.string().optional(),
    inquiry_type: z.enum(['product', 'farm_tour'], {
      message: '詢問類型必須是 product 或 farm_tour',
    }),
    notes: z.string().max(1000, '備註長度不能超過1000字元').optional(),
    delivery_address: z.string().max(200, '配送地址長度不能超過200字元').optional(),
    preferred_delivery_date: z.string().optional(),

    // 產品詢價專用欄位
    items: z
      .array(
        z.object({
          product_id: z.string().min(1, '產品ID不能為空'),
          product_name: z.string().min(1, '產品名稱不能為空'),
          product_category: z.string().optional(),
          quantity: z.number().positive('數量必須大於0'),
          unit_price: z.number().positive('單價必須大於0').optional(),
          notes: z.string().max(200, '備註長度不能超過200字元').optional(),
        })
      )
      .optional(),

    // 農場參觀專用欄位
    activity_title: z.string().max(100, '活動標題長度不能超過100字元').optional(),
    visit_date: z.string().optional(),
    visitor_count: z.string().max(20, '參觀人數說明長度不能超過20字元').optional(),
  })
  .refine(
    data => {
      // 根據詢問類型驗證必要欄位
      if (data.inquiry_type === 'product') {
        return data.items && data.items.length > 0
      } else if (data.inquiry_type === 'farm_tour') {
        return data.activity_title && data.visit_date && data.visitor_count
      }
      return true
    },
    {
      message: '根據詢問類型，必須提供相對應的詳細資訊',
    }
  )

/**
 * GET /api/v1/inquiries - 取得詢價列表
 * 支援分頁、篩選、搜尋功能
 * 權限：需要使用者登入
 */
async function handleGET(request: NextRequest, user: User) {
  // 解析並驗證查詢參數
  const url = new URL(request.url)
  const queryParams = Object.fromEntries(url.searchParams.entries())

  const result = QueryInquiriesSchema.safeParse(queryParams)
  if (!result.success) {
    const errors = result.error.issues
      .map(issue => `${issue.path.join('.')}: ${issue.message}`)
      .join(', ')
    throw new ValidationError(`查詢參數驗證失敗: ${errors}`)
  }

  const params = result.data

  apiLogger.info('查詢詢價列表', {
    userId: user.id,
    metadata: {
      params,
      isAdminMode: params.admin_mode,
      userEmail: user.email,
    },
  })

  // 檢查管理員模式權限
  if (params.admin_mode && !user.isAdmin) {
    throw new ValidationError('管理員模式需要管理員權限')
  }

  // 構建查詢選項
  const queryOptions: InquiryQueryParams = {
    status: params.status,
    inquiry_type: params.inquiry_type,
    customer_email: params.customer_email,
    start_date: params.start_date,
    end_date: params.end_date,
    limit: params.limit,
    offset: (params.page - 1) * params.limit,
    sort_by: params.sort_by,
    sort_order: params.sort_order,
    unread_only: params.unread_only,
    unreplied_only: params.unreplied_only,
  }

  // 根據權限取得資料
  let inquiries
  if (params.admin_mode && user.isAdmin) {
    // 管理員模式：取得所有詢價
    if (params.search) {
      inquiries = await inquiryServiceV2.searchInquiries(params.search, {
        sortBy: params.sort_by,
        sortOrder: params.sort_order,
      })
    } else {
      inquiries = await inquiryServiceV2.getAllInquiries(queryOptions)
    }
  } else {
    // 一般使用者模式：只取得自己的詢價
    if (params.search) {
      const allUserInquiries = await inquiryServiceV2.getUserInquiries(user.id)
      inquiries = allUserInquiries.filter(
        inquiry =>
          inquiry.customer_name.toLowerCase().includes(params.search!.toLowerCase()) ||
          inquiry.customer_email.toLowerCase().includes(params.search!.toLowerCase()) ||
          (inquiry.notes && inquiry.notes.toLowerCase().includes(params.search!.toLowerCase()))
      )
    } else {
      inquiries = await inquiryServiceV2.getUserInquiries(user.id, queryOptions)
    }
  }

  // 計算分頁資訊
  const total = inquiries.length
  const hasMore = params.page * params.limit < total

  // 套用分頁切割（如果不是搜尋模式）
  if (!params.search) {
    const startIndex = queryOptions.offset || 0
    const endIndex = startIndex + (queryOptions.limit || 20)
    inquiries = inquiries.slice(startIndex, endIndex)
  }

  // 增強返回資料
  const enhancedInquiries = inquiries.map(inquiry => ({
    ...inquiry,
    inquiry_number: InquiryUtils.formatInquiryNumber(inquiry),
    total_quantity: InquiryUtils.calculateTotalQuantity(inquiry),
    calculated_total_amount: InquiryUtils.calculateTotalAmount(inquiry),
    read_status: InquiryUtils.getReadStatus(inquiry),
    needs_attention: InquiryUtils.needsAttention(inquiry),
    response_time: InquiryUtils.formatResponseTime(inquiry),
    priority: InquiryUtils.getPriority(inquiry),
  }))

  const paginationData = {
    items: enhancedInquiries,
    total,
    page: params.page,
    limit: params.limit,
    hasMore,
    totalPages: Math.ceil(total / params.limit),
    filters: {
      status: params.status,
      inquiry_type: params.inquiry_type,
      search: params.search,
      admin_mode: params.admin_mode,
    },
  }

  return successWithPagination(paginationData, `成功取得 ${inquiries.length} 筆詢價資料`)
}

/**
 * POST /api/v1/inquiries - 建立新詢價
 * 權限：需要使用者登入
 */
async function handlePOST(request: NextRequest, user: User) {
  // 解析並驗證請求資料
  const body = await request.json()
  const result = CreateInquirySchema.safeParse(body)

  if (!result.success) {
    const errors = result.error.issues
      .map(issue => `${issue.path.join('.')}: ${issue.message}`)
      .join(', ')
    throw new ValidationError(`資料驗證失敗: ${errors}`)
  }

  const inquiryData = result.data

  apiLogger.info('建立詢價', {
    userId: user.id,
    metadata: {
      inquiryType: inquiryData.inquiry_type,
      itemsCount: inquiryData.items?.length || 0,
      customerEmail: inquiryData.customer_email,
      hasItems: !!inquiryData.items?.length,
      isProductInquiry: inquiryData.inquiry_type === 'product',
      isFarmTourInquiry: inquiryData.inquiry_type === 'farm_tour',
    },
  })

  // 建立詢價
  const newInquiry = await inquiryServiceV2.createInquiry(
    user.id,
    inquiryData as CreateInquiryRequest
  )

  // 增強返回資料
  const enhancedInquiry = {
    ...newInquiry,
    inquiry_number: InquiryUtils.formatInquiryNumber(newInquiry),
    total_quantity: InquiryUtils.calculateTotalQuantity(newInquiry),
    calculated_total_amount: InquiryUtils.calculateTotalAmount(newInquiry),
    read_status: InquiryUtils.getReadStatus(newInquiry),
  }

  // 記錄業務指標
  try {
    const { recordInquirySubmit } = await import('@/lib/metrics')
    recordInquirySubmit(inquiryData.inquiry_type, user.id)
  } catch (error) {
    // 指標記錄失敗不影響主流程
    apiLogger.warn('詢價指標記錄失敗', {
      metadata: {
        error: error instanceof Error ? error.message : String(error),
        inquiryId: newInquiry.id,
      },
    })
  }

  return created(enhancedInquiry, '詢價建立成功')
}

// 匯出處理器
export const GET = requireAuth(handleGET)
export const POST = requireAuth(handlePOST)
