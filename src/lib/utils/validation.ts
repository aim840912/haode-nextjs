/**
 * 統一的驗證工具函數
 *
 * 提供可重用的驗證邏輯，避免程式碼重複
 */

export interface ValidationResult {
  valid: boolean
  message?: string
}

/**
 * 驗證台灣手機號碼
 *
 * @example
 * ```ts
 * validatePhone('0912-345-678') // { valid: true }
 * validatePhone('02-2345-6789') // { valid: true }
 * validatePhone('123456') // { valid: false, message: '...' }
 * ```
 */
export function validatePhone(phone: string): ValidationResult {
  // 移除所有空格和特殊字元
  const cleaned = phone.replace(/[\s\-()]/g, '')

  // 台灣手機號碼格式: 09 開頭，總共 10 碼
  const mobileRegex = /^09\d{8}$/

  // 台灣市話格式: 區碼 + 號碼（支援 02/03/04/05/06/07/08/089）
  const landlineRegex = /^0[2-9]\d{7,8}$/

  if (mobileRegex.test(cleaned)) {
    return { valid: true }
  }

  if (landlineRegex.test(cleaned)) {
    return { valid: true }
  }

  return {
    valid: false,
    message: '請輸入有效的台灣電話號碼（手機或市話）',
  }
}

/**
 * 驗證 Email 地址
 *
 * @example
 * ```ts
 * validateEmail('user@example.com') // { valid: true }
 * validateEmail('invalid-email') // { valid: false, message: '...' }
 * ```
 */
export function validateEmail(email: string): ValidationResult {
  // RFC 5322 簡化版正則表達式
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

  // 額外檢查常見錯誤
  if (email.startsWith('@') || email.endsWith('@')) {
    return { valid: false, message: 'Email 格式錯誤：不能以 @ 開頭或結尾' }
  }

  if (email.includes('..')) {
    return { valid: false, message: 'Email 格式錯誤：不能包含連續的點' }
  }

  if (!regex.test(email)) {
    return { valid: false, message: '請輸入有效的 Email 地址' }
  }

  // 檢查長度
  if (email.length > 254) {
    return { valid: false, message: 'Email 長度不得超過 254 字元' }
  }

  return { valid: true }
}

/**
 * 驗證日期範圍
 *
 * @example
 * ```ts
 * validateDateRange('2025-01-01', '2025-01-31') // { valid: true }
 * validateDateRange('2025-01-31', '2025-01-01') // { valid: false, message: '...' }
 * ```
 */
export function validateDateRange(startDate: string, endDate: string): ValidationResult {
  const start = new Date(startDate)
  const end = new Date(endDate)

  if (isNaN(start.getTime())) {
    return { valid: false, message: '開始日期格式錯誤' }
  }

  if (isNaN(end.getTime())) {
    return { valid: false, message: '結束日期格式錯誤' }
  }

  if (start > end) {
    return { valid: false, message: '開始日期不得晚於結束日期' }
  }

  return { valid: true }
}

/**
 * 驗證台灣身分證字號
 *
 * @example
 * ```ts
 * validateTaiwanId('A123456789') // { valid: true }
 * validateTaiwanId('Z999999999') // { valid: false, message: '...' }
 * ```
 */
export function validateTaiwanId(id: string): ValidationResult {
  // 移除空格
  const cleaned = id.trim().toUpperCase()

  // 基本格式檢查：1 個英文字母 + 9 個數字
  const regex = /^[A-Z]\d{9}$/
  if (!regex.test(cleaned)) {
    return { valid: false, message: '身分證字號格式錯誤（應為 1 個英文字母 + 9 個數字）' }
  }

  // 英文字母對應的數字
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

  // 計算檢查碼
  const digits = cleaned.substring(1).split('').map(Number)
  const weights = [1, 9, 8, 7, 6, 5, 4, 3, 2, 1]

  let sum = Math.floor(letterValue / 10) + (letterValue % 10) * 9

  for (let i = 0; i < 9; i++) {
    sum += digits[i] * weights[i + 1]
  }

  if (sum % 10 !== 0) {
    return { valid: false, message: '身分證字號檢查碼錯誤' }
  }

  return { valid: true }
}

/**
 * 驗證台灣郵遞區號
 *
 * @example
 * ```ts
 * validateZipCode('100') // { valid: true }
 * validateZipCode('10043') // { valid: true } // 支援 3+2 格式
 * validateZipCode('999') // { valid: false, message: '...' }
 * ```
 */
export function validateZipCode(zipCode: string): ValidationResult {
  const cleaned = zipCode.trim()

  // 支援 3 碼或 3+2 碼（5 碼）格式
  const regex = /^\d{3}(\d{2})?$/

  if (!regex.test(cleaned)) {
    return { valid: false, message: '郵遞區號格式錯誤（應為 3 碼或 5 碼數字）' }
  }

  // 簡單的範圍檢查（台灣郵遞區號範圍 100-999）
  const code = parseInt(cleaned.substring(0, 3))
  if (code < 100 || code > 999) {
    return { valid: false, message: '郵遞區號不在有效範圍內' }
  }

  return { valid: true }
}

/**
 * 驗證 URL
 *
 * @example
 * ```ts
 * validateUrl('https://example.com') // { valid: true }
 * validateUrl('not-a-url') // { valid: false, message: '...' }
 * ```
 */
export function validateUrl(url: string): ValidationResult {
  try {
    const parsed = new URL(url)

    // 只允許 http 和 https 協定
    if (!['http:', 'https:'].includes(parsed.protocol)) {
      return { valid: false, message: 'URL 必須使用 http 或 https 協定' }
    }

    return { valid: true }
  } catch {
    return { valid: false, message: '請輸入有效的 URL' }
  }
}

/**
 * 驗證密碼強度
 *
 * @example
 * ```ts
 * validatePassword('Password123!', { minLength: 8 })
 * // { valid: true }
 *
 * validatePassword('weak', { minLength: 8, requireUppercase: true })
 * // { valid: false, message: '...' }
 * ```
 */
export function validatePassword(
  password: string,
  options: {
    minLength?: number
    requireUppercase?: boolean
    requireLowercase?: boolean
    requireNumber?: boolean
    requireSpecial?: boolean
  } = {}
): ValidationResult {
  const {
    minLength = 8,
    requireUppercase = true,
    requireLowercase = true,
    requireNumber = true,
    requireSpecial = false,
  } = options

  if (password.length < minLength) {
    return { valid: false, message: `密碼長度至少需要 ${minLength} 個字元` }
  }

  if (requireUppercase && !/[A-Z]/.test(password)) {
    return { valid: false, message: '密碼必須包含至少一個大寫字母' }
  }

  if (requireLowercase && !/[a-z]/.test(password)) {
    return { valid: false, message: '密碼必須包含至少一個小寫字母' }
  }

  if (requireNumber && !/\d/.test(password)) {
    return { valid: false, message: '密碼必須包含至少一個數字' }
  }

  if (requireSpecial && !/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
    return { valid: false, message: '密碼必須包含至少一個特殊字元' }
  }

  return { valid: true }
}

/**
 * 驗證數字範圍
 *
 * @example
 * ```ts
 * validateNumberRange(50, { min: 0, max: 100 }) // { valid: true }
 * validateNumberRange(150, { min: 0, max: 100 }) // { valid: false, message: '...' }
 * ```
 */
export function validateNumberRange(
  value: number,
  options: {
    min?: number
    max?: number
    integer?: boolean
  } = {}
): ValidationResult {
  const { min, max, integer = false } = options

  if (isNaN(value)) {
    return { valid: false, message: '請輸入有效的數字' }
  }

  if (integer && !Number.isInteger(value)) {
    return { valid: false, message: '必須為整數' }
  }

  if (min !== undefined && value < min) {
    return { valid: false, message: `數值不得小於 ${min}` }
  }

  if (max !== undefined && value > max) {
    return { valid: false, message: `數值不得大於 ${max}` }
  }

  return { valid: true }
}

/**
 * 驗證字串長度
 *
 * @example
 * ```ts
 * validateStringLength('Hello', { min: 1, max: 10 }) // { valid: true }
 * validateStringLength('Too long text', { max: 5 }) // { valid: false, message: '...' }
 * ```
 */
export function validateStringLength(
  value: string,
  options: {
    min?: number
    max?: number
  } = {}
): ValidationResult {
  const { min, max } = options
  const length = value.trim().length

  if (min !== undefined && length < min) {
    return { valid: false, message: `長度至少需要 ${min} 個字元` }
  }

  if (max !== undefined && length > max) {
    return { valid: false, message: `長度不得超過 ${max} 個字元` }
  }

  return { valid: true }
}

/**
 * 驗證必填欄位
 *
 * @example
 * ```ts
 * validateRequired('value') // { valid: true }
 * validateRequired('') // { valid: false, message: '...' }
 * validateRequired('  ') // { valid: false, message: '...' }
 * ```
 */
export function validateRequired(value: string | number | null | undefined): ValidationResult {
  if (value === null || value === undefined) {
    return { valid: false, message: '此欄位為必填' }
  }

  if (typeof value === 'string' && value.trim() === '') {
    return { valid: false, message: '此欄位不得為空' }
  }

  return { valid: true }
}

/**
 * 組合多個驗證器
 *
 * @example
 * ```ts
 * const validators = [
 *   validateRequired,
 *   (value) => validateEmail(value),
 *   (value) => validateStringLength(value, { max: 50 })
 * ]
 *
 * combineValidators('user@example.com', validators)
 * // { valid: true }
 * ```
 */
export function combineValidators(
  value: any,
  validators: Array<(value: any) => ValidationResult>
): ValidationResult {
  for (const validator of validators) {
    const result = validator(value)
    if (!result.valid) {
      return result
    }
  }

  return { valid: true }
}
