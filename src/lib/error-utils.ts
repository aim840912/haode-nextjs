/**
 * 錯誤處理工具函數
 * 提供統一的錯誤識別和處理邏輯
 */

/**
 * 檢查錯誤是否為速率限制錯誤
 * 這些錯誤應該被靜默處理，不顯示給用戶
 */
export function isRateLimitError(errorMessage: string): boolean {
  return (
    errorMessage.includes('頻繁') ||
    errorMessage.includes('10 分鐘') ||
    errorMessage.includes('rate limit') ||
    errorMessage.includes('RATE_LIMIT_EXCEEDED') ||
    errorMessage.includes('Too Many Requests')
  )
}

/**
 * 檢查錯誤是否為網路錯誤
 * 這些錯誤通常也應該被靜默處理或最小化顯示
 */
export function isNetworkError(errorMessage: string): boolean {
  return (
    errorMessage.includes('fetch') ||
    errorMessage.includes('網路') ||
    errorMessage.includes('network') ||
    errorMessage.includes('Failed to fetch') ||
    errorMessage.includes('NetworkError')
  )
}

/**
 * 檢查錯誤是否應該被靜默處理
 * 包括速率限制錯誤和網路錯誤
 */
export function shouldSilenceError(errorMessage: string): boolean {
  return isRateLimitError(errorMessage) || isNetworkError(errorMessage)
}

/**
 * 檢查錯誤是否應該在開發模式下顯示
 * 速率限制錯誤即使在開發模式也不應該顯示給用戶
 */
export function shouldShowErrorInDevelopment(errorMessage: string): boolean {
  // 速率限制錯誤在開發模式下也不顯示
  if (isRateLimitError(errorMessage)) {
    return false
  }

  // 其他錯誤在開發模式下可以顯示
  return process.env.NODE_ENV === 'development'
}

/**
 * 獲取用戶友好的錯誤訊息
 * 過濾掉不應該顯示的錯誤，返回適合顯示的訊息
 */
export function getUserFriendlyErrorMessage(errorMessage: string): string | null {
  // 速率限制錯誤不顯示給用戶
  if (isRateLimitError(errorMessage)) {
    return null
  }

  // 網路錯誤簡化顯示
  if (isNetworkError(errorMessage)) {
    return '網路連接失敗，請稍後再試'
  }

  // 其他錯誤直接返回
  return errorMessage
}
