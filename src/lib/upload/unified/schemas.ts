/**
 * Unified Upload API - Validation Schemas
 *
 * 統一圖片上傳 API 的驗證 Schema
 */

import { z } from 'zod'

/**
 * POST - 上傳表單驗證
 */
export const UploadFormSchema = z.object({
  /** 模組名稱 (products, locations, site-settings 等) */
  module: z.string().min(1, '模組名稱為必填'),
  /** 實體 ID */
  entityId: z.string().min(1, '實體ID為必填'),
  /** 圖片尺寸 (small, medium, large) */
  size: z.string().optional().default('medium'),
  /** 顯示順序 */
  display_position: z.coerce.number().optional().default(0),
  /** 是否生成多個尺寸 */
  generateMultipleSizes: z.coerce.boolean().optional().default(false),
  /** 替代文字 */
  alt_text: z.string().optional(),
})

/**
 * GET - 查詢參數驗證
 */
export const QuerySchema = z.object({
  /** 模組名稱 */
  module: z.string().min(1, '模組名稱為必填'),
  /** 實體 ID */
  entityId: z.string().min(1, '實體ID為必填'),
})

/**
 * DELETE - 刪除參數驗證
 */
export const DeleteSchema = z.object({
  /** 圖片 ID */
  imageId: z.string().min(1, '圖片ID為必填'),
})

/**
 * PATCH - 更新參數驗證
 */
export const UpdateSchema = z.object({
  /** 操作類型 (reorder 或 update) */
  action: z.enum(['reorder', 'update']),
  /** 模組名稱 */
  module: z.string().min(1, '模組名稱為必填'),
  /** 實體 ID */
  entityId: z.string().min(1, '實體ID為必填'),

  // reorder 操作的參數
  images: z
    .array(
      z.object({
        id: z.string(),
        display_position: z.number(),
      })
    )
    .optional(),

  // update 操作的參數
  imageId: z.string().optional(),
  data: z
    .object({
      alt_text: z.string().optional(),
      metadata: z.record(z.string(), z.any()).optional(),
    })
    .optional(),
})

/**
 * 型別推導
 */
export type UploadFormInput = z.infer<typeof UploadFormSchema>
export type QueryInput = z.infer<typeof QuerySchema>
export type DeleteInput = z.infer<typeof DeleteSchema>
export type UpdateInput = z.infer<typeof UpdateSchema>
