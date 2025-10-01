/**
 * 上傳驗證 Schema
 * 用於檔案上傳的驗證
 */

import { z } from 'zod'
import { StringSchemas } from '../base/string-schemas'

/**
 * 上傳相關 Schema
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
