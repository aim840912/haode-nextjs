/**
 * 日期驗證 Schema
 * 提供常用的日期驗證規則
 */

import { z } from 'zod'

/**
 * 日期驗證
 */
export const DateSchemas = {
  /** ISO 日期字串 */
  isoDate: z.string().datetime('請輸入有效的日期時間格式'),

  /** 日期字串 YYYY-MM-DD */
  dateString: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, '請輸入有效的日期格式 (YYYY-MM-DD)'),

  /** 未來日期 */
  futureDate: z
    .string()
    .datetime()
    .refine(date => new Date(date) > new Date(), '日期必須是未來時間'),

  /** 過去日期 */
  pastDate: z
    .string()
    .datetime()
    .refine(date => new Date(date) < new Date(), '日期必須是過去時間'),
}
