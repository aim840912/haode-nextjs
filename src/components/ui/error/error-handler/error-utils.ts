import { ErrorType } from './types'

/**
 * 錯誤分類函數
 *
 * 根據錯誤物件的特徵（message, name, status）判斷錯誤類型
 *
 * @param error - 錯誤物件
 * @returns ErrorType
 */
export function classifyError(error: Error | unknown): ErrorType {
  if (!error) return ErrorType.UNKNOWN

  // 類型守衛：檢查是否為 Error 類型
  const isError = (obj: unknown): obj is Error => {
    return obj instanceof Error || (typeof obj === 'object' && obj !== null && 'message' in obj)
  }

  // 類型守衛：檢查是否有狀態碼屬性
  const hasStatus = (obj: unknown): obj is { status: number } => {
    return (
      typeof obj === 'object' &&
      obj !== null &&
      'status' in obj &&
      typeof (obj as { status: unknown }).status === 'number'
    )
  }

  // 類型守衛：檢查是否有 name 屬性
  const hasName = (obj: unknown): obj is { name: string } => {
    return (
      typeof obj === 'object' &&
      obj !== null &&
      'name' in obj &&
      typeof (obj as { name: unknown }).name === 'string'
    )
  }

  const message = isError(error) ? error.message?.toLowerCase() || '' : String(error).toLowerCase()
  const errorName = hasName(error) ? error.name : ''
  const status = hasStatus(error) ? error.status : 0

  // 網路錯誤
  if (
    message.includes('network') ||
    message.includes('fetch') ||
    message.includes('connection') ||
    errorName === 'NetworkError'
  ) {
    return ErrorType.NETWORK
  }

  // 驗證錯誤
  if (
    message.includes('validation') ||
    message.includes('invalid') ||
    errorName === 'ValidationError'
  ) {
    return ErrorType.VALIDATION
  }

  // 認證錯誤
  if (message.includes('unauthorized') || message.includes('authentication') || status === 401) {
    return ErrorType.AUTHENTICATION
  }

  // 授權錯誤
  if (message.includes('forbidden') || message.includes('authorization') || status === 403) {
    return ErrorType.AUTHORIZATION
  }

  // 伺服器錯誤
  if (status >= 500 || message.includes('server') || message.includes('internal')) {
    return ErrorType.SERVER
  }

  // 客戶端錯誤
  if (status >= 400 && status < 500) {
    return ErrorType.CLIENT
  }

  return ErrorType.UNKNOWN
}

/**
 * 取得錯誤訊息
 *
 * 根據錯誤類型回傳使用者友善的錯誤訊息
 *
 * @param type - 錯誤類型
 * @param originalMessage - 原始錯誤訊息（可選）
 * @returns 使用者友善的錯誤訊息
 */
export function getErrorMessage(type: ErrorType, originalMessage?: string): string {
  const messages: Record<ErrorType, string> = {
    [ErrorType.NETWORK]: '網路連線失敗，請檢查您的網路連線',
    [ErrorType.VALIDATION]: '輸入的資料格式不正確，請檢查後重試',
    [ErrorType.AUTHENTICATION]: '請先登入才能繼續操作',
    [ErrorType.AUTHORIZATION]: '您沒有權限執行此操作',
    [ErrorType.SERVER]: '伺服器暫時無法回應，請稍後再試',
    [ErrorType.CLIENT]: '請求失敗，請檢查輸入的資料',
    [ErrorType.UNKNOWN]: '發生未知錯誤，請稍後再試',
  }

  return originalMessage || messages[type]
}

/**
 * 判斷錯誤是否可重試
 *
 * 網路錯誤和伺服器錯誤通常可重試
 *
 * @param type - 錯誤類型
 * @returns 是否可重試
 */
export function isRetryableError(type: ErrorType): boolean {
  return [ErrorType.NETWORK, ErrorType.SERVER].includes(type)
}
