/**
 * API v1 範例路由
 * 展示新版本 API 的標準結構和最佳實踐
 *
 * 特點：
 * - 使用統一的權限中間件
 * - 標準的錯誤處理
 * - 清晰的類型定義
 * - 完整的日誌記錄
 * - RESTful 設計原則
 */

import { NextRequest } from 'next/server'
import { requireAuth, requireAdmin, optionalAuth, User } from '@/lib/api-middleware'
import { success, created, successWithPagination } from '@/lib/api-response'
import { ValidationError, NotFoundError } from '@/lib/errors'
import { apiLogger } from '@/lib/logger'
import { z } from 'zod'

// 範例資料類型定義
interface ExampleResource {
  id: string
  title: string
  description?: string
  createdAt: string
  updatedAt: string
  authorId: string
  isPublic: boolean
}

// 請求驗證架構
const CreateExampleSchema = z.object({
  title: z.string().min(1, '標題不能為空').max(100, '標題長度不能超過 100 字元'),
  description: z.string().optional(),
  isPublic: z.boolean().default(false),
})

const UpdateExampleSchema = CreateExampleSchema.partial()

const QueryExampleSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(10),
  search: z.string().optional(),
  isPublic: z.coerce.boolean().optional(),
  sort: z.enum(['createdAt', 'title', 'updatedAt']).default('createdAt'),
  order: z.enum(['asc', 'desc']).default('desc'),
})

// 模擬的資料服務（實際專案中會是真實的服務）
class ExampleService {
  private static mockData: ExampleResource[] = []

  static async findMany(params: z.infer<typeof QueryExampleSchema>) {
    // 模擬資料庫查詢
    let filtered = this.mockData

    if (params.search) {
      filtered = filtered.filter(item =>
        item.title.toLowerCase().includes(params.search!.toLowerCase())
      )
    }

    if (params.isPublic !== undefined) {
      filtered = filtered.filter(item => item.isPublic === params.isPublic)
    }

    // 模擬分頁
    const offset = (params.page - 1) * params.limit
    const items = filtered.slice(offset, offset + params.limit)

    return {
      items,
      total: filtered.length,
      page: params.page,
      limit: params.limit,
      hasMore: offset + params.limit < filtered.length,
    }
  }

  static async findById(id: string) {
    return this.mockData.find(item => item.id === id) || null
  }

  static async create(
    data: z.infer<typeof CreateExampleSchema>,
    authorId: string
  ): Promise<ExampleResource> {
    const newItem: ExampleResource = {
      id: Math.random().toString(36).substring(7),
      ...data,
      authorId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }

    this.mockData.push(newItem)
    return newItem
  }

  static async update(id: string, data: z.infer<typeof UpdateExampleSchema>) {
    const index = this.mockData.findIndex(item => item.id === id)
    if (index === -1) return null

    this.mockData[index] = {
      ...this.mockData[index],
      ...data,
      updatedAt: new Date().toISOString(),
    }

    return this.mockData[index]
  }

  static async delete(id: string) {
    const index = this.mockData.findIndex(item => item.id === id)
    if (index === -1) return false

    this.mockData.splice(index, 1)
    return true
  }
}

/**
 * GET /api/v1/example - 取得資源列表
 * 支援分頁、搜尋、排序、篩選
 * 權限：可選認證（登入使用者看到更多資料）
 */
async function handleGET(request: NextRequest, { user }: { user: User | null }) {
  // 解析查詢參數並驗證
  const url = new URL(request.url)
  const queryParams = Object.fromEntries(url.searchParams.entries())

  const result = QueryExampleSchema.safeParse(queryParams)
  if (!result.success) {
    const errors = result.error.issues
      .map(issue => `${issue.path.join('.')}: ${issue.message}`)
      .join(', ')
    throw new ValidationError(`查詢參數驗證失敗: ${errors}`)
  }

  apiLogger.info('查詢範例資源列表', {
    userId: user?.id,
    metadata: {
      params: result.data,
      hasUser: !!user,
    },
  })

  // 根據使用者狀態調整查詢邏輯
  let queryOptions = result.data
  if (!user) {
    // 未登入使用者只能看公開內容
    queryOptions = { ...queryOptions, isPublic: true }
  }

  const data = await ExampleService.findMany(queryOptions)

  return successWithPagination(data, '查詢成功')
}

/**
 * POST /api/v1/example - 建立新資源
 * 權限：需要使用者登入
 */
async function handlePOST(request: NextRequest, { user }: { user: User }) {
  // 解析並驗證請求資料
  const body = await request.json()
  const result = CreateExampleSchema.safeParse(body)

  if (!result.success) {
    const errors = result.error.issues
      .map(issue => `${issue.path.join('.')}: ${issue.message}`)
      .join(', ')
    throw new ValidationError(`資料驗證失敗: ${errors}`)
  }

  apiLogger.info('建立範例資源', {
    userId: user.id,
    metadata: {
      title: result.data.title,
      isPublic: result.data.isPublic,
    },
  })

  const newResource = await ExampleService.create(result.data, user.id)

  return created(newResource, '建立成功')
}

/**
 * PUT /api/v1/example/[id] - 更新資源
 * 權限：需要使用者登入（只能更新自己的資源，管理員可更新所有）
 */
async function handlePUT(
  request: NextRequest,
  { user, params }: { user: User; params?: Record<string, string> }
) {
  const resourceId = params?.id
  if (!resourceId) {
    throw new ValidationError('缺少資源 ID')
  }

  // 檢查資源是否存在
  const existingResource = await ExampleService.findById(resourceId)
  if (!existingResource) {
    throw new NotFoundError('找不到指定的資源')
  }

  // 檢查使用者權限（只能更新自己的資源）
  if (existingResource.authorId !== user.id) {
    // 這裡可以檢查是否為管理員
    throw new ValidationError('沒有權限更新此資源')
  }

  // 解析並驗證更新資料
  const body = await request.json()
  const result = UpdateExampleSchema.safeParse(body)

  if (!result.success) {
    const errors = result.error.issues
      .map(issue => `${issue.path.join('.')}: ${issue.message}`)
      .join(', ')
    throw new ValidationError(`資料驗證失敗: ${errors}`)
  }

  apiLogger.info('更新範例資源', {
    userId: user.id,
    metadata: {
      resourceId,
      changes: Object.keys(result.data),
    },
  })

  const updatedResource = await ExampleService.update(resourceId, result.data)

  return success(updatedResource, '更新成功')
}

/**
 * DELETE /api/v1/example/[id] - 刪除資源
 * 權限：需要管理員權限
 */
async function handleDELETE(
  request: NextRequest,
  { user, params }: { user: User; isAdmin: true; params?: Record<string, string> }
) {
  const resourceId = params?.id
  if (!resourceId) {
    throw new ValidationError('缺少資源 ID')
  }

  // 檢查資源是否存在
  const existingResource = await ExampleService.findById(resourceId)
  if (!existingResource) {
    throw new NotFoundError('找不到指定的資源')
  }

  apiLogger.info('刪除範例資源', {
    userId: user.id,
    metadata: {
      resourceId,
      resourceTitle: existingResource.title,
    },
  })

  const deleted = await ExampleService.delete(resourceId)
  if (!deleted) {
    throw new Error('刪除失敗')
  }

  return success(null, '刪除成功')
}

// 匯出 API 處理器 - 展示不同權限級別的用法
export const GET = optionalAuth(handleGET) // 公開 API，可選認證
export const POST = requireAuth(handlePOST) // 需要登入
export const PUT = requireAuth(handlePUT) // 需要登入
export const DELETE = requireAdmin(handleDELETE) // 需要管理員權限
