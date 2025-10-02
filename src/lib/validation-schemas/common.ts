/**
 * 通用驗證 Schema
 *
 * 提供檔案上傳、圖片管理、搜尋和其他通用功能的驗證規則
 */

import { z } from 'zod'
import { StringSchemas, NumberSchemas } from './base'

/**
 * 上傳檔案相關 Schema
 */
export const UploadSchemas = {
  /** 圖片上傳 */
  image: z.object({
    file: z.any().refine(file => {
      if (!(file instanceof File)) return false

      // 檢查檔案大小 (5MB)
      if (file.size > 5 * 1024 * 1024) return false

      // 檢查檔案類型
      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
      return allowedTypes.includes(file.type)
    }, '請上傳有效的圖片檔案 (JPG, PNG, WebP, 最大 5MB)'),

    productId: StringSchemas.uuid.optional(),
    generateMultipleSizes: z.boolean().default(false),
    compress: z.boolean().default(true),
  }),

  /** POST 圖片上傳驗證（FormData 格式）*/
  imageUpload: z.object({
    productId: StringSchemas.uuid,
    generateMultipleSizes: z
      .enum(['true', 'false'])
      .optional()
      .transform(val => val === 'true'),
    compress: z
      .enum(['true', 'false'])
      .optional()
      .transform(val => val === 'true'),
    size: z.enum(['thumbnail', 'medium', 'large']).optional().default('medium'),
  }),

  /** GET 列出圖片驗證 */
  listImages: z.object({
    productId: StringSchemas.uuid,
  }),

  /** DELETE 刪除圖片驗證 */
  deleteImage: z.object({
    filePath: z.string().min(1, '檔案路徑不能為空'),
  }),
}

/**
 * 圖片上傳 API 相關 Schema
 */
export const ImageUploadSchemas = {
  /** POST 上傳表單驗證 */
  uploadForm: z
    .object({
      productId: StringSchemas.uuid.optional(),
      momentId: StringSchemas.uuid.optional(),
      generateMultipleSizes: z
        .enum(['true', 'false'])
        .optional()
        .transform(val => val === 'true'),
      compress: z
        .enum(['true', 'false'])
        .optional()
        .transform(val => val === 'true'),
      size: z.enum(['thumbnail', 'medium', 'large']).optional().default('medium'),
    })
    .refine(data => data.productId || data.momentId, {
      message: '必須提供 productId 或 momentId',
    }),

  /** GET 查詢參數驗證 */
  query: z
    .object({
      productId: StringSchemas.uuid.optional(),
      momentId: StringSchemas.uuid.optional(),
    })
    .refine(data => data.productId || data.momentId, {
      message: '必須提供 productId 或 momentId',
    }),

  /** DELETE 刪除參數驗證 */
  deleteParams: z.object({
    filePath: z.string().min(1, '檔案路徑不能為空').max(500, '檔案路徑過長'),
  }),
}

/**
 * 通用驗證組合
 */
export const CommonValidations = {
  /** UUID 參數驗證 */
  uuidParam: z.object({
    id: StringSchemas.uuid,
  }),

  /** 管理員金鑰驗證 */
  adminKey: z
    .object({
      'x-admin-key': z.string().min(32, '無效的管理員金鑰'),
    })
    .or(
      z.object({
        adminKey: z.string().min(32, '無效的管理員金鑰'),
      })
    ),
}

/**
 * 搜尋相關 Schema
 */
export const SearchSchemas = {
  /** 搜尋查詢 */
  query: z.object({
    q: StringSchemas.nonEmpty.max(100, '搜尋關鍵字不能超過 100 字元'),
    limit: z.coerce
      .number()
      .int('limit 必須是整數')
      .min(1, 'limit 至少為 1')
      .max(100, 'limit 不能超過 100')
      .default(20),
    offset: z.coerce.number().int('offset 必須是整數').min(0, 'offset 不能小於 0').default(0),
  }),
}

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
 * API 回應驗證 Schema
 */
export const ApiResponseSchema = z.object({
  success: z.boolean(),
  data: z.unknown().optional(),
  error: z.string().optional(),
  message: z.string().optional(),
  details: z.unknown().optional(),
  pagination: z
    .object({
      total: NumberSchemas.nonNegativeInt,
      page: NumberSchemas.positiveInt,
      per_page: NumberSchemas.positiveInt,
      total_pages: NumberSchemas.positiveInt,
    })
    .optional(),
})
