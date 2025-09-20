/**
 * 圖片 URL 工具函數
 * 處理相對路徑轉完整 URL，避免資料庫 VARCHAR(10) 限制
 */

import { imageUrlValidator } from '@/lib/image-url-validator'

/**
 * 將相對圖片路徑轉換為完整的 Supabase Storage URL
 * @param relativePath - 相對路徑 (例: "/storage/v1/object/public/locations/...")
 * @returns 完整的 Supabase URL
 */
export function getFullImageUrl(relativePath: string | null | undefined): string {
  // 使用新的驗證器處理 URL
  const cleanedUrl = imageUrlValidator.clean(relativePath)

  // 如果已經是有效的完整 URL，直接返回
  const validation = imageUrlValidator.validate(cleanedUrl)
  if (
    validation.isValid &&
    (validation.type === 'https' ||
      validation.type === 'http' ||
      validation.type === 'data' ||
      validation.type === 'blob')
  ) {
    return validation.processedUrl || cleanedUrl
  }

  // 處理空值情況
  if (!relativePath) {
    return '/images/placeholder.jpg' // 預設佔位圖
  }

  // 如果是本地路徑（/images/ 等），直接返回
  if (relativePath.startsWith('/images/')) {
    return relativePath
  }

  // 其他情況，拼接 Supabase 域名
  const supabaseUrl =
    process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://bxlrtcagsuoijjolgdzs.supabase.co'

  // 確保路徑以 / 開頭
  const cleanPath = relativePath.startsWith('/') ? relativePath : `/${relativePath}`

  // 根據環境調整 URL
  const fullUrl = `${supabaseUrl}${cleanPath}`
  return imageUrlValidator.adaptForEnvironment(fullUrl)
}

/**
 * 將完整 URL 轉換為相對路徑以節省資料庫空間
 * @param fullUrl - 完整的 Supabase Storage URL
 * @returns 相對路徑
 */
export function getRelativeImagePath(fullUrl: string): string {
  if (!fullUrl) return ''

  // 如果已經是相對路徑，直接返回
  if (!fullUrl.startsWith('http://') && !fullUrl.startsWith('https://')) {
    return fullUrl
  }

  // 從完整 URL 提取相對路徑
  const url = new URL(fullUrl)
  return url.pathname
}

/**
 * 從 Supabase Storage URL 提取檔案路徑
 * @param url - 完整的 Supabase Storage URL
 * @returns 檔案路徑 (例: "31/location-31-xxx.jpg")
 */
export function extractStoragePathFromUrl(url: string): string {
  if (!url) return ''

  // 如果已經是檔案路徑，直接返回
  if (!url.startsWith('http://') && !url.startsWith('https://')) {
    return url
  }

  try {
    const urlObj = new URL(url)
    const pathname = urlObj.pathname

    // Supabase Storage 路徑格式: /storage/v1/object/public/{bucket}/{path}
    // 我們需要提取 {path} 部分
    const storagePath = '/storage/v1/object/public/locations/'

    if (pathname.includes(storagePath)) {
      // 提取 locations/ 之後的路徑
      return pathname.substring(pathname.indexOf(storagePath) + storagePath.length)
    }

    // 如果沒有標準的 storage 路徑，嘗試從 pathname 提取
    // 假設格式是 /storage/v1/object/public/locations/31/xxx.jpg
    const pathParts = pathname.split('/')
    const locationsIndex = pathParts.indexOf('locations')

    if (locationsIndex >= 0 && locationsIndex < pathParts.length - 1) {
      // 取得 locations 之後的所有部分
      return pathParts.slice(locationsIndex + 1).join('/')
    }

    // 如果都無法解析，返回空字串
    return ''
  } catch (error) {
    console.warn('無法解析 Storage URL:', url, error)
    return ''
  }
}

/**
 * 檢查是否為有效的圖片 URL
 * @param url - 要檢查的 URL
 * @returns 是否為有效圖片 URL
 */
export function isValidImageUrl(url: string): boolean {
  if (!url) return false

  // 檢查常見圖片格式
  const imageExtensions = ['.jpg', '.jpeg', '.png', '.webp', '.avif', '.svg']
  const lowerUrl = url.toLowerCase()

  return imageExtensions.some(ext => lowerUrl.includes(ext))
}

/**
 * 為圖片 URL 添加查詢參數以支援快取控制
 * @param url - 原始 URL
 * @param params - 要添加的查詢參數
 * @returns 帶查詢參數的 URL
 */
export function addImageUrlParams(url: string, params: Record<string, string> = {}): string {
  if (!url) return url

  try {
    const urlObj = new URL(getFullImageUrl(url))

    Object.entries(params).forEach(([key, value]) => {
      urlObj.searchParams.set(key, value)
    })

    return urlObj.toString()
  } catch (error) {
    console.warn('Invalid URL provided to addImageUrlParams:', url)
    return url
  }
}

/**
 * 生成響應式圖片的 srcSet
 * @param baseUrl - 基礎 URL
 * @param sizes - 不同尺寸的寬度陣列
 * @returns srcSet 字符串
 */
export function generateImageSrcSet(baseUrl: string, sizes: number[] = [400, 800, 1200]): string {
  if (!baseUrl) return ''

  const fullUrl = getFullImageUrl(baseUrl)

  return sizes
    .map(width => `${addImageUrlParams(fullUrl, { width: width.toString() })} ${width}w`)
    .join(', ')
}

// 預設導出常用函數
const imageUrlUtils = {
  getFullImageUrl,
  getRelativeImagePath,
  extractStoragePathFromUrl,
  isValidImageUrl,
  addImageUrlParams,
  generateImageSrcSet,
}

export default imageUrlUtils
