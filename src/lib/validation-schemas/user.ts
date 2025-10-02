/**
 * 使用者與管理員相關驗證 Schema
 *
 * 提供使用者註冊、登入、個人資料更新和管理員操作的驗證規則
 */

import { z } from 'zod'
import { StringSchemas, DateSchemas } from './base'

/**
 * 使用者相關 Schema
 */
export const UserSchemas = {
  /** 使用者註冊 */
  register: z.object({
    email: StringSchemas.email,
    password: z.string().min(8, '密碼至少需要 8 字元').max(128, '密碼不能超過 128 字元'),
    name: StringSchemas.nonEmpty.max(50, '姓名不能超過 50 字元'),
    phone: z.union([StringSchemas.phone, StringSchemas.mobile]).optional(),
    terms_accepted: z.boolean().refine(val => val === true, '必須同意服務條款'),
  }),

  /** 使用者登入 */
  login: z.object({
    email: StringSchemas.email,
    password: z.string().min(1, '密碼不能為空'),
  }),

  /** 密碼重設 */
  resetPassword: z.object({
    email: StringSchemas.email,
  }),

  /** 更新個人資料 */
  updateProfile: z.object({
    name: StringSchemas.nonEmpty.max(50, '姓名不能超過 50 字元').optional(),
    phone: z.union([StringSchemas.phone, StringSchemas.mobile]).optional(),
    address: z.string().max(200, '地址不能超過 200 字元').optional(),
    birthday: DateSchemas.pastDate.optional(),
    preferences: z
      .object({
        newsletter: z.boolean(),
        sms_notifications: z.boolean(),
        email_notifications: z.boolean(),
      })
      .optional(),
  }),
}

/**
 * 管理員操作 Schema
 */
export const AdminSchemas = {
  /** 管理員認證 */
  auth: z.object({
    adminKey: z.string().min(32, '管理員金鑰格式錯誤'),
  }),

  /** 系統重置 */
  systemReset: z.object({
    confirmAction: z.literal('RESET_SYSTEM'),
    adminKey: z.string().min(32, '管理員金鑰格式錯誤'),
  }),

  /** 審計日誌查詢 */
  auditLogQuery: z.object({
    action: z.string().optional(),
    resource_type: z.string().optional(),
    user_id: StringSchemas.uuid.optional(),
    start_date: DateSchemas.dateString.optional(),
    end_date: DateSchemas.dateString.optional(),
    severity: z.enum(['low', 'medium', 'high', 'critical']).optional(),
    limit: z.coerce.number().int().min(1).max(1000).default(50),
    offset: z.coerce.number().int().min(0).default(0),
  }),
}
