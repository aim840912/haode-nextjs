import { ProductImage } from '@/types/product'
import { apiLogger } from '@/lib/logger'

export interface ImageSizeConfig {
  thumbnail: { width: 200; height: 200 }
  medium: { width: 600; height: 600 }
  large: { width: 1200; height: 1200 }
}

export const IMAGE_SIZES: ImageSizeConfig = {
  thumbnail: { width: 200, height: 200 },
  medium: { width: 600, height: 600 },
  large: { width: 1200, height: 1200 },
}

export interface ImageOptimizationOptions {
  quality?: number
  format?: 'webp' | 'avif' | 'jpeg' | 'png'
  progressive?: boolean
}

export const DEFAULT_IMAGE_OPTIONS: ImageOptimizationOptions = {
  quality: 80,
  format: 'webp',
  progressive: true,
}

/**
 * 生成圖片URL，根據不同尺寸和來源
 */
export function generateImageUrl(
  productId: string,
  filename: string,
  size: keyof ImageSizeConfig = 'medium',
  source: 'local' | 'supabase' = 'local'
): string {
  // 如果 filename 已經是完整的 Supabase URL，直接返回
  if (filename && filename.startsWith('https://') && filename.includes('supabase.co/storage')) {
    return filename
  }

  if (source === 'supabase') {
    return `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/products/${productId}/${size}-${filename}`
  }

  // 處理 blob URL 或無效檔名的情況
  if (!filename || filename.startsWith('blob:') || filename.includes('blob')) {
    return `/images/products/${productId}-${size}.jpg` // 使用預設副檔名
  }

  // 本地圖片路徑
  const baseFileName = filename.replace(/\.[^/.]+$/, '') // 移除副檔名
  const extension = filename.split('.').pop()

  // 驗證副檔名是否有效
  const validExtensions = ['jpg', 'jpeg', 'png', 'webp', 'avif']
  const finalExtension =
    extension && validExtensions.includes(extension.toLowerCase()) ? extension.toLowerCase() : 'jpg'

  return `/images/products/${productId}-${size}.${finalExtension}`
}

/**
 * 生成產品所有尺寸的圖片URLs
 */
export function generateProductImageUrls(
  productId: string,
  filename: string,
  source: 'local' | 'supabase' = 'local'
): Record<keyof ImageSizeConfig, string> {
  return {
    thumbnail: generateImageUrl(productId, filename, 'thumbnail', source),
    medium: generateImageUrl(productId, filename, 'medium', source),
    large: generateImageUrl(productId, filename, 'large', source),
  }
}

/**
 * 從 Supabase Storage URL 生成不同尺寸的圖片 URL
 */
export function generateImageUrlsFromSupabaseUrl(
  supabaseUrl: string
): Record<keyof ImageSizeConfig, string> {
  // 如果不是 Supabase URL，返回原 URL 作為所有尺寸
  if (!supabaseUrl.includes('supabase.co/storage')) {
    return {
      thumbnail: supabaseUrl,
      medium: supabaseUrl,
      large: supabaseUrl,
    }
  }

  // 由於 Supabase Storage 中可能只有 medium 尺寸的圖片
  // 我們優先使用現有的 medium 圖片，避免請求不存在的縮圖
  return {
    thumbnail: supabaseUrl, // 使用 medium 圖片作為縮圖
    medium: supabaseUrl, // 原始 medium 圖片
    large: supabaseUrl, // 使用 medium 圖片作為 large
  }
}

/**
 * 建立 ProductImage 物件
 */
export function createProductImage(
  productId: string,
  filename: string,
  alt: string,
  position: number = 0,
  size: keyof ImageSizeConfig = 'medium',
  source: 'local' | 'supabase' = 'local'
): ProductImage {
  const url = generateImageUrl(productId, filename, size, source)
  const sizeConfig = IMAGE_SIZES[size]

  return {
    id: `${productId}-${size}-${position}`,
    url,
    alt,
    position,
    size,
    width: sizeConfig.width,
    height: sizeConfig.height,
  }
}

/**
 * 壓縮圖片檔案 (瀏覽器端使用)
 */
export async function compressImage(
  file: File,
  options: { maxSizeMB?: number; maxWidthOrHeight?: number; quality?: number } = {}
): Promise<File> {
  const { maxSizeMB = 1, maxWidthOrHeight = 1920, quality = 0.8 } = options

  // 動態導入 browser-image-compression
  const { default: imageCompression } = await import('browser-image-compression')

  const compressOptions = {
    maxSizeMB,
    maxWidthOrHeight,
    useWebWorker: true,
    initialQuality: quality,
  }

  try {
    const compressedFile = await imageCompression(file, compressOptions)
    return compressedFile
  } catch (error) {
    apiLogger.error(
      '圖片壓縮失敗',
      error instanceof Error ? error : new Error('Unknown compression error'),
      {
        module: 'ImageUtils',
        action: 'compressImage',
        metadata: {
          fileName: file.name,
          fileSize: file.size,
          maxSizeMB: options.maxSizeMB,
          maxWidthOrHeight: options.maxWidthOrHeight,
        },
      }
    )
    return file // 壓縮失敗時返回原檔案
  }
}

/**
 * 檔案魔術位元組（Magic Number）檢查
 * 驗證檔案的實際內容是否符合聲明的 MIME 類型
 */
async function validateFileMagicBytes(file: File): Promise<{ valid: boolean; error?: string }> {
  const buffer = await file.slice(0, 16).arrayBuffer()
  const bytes = new Uint8Array(buffer)

  // 常見圖片格式的魔術位元組
  const magicBytes: { [key: string]: number[] } = {
    'image/jpeg': [0xff, 0xd8, 0xff],
    'image/png': [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a],
    'image/webp': [0x52, 0x49, 0x46, 0x46], // 需要額外檢查 WEBP 標識
    'image/avif': [0x00, 0x00, 0x00], // AVIF 檢查較複雜，基礎檢查
  }

  const expectedMagic = magicBytes[file.type]
  if (!expectedMagic) {
    return { valid: false, error: '不支援的檔案類型' }
  }

  // 檢查魔術位元組
  for (let i = 0; i < expectedMagic.length; i++) {
    if (bytes[i] !== expectedMagic[i]) {
      return {
        valid: false,
        error: '檔案內容與宣告的格式不符，可能是惡意檔案',
      }
    }
  }

  // WebP 需要額外檢查
  if (file.type === 'image/webp') {
    const webpSignature = Array.from(bytes.slice(8, 12))
    const expectedWebp = [0x57, 0x45, 0x42, 0x50] // "WEBP"
    if (!webpSignature.every((byte, i) => byte === expectedWebp[i])) {
      return {
        valid: false,
        error: 'WebP 檔案格式驗證失敗',
      }
    }
  }

  return { valid: true }
}

/**
 * 驗證圖片檔案
 * 包含基本驗證和深度安全檢查
 */
export async function validateImageFile(file: File): Promise<{ valid: boolean; error?: string }> {
  const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/avif']
  const maxSize = 10 * 1024 * 1024 // 10MB
  const minSize = 100 // 100 bytes 最小檔案大小

  // 基本檔案名稱檢查
  if (!file.name || file.name.trim() === '') {
    return {
      valid: false,
      error: '檔案名稱不能為空',
    }
  }

  // 檔案名稱長度檢查
  if (file.name.length > 255) {
    return {
      valid: false,
      error: '檔案名稱過長（最多 255 字元）',
    }
  }

  // 危險檔案名稱檢查
  const dangerousPatterns = [
    /\.\./, // 路徑穿越
    /[<>:"\/\\|?*]/, // 危險字符
    /^\.|\.$/, // 以點開始或結束
    /\.(exe|bat|cmd|scr|com|pif|vbs|js|jar|php|asp|jsp)$/i, // 可執行檔案
  ]

  if (dangerousPatterns.some(pattern => pattern.test(file.name))) {
    return {
      valid: false,
      error: '檔案名稱包含不安全的字元或格式',
    }
  }

  // 檔案大小檢查
  if (file.size < minSize) {
    return {
      valid: false,
      error: '檔案太小，可能不是有效的圖片檔案',
    }
  }

  if (file.size > maxSize) {
    return {
      valid: false,
      error: '檔案大小不能超過 10MB',
    }
  }

  // MIME 類型檢查
  if (!allowedTypes.includes(file.type)) {
    return {
      valid: false,
      error: '不支援的檔案格式。請使用 JPEG、PNG、WebP 或 AVIF 格式',
    }
  }

  // 深度檔案內容驗證（魔術位元組檢查）
  try {
    const magicBytesValidation = await validateFileMagicBytes(file)
    if (!magicBytesValidation.valid) {
      return magicBytesValidation
    }
  } catch (error) {
    return {
      valid: false,
      error: '檔案內容驗證失敗',
    }
  }

  return { valid: true }
}

/**
 * 同步版本的基本檔案驗證（向後相容）
 */
export function validateImageFileBasic(file: File): { valid: boolean; error?: string } {
  const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/avif']
  const maxSize = 10 * 1024 * 1024 // 10MB

  if (!allowedTypes.includes(file.type)) {
    return {
      valid: false,
      error: '不支援的檔案格式。請使用 JPEG、PNG、WebP 或 AVIF 格式。',
    }
  }

  if (file.size > maxSize) {
    return {
      valid: false,
      error: '檔案大小不能超過 10MB。',
    }
  }

  return { valid: true }
}

/**
 * 從 MIME 類型推斷檔案副檔名
 */
function getExtensionFromMimeType(mimeType: string): string {
  const mimeToExt: Record<string, string> = {
    'image/jpeg': 'jpg',
    'image/jpg': 'jpg',
    'image/png': 'png',
    'image/webp': 'webp',
    'image/avif': 'avif',
    'image/gif': 'gif',
    'image/bmp': 'bmp',
    'image/tiff': 'tiff',
    'image/svg+xml': 'svg',
  }
  return mimeToExt[mimeType.toLowerCase()] || 'jpg'
}

/**
 * 產生檔案名稱
 */
export function generateFileName(
  originalName: string,
  productId: string,
  mimeType?: string
): string {
  const timestamp = Date.now()
  let extension = originalName.split('.').pop() || 'jpg'

  // 特殊處理：如果副檔名為 'blob' 且有 MIME type，則從 MIME type 推斷正確的副檔名
  if (extension.toLowerCase() === 'blob' && mimeType) {
    extension = getExtensionFromMimeType(mimeType)
  }

  // 確保副檔名是有效的圖片格式
  const validExtensions = ['jpg', 'jpeg', 'png', 'webp', 'avif', 'gif', 'bmp', 'tiff', 'svg']
  if (!validExtensions.includes(extension.toLowerCase())) {
    extension = mimeType ? getExtensionFromMimeType(mimeType) : 'jpg'
  }

  const baseName = originalName.replace(/\.[^/.]+$/, '').replace(/[^a-zA-Z0-9]/g, '_')
  return `${productId}_${baseName}_${timestamp}.${extension}`
}

/**
 * 獲取圖片預覽URL
 */
export function getImagePreviewUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = e => resolve(e.target?.result as string)
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

/**
 * 建立不同尺寸的響應式圖片srcSet
 */
export function buildResponsiveImageSrcSet(baseUrl: string, productId: string): string {
  const sizes = ['thumbnail', 'medium', 'large'] as const
  return sizes
    .map(size => {
      const width = IMAGE_SIZES[size].width
      const url = baseUrl.replace('medium', size)
      return `${url} ${width}w`
    })
    .join(', ')
}

/**
 * 獲取適當的圖片尺寸基於容器寬度
 */
export function getOptimalImageSize(containerWidth: number): keyof ImageSizeConfig {
  if (containerWidth <= 200) return 'thumbnail'
  if (containerWidth <= 600) return 'medium'
  return 'large'
}

/**
 * 圖片載入錯誤時的後備處理
 */
export function handleImageError(
  event: React.SyntheticEvent<HTMLImageElement>,
  fallbackUrl: string = '/images/placeholder.jpg'
): void {
  const img = event.currentTarget
  if (img.src !== fallbackUrl) {
    img.src = fallbackUrl
  }
}

/**
 * 預載入圖片
 */
export function preloadImage(url: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve()
    img.onerror = reject
    img.src = url
  })
}

/**
 * 批量預載入圖片
 */
export async function preloadImages(urls: string[]): Promise<void> {
  try {
    await Promise.all(urls.map(url => preloadImage(url)))
  } catch (error) {
    apiLogger.warn('部分圖片預載入失敗', {
      module: 'ImageUtils',
      action: 'preloadImages',
      metadata: {
        error: error instanceof Error ? error.message : 'Unknown preload error',
        urlCount: urls.length,
        urls: urls.slice(0, 3),
      },
    })
  }
}
