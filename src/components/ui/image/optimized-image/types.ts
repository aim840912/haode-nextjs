/**
 * OptimizedImage 型別定義與常量
 */

export interface OptimizedImageProps {
  src: string
  alt: string
  width?: number
  height?: number
  className?: string
  fill?: boolean // ⚠️ 注意：配合 aspect-ratio 使用時可能有填充問題
  sizes?: string
  priority?: boolean
  quality?: number
  placeholder?: 'blur' | 'empty'
  blurDataURL?: string
  fallbackSrc?: string
  onError?: (error?: string) => void
  onLoad?: () => void
  lazy?: boolean
  productId?: string
  enableResponsive?: boolean
  threshold?: number
  enableMultiLevelFallback?: boolean
  showErrorDetails?: boolean
}

export interface ResponsiveImageProps extends OptimizedImageProps {
  aspectRatio?: string
}

export interface AvatarImageProps extends OptimizedImageProps {
  size?: 'sm' | 'md' | 'lg' | 'xl'
}

/** Base64 編碼的 1x1 灰色像素作為最終 fallback */
export const BASE64_PLACEHOLDER =
  'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCA0MCA0MCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjQwIiBoZWlnaHQ9IjQwIiBmaWxsPSIjRjNGNEY2Ii8+CjxwYXRoIGQ9Ik0xNiAxNkwyNCAxNkwyNCAyNEwxNiAyNFYxNloiIGZpbGw9IiNEMUQ1REIiLz4KPC9zdmc+'

/** 優化的模糊預設圖片 base64 - 更柔和的灰色漸層 */
export const DEFAULT_BLUR_DATA_URL =
  'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzIwIiBoZWlnaHQ9IjI0MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KICA8ZGVmcz4KICAgIDxsaW5lYXJHcmFkaWVudCBpZD0iYSIgeDI9IjEwMCUiIHkyPSIxMDAlIj4KICAgICAgPHN0b3Agc3RvcC1jb2xvcj0iI2Y5ZmFmYiIvPgogICAgICA8c3RvcCBvZmZzZXQ9IjEiIHN0b3AtY29sb3I9IiNlNWU3ZWIiLz4KICAgIDwvbGluZWFyR3JhZGllbnQ+CiAgPC9kZWZzPgogIDxyZWN0IHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIGZpbGw9InVybCgjYSkiLz4KPC9zdmc+'

/** 響應式圖片 sizes 配置 */
export const RESPONSIVE_SIZES =
  '(max-width: 480px) 100vw, (max-width: 768px) 50vw, (max-width: 1200px) 33vw, 25vw'

/** 預設 sizes 配置 */
export const DEFAULT_SIZES = '(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw'

/** 頭像尺寸配置 */
export const AVATAR_SIZE_CLASSES = {
  sm: 'w-8 h-8',
  md: 'w-12 h-12',
  lg: 'w-16 h-16',
  xl: 'w-24 h-24',
}

export const AVATAR_SIZE_PX = {
  sm: { width: 32, height: 32 },
  md: { width: 48, height: 48 },
  lg: { width: 64, height: 64 },
  xl: { width: 96, height: 96 },
}

/** AspectRatio 到 padding-bottom 百分比的映射 */
export const ASPECT_RATIO_PADDING_MAP: Record<string, string> = {
  'aspect-square': '100%', // 1:1
  'aspect-video': '56.25%', // 16:9
  'aspect-[4/3]': '75%', // 4:3
  'aspect-[3/2]': '66.67%', // 3:2
  'aspect-[2/1]': '50%', // 2:1
}
