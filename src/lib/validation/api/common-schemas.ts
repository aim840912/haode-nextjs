/**
 * 通用 API 驗證 Schema
 *
 * 提供通用驗證組合和搜尋功能的驗證規則
 */

import { z } from 'zod'
import { StringSchemas } from '../base/string-schemas'

/**
 * 通用驗證組合
 */
export const CommonValidations = {
  /** UUID 參數驗證 */
  uuidParam: z.object({
    id: StringSchemas.uuid,
  }),

  /** 管理員金鑰驗證 */
  adminKey: z
    .object({
      'x-admin-key': z.string().min(32, '無效的管理員金鑰'),
    })
    .or(
      z.object({
        adminKey: z.string().min(32, '無效的管理員金鑰'),
      })
    ),
}

/**
 * 搜尋相關 Schema
 */
export const SearchSchemas = {
  /** 搜尋查詢 */
  query: z.object({
    q: StringSchemas.nonEmpty.max(100, '搜尋關鍵字不能超過 100 字元'),
    limit: z.coerce
      .number()
      .int('limit 必須是整數')
      .min(1, 'limit 至少為 1')
      .max(100, 'limit 不能超過 100')
      .default(20),
    offset: z.coerce.number().int('offset 必須是整數').min(0, 'offset 不能小於 0').default(0),
  }),
}
