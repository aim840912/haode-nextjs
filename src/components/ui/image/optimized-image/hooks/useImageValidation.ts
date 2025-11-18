import { useCallback } from 'react'

/**
 * 圖片 URL 驗證 Hook
 */
export function useImageValidation() {
  /**
   * 驗證圖片 URL 是否有效
   */
  const isValidImageSrc = useCallback((url: string): boolean => {
    if (!url || typeof url !== 'string') return false

    try {
      if (url.startsWith('http') || url.startsWith('https')) {
        new URL(url)
        return true
      }
      return url.startsWith('/') || url.startsWith('data:') || url.startsWith('blob:')
    } catch {
      return false
    }
  }, [])

  /**
   * 判斷是否需要 CORS：只對外部 HTTP/HTTPS URLs 啟用
   */
  const needsCrossOrigin = useCallback((url: string): boolean => {
    return Boolean(
      url &&
        !url.startsWith('data:') &&
        !url.startsWith('blob:') &&
        (url.startsWith('http://') || url.startsWith('https://'))
    )
  }, [])

  /**
   * 判斷圖片類型：base64、Blob URL 或普通 URL
   */
  const isBase64OrBlob = useCallback((url: string): boolean => {
    return Boolean(url && (url.startsWith('data:') || url.startsWith('blob:')))
  }, [])

  return {
    isValidImageSrc,
    needsCrossOrigin,
    isBase64OrBlob,
  }
}
