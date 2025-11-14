export interface UploadedImage {
  id: string
  url?: string
  path: string
  size: 'thumbnail' | 'medium' | 'large'
  file?: File
  preview?: string
  storage_url?: string
  position: number
  alt?: string
}

export interface UploadUrlData {
  url: string
  path: string
}

export interface UploadResult {
  multiple?: boolean
  urls?: Record<string, UploadUrlData>
  // 統一 API 多圖結果
  images?: Array<{
    id: string
    url: string
    path: string
    size: 'thumbnail' | 'medium' | 'large'
  }>
  // 統一 API 單圖結果
  image?: {
    id: string
    url: string
    path: string
    size: 'thumbnail' | 'medium' | 'large'
  }
  // 單一上傳結果
  url?: string
  path?: string
  size?: 'thumbnail' | 'medium' | 'large'
}

export interface ImageUploaderProps {
  productId: string
  onUploadSuccess?: (images: UploadedImage[]) => void
  onUploadError?: (error: string) => void
  onDeleteSuccess?: (deletedImage: UploadedImage) => void
  maxFiles?: number
  allowMultiple?: boolean
  generateMultipleSizes?: boolean
  enableCompression?: boolean
  className?: string
  acceptedTypes?: string[]
  // 新增統一 API 支援
  module?: string
  // 向後相容的舊 props
  apiEndpoint?: string
  idParamName?: string
  // 新增：初始圖片支援
  initialImages?: string[]
  onDeleteInitialImage?: (imageUrl: string) => void
}

export interface SingleImageUploaderProps {
  productId: string
  onUploadSuccess?: (image: UploadedImage) => void
  onUploadError?: (error: string) => void
  onDelete?: () => void
  initialImage?: string
  size?: 'thumbnail' | 'medium' | 'large'
  className?: string
  module?: string
  apiEndpoint?: string
  idParamName?: string
  enableDelete?: boolean
}
