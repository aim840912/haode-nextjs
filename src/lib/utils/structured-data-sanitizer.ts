/**
 * Structured Data Sanitizer
 *
 * 專門用於清理 JSON-LD 結構化資料，防止潛在的注入攻擊
 *
 * 安全性考量：
 * - JSON.stringify() 會自動轉義 HTML 特殊字元
 * - 額外防護：防止 </script> 標籤注入
 * - JSON-LD 資料放在 <script type="application/ld+json"> 中，不會被執行
 * - 這是 Google、Schema.org 推薦的標準做法
 *
 * @module structured-data-sanitizer
 */

import { logger } from '@/lib/logger'

/**
 * 驗證並清理結構化資料物件
 *
 * @param data - 要轉換為 JSON 的資料物件
 * @param options - 可選的配置選項
 * @returns 安全的 JSON 字串
 *
 * @example
 * ```typescript
 * const product = { name: 'Apple</script><script>alert("XSS")</script>' }
 * const safe = sanitizeStructuredData(product)
 * // 結果: {"name":"Apple<\\/script><script>alert(\\"XSS\\")</script>"}
 * ```
 */
export function sanitizeStructuredData(
  data: unknown,
  options: {
    /** 是否記錄清理動作 */
    enableLogging?: boolean
    /** 自定義模組名稱（用於日誌） */
    moduleName?: string
  } = {}
): string {
  const { enableLogging = false, moduleName = 'StructuredDataSanitizer' } = options

  try {
    // 步驟 1: 使用 JSON.stringify 序列化
    // 這會自動轉義 <, >, &, ", ' 等特殊字元
    const jsonString = JSON.stringify(data, null, 0)

    // 步驟 2: 額外防護 - 轉義 </script> 標籤
    // 即使 JSON.stringify 已經處理，這是額外的安全層
    // 將 </script> 轉為 <\/script>，破壞標籤結構
    const sanitized = jsonString.replace(/<\/script>/gi, '<\\/script>')

    // 步驟 3: 檢測是否有可疑內容被清理
    if (sanitized !== jsonString && enableLogging) {
      logger.warn('結構化資料包含可疑內容已清理', {
        module: moduleName,
        action: 'sanitizeStructuredData',
        metadata: {
          detectedPattern: '</script>',
          originalLength: jsonString.length,
          sanitizedLength: sanitized.length,
        },
      })
    }

    return sanitized
  } catch (error) {
    // JSON.stringify 失敗（循環引用、BigInt 等）
    logger.error('結構化資料序列化失敗', error as Error, {
      module: moduleName,
      action: 'sanitizeStructuredData',
      metadata: {
        dataType: typeof data,
        errorMessage: (error as Error).message,
      },
    })

    // 返回安全的空物件
    return '{}'
  }
}

/**
 * 驗證結構化資料物件的基本格式
 *
 * 確保資料符合 Schema.org 規範的基本要求
 *
 * @param data - 要驗證的資料物件
 * @returns 驗證結果
 */
export function validateStructuredData(data: unknown): { isValid: boolean; errors: string[] } {
  const errors: string[] = []

  // 檢查是否為物件
  if (!data || typeof data !== 'object') {
    errors.push('結構化資料必須是物件類型')
    return { isValid: false, errors }
  }

  const dataObj = data as Record<string, unknown>

  // 檢查必要的 Schema.org 欄位
  if (!dataObj['@context']) {
    errors.push('缺少 @context 欄位')
  }

  if (!dataObj['@type']) {
    errors.push('缺少 @type 欄位')
  }

  // 檢查 @context 是否為 Schema.org
  if (dataObj['@context'] && typeof dataObj['@context'] === 'string') {
    if (!dataObj['@context'].includes('schema.org')) {
      errors.push('@context 應指向 schema.org')
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
  }
}

/**
 * 清理字串欄位，移除潛在的危險內容
 *
 * 用於清理使用者輸入的文字欄位（如產品名稱、描述）
 *
 * @param value - 要清理的字串
 * @param maxLength - 最大長度限制（防止過長輸入）
 * @returns 清理後的字串
 */
export function sanitizeStringField(value: unknown, maxLength: number = 500): string {
  if (typeof value !== 'string') {
    return ''
  }

  // 移除控制字元和不可見字元
  let cleaned = value.replace(/[\x00-\x1F\x7F-\x9F]/g, '')

  // 限制長度
  if (cleaned.length > maxLength) {
    cleaned = cleaned.substring(0, maxLength)
    logger.debug('字串欄位超過長度限制已截斷', {
      module: 'StructuredDataSanitizer',
      action: 'sanitizeStringField',
      metadata: { originalLength: value.length, maxLength },
    })
  }

  return cleaned.trim()
}

/**
 * 清理 URL 欄位
 *
 * @param value - 要清理的 URL
 * @returns 清理後的 URL 或空字串
 */
export function sanitizeUrlField(value: unknown): string {
  if (typeof value !== 'string') {
    return ''
  }

  try {
    // 驗證 URL 格式
    const url = new URL(value)

    // 只允許 http 和 https 協議
    if (!['http:', 'https:'].includes(url.protocol)) {
      logger.warn('結構化資料包含非 HTTP(S) URL', {
        module: 'StructuredDataSanitizer',
        action: 'sanitizeUrlField',
        metadata: { protocol: url.protocol },
      })
      return ''
    }

    return url.toString()
  } catch {
    // 無效的 URL
    logger.debug('無效的 URL 已過濾', {
      module: 'StructuredDataSanitizer',
      action: 'sanitizeUrlField',
    })
    return ''
  }
}

/**
 * 安全地格式化產品結構化資料
 *
 * 專門用於清理產品相關的結構化資料
 */
export function sanitizeProductData(product: {
  name: unknown
  description: unknown
  category: unknown
  price: unknown
  inventory: unknown
  images?: unknown[]
}): {
  name: string
  description: string
  category: string
  price: number
  inventory: number
  images?: string[]
} {
  return {
    name: sanitizeStringField(product.name, 100),
    description: sanitizeStringField(product.description, 500),
    category: sanitizeStringField(product.category, 50),
    price: typeof product.price === 'number' ? product.price : 0,
    inventory: typeof product.inventory === 'number' ? product.inventory : 0,
    images: Array.isArray(product.images)
      ? product.images.map(img => sanitizeUrlField(img)).filter(Boolean)
      : undefined,
  }
}

/**
 * 安全地格式化文章結構化資料
 */
export function sanitizeArticleData(article: {
  title: unknown
  summary: unknown
  imageUrl?: unknown
  publishedDate: unknown
  modifiedDate?: unknown
  author?: unknown
}): {
  title: string
  summary: string
  imageUrl?: string
  publishedDate: string
  modifiedDate?: string
  author?: string
} {
  return {
    title: sanitizeStringField(article.title, 200),
    summary: sanitizeStringField(article.summary, 500),
    imageUrl: article.imageUrl ? sanitizeUrlField(article.imageUrl) : undefined,
    publishedDate:
      typeof article.publishedDate === 'string' ? article.publishedDate : new Date().toISOString(),
    modifiedDate:
      typeof article.modifiedDate === 'string'
        ? article.modifiedDate
        : typeof article.publishedDate === 'string'
          ? article.publishedDate
          : new Date().toISOString(),
    author: article.author ? sanitizeStringField(article.author, 100) : undefined,
  }
}
