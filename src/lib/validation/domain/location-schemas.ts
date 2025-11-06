/**
 * 地點與行程管理相關驗證 Schema
 *
 * 提供地點管理和行程排程的驗證規則
 */

import { z } from 'zod'
import { StringSchemas } from '../base/string-schemas'
import { DateSchemas } from '../base/date-schemas'

/**
 * 座標驗證 Schema
 */
const CoordinatesSchema = z.object({
  lat: z.number().min(-90, '緯度必須在 -90 到 90 之間').max(90, '緯度必須在 -90 到 90 之間'),
  lng: z.number().min(-180, '經度必須在 -180 到 180 之間').max(180, '經度必須在 -180 到 180 之間'),
})

/**
 * 地點相關 Schema
 */
export const LocationSchemas = {
  /** 創建地點 */
  create: z.object({
    id: z.string().uuid('ID 必須是有效的 UUID 格式').optional(),
    name: StringSchemas.nonEmpty.max(50, '地點名稱不能超過 50 字元'),
    title: StringSchemas.nonEmpty.max(100, '地點標題不能超過 100 字元'),
    address: StringSchemas.nonEmpty.max(200, '地址不能超過 200 字元'),
    landmark: z.string().max(100, '地標不能超過 100 字元').default(''),
    phone: StringSchemas.phone,
    lineId: z.string().max(50, 'LINE ID 不能超過 50 字元').default(''),
    hours: StringSchemas.nonEmpty.max(100, '營業時間不能超過 100 字元'),
    closedDays: z.string().max(50, '休息日不能超過 50 字元').default(''),
    parking: z.string().max(200, '停車資訊不能超過 200 字元').default(''),
    publicTransport: z.string().max(200, '大眾運輸資訊不能超過 200 字元').default(''),
    features: z
      .array(z.string().max(30, '特色長度不能超過 30 字元'))
      .max(10, '最多只能有 10 個特色')
      .default([]),
    specialties: z
      .array(z.string().max(30, '特產長度不能超過 30 字元'))
      .max(10, '最多只能有 10 個特產')
      .default([]),
    coordinates: CoordinatesSchema,
    image: z
      .string()
      .optional()
      .default('')
      .refine(
        value => {
          if (!value) return true
          return value.startsWith('/') || z.string().url().safeParse(value).success
        },
        {
          message: '請輸入有效的圖片網址或相對路徑',
        }
      ),
    isMain: z.boolean().default(false),
  }),

  /** 更新地點 */
  update: z.object({
    name: StringSchemas.nonEmpty.max(50, '地點名稱不能超過 50 字元').optional(),
    title: StringSchemas.nonEmpty.max(100, '地點標題不能超過 100 字元').optional(),
    address: StringSchemas.nonEmpty.max(200, '地址不能超過 200 字元').optional(),
    landmark: z.string().max(100, '地標不能超過 100 字元').optional(),
    phone: StringSchemas.phone.optional(),
    lineId: z.string().max(50, 'LINE ID 不能超過 50 字元').optional(),
    hours: StringSchemas.nonEmpty.max(100, '營業時間不能超過 100 字元').optional(),
    closedDays: z.string().max(50, '休息日不能超過 50 字元').optional(),
    parking: z.string().max(200, '停車資訊不能超過 200 字元').optional(),
    publicTransport: z.string().max(200, '大眾運輸資訊不能超過 200 字元').optional(),
    features: z
      .array(z.string().max(30, '特色長度不能超過 30 字元'))
      .max(10, '最多只能有 10 個特色')
      .optional(),
    specialties: z
      .array(z.string().max(30, '特產長度不能超過 30 字元'))
      .max(10, '最多只能有 10 個特產')
      .optional(),
    coordinates: CoordinatesSchema.optional(),
    image: z
      .string()
      .optional()
      .refine(value => !value || z.string().url().safeParse(value).success, {
        message: '請輸入有效的圖片網址',
      }),
    isMain: z.boolean().optional(),
  }),

  /** 查詢參數 */
  query: z.object({
    search: z.string().max(100, '搜尋關鍵字不能超過 100 字元').optional(),
    isMain: z.coerce.boolean().optional(),
    features: z.string().max(30, '特色篩選不能超過 30 字元').optional(),
    limit: z.coerce.number().int().min(1).max(100).default(20),
    offset: z.coerce.number().int().min(0).default(0),
    sort_by: z.enum(['name', 'createdAt', 'updatedAt']).default('name'),
    sort_order: z.enum(['asc', 'desc']).default('asc'),
  }),
}

/**
 * 行程相關 Schema
 */
export const ScheduleSchemas = {
  /** 創建行程 */
  create: z.object({
    title: StringSchemas.nonEmpty.max(100, '行程標題不能超過 100 字元'),
    description: z.string().max(1000, '行程描述不能超過 1000 字元').optional(),
    location_id: StringSchemas.uuid,
    start_date: DateSchemas.isoDate,
    end_date: DateSchemas.isoDate,
    max_participants: z.number().int().min(1, '最大參與人數至少為 1').optional(),
    price: z.number().min(0, '價格不能為負數').optional(),
    status: z.enum(['draft', 'published', 'cancelled', 'completed']).default('draft'),
    image: z.string().url('圖片必須是有效的 URL').optional(),
  }),

  /** 更新行程 */
  update: z.object({
    title: StringSchemas.nonEmpty.max(100, '行程標題不能超過 100 字元').optional(),
    description: z.string().max(1000, '行程描述不能超過 1000 字元').optional(),
    location_id: StringSchemas.uuid.optional(),
    start_date: DateSchemas.isoDate.optional(),
    end_date: DateSchemas.isoDate.optional(),
    max_participants: z.number().int().min(1, '最大參與人數至少為 1').optional(),
    price: z.number().min(0, '價格不能為負數').optional(),
    status: z.enum(['draft', 'published', 'cancelled', 'completed']).optional(),
    image: z.string().url('圖片必須是有效的 URL').optional(),
  }),

  /** 查詢參數 */
  query: z.object({
    location_id: StringSchemas.uuid.optional(),
    status: z.enum(['draft', 'published', 'cancelled', 'completed']).optional(),
    start_date: DateSchemas.dateString.optional(),
    end_date: DateSchemas.dateString.optional(),
    limit: z.coerce.number().int().min(1).max(100).default(20),
    offset: z.coerce.number().int().min(0).default(0),
  }),
}
