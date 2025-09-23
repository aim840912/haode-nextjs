/**
 * 認證輔助工具函數
 * 用於處理登入時的輸入格式判斷和驗證
 */

/**
 * 判斷輸入是否為台灣手機號碼格式
 * 支援格式：09xx-xxx-xxx, 09xxxxxxxx, +886-9xx-xxx-xxx
 */
export function isPhoneNumber(input: string): boolean {
  if (!input) return false

  // 移除所有空格、連字號和括號
  const cleaned = input.replace(/[\s\-\(\)]/g, '')

  // 台灣手機號碼格式
  const taiwanMobileRegex = /^(\+886)?0?9\d{8}$/

  return taiwanMobileRegex.test(cleaned)
}

/**
 * 判斷輸入是否為有效的電子郵件格式
 */
export function isEmail(input: string): boolean {
  if (!input) return false

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(input.trim())
}

/**
 * 格式化台灣手機號碼為標準格式 (09xx-xxx-xxx)
 * 如果輸入無效則返回原始輸入
 */
export function formatPhoneNumber(phone: string): string {
  if (!phone) return phone

  // 移除所有非數字字符（除了開頭的 +886）
  let cleaned = phone.replace(/[\s\-\(\)]/g, '')

  // 處理 +886 國碼
  if (cleaned.startsWith('+886')) {
    cleaned = '0' + cleaned.substring(4)
  } else if (cleaned.startsWith('886')) {
    cleaned = '0' + cleaned.substring(3)
  }

  // 確保以 09 開頭且總長度為 10
  if (cleaned.startsWith('09') && cleaned.length === 10) {
    // 格式化為 09xx-xxx-xxx
    return `${cleaned.substring(0, 4)}-${cleaned.substring(4, 7)}-${cleaned.substring(7)}`
  }

  // 如果格式不正確，返回原始輸入
  return phone
}

/**
 * 正規化手機號碼為資料庫儲存格式 (09xxxxxxxx)
 * 移除所有格式化字符，保留純數字
 */
export function normalizePhoneNumber(phone: string): string {
  if (!phone) return phone

  let cleaned = phone.replace(/[\s\-\(\)]/g, '')

  // 處理國碼
  if (cleaned.startsWith('+886')) {
    cleaned = '0' + cleaned.substring(4)
  } else if (cleaned.startsWith('886')) {
    cleaned = '0' + cleaned.substring(3)
  }

  return cleaned
}

/**
 * 判斷登入輸入的類型
 */
export type LoginInputType = 'email' | 'phone' | 'invalid'

export function getLoginInputType(input: string): LoginInputType {
  if (!input || !input.trim()) {
    return 'invalid'
  }

  const trimmed = input.trim()

  if (isEmail(trimmed)) {
    return 'email'
  }

  if (isPhoneNumber(trimmed)) {
    return 'phone'
  }

  return 'invalid'
}

/**
 * 驗證登入輸入格式並提供錯誤訊息
 */
export function validateLoginInput(input: string): {
  isValid: boolean
  type: LoginInputType
  normalizedInput: string
  errorMessage?: string
} {
  const trimmed = input.trim()
  const type = getLoginInputType(trimmed)

  if (type === 'invalid') {
    return {
      isValid: false,
      type: 'invalid',
      normalizedInput: trimmed,
      errorMessage: '請輸入有效的電子郵件或手機號碼',
    }
  }

  let normalizedInput = trimmed

  if (type === 'phone') {
    normalizedInput = normalizePhoneNumber(trimmed)

    // 再次驗證正規化後的手機號碼
    if (!normalizedInput.match(/^09\d{8}$/)) {
      return {
        isValid: false,
        type: 'invalid',
        normalizedInput: trimmed,
        errorMessage: '請輸入有效的台灣手機號碼（09xx-xxx-xxx）',
      }
    }
  }

  return {
    isValid: true,
    type,
    normalizedInput,
  }
}
