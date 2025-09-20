/**
 * 圖片 URL 驗證和轉換工具
 * 處理 data URLs、Blob URLs 和正常 URLs 的統一管理
 */

import { dbLogger } from '@/lib/logger'

export interface ImageUrlValidationResult {
  isValid: boolean
  type: 'data' | 'blob' | 'http' | 'https' | 'relative' | 'invalid'
  originalUrl: string
  processedUrl?: string
  error?: string
  shouldUseNativeImg: boolean
}

/**
 * 驗證圖片 URL 並分類類型
 */
export function validateImageUrl(url: string | null | undefined): ImageUrlValidationResult {
  const originalUrl = url || ''

  if (!originalUrl) {
    return {
      isValid: false,
      type: 'invalid',
      originalUrl,
      error: 'URL 為空',
      shouldUseNativeImg: false,
    }
  }

  try {
    // Data URL (base64)
    if (originalUrl.startsWith('data:image/')) {
      return {
        isValid: true,
        type: 'data',
        originalUrl,
        processedUrl: originalUrl,
        shouldUseNativeImg: true, // 必須使用原生 img 標籤
      }
    }

    // Blob URL
    if (originalUrl.startsWith('blob:')) {
      return {
        isValid: true,
        type: 'blob',
        originalUrl,
        processedUrl: originalUrl,
        shouldUseNativeImg: true, // 必須使用原生 img 標籤
      }
    }

    // HTTPS URL
    if (originalUrl.startsWith('https://')) {
      // 驗證是否為有效的 URL
      new URL(originalUrl)
      return {
        isValid: true,
        type: 'https',
        originalUrl,
        processedUrl: originalUrl,
        shouldUseNativeImg: false, // 可以使用 Next.js Image
      }
    }

    // HTTP URL
    if (originalUrl.startsWith('http://')) {
      new URL(originalUrl)
      return {
        isValid: true,
        type: 'http',
        originalUrl,
        processedUrl: originalUrl,
        shouldUseNativeImg: false, // 可以使用 Next.js Image
      }
    }

    // 相對路徑
    if (originalUrl.startsWith('/')) {
      return {
        isValid: true,
        type: 'relative',
        originalUrl,
        processedUrl: originalUrl,
        shouldUseNativeImg: false, // 可以使用 Next.js Image
      }
    }

    // 其他情況視為無效
    return {
      isValid: false,
      type: 'invalid',
      originalUrl,
      error: `不支援的 URL 格式: ${originalUrl.substring(0, 50)}...`,
      shouldUseNativeImg: false,
    }
  } catch (error) {
    return {
      isValid: false,
      type: 'invalid',
      originalUrl,
      error: `URL 格式錯誤: ${error instanceof Error ? error.message : 'Unknown error'}`,
      shouldUseNativeImg: false,
    }
  }
}

/**
 * 檢查是否為預覽圖片（data URL）
 */
export function isPreviewImage(url: string): boolean {
  return url.startsWith('data:image/')
}

/**
 * 檢查是否為上傳後的圖片（Supabase URL）
 */
export function isUploadedImage(url: string): boolean {
  return url.startsWith('https://') && url.includes('supabase')
}

/**
 * 轉換 data URL 為 File 物件
 */
export function dataUrlToFile(dataUrl: string, filename: string = 'image.jpg'): File | null {
  try {
    if (!dataUrl.startsWith('data:image/')) {
      return null
    }

    // 解析 data URL
    const arr = dataUrl.split(',')
    if (arr.length !== 2) {
      return null
    }

    const mimeMatch = arr[0].match(/data:([^;]+)/)
    if (!mimeMatch) {
      return null
    }

    const mime = mimeMatch[1]
    const bstr = atob(arr[1])
    let n = bstr.length
    const u8arr = new Uint8Array(n)

    while (n--) {
      u8arr[n] = bstr.charCodeAt(n)
    }

    return new File([u8arr], filename, { type: mime })
  } catch (error) {
    dbLogger.warn('data URL 轉換為 File 失敗', {
      metadata: { error: error instanceof Error ? error.message : 'Unknown error', filename },
    })
    return null
  }
}

/**
 * 生成安全的 fallback 圖片 URL
 */
export function getSafeFallbackUrl(): string {
  return '/images/placeholder.jpg'
}

/**
 * 檢查圖片 URL 是否需要 CORS 代理
 */
export function needsCorsProxy(url: string): boolean {
  // 對於外部圖片，可能需要 CORS 代理
  if (url.startsWith('http://') || url.startsWith('https://')) {
    // 檢查是否為同源或已知安全的域名
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    if (supabaseUrl && url.startsWith(supabaseUrl)) {
      return false // Supabase 不需要代理
    }

    // 檢查是否為本地開發環境
    if (url.startsWith('http://localhost')) {
      return false
    }

    return true // 其他外部 URL 可能需要代理
  }

  return false
}

/**
 * 環境檢測：判斷是否在 Vercel 環境
 */
export function isVercelEnvironment(): boolean {
  return !!(process.env.VERCEL || process.env.VERCEL_URL)
}

/**
 * 環境檢測：判斷是否在本地開發環境
 */
export function isLocalDevelopment(): boolean {
  return process.env.NODE_ENV === 'development' && !isVercelEnvironment()
}

/**
 * 根據環境調整圖片 URL
 */
export function adaptUrlForEnvironment(url: string): string {
  const validation = validateImageUrl(url)

  if (!validation.isValid || !validation.processedUrl) {
    return getSafeFallbackUrl()
  }

  // data URLs 和 blob URLs 不需要調整
  if (validation.type === 'data' || validation.type === 'blob') {
    return validation.processedUrl
  }

  // 在 Vercel 環境下，確保使用 HTTPS
  if (isVercelEnvironment() && url.startsWith('http://')) {
    dbLogger.warn('在 Vercel 環境下將 HTTP URL 轉換為 HTTPS', {
      metadata: { originalUrl: url },
    })
    return url.replace('http://', 'https://')
  }

  return validation.processedUrl
}

/**
 * 清理和標準化圖片 URL
 */
export function cleanImageUrl(url: string | null | undefined): string {
  if (!url) {
    return getSafeFallbackUrl()
  }

  const trimmed = url.trim()
  if (!trimmed) {
    return getSafeFallbackUrl()
  }

  return adaptUrlForEnvironment(trimmed)
}

// 導出常用函數集合
export const imageUrlValidator = {
  validate: validateImageUrl,
  isPreview: isPreviewImage,
  isUploaded: isUploadedImage,
  dataUrlToFile,
  getSafeFallback: getSafeFallbackUrl,
  needsCorsProxy,
  isVercel: isVercelEnvironment,
  isLocal: isLocalDevelopment,
  adaptForEnvironment: adaptUrlForEnvironment,
  clean: cleanImageUrl,
}

export default imageUrlValidator
