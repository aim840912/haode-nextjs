/**
 * 農場導覽驗證 Schema
 * 用於農場導覽預約的驗證
 */

import { z } from 'zod'
import { StringSchemas } from '../base/string-schemas'
import { NumberSchemas } from '../base/number-schemas'
import { DateSchemas } from '../base/date-schemas'

/**
 * 農場導覽相關 Schema
 */
export const FarmTourSchemas = {
  /** 創建農場導覽預約 */
  create: z.object({
    customer_name: StringSchemas.nonEmpty.max(50, '姓名不能超過 50 字元'),
    customer_email: StringSchemas.email,
    customer_phone: z.union([StringSchemas.phone, StringSchemas.mobile]),
    tour_date: DateSchemas.futureDate,
    tour_time: z.enum(['morning', 'afternoon']),
    group_size: NumberSchemas.positiveInt.max(20, '團體人數不能超過 20 人'),
    special_requirements: z.string().max(500, '特殊需求不能超過 500 字元').optional(),
    dietary_restrictions: z.string().max(200, '飲食限制不能超過 200 字元').optional(),
    transportation: z.enum(['self_drive', 'public_transport', 'tour_bus']).optional(),
    contact_preference: z.enum(['phone', 'email', 'both']).default('both'),
  }),

  /** 更新預約狀態 */
  updateStatus: z.object({
    status: z.enum(['pending', 'confirmed', 'completed', 'cancelled']),
    admin_notes: z.string().max(1000, '管理員備註不能超過 1000 字元').optional(),
    confirmed_time: DateSchemas.isoDate.optional(),
  }),
}

/**
 * 文化典藏相關 Schema
 */
export const CultureSchemas = {
  /** 建立文化項目 */
  create: z.object({
    title: StringSchemas.nonEmpty.max(100, '標題不能超過 100 字元'),
    subtitle: z.string().max(200, '副標題不能超過 200 字元').optional().default(''),
    description: StringSchemas.nonEmpty.max(2000, '描述不能超過 2000 字元'),
    height: z
      .string()
      .regex(
        /^h-(4[8-9]|[5-9]\d|1[0-9]\d)$/,
        '高度必須是有效的 Tailwind CSS 類別，如 h-48, h-64 等'
      )
      .optional()
      .default('h-64'),
    color: z
      .string()
      .regex(/^#[0-9A-Fa-f]{6}$/, '顏色必須是有效的十六進制格式，如 #FF0000')
      .optional()
      .default('#4A90E2'),
    textColor: z
      .string()
      .regex(/^#[0-9A-Fa-f]{6}$/, '文字顏色必須是有效的十六進制格式，如 #FFFFFF')
      .optional()
      .default('#FFFFFF'),
    emoji: z
      .string()
      .min(1, 'Emoji 不能為空')
      .max(4, 'Emoji 不能超過 4 個字符')
      .optional()
      .default('🏺'),
    imageUrl: z.string().url('圖片 URL 格式不正確').optional().or(z.literal('')),
    imageFile: z.any().optional(),
  }),

  /** 更新文化項目 */
  update: z.object({
    title: StringSchemas.nonEmpty.max(100, '標題不能超過 100 字元').optional(),
    subtitle: z.string().max(200, '副標題不能超過 200 字元').optional(),
    description: StringSchemas.nonEmpty.max(2000, '描述不能超過 2000 字元').optional(),
    height: z
      .string()
      .regex(
        /^h-(4[8-9]|[5-9]\d|1[0-9]\d)$/,
        '高度必須是有效的 Tailwind CSS 類別，如 h-48, h-64 等'
      )
      .optional(),
    color: z
      .string()
      .regex(/^#[0-9A-Fa-f]{6}$/, '顏色必須是有效的十六進制格式，如 #FF0000')
      .optional(),
    textColor: z
      .string()
      .regex(/^#[0-9A-Fa-f]{6}$/, '文字顏色必須是有效的十六進制格式，如 #FFFFFF')
      .optional(),
    emoji: z.string().min(1, 'Emoji 不能為空').max(4, 'Emoji 不能超過 4 個字符').optional(),
    imageUrl: z.string().url('圖片 URL 格式不正確').optional().or(z.literal('')),
  }),
}

/**
 * 精彩時刻相關 Schema
 */
export const MomentSchemas = {
  /** 建立精彩時刻項目 */
  create: z.object({
    id: z.string().uuid('ID 必須是有效的 UUID 格式').optional(),
    title: StringSchemas.nonEmpty.max(100, '標題不能超過 100 字元'),
    subtitle: z.string().max(200, '副標題不能超過 200 字元').optional().default(''),
    description: StringSchemas.nonEmpty.max(2000, '描述不能超過 2000 字元'),
    height: z
      .string()
      .regex(
        /^h-(4[8-9]|[5-9]\d|1[0-9]\d)$/,
        '高度必須是有效的 Tailwind CSS 類別，如 h-48, h-64 等'
      )
      .optional()
      .default('h-56'),
    color: z
      .string()
      .regex(/^#[0-9A-Fa-f]{6}$/, '顏色必須是有效的十六進制格式，如 #FF0000')
      .optional()
      .default('#3B82F6'),
    textColor: z
      .string()
      .regex(/^#[0-9A-Fa-f]{6}$/, '文字顏色必須是有效的十六進制格式，如 #FFFFFF')
      .optional()
      .default('#FFFFFF'),
    emoji: z
      .string()
      .min(1, 'Emoji 不能為空')
      .max(4, 'Emoji 不能超過 4 個字符')
      .optional()
      .default('📸'),
    imageUrl: z.string().url('圖片 URL 格式不正確').optional().or(z.literal('')),
    imageFile: z.any().optional(),
  }),

  /** 更新精彩時刻項目 */
  update: z.object({
    title: StringSchemas.nonEmpty.max(100, '標題不能超過 100 字元').optional(),
    subtitle: z.string().max(200, '副標題不能超過 200 字元').optional(),
    description: StringSchemas.nonEmpty.max(2000, '描述不能超過 2000 字元').optional(),
    height: z
      .string()
      .regex(
        /^h-(4[8-9]|[5-9]\d|1[0-9]\d)$/,
        '高度必須是有效的 Tailwind CSS 類別，如 h-48, h-64 等'
      )
      .optional(),
    color: z
      .string()
      .regex(/^#[0-9A-Fa-f]{6}$/, '顏色必須是有效的十六進制格式，如 #FF0000')
      .optional(),
    textColor: z
      .string()
      .regex(/^#[0-9A-Fa-f]{6}$/, '文字顏色必須是有效的十六進制格式，如 #FFFFFF')
      .optional(),
    emoji: z.string().min(1, 'Emoji 不能為空').max(4, 'Emoji 不能超過 4 個字符').optional(),
    imageUrl: z.string().url('圖片 URL 格式不正確').optional().or(z.literal('')),
    imageFile: z.any().optional(),
  }),
}

/**
 * 農場體驗活動相關 Schema
 */
export const FarmTourActivitySchemas = {
  /** 建立農場體驗活動 */
  create: z.object({
    id: z.string().uuid('ID 必須是有效的 UUID 格式').optional(),
    start_month: z.number().int().min(1, '開始月份必須是 1-12').max(12, '開始月份必須是 1-12'),
    end_month: z.number().int().min(1, '結束月份必須是 1-12').max(12, '結束月份必須是 1-12'),
    title: StringSchemas.nonEmpty.max(100, '活動標題不能超過 100 字元'),
    activities: z
      .array(z.string().max(50, '活動項目不能超過 50 字元'))
      .min(1, '至少要有一個活動項目'),
    price: z.number().min(0, '價格不能為負數').default(0),
    image: z.string().url('圖片 URL 格式不正確'),
    available: z.boolean().default(true),
    note: z.string().max(500, '備註不能超過 500 字元').default(''),
  }),

  /** 更新農場體驗活動 */
  update: z.object({
    start_month: z
      .number()
      .int()
      .min(1, '開始月份必須是 1-12')
      .max(12, '開始月份必須是 1-12')
      .optional(),
    end_month: z
      .number()
      .int()
      .min(1, '結束月份必須是 1-12')
      .max(12, '結束月份必須是 1-12')
      .optional(),
    title: StringSchemas.nonEmpty.max(100, '活動標題不能超過 100 字元').optional(),
    activities: z
      .array(z.string().max(50, '活動項目不能超過 50 字元'))
      .min(1, '至少要有一個活動項目')
      .optional(),
    price: z.number().min(0, '價格不能為負數').optional(),
    image: z.string().url('圖片 URL 格式不正確').optional(),
    available: z.boolean().optional(),
    note: z.string().max(500, '備註不能超過 500 字元').optional(),
  }),
}
