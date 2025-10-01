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
