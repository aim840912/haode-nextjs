/**
 * 驗證工具函數
 *
 * 提供統一的驗證函數和資料清理工具
 */

import { z } from 'zod'

/**
 * 驗證函數：安全地驗證資料並返回結果
 */
export function validateData<T>(
  schema: z.ZodSchema<T>,
  data: unknown
): { success: true; data: T } | { success: false; error: string } {
  try {
    const validatedData = schema.parse(data)
    return { success: true, data: validatedData }
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errorMessage = error.issues
        .map(err => `${err.path.join('.')}: ${err.message}`)
        .join('; ')
      return { success: false, error: errorMessage }
    }
    return { success: false, error: '資料驗證失敗' }
  }
}

/**
 * 中間件用的驗證函數：從 Request 物件驗證 JSON 資料
 */
export async function validateRequestData<T>(
  request: Request,
  schema: z.ZodSchema<T>
): Promise<{ success: true; data: T } | { success: false; error: string }> {
  try {
    const body = await request.json()
    return validateData(schema, body)
  } catch {
    return { success: false, error: '無效的 JSON 格式' }
  }
}

/**
 * 驗證查詢參數
 */
export function validateSearchParams<T>(
  searchParams: URLSearchParams,
  schema: z.ZodSchema<T>
): { success: true; data: T } | { success: false; error: string } {
  try {
    const params: Record<string, string> = {}
    for (const [key, value] of searchParams.entries()) {
      params[key] = value
    }
    return validateData(schema, params)
  } catch {
    return { success: false, error: '查詢參數格式錯誤' }
  }
}

/**
 * 清理和驗證 HTML 內容（基礎版本）
 */
export function sanitizeHtml(html: string): string {
  // 移除所有 HTML 標籤和潛在的危險字符
  return html
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '') // 移除 script 標籤
    .replace(/<[^>]*>/g, '') // 移除所有 HTML 標籤
    .replace(/javascript:/gi, '') // 移除 javascript: 協議
    .replace(/on\w+\s*=/gi, '') // 移除事件處理器
    .trim()
}
