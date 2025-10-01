/**
 * 數字驗證 Schema
 * 提供常用的數字驗證規則
 */

import { z } from 'zod'

/**
 * 數字驗證
 */
export const NumberSchemas = {
  /** 正整數 */
  positiveInt: z.number().int().positive('必須是正整數'),

  /** 非負整數 */
  nonNegativeInt: z.number().int().min(0, '必須是非負整數'),

  /** 價格（最多兩位小數） */
  price: z.number().min(0, '價格不能為負數').multipleOf(0.01),

  /** 百分比 */
  percentage: z.number().min(0, '百分比不能小於 0').max(100, '百分比不能大於 100'),

  /** 庫存數量 */
  stock: z.number().int().min(0, '庫存不能為負數'),

  /** 評分 */
  rating: z.number().min(1, '評分不能小於 1').max(5, '評分不能大於 5'),
}
