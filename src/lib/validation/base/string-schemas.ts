/**
 * 字串驗證 Schema
 * 提供常用的字串驗證規則
 */

import { z } from 'zod'

/**
 * 常用的字串驗證
 */
export const StringSchemas = {
  /** 非空字串 */
  nonEmpty: z.string().min(1, '此欄位不能為空'),

  /** Email 驗證 */
  email: z.string().email('請輸入有效的電子郵件地址'),

  /** 電話號碼驗證（台灣） */
  phone: z
    .string()
    .regex(
      /^(0[2-9][\d\-]{6,15}|09[\d\-]{8,10})$/,
      '請輸入有效的台灣電話號碼格式（如：02-12345678 或 0912-345678）'
    ),

  /** 手機號碼驗證（台灣） */
  mobile: z.string().regex(/^(\+886|886|0)?9\d{8}$/, '請輸入有效的台灣手機號碼'),

  /** URL 驗證 */
  url: z.string().url('請輸入有效的網址'),

  /** UUID 驗證 */
  uuid: z.string().uuid('請輸入有效的 UUID'),

  /** 價格字串（可包含小數點） */
  price: z.string().regex(/^\d+(\.\d{1,2})?$/, '請輸入有效的價格格式'),

  /** HTML 標籤清理 */
  sanitized: z.string().transform(str => {
    // 簡單的 HTML 標籤移除（生產環境建議使用 DOMPurify）
    return str.replace(/<[^>]*>/g, '').trim()
  }),
}
