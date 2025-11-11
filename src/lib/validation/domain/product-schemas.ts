/**
 * 產品驗證 Schema
 * 用於產品的建立、更新驗證
 */

import { z } from 'zod'
import { NumberSchemas } from '../base/number-schemas'
import { StringSchemas } from '../base/string-schemas'

/**
 * 產品相關 Schema
 */
export const ProductSchemas = {
  /** 創建產品 */
  create: z.object({
    name: StringSchemas.nonEmpty.max(100, '產品名稱不能超過 100 字元'),
    description: z
      .string()
      .max(2000, '產品描述不能超過 2000 字元')
      .transform(str => {
        return str.replace(/<[^>]*>/g, '').trim()
      }),
    price: NumberSchemas.price,
    stock: NumberSchemas.stock,
    category: StringSchemas.nonEmpty.max(50, '分類名稱不能超過 50 字元'),
    unit: StringSchemas.nonEmpty.max(10, '單位不能超過 10 字元'),
    weight: NumberSchemas.price.optional(),
    origin: z.string().max(50, '產地不能超過 50 字元').optional(),
    harvest_season: z.string().max(50, '採收季節不能超過 50 字元').optional(),
    storage_method: z.string().max(200, '保存方式不能超過 200 字元').optional(),
    nutritional_info: z.string().max(1000, '營養資訊不能超過 1000 字元').optional(),
    is_organic: z.boolean().default(false),
    is_featured: z.boolean().default(false),
    is_available: z.boolean().default(true),
    tags: z
      .array(z.string().max(20, '標籤長度不能超過 20 字元'))
      .max(10, '最多只能有 10 個標籤')
      .optional(),
    images: z.array(StringSchemas.url).max(5, '最多只能上傳 5 張圖片').optional(),
  }),

  /** 更新產品 */
  update: z.object({
    name: StringSchemas.nonEmpty.max(100, '產品名稱不能超過 100 字元').optional(),
    description: z
      .string()
      .max(2000, '產品描述不能超過 2000 字元')
      .transform(str => {
        return str.replace(/<[^>]*>/g, '').trim()
      })
      .optional(),
    price: NumberSchemas.price.optional(),
    stock: NumberSchemas.stock.optional(),
    category: StringSchemas.nonEmpty.max(50, '分類名稱不能超過 50 字元').optional(),
    unit: StringSchemas.nonEmpty.max(10, '單位不能超過 10 字元').optional(),
    weight: NumberSchemas.price.optional(),
    origin: z.string().max(50, '產地不能超過 50 字元').optional(),
    harvest_season: z.string().max(50, '採收季節不能超過 50 字元').optional(),
    storage_method: z.string().max(200, '保存方式不能超過 200 字元').optional(),
    nutritional_info: z.string().max(1000, '營養資訊不能超過 1000 字元').optional(),
    is_organic: z.boolean().optional(),
    is_featured: z.boolean().optional(),
    is_available: z.boolean().optional(),
    tags: z
      .array(z.string().max(20, '標籤長度不能超過 20 字元'))
      .max(10, '最多只能有 10 個標籤')
      .optional(),
    images: z.array(StringSchemas.url).max(5, '最多只能上傳 5 張圖片').optional(),
  }),
}

/**
 * 公開產品 API 相關 Schema
 */
export const PublicProductSchemas = {
  /** GET 查詢參數驗證 */
  query: z.object({
    nocache: z
      .enum(['true', 'false'])
      .optional()
      .transform(val => val === 'true'),
    t: z.string().optional(),
    category: z.string().max(50, '分類名稱不能超過 50 字元').optional(),
    search: z.string().max(100, '搜尋關鍵字不能超過 100 字元').optional(),
    featured: z
      .enum(['true', 'false'])
      .optional()
      .transform(val => val === 'true'),
    available: z
      .enum(['true', 'false'])
      .optional()
      .transform(val => val === 'true'),
    limit: z.coerce.number().int().min(1).max(100).default(20),
    offset: z.coerce.number().int().min(0).default(0),
  }),

  /** POST 產品建立驗證（公開 API 用）*/
  create: z.object({
    name: StringSchemas.nonEmpty.max(100, '產品名稱不能超過 100 字元'),
    description: z
      .string()
      .max(2000, '產品描述不能超過 2000 字元')
      .transform(str => {
        return str.replace(/<[^>]*>/g, '').trim()
      }),
    price: NumberSchemas.price,
    category: StringSchemas.nonEmpty.max(50, '分類名稱不能超過 50 字元'),
    inventory: NumberSchemas.stock,
    isActive: z.boolean().default(true),
    images: z
      .array(z.string().url('圖片必須是有效的 URL'))
      .max(5, '最多只能上傳 5 張圖片')
      .optional(),
  }),
}

/**
 * 管理員產品相關 Schema
 */
export const AdminProductSchemas = {
  /** 創建產品（管理員用）*/
  create: z.object({
    name: StringSchemas.nonEmpty.max(100, '產品名稱不能超過 100 字元'),
    description: z
      .string()
      .max(2000, '產品描述不能超過 2000 字元')
      .transform(str => {
        return str.replace(/<[^>]*>/g, '').trim()
      }),
    price: NumberSchemas.price,
    priceUnit: z.string().max(20, '價格單位不能超過 20 字元').optional(),
    unitQuantity: z.number().min(0.01, '單位數量必須大於 0').optional(),
    category: StringSchemas.nonEmpty.max(50, '分類名稱不能超過 50 字元'),
    inventory: NumberSchemas.stock,
    images: z
      .array(z.string().url('圖片必須是有效的 URL'))
      .max(5, '最多只能上傳 5 張圖片')
      .optional(),
    isActive: z.boolean().default(true),
    id: StringSchemas.uuid.optional(),
  }),

  /** 更新產品（管理員用）*/
  update: z.object({
    id: StringSchemas.uuid.optional(),
    name: StringSchemas.nonEmpty.max(100, '產品名稱不能超過 100 字元').optional(),
    description: z
      .string()
      .max(2000, '產品描述不能超過 2000 字元')
      .transform(str => {
        return str.replace(/<[^>]*>/g, '').trim()
      })
      .optional(),
    price: NumberSchemas.price.optional(),
    priceUnit: z.string().max(20, '價格單位不能超過 20 字元').optional(),
    unitQuantity: z.number().min(0.01, '單位數量必須大於 0').optional(),
    category: StringSchemas.nonEmpty.max(50, '分類名稱不能超過 50 字元').optional(),
    inventory: NumberSchemas.stock.optional(),
    images: z
      .array(z.string().url('圖片必須是有效的 URL'))
      .max(5, '最多只能上傳 5 張圖片')
      .optional(),
    isActive: z.boolean().optional(),
  }),

  /** 刪除產品 ID 驗證 */
  deleteParams: z.object({
    id: StringSchemas.uuid,
  }),
}
