/**
 * Zod 驗證 Schemas
 *
 * 提供類型安全的表單驗證 schema
 * 與 validation.ts 的函數驗證器互補使用
 */

import { z } from 'zod'

/**
 * 台灣電話號碼 schema
 */
export const phoneSchema = z.string().refine(
  phone => {
    const cleaned = phone.replace(/[\s\-()]/g, '')
    return /^09\d{8}$/.test(cleaned) || /^0[2-9]\d{7,8}$/.test(cleaned)
  },
  { message: '請輸入有效的台灣電話號碼（手機或市話）' }
)

/**
 * Email schema
 */
export const emailSchema = z
  .string()
  .email('請輸入有效的 Email 地址')
  .max(254, 'Email 長度不得超過 254 字元')

/**
 * 台灣身分證字號 schema
 */
export const taiwanIdSchema = z.string().refine(
  id => {
    const cleaned = id.trim().toUpperCase()
    const regex = /^[A-Z]\d{9}$/
    if (!regex.test(cleaned)) return false

    const letterMap: Record<string, number> = {
      A: 10,
      B: 11,
      C: 12,
      D: 13,
      E: 14,
      F: 15,
      G: 16,
      H: 17,
      I: 34,
      J: 18,
      K: 19,
      L: 20,
      M: 21,
      N: 22,
      O: 35,
      P: 23,
      Q: 24,
      R: 25,
      S: 26,
      T: 27,
      U: 28,
      V: 29,
      W: 32,
      X: 30,
      Y: 31,
      Z: 33,
    }

    const firstLetter = cleaned[0]
    const letterValue = letterMap[firstLetter]
    const digits = cleaned.substring(1).split('').map(Number)
    const weights = [1, 9, 8, 7, 6, 5, 4, 3, 2, 1]

    let sum = Math.floor(letterValue / 10) + (letterValue % 10) * 9
    for (let i = 0; i < 9; i++) {
      sum += digits[i] * weights[i + 1]
    }

    return sum % 10 === 0
  },
  { message: '請輸入有效的台灣身分證字號' }
)

/**
 * 台灣郵遞區號 schema
 */
export const zipCodeSchema = z
  .string()
  .regex(/^\d{3}(\d{2})?$/, '郵遞區號格式錯誤（應為 3 碼或 5 碼數字）')

/**
 * URL schema
 */
export const urlSchema = z.string().url('請輸入有效的 URL')

/**
 * 密碼 schema（預設：至少 8 字元，包含大小寫字母和數字）
 */
export const passwordSchema = z
  .string()
  .min(8, '密碼長度至少需要 8 個字元')
  .regex(/[A-Z]/, '密碼必須包含至少一個大寫字母')
  .regex(/[a-z]/, '密碼必須包含至少一個小寫字母')
  .regex(/\d/, '密碼必須包含至少一個數字')

/**
 * 強密碼 schema（包含特殊字元）
 */
export const strongPasswordSchema = passwordSchema.regex(
  /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/,
  '密碼必須包含至少一個特殊字元'
)

/**
 * 日期範圍 schema
 */
export const dateRangeSchema = z
  .object({
    startDate: z.string().datetime('開始日期格式錯誤'),
    endDate: z.string().datetime('結束日期格式錯誤'),
  })
  .refine(data => new Date(data.startDate) <= new Date(data.endDate), {
    message: '開始日期不得晚於結束日期',
    path: ['endDate'],
  })

/**
 * 產品 schema
 */
export const productSchema = z.object({
  name: z.string().min(1, '產品名稱為必填').max(100, '產品名稱不得超過 100 字元'),
  description: z.string().min(1, '產品描述為必填').max(1000, '產品描述不得超過 1000 字元'),
  price: z.number().positive('價格必須大於 0').max(1000000, '價格不得超過 1,000,000'),
  stock: z.number().int('庫存必須為整數').min(0, '庫存不得為負數'),
  category_id: z.string().uuid('類別 ID 格式錯誤').optional(),
})

/**
 * 詢價單 schema
 */
export const inquirySchema = z.object({
  customer_name: z.string().min(1, '姓名為必填').max(50, '姓名不得超過 50 字元'),
  email: emailSchema,
  phone: phoneSchema,
  company: z.string().max(100, '公司名稱不得超過 100 字元').optional(),
  message: z.string().min(10, '訊息至少需要 10 個字元').max(1000, '訊息不得超過 1000 字元'),
  product_id: z.string().uuid('產品 ID 格式錯誤').optional(),
})

/**
 * 使用者註冊 schema
 */
export const userRegistrationSchema = z
  .object({
    email: emailSchema,
    password: passwordSchema,
    confirmPassword: z.string(),
    name: z.string().min(1, '姓名為必填').max(50, '姓名不得超過 50 字元'),
    phone: phoneSchema.optional(),
  })
  .refine(data => data.password === data.confirmPassword, {
    message: '密碼與確認密碼不符',
    path: ['confirmPassword'],
  })

/**
 * 使用者登入 schema
 */
export const userLoginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, '密碼為必填'),
})

/**
 * 聯絡表單 schema
 */
export const contactFormSchema = z.object({
  name: z.string().min(1, '姓名為必填').max(50, '姓名不得超過 50 字元'),
  email: emailSchema,
  phone: phoneSchema.optional(),
  subject: z.string().min(1, '主旨為必填').max(100, '主旨不得超過 100 字元'),
  message: z.string().min(10, '訊息至少需要 10 個字元').max(1000, '訊息不得超過 1000 字元'),
})

/**
 * 地址 schema
 */
export const addressSchema = z.object({
  city: z.string().min(1, '縣市為必填'),
  district: z.string().min(1, '區域為必填'),
  zipCode: zipCodeSchema,
  street: z.string().min(1, '街道地址為必填').max(100, '街道地址不得超過 100 字元'),
})

/**
 * 訂單 schema
 */
export const orderSchema = z.object({
  customer_name: z.string().min(1, '姓名為必填').max(50, '姓名不得超過 50 字元'),
  email: emailSchema,
  phone: phoneSchema,
  address: addressSchema,
  items: z
    .array(
      z.object({
        product_id: z.string().uuid('產品 ID 格式錯誤'),
        quantity: z.number().int('數量必須為整數').min(1, '數量至少為 1'),
        price: z.number().positive('價格必須大於 0'),
      })
    )
    .min(1, '訂單至少需要一項商品'),
  total: z.number().positive('訂單總額必須大於 0'),
  notes: z.string().max(500, '備註不得超過 500 字元').optional(),
})

/**
 * 網站設定 schema
 */
export const siteSettingsSchema = z.object({
  site_name: z.string().min(1, '網站名稱為必填').max(100, '網站名稱不得超過 100 字元'),
  site_description: z.string().max(500, '網站描述不得超過 500 字元').optional(),
  contact_email: emailSchema.optional(),
  contact_phone: phoneSchema.optional(),
  address: z.string().max(200, '地址不得超過 200 字元').optional(),
  social_media: z
    .object({
      facebook: urlSchema.optional(),
      instagram: urlSchema.optional(),
      line: z.string().max(100, 'LINE ID 不得超過 100 字元').optional(),
    })
    .optional(),
})

/**
 * 農場體驗活動 schema
 */
export const farmTourActivitySchema = z.object({
  title: z.string().min(1, '活動標題為必填').max(100, '活動標題不得超過 100 字元'),
  description: z.string().min(1, '活動描述為必填').max(1000, '活動描述不得超過 1000 字元'),
  date: z.string().datetime('活動日期格式錯誤'),
  duration: z.number().int('活動時長必須為整數').min(30, '活動時長至少 30 分鐘'),
  capacity: z.number().int('人數上限必須為整數').min(1, '人數上限至少為 1'),
  price: z.number().min(0, '價格不得為負數'),
  image: urlSchema.optional(),
})

/**
 * 庫存保留 schema
 */
export const stockReservationSchema = z.object({
  product_id: z.string().uuid('產品 ID 格式錯誤'),
  quantity: z.number().int('數量必須為整數').min(1, '數量至少為 1'),
  customer_email: emailSchema.optional(),
  expires_at: z.string().datetime('過期時間格式錯誤').optional(),
})

// 匯出所有 schemas 的 TypeScript 類型
export type ProductInput = z.infer<typeof productSchema>
export type InquiryInput = z.infer<typeof inquirySchema>
export type UserRegistrationInput = z.infer<typeof userRegistrationSchema>
export type UserLoginInput = z.infer<typeof userLoginSchema>
export type ContactFormInput = z.infer<typeof contactFormSchema>
export type AddressInput = z.infer<typeof addressSchema>
export type OrderInput = z.infer<typeof orderSchema>
export type SiteSettingsInput = z.infer<typeof siteSettingsSchema>
export type FarmTourActivityInput = z.infer<typeof farmTourActivitySchema>
export type StockReservationInput = z.infer<typeof stockReservationSchema>
