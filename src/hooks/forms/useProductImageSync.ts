import { useState, useCallback } from 'react'
import { logger } from '@/lib/logger'

function getCSRFTokenFromCookie(): string | null {
  if (typeof document === 'undefined') return null
  const cookies = document.cookie.split(';')
  const csrfCookie = cookies.find(cookie => cookie.trim().startsWith('csrf-token='))
  return csrfCookie ? csrfCookie.split('=')[1] : null
}

export interface ImageOrder {
  id: string
  position: number
}

export function useProductImageSync(productId: string) {
  const [isSyncing, setIsSyncing] = useState(false)
  const [syncError, setSyncError] = useState<string | null>(null)

  /**
   * 批次刪除圖片
   */
  const syncDeletedImages = useCallback(
    async (imageIds: string[]): Promise<void> => {
      if (imageIds.length === 0) return

      logger.info('開始批次刪除圖片', {
        metadata: {
          context: 'useProductImageSync',
          productId,
          imageIds,
          count: imageIds.length,
        },
      })

      const csrfToken = getCSRFTokenFromCookie()
      const headers: HeadersInit = {
        'Content-Type': 'application/json',
      }
      if (csrfToken) {
        headers['X-CSRF-Token'] = csrfToken
      }

      for (const imageId of imageIds) {
        const response = await fetch('/api/upload/unified', {
          method: 'DELETE',
          headers,
          body: JSON.stringify({ imageId }),
        })

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({ message: '刪除失敗' }))
          throw new Error(`刪除圖片 ${imageId} 失敗: ${errorData.message}`)
        }
      }

      logger.info('批次刪除圖片完成', {
        metadata: {
          context: 'useProductImageSync',
          productId,
          deletedCount: imageIds.length,
        },
      })
    },
    [productId]
  )

  /**
   * 批次上傳新圖片
   */
  const syncNewImages = useCallback(
    async (files: File[]): Promise<void> => {
      if (files.length === 0) return

      logger.info('開始批次上傳圖片', {
        metadata: {
          context: 'useProductImageSync',
          productId,
          fileCount: files.length,
        },
      })

      const csrfToken = getCSRFTokenFromCookie()

      for (let i = 0; i < files.length; i++) {
        const file = files[i]
        const formData = new FormData()
        formData.append('file', file)
        formData.append('module', 'products')
        formData.append('entityId', productId)
        formData.append('size', 'medium')
        formData.append('display_position', String(i))
        formData.append('alt_text', file.name.replace(/\.[^/.]+$/, ''))

        const headers: HeadersInit = {}
        if (csrfToken) {
          headers['X-CSRF-Token'] = csrfToken
        }

        const response = await fetch('/api/upload/unified', {
          method: 'POST',
          headers,
          body: formData,
        })

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({ message: '上傳失敗' }))
          throw new Error(`上傳圖片 ${file.name} 失敗: ${errorData.message}`)
        }
      }

      logger.info('批次上傳圖片完成', {
        metadata: {
          context: 'useProductImageSync',
          productId,
          uploadedCount: files.length,
        },
      })
    },
    [productId]
  )

  /**
   * 更新圖片排序
   */
  const syncImageOrder = useCallback(
    async (imageOrders: ImageOrder[]): Promise<void> => {
      if (imageOrders.length === 0) return

      logger.info('開始更新圖片排序', {
        metadata: {
          context: 'useProductImageSync',
          productId,
          orderCount: imageOrders.length,
        },
      })

      const csrfToken = getCSRFTokenFromCookie()
      const headers: HeadersInit = {
        'Content-Type': 'application/json',
      }
      if (csrfToken) {
        headers['X-CSRF-Token'] = csrfToken
      }

      const response = await fetch('/api/upload/unified', {
        method: 'PATCH',
        headers,
        body: JSON.stringify({
          action: 'reorder',
          module: 'products',
          entityId: productId,
          images: imageOrders.map(order => ({ id: order.id, display_position: order.position })),
        }),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: '更新排序失敗' }))
        throw new Error(`更新圖片排序失敗: ${errorData.message}`)
      }

      logger.info('更新圖片排序完成', {
        metadata: {
          context: 'useProductImageSync',
          productId,
          orderCount: imageOrders.length,
        },
      })
    },
    [productId]
  )

  /**
   * 執行完整同步（刪除 -> 上傳 -> 排序）
   */
  const syncAllChanges = useCallback(
    async (
      deletedIds: string[],
      newImages: File[],
      reorderedImages: ImageOrder[]
    ): Promise<void> => {
      try {
        setIsSyncing(true)
        setSyncError(null)

        logger.info('開始同步所有圖片變更', {
          metadata: {
            context: 'useProductImageSync',
            productId,
            deletedCount: deletedIds.length,
            newImagesCount: newImages.length,
            reorderedCount: reorderedImages.length,
          },
        })

        // 1. 先刪除
        if (deletedIds.length > 0) {
          await syncDeletedImages(deletedIds)
        }

        // 2. 上傳新圖片
        if (newImages.length > 0) {
          await syncNewImages(newImages)
        }

        // 3. 更新排序
        if (reorderedImages.length > 0) {
          await syncImageOrder(reorderedImages)
        }

        logger.info('同步所有圖片變更完成', {
          metadata: {
            context: 'useProductImageSync',
            productId,
          },
        })
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : '同步圖片變更失敗'
        setSyncError(errorMessage)
        logger.error('同步圖片變更失敗', error as Error, {
          metadata: {
            context: 'useProductImageSync',
            productId,
          },
        })
        throw error
      } finally {
        setIsSyncing(false)
      }
    },
    [productId, syncDeletedImages, syncNewImages, syncImageOrder]
  )

  return {
    isSyncing,
    syncError,
    syncDeletedImages,
    syncNewImages,
    syncImageOrder,
    syncAllChanges,
  }
}
