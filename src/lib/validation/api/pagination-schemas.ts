/**
 * 分頁與排序驗證 Schema
 * 提供通用的分頁和排序驗證規則
 */

import { z } from 'zod'

/**
 * 通用分頁參數 Schema
 */
export const PaginationSchema = z
  .object({
    limit: z.coerce.number().int().min(1).max(100).default(20),
    offset: z.coerce.number().int().min(0).default(0),
    page: z.coerce.number().int().min(1).optional(),
    per_page: z.coerce.number().int().min(1).max(100).optional(),
  })
  .transform(data => {
    // 如果有 page 和 per_page，轉換為 limit 和 offset
    if (data.page && data.per_page) {
      return {
        limit: data.per_page,
        offset: (data.page - 1) * data.per_page,
      }
    }
    return {
      limit: data.limit,
      offset: data.offset,
    }
  })

/**
 * 通用排序參數 Schema
 */
export const SortingSchema = z
  .object({
    sort_by: z.string().optional(),
    sort_order: z.enum(['asc', 'desc']).default('desc'),
    order_by: z.string().optional(), // 別名支援
  })
  .transform(data => ({
    sort_by: data.sort_by || data.order_by,
    sort_order: data.sort_order,
  }))

/**
 * 帶分頁的查詢 Schema
 * 簡化版本，避免複雜的 TypeScript 類型推斷問題
 */
export function createPaginatedQuerySchema(baseSchema: z.ZodObject<z.ZodRawShape>) {
  return baseSchema.merge(
    z.object({
      limit: z.coerce.number().int().min(1).max(100).default(20),
      offset: z.coerce.number().int().min(0).default(0),
      sort_by: z.string().optional(),
      sort_order: z.enum(['asc', 'desc']).default('desc'),
    })
  )
}

/**
 * API 回應驗證 Schema
 */
export const ApiResponseSchema = z.object({
  success: z.boolean(),
  data: z.any().optional(),
  error: z
    .object({
      code: z.string(),
      message: z.string(),
      details: z.any().optional(),
    })
    .optional(),
  meta: z
    .object({
      page: z.number().optional(),
      limit: z.number().optional(),
      total: z.number().optional(),
      hasMore: z.boolean().optional(),
    })
    .optional(),
})
