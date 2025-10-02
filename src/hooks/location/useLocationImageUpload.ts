import { useState, useCallback } from 'react'
import { logger } from '@/lib/logger'

export const useLocationImageUpload = () => {
  const [uploadedImageUrl, setUploadedImageUrl] = useState<string>('')
  const [imagePaths, setImagePaths] = useState<Map<string, string>>(new Map())
  const [uploadError, setUploadError] = useState<string | null>(null)

  const handleImageUploadSuccess = useCallback(
    (images: Array<{ url?: string; path?: string; preview?: string }>) => {
      if (images.length > 0 && images[0].url) {
        const imageUrl = images[0].url
        const imagePath = images[0].path

        if (imagePath) {
          // 儲存 URL 和 path 的對應關係
          setImagePaths(prev => new Map(prev).set(imageUrl, imagePath))
        }

        setUploadedImageUrl(imageUrl)
        setUploadError(null)
        logger.info('門市圖片上傳成功', {
          metadata: { url: imageUrl, path: imagePath },
        })
      }
    },
    []
  )

  const handleImageUploadError = useCallback((error: string) => {
    logger.error('門市圖片上傳失敗', new Error(error))
    setUploadError(`圖片上傳失敗: ${error}`)
  }, [])

  return {
    uploadedImageUrl,
    imagePaths,
    uploadError,
    handleImageUploadSuccess,
    handleImageUploadError,
  }
}
