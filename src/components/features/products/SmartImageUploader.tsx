'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { logger } from '@/lib/logger'
import {
  PhotoIcon,
  CloudArrowUpIcon,
  XMarkIcon,
  PlayIcon,
  PauseIcon,
  StopIcon,
  BeakerIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  ClockIcon,
  Bars3Icon,
} from '@heroicons/react/24/outline'
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core'
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  rectSortingStrategy,
} from '@dnd-kit/sortable'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'

// 導入智慧上傳系統
import {
  smartUploadDecision,
  getCurrentNetworkInfo,
  type UploadContext,
} from '@/lib/upload/SmartUploadDecision'
import { uploadStateManager } from '@/lib/upload/UploadStateManager'
import {
  addUploadTask,
  pauseAllUploads,
  resumeAllUploads,
  cancelAllTasks,
  getQueueStatus,
  type UploadResult,
} from '@/lib/upload/BackgroundUploadQueue'
import { localImageCache } from '@/lib/storage/LocalImageCache'
import { UploadErrorHandler, type UploadError } from '@/lib/upload/UploadErrorHandler'
import { UploadErrorDisplay, BatchErrorSummary } from '@/components/ui/upload/UploadErrorDisplay'

export interface SmartImageUploaderProps {
  productId: string
  onImagesChange: (images: string[]) => void
  onStatsChange: (stats: UploadStats) => void
  maxImages?: number
  enabled?: boolean
  csrfToken?: string | null
}

interface UploadStats {
  totalImages: number
  uploadedImages: number
  queuedImages: number
  failedImages: number
  savedSpace: number
  savedTime: number
}

interface ImageItem {
  id: string
  file: File
  preview: string
  status: 'local' | 'queued' | 'uploading' | 'completed' | 'failed'
  url?: string
  dbId?: string // 資料庫中的圖片 ID (UUID)
  progress?: number
  decision?: {
    shouldUpload: boolean
    confidence: number
    reasoning: string[]
  }
  error?: string
  uploadError?: UploadError // 結構化錯誤資訊
  uploadTime?: number
  position: number // 添加位置屬性用於排序
  attemptNumber?: number // 重試次數
  maxRetries?: number // 最大重試次數
}

// 可排序圖片項目元件
interface SortableImageItemProps {
  image: ImageItem
  onRemove: (id: string) => void
  onRetry?: (id: string) => void
  enabled: boolean
  getStatusIcon: (status: ImageItem['status']) => React.ReactNode
}

function SortableImageItem({
  image,
  onRemove,
  onRetry,
  enabled,
  getStatusIcon,
}: SortableImageItemProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: image.id,
  })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.8 : 1,
  }

  return (
    <div ref={setNodeRef} style={style} className="relative group">
      <div className="aspect-square bg-gray-100 rounded-lg overflow-hidden">
        <img src={image.preview} alt="預覽" className="w-full h-full object-cover" />
      </div>

      {/* 拖拽把手 */}
      <div
        {...attributes}
        {...listeners}
        className="absolute top-2 left-2 w-6 h-6 bg-black bg-opacity-50 text-white rounded flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-grab active:cursor-grabbing"
      >
        <Bars3Icon className="w-4 h-4" />
      </div>

      {/* 狀態覆蓋 */}
      <div className="absolute inset-0 bg-black bg-opacity-50 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center">
        <div className="text-white text-center space-y-1">
          {getStatusIcon(image.status)}
          <div className="text-xs">
            {image.status === 'local' && '本地預覽'}
            {image.status === 'queued' && '等待上傳'}
            {image.status === 'uploading' && `上傳中 ${image.progress?.toFixed(0) || 0}%`}
            {image.status === 'completed' && '上傳完成'}
            {image.status === 'failed' && '上傳失敗'}
          </div>
        </div>
      </div>

      {/* 移除按鈕 */}
      <button
        type="button"
        onClick={() => onRemove(image.id)}
        className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600 transition-colors opacity-0 group-hover:opacity-100"
      >
        <XMarkIcon className="w-4 h-4" />
      </button>

      {/* 智慧決策指標 */}
      {enabled && image.decision && (
        <div
          className={`absolute bottom-2 left-2 px-2 py-1 rounded text-xs font-medium ${
            image.decision.shouldUpload
              ? 'bg-green-100 text-green-800'
              : 'bg-yellow-100 text-yellow-800'
          }`}
        >
          {image.decision.shouldUpload ? '智慧上傳' : '本地暫存'}
        </div>
      )}

      {/* 進度條 */}
      {image.status === 'uploading' && typeof image.progress === 'number' && (
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-gray-200 rounded-b-lg overflow-hidden">
          <div
            className="h-full bg-blue-500 transition-all duration-300"
            style={{ width: `${image.progress}%` }}
          />
        </div>
      )}

      {/* 位置編號 */}
      <div className="absolute top-2 right-2 w-5 h-5 bg-blue-500 text-white rounded-full flex items-center justify-center text-xs font-medium">
        {image.position + 1}
      </div>

      {/* 錯誤顯示和重試按鈕 */}
      {image.status === 'failed' && image.uploadError && (
        <div className="absolute inset-x-0 bottom-0 p-2">
          <UploadErrorDisplay
            error={image.uploadError}
            fileName={image.file.name}
            attemptNumber={image.attemptNumber || 1}
            maxRetries={image.maxRetries || 3}
            onRetry={onRetry ? () => onRetry(image.id) : undefined}
            onRemove={() => onRemove(image.id)}
            compact={true}
          />
        </div>
      )}
    </div>
  )
}

const SmartImageUploader: React.FC<SmartImageUploaderProps> = ({
  productId,
  onImagesChange,
  onStatsChange,
  maxImages = 5,
  enabled = true,
  csrfToken = null,
}) => {
  const [images, setImages] = useState<ImageItem[]>([])
  const [isDragging, setIsDragging] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const [queuePaused, setQueuePaused] = useState(false)
  const [errors, setErrors] = useState<
    Array<{ fileName: string; error: UploadError; attemptNumber: number }>
  >([])
  const fileInputRef = useRef<HTMLInputElement>(null)

  // DnD Kit 傳感器設定
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  // 智慧決策狀態
  const [formContext, setFormContext] = useState({
    completeness: 0,
    userBehavior: {
      timeOnPage: 0,
      fieldsCompleted: 0,
      totalFields: 6, // name, description, category, price, inventory, images
      editingSessions: 0,
      lastActivity: Date.now(),
    },
    networkQuality: 'good' as 'excellent' | 'good' | 'fair' | 'poor',
  })

  // 更新統計
  const updateStats = useCallback(() => {
    const stats: UploadStats = {
      totalImages: images.length,
      uploadedImages: images.filter(img => img.status === 'completed').length,
      queuedImages: images.filter(img => ['queued', 'uploading'].includes(img.status)).length,
      failedImages: images.filter(img => img.status === 'failed').length,
      savedSpace: images.reduce((total, img) => total + (img.file?.size || 0), 0) * 0.1, // 估算壓縮節省
      savedTime: 0, // 簡化版：不計算節省時間（因為都立即上傳）
    }

    onStatsChange(stats)

    // 簡化版：包含所有圖片 URL（已完成的用真實 URL，其他用預覽）
    const allImageUrls = images
      .map(img => {
        if (img.status === 'completed' && img.url) {
          return img.url // 已完成上傳的使用真實 URL
        } else if (img.preview) {
          return img.preview // 其他狀態使用預覽 URL
        }
        return null
      })
      .filter(Boolean) as string[]

    onImagesChange(allImageUrls)
  }, [images, onImagesChange, onStatsChange])

  // 簡化版：不監聽表單完成度，假設在管理後台環境
  useEffect(() => {
    // 設定固定的表單上下文，適合管理後台使用
    setFormContext(prev => ({
      ...prev,
      completeness: 1.0, // 假設表單已完成，立即上傳
      networkQuality: 'good',
      userBehavior: {
        ...prev.userBehavior,
        fieldsCompleted: 10, // 假設足夠的欄位已填寫
        lastActivity: Date.now(),
      },
    }))
  }, [])

  // 監聽佇列狀態
  useEffect(() => {
    const interval = setInterval(() => {
      const status = getQueueStatus()
      setQueuePaused(prev => {
        // 只有在狀態真正改變時才更新
        return prev !== status.isPaused ? status.isPaused : prev
      })
    }, 1000)

    return () => clearInterval(interval)
  }, [])

  // 更新統計 - 使用防抖機制
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      updateStats()
    }, 100) // 100ms 防抖

    return () => clearTimeout(timeoutId)
  }, [images]) // 只依賴 images，移除 updateStats 依賴

  // 監聽上傳完成事件，更新圖片的 dbId
  useEffect(() => {
    const handleUploadCompleted = (data: { taskId: string; result: UploadResult; task: any }) => {
      const { taskId, result, task } = data

      logger.info('收到上傳完成事件', {
        metadata: {
          taskId,
          cachedImageId: task.cachedImageId,
          resultId: result.id,
          url: result.url,
        },
      })

      setImages(prev =>
        prev.map(img => {
          // 使用 cachedImageId 匹配圖片 ID
          if (img.id === task.cachedImageId && result.id) {
            return {
              ...img,
              status: 'completed' as const,
              url: result.url,
              dbId: result.id,
              progress: 100,
            }
          }
          return img
        })
      )
    }

    // 使用 BackgroundUploadQueue 的事件監聽
    let cleanup: (() => void) | undefined

    import('@/lib/upload/BackgroundUploadQueue').then(module => {
      const queue = module.backgroundUploadQueue
      cleanup = queue.on('task:completed', handleUploadCompleted)
    })

    return () => {
      // 使用 on 方法返回的清理函數
      if (cleanup) {
        cleanup()
      }
    }
  }, [])

  // 處理檔案選擇
  const handleFiles = async (fileList: FileList) => {
    if (!fileList.length) return

    const files = Array.from(fileList)
    if (images.length + files.length > maxImages) {
      logger.warn('超過最大圖片數量限制', {
        metadata: {
          current: images.length,
          adding: files.length,
          max: maxImages,
        },
      })
      return
    }

    setIsProcessing(true)

    try {
      const newImages: ImageItem[] = []

      for (const file of files) {
        // 驗證檔案類型
        if (!file.type.startsWith('image/')) {
          logger.warn('跳過非圖片檔案', { metadata: { fileName: file.name, type: file.type } })
          continue
        }

        // 生成預覽
        const preview = URL.createObjectURL(file)
        const imageId = `${productId}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

        // 簡化版：管理後台環境直接上傳，不需要複雜決策
        const decision = {
          shouldUpload: true,
          confidence: 1.0,
          reasoning: ['管理後台立即上傳模式'],
          suggestedDelay: 0,
          priority: 'normal' as const,
          metadata: {
            scoreBreakdown: {
              formCompleteness: 1,
              userBehavior: 1,
              network: 1,
              fileSize: 1,
              systemLoad: 1,
            },
            totalScore: 1.0,
            appliedWeights: {
              formCompleteness: 0.3,
              userBehavior: 0.25,
              network: 0.2,
              fileSize: 0.15,
              systemLoad: 0.1,
            },
            contextSnapshot: {
              formCompleteness: 1.0,
              networkQuality: 'good',
              fileSize: file.size,
              userIdleTime: 0,
            },
            decisionTime: Date.now(),
          },
        }

        const imageItem: ImageItem = {
          id: imageId,
          file,
          preview,
          status: 'queued', // 簡化版：直接設為 queued，立即上傳
          decision,
          progress: 0,
          position: images.length + newImages.length, // 設定位置
        }

        newImages.push(imageItem)

        // 簡化版：總是加入上傳佇列（移除 enabled 條件檢查）
        try {
          // 先快取到本地
          await localImageCache.storeFile(file, {
            priority: 'normal',
            compress: true,
            generatePreview: true,
          })

          // 加入上傳佇列
          await addUploadTask({
            cachedImageId: imageId,
            file,
            destination: {
              bucket: 'media',
              path: `products/${productId}`,
              module: 'products',
              entityId: productId,
              isPublic: true,
            },
            priority: 'normal',
            retryCount: 0,
            maxRetries: 3,
            metadata: {
              formId: productId,
              userId: 'current-user', // TODO: 從 auth context 獲取
              sessionId: 'session-id',
              userAgent: navigator.userAgent,
              source: 'manual',
              networkType: formContext.networkQuality,
              context: {
                csrfToken: csrfToken || undefined,
              },
            },
            abortController: new AbortController(),
          })

          logger.info('圖片已加入立即上傳佇列', {
            metadata: {
              imageId,
              fileName: file.name,
              fileSize: file.size,
              mode: '管理後台立即上傳',
              confidence: decision.confidence,
            },
          })
        } catch (error) {
          logger.error('加入上傳佇列失敗', error as Error)
          const uploadError = UploadErrorHandler.analyzeError(error, {
            fileName: file.name,
            fileSize: file.size,
            fileType: file.type,
            attemptNumber: 1,
          })

          imageItem.status = 'failed'
          imageItem.error = (error as Error).message
          imageItem.uploadError = uploadError
          imageItem.attemptNumber = 1
          imageItem.maxRetries = 3

          // 添加到錯誤列表
          setErrors(prev => [
            ...prev,
            {
              fileName: file.name,
              error: uploadError,
              attemptNumber: 1,
            },
          ])
        }
      }

      setImages(prev => [...prev, ...newImages])

      logger.info('圖片處理完成', {
        metadata: {
          addedCount: newImages.length,
          totalCount: images.length + newImages.length,
          enabledSmartUpload: enabled,
        },
      })
    } catch (error) {
      logger.error('處理圖片失敗', error as Error)
    } finally {
      setIsProcessing(false)
    }
  }

  // 拖拽處理
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)

    const files = e.dataTransfer.files
    if (files.length > 0) {
      handleFiles(files)
    }
  }

  // 檔案選擇
  const handleFileSelect = () => {
    fileInputRef.current?.click()
  }

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      handleFiles(e.target.files)
    }
    // 清除選擇，允許重複選擇同一檔案
    e.target.value = ''
  }

  // 移除圖片
  const handleRemoveImage = async (imageId: string) => {
    const image = images.find(img => img.id === imageId)

    // 如果圖片已上傳到 Supabase，先從 Supabase 刪除
    if (image?.status === 'completed' && image.dbId) {
      try {
        logger.info('開始刪除 Supabase 圖片', {
          metadata: {
            imageId,
            dbId: image.dbId,
            url: image.url,
            fileName: image.file.name,
          },
        })

        const response = await fetch('/api/upload/unified', {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
            'X-CSRF-Token': csrfToken || '',
          },
          body: JSON.stringify({
            imageId: image.dbId, // 使用資料庫 ID
          }),
          credentials: 'include',
        })

        if (!response.ok) {
          const errorText = await response.text()
          throw new Error(`刪除 Supabase 圖片失敗: ${response.status} ${errorText}`)
        }

        const result = await response.json()
        logger.info('Supabase 圖片刪除成功', {
          metadata: {
            imageId,
            url: image.url,
            result,
          },
        })
      } catch (error) {
        logger.error('刪除 Supabase 圖片失敗', error as Error, {
          metadata: {
            imageId,
            url: image.url,
            fileName: image.file.name,
          },
        })

        // 即使 Supabase 刪除失敗，我們仍然從前端移除圖片
        // 但應該通知用戶可能有孤立檔案
        // 可以在這裡添加用戶通知邏輯
      }
    }

    // 執行本地刪除（原有邏輯）
    setImages(prev => {
      const updated = prev.filter(img => img.id !== imageId)

      // 清理預覽 URL
      const image = prev.find(img => img.id === imageId)
      if (image?.preview) {
        URL.revokeObjectURL(image.preview)
      }

      // 重新計算位置
      return updated.map((img, index) => ({ ...img, position: index }))
    })
  }

  // 處理拖拽排序
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event

    if (active.id !== over?.id) {
      setImages(items => {
        const oldIndex = items.findIndex(item => item.id === active.id)
        const newIndex = items.findIndex(item => item.id === over?.id)

        const reorderedItems = arrayMove(items, oldIndex, newIndex)

        // 更新位置屬性
        const updatedItems = reorderedItems.map((item, index) => ({
          ...item,
          position: index,
        }))

        logger.info('圖片順序已變更', {
          metadata: {
            from: oldIndex,
            to: newIndex,
            totalImages: updatedItems.length,
          },
        })

        return updatedItems
      })
    }
  }

  // 佇列控制
  const handlePauseQueue = async () => {
    try {
      await pauseAllUploads()
      setQueuePaused(true)
      logger.info('上傳佇列已暫停')
    } catch (error) {
      logger.error('暫停佇列失敗', error as Error)
    }
  }

  const handleResumeQueue = async () => {
    try {
      await resumeAllUploads()
      setQueuePaused(false)
      logger.info('上傳佇列已恢復')
    } catch (error) {
      logger.error('恢復佇列失敗', error as Error)
    }
  }

  const handleCancelAll = async () => {
    try {
      await cancelAllTasks()
      setImages(prev =>
        prev.map(img =>
          ['queued', 'uploading'].includes(img.status) ? { ...img, status: 'local' as const } : img
        )
      )
      logger.info('所有上傳任務已取消')
    } catch (error) {
      logger.error('取消任務失敗', error as Error)
    }
  }

  // 重試上傳
  const handleRetryUpload = useCallback(
    async (imageId: string) => {
      const image = images.find(img => img.id === imageId)
      if (!image || !image.uploadError) return

      const currentAttempt = (image.attemptNumber || 1) + 1
      const maxRetries = image.maxRetries || 3

      if (currentAttempt > maxRetries) {
        logger.warn('已達到最大重試次數', {
          metadata: {
            imageId,
            fileName: image.file.name,
            attemptNumber: currentAttempt,
            maxRetries,
          },
        })
        return
      }

      // 更新圖片狀態
      setImages(prev =>
        prev.map(img =>
          img.id === imageId
            ? {
                ...img,
                status: 'queued' as const,
                uploadError: undefined,
                attemptNumber: currentAttempt,
                progress: 0,
              }
            : img
        )
      )

      try {
        // 重新加入上傳佇列
        await addUploadTask({
          cachedImageId: imageId,
          file: image.file,
          destination: {
            bucket: 'media',
            path: `products/${productId}`,
            module: 'products',
            entityId: productId,
            isPublic: true,
          },
          priority: 'high', // 重試時使用高優先級
          retryCount: currentAttempt - 1,
          maxRetries,
          metadata: {
            formId: productId,
            userId: 'current-user',
            sessionId: 'session-id',
            userAgent: navigator.userAgent,
            source: 'retry',
            networkType: formContext.networkQuality,
          },
          abortController: new AbortController(),
        })

        // 從錯誤列表中移除
        setErrors(prev => prev.filter(err => err.fileName !== image.file.name))

        logger.info('圖片重試上傳已啟動', {
          metadata: {
            imageId,
            fileName: image.file.name,
            attemptNumber: currentAttempt,
            maxRetries,
          },
        })
      } catch (error) {
        logger.error('重試上傳失敗', error as Error)

        const uploadError = UploadErrorHandler.analyzeError(error, {
          fileName: image.file.name,
          fileSize: image.file.size,
          fileType: image.file.type,
          attemptNumber: currentAttempt,
        })

        // 更新錯誤狀態
        setImages(prev =>
          prev.map(img =>
            img.id === imageId
              ? {
                  ...img,
                  status: 'failed' as const,
                  uploadError,
                  attemptNumber: currentAttempt,
                }
              : img
          )
        )
      }
    },
    [images, productId, formContext.networkQuality]
  )

  // 清除所有錯誤
  const handleClearAllErrors = useCallback(() => {
    setErrors([])
    setImages(prev => prev.filter(img => img.status !== 'failed'))
  }, [])

  // 重試所有失敗的上傳
  const handleRetryAllErrors = useCallback(async () => {
    const failedImages = images.filter(img => img.status === 'failed')

    for (const image of failedImages) {
      await handleRetryUpload(image.id)
      // 添加延遲避免同時重試過多任務
      await new Promise(resolve => setTimeout(resolve, 500))
    }
  }, [images, handleRetryUpload])

  // 取得狀態圖示
  const getStatusIcon = (status: ImageItem['status']) => {
    switch (status) {
      case 'local':
        return <PhotoIcon className="w-4 h-4 text-gray-500" />
      case 'queued':
        return <ClockIcon className="w-4 h-4 text-blue-500" />
      case 'uploading':
        return <CloudArrowUpIcon className="w-4 h-4 text-blue-500 animate-pulse" />
      case 'completed':
        return <CheckCircleIcon className="w-4 h-4 text-green-500" />
      case 'failed':
        return <ExclamationTriangleIcon className="w-4 h-4 text-red-500" />
    }
  }

  return (
    <div className="space-y-4">
      {/* 智慧上傳控制面板 */}
      {enabled && images.some(img => ['queued', 'uploading'].includes(img.status)) && (
        <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center space-x-2">
              <BeakerIcon className="w-5 h-5 text-blue-600" />
              <h3 className="font-medium text-blue-900">智慧上傳控制</h3>
            </div>
            <div className="flex items-center space-x-2">
              {!queuePaused ? (
                <button
                  type="button"
                  onClick={handlePauseQueue}
                  className="flex items-center space-x-1 px-3 py-1 text-sm bg-orange-600 text-white rounded hover:bg-orange-700 transition-colors"
                >
                  <PauseIcon className="w-4 h-4" />
                  <span>暫停</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleResumeQueue}
                  className="flex items-center space-x-1 px-3 py-1 text-sm bg-green-600 text-white rounded hover:bg-green-700 transition-colors"
                >
                  <PlayIcon className="w-4 h-4" />
                  <span>恢復</span>
                </button>
              )}
              <button
                type="button"
                onClick={handleCancelAll}
                className="flex items-center space-x-1 px-3 py-1 text-sm bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
              >
                <StopIcon className="w-4 h-4" />
                <span>全部取消</span>
              </button>
            </div>
          </div>

          <div className="text-sm text-blue-800">
            <div className="flex items-center justify-between">
              <span>佇列狀態: {queuePaused ? '已暫停' : '處理中'}</span>
              <span>表單完成度: {Math.round(formContext.completeness * 100)}%</span>
            </div>
          </div>
        </div>
      )}

      {/* 上傳區域 */}
      <div
        className={`relative border-2 border-dashed rounded-lg p-6 transition-all ${
          isDragging ? 'border-green-400 bg-green-50' : 'border-gray-300 hover:border-gray-400'
        }`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept="image/*"
          onChange={handleFileInputChange}
          className="hidden"
        />

        <div className="text-center">
          <PhotoIcon className="mx-auto h-12 w-12 text-gray-400" />
          <div className="mt-4">
            <p className="text-sm text-gray-600">
              拖拽圖片到此處，或{' '}
              <button
                type="button"
                onClick={handleFileSelect}
                disabled={isProcessing}
                className="text-green-600 hover:text-green-500 font-medium disabled:opacity-50"
              >
                點擊選擇
              </button>
            </p>
            <p className="text-xs text-gray-500 mt-1">
              支援 PNG、JPG、GIF 格式，最多 {maxImages} 張圖片
            </p>
            {enabled && (
              <p className="text-xs text-green-600 mt-1 flex items-center justify-center">
                <BeakerIcon className="w-3 h-3 mr-1" />
                智慧上傳已啟用
              </p>
            )}
          </div>
        </div>

        {isProcessing && (
          <div className="absolute inset-0 bg-white bg-opacity-75 flex items-center justify-center rounded-lg">
            <div className="flex items-center space-x-2 text-green-600">
              <div className="w-4 h-4 border-2 border-green-600 border-t-transparent rounded-full animate-spin"></div>
              <span className="text-sm">處理中...</span>
            </div>
          </div>
        )}
      </div>

      {/* 可排序圖片預覽區 */}
      {images.length > 0 && (
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={images.map(img => img.id)} strategy={rectSortingStrategy}>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
              {images
                .sort((a, b) => a.position - b.position)
                .map(image => (
                  <SortableImageItem
                    key={image.id}
                    image={image}
                    onRemove={handleRemoveImage}
                    onRetry={handleRetryUpload}
                    enabled={enabled}
                    getStatusIcon={getStatusIcon}
                  />
                ))}
            </div>
          </SortableContext>
        </DndContext>
      )}

      {/* 批量錯誤摘要 */}
      {errors.length > 0 && (
        <BatchErrorSummary
          errors={errors}
          onRetryAll={handleRetryAllErrors}
          onClearAll={handleClearAllErrors}
        />
      )}

      {/* 智慧決策資訊 */}
      {enabled && images.some(img => img.decision) && (
        <div className="bg-gray-50 rounded-lg p-4">
          <h4 className="font-medium text-gray-900 mb-2">智慧決策分析</h4>
          <div className="space-y-2 text-sm text-gray-600">
            {images
              .filter(img => img.decision && img.decision.reasoning.length > 0)
              .slice(0, 3) // 只顯示前3個
              .map(img => (
                <div key={img.id} className="flex items-start space-x-2">
                  <div className="w-2 h-2 bg-blue-500 rounded-full mt-1.5 flex-shrink-0"></div>
                  <div>
                    <div className="font-medium">{img.file.name}</div>
                    <div className="text-xs">{img.decision!.reasoning.join(', ')}</div>
                  </div>
                </div>
              ))}
          </div>
        </div>
      )}
    </div>
  )
}

export default SmartImageUploader
