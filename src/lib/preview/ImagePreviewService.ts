/**
 * ImagePreviewService - 統一的圖片預覽服務
 *
 * 提供多種預覽尺寸生成、格式轉換、影像增強等功能
 * 支援批量處理、快取管理和效能監控
 */

import { logger } from '@/lib/logger'
import { IMAGE_SIZES, ImageSizeConfig } from '@/lib/utils/image-utils'
import { BlobURLGroup, blobURLManager } from '@/lib/storage/BlobURLManager'

export interface PreviewOptions {
  maxWidth: number
  maxHeight: number
  quality: number
  format: 'webp' | 'jpeg' | 'png'
  enableSharpening?: boolean
  enableColorCorrection?: boolean
  maintainAspectRatio?: boolean
  backgroundFill?: string
}

export interface PreviewResult {
  url: string
  width: number
  height: number
  size: number
  format: string
  quality: number
  processingTime: number
}

export interface ThumbnailSize {
  width: number
  height: number
  name?: string
}

export interface ResponsivePreviewOptions {
  breakpoints?: string[]
  baseOptions?: Omit<PreviewOptions, 'maxWidth' | 'maxHeight'>
  enableWebP?: boolean
  generateFallbacks?: boolean
}

/**
 * 自定義尺寸集合選項
 */
export interface CustomSizeSet {
  customSet?: SizeSetDefinition
  quality?: number
  format?: 'webp' | 'jpeg' | 'png'
  baseOptions?: Omit<PreviewOptions, 'maxWidth' | 'maxHeight'>
}

/**
 * 尺寸集合定義
 */
export interface SizeSetDefinition {
  name?: string
  description?: string
  sizes: Array<{
    width: number
    height: number
    maintainAspect?: boolean
  }>
}

export interface BatchPreviewOptions {
  sizes: ThumbnailSize[]
  baseOptions: Omit<PreviewOptions, 'maxWidth' | 'maxHeight'>
  concurrent?: number
}

export interface BatchPreviewResult {
  file: File
  results: Map<string, PreviewResult>
  errors: Map<string, Error>
  totalProcessingTime: number
}

/**
 * 統一圖片預覽服務類別
 */
export class ImagePreviewService {
  private static instance: ImagePreviewService
  private previewBlobGroup: BlobURLGroup
  private previewCache = new Map<string, PreviewResult>()
  private readonly CACHE_SIZE_LIMIT = 100
  private readonly DEFAULT_SIZES: { [key: string]: ThumbnailSize } = {
    // 從 image-utils.ts 整合標準尺寸
    thumbnail: {
      width: IMAGE_SIZES.thumbnail.width,
      height: IMAGE_SIZES.thumbnail.height,
      name: 'thumbnail',
    },
    medium: { width: IMAGE_SIZES.medium.width, height: IMAGE_SIZES.medium.height, name: 'medium' },
    large: { width: IMAGE_SIZES.large.width, height: IMAGE_SIZES.large.height, name: 'large' },

    // 擴展的預覽尺寸
    tiny: { width: 100, height: 100, name: 'tiny' },
    small: { width: 300, height: 300, name: 'small' },
    xlarge: { width: 1600, height: 1600, name: 'xlarge' },

    // 特殊長寬比
    widescreen: { width: 800, height: 450, name: 'widescreen' }, // 16:9
    square: { width: 400, height: 400, name: 'square' },
    portrait: { width: 300, height: 400, name: 'portrait' }, // 3:4
  }

  // 預設尺寸集合
  private readonly SIZE_SETS: { [key: string]: SizeSetDefinition } = {
    standard: {
      name: 'standard',
      description: '標準尺寸組合（符合 image-utils.ts 規範）',
      sizes: [
        {
          width: this.DEFAULT_SIZES.thumbnail.width,
          height: this.DEFAULT_SIZES.thumbnail.height,
          maintainAspect: true,
        },
        {
          width: this.DEFAULT_SIZES.medium.width,
          height: this.DEFAULT_SIZES.medium.height,
          maintainAspect: true,
        },
        {
          width: this.DEFAULT_SIZES.large.width,
          height: this.DEFAULT_SIZES.large.height,
          maintainAspect: true,
        },
      ],
    },
    complete: {
      name: 'complete',
      description: '完整尺寸組合',
      sizes: [
        {
          width: this.DEFAULT_SIZES.tiny.width,
          height: this.DEFAULT_SIZES.tiny.height,
          maintainAspect: true,
        },
        {
          width: this.DEFAULT_SIZES.thumbnail.width,
          height: this.DEFAULT_SIZES.thumbnail.height,
          maintainAspect: true,
        },
        {
          width: this.DEFAULT_SIZES.small.width,
          height: this.DEFAULT_SIZES.small.height,
          maintainAspect: true,
        },
        {
          width: this.DEFAULT_SIZES.medium.width,
          height: this.DEFAULT_SIZES.medium.height,
          maintainAspect: true,
        },
        {
          width: this.DEFAULT_SIZES.large.width,
          height: this.DEFAULT_SIZES.large.height,
          maintainAspect: true,
        },
        {
          width: this.DEFAULT_SIZES.xlarge.width,
          height: this.DEFAULT_SIZES.xlarge.height,
          maintainAspect: true,
        },
      ],
    },
    responsive: {
      name: 'responsive',
      description: '響應式設計尺寸組合',
      sizes: [
        {
          width: this.DEFAULT_SIZES.small.width,
          height: this.DEFAULT_SIZES.small.height,
          maintainAspect: true,
        }, // 手機
        {
          width: this.DEFAULT_SIZES.medium.width,
          height: this.DEFAULT_SIZES.medium.height,
          maintainAspect: true,
        }, // 平板
        {
          width: this.DEFAULT_SIZES.large.width,
          height: this.DEFAULT_SIZES.large.height,
          maintainAspect: true,
        }, // 桌面
      ],
    },
    social: {
      name: 'social',
      description: '社群媒體尺寸組合',
      sizes: [
        {
          width: this.DEFAULT_SIZES.square.width,
          height: this.DEFAULT_SIZES.square.height,
          maintainAspect: false,
        }, // Instagram 正方形
        {
          width: this.DEFAULT_SIZES.widescreen.width,
          height: this.DEFAULT_SIZES.widescreen.height,
          maintainAspect: false,
        }, // Facebook 橫幅
        {
          width: this.DEFAULT_SIZES.portrait.width,
          height: this.DEFAULT_SIZES.portrait.height,
          maintainAspect: false,
        }, // Instagram Stories
      ],
    },
  }

  /**
   * 單例模式
   */
  static getInstance(): ImagePreviewService {
    if (!ImagePreviewService.instance) {
      ImagePreviewService.instance = new ImagePreviewService()
    }
    return ImagePreviewService.instance
  }

  /**
   * 私有建構子
   */
  private constructor() {
    this.previewBlobGroup = new BlobURLGroup('image-preview')
  }

  // 智慧調整設定
  private enableSmartQualityAdjustment = true
  private enableSmartSizeAdjustment = true
  private performanceStats = {
    totalPreviews: 0,
    optimizedPreviews: 0,
    avgQualityReduction: 0,
    avgSizeReduction: 0,
    memoryUsageSamples: [] as number[],
  }

  /**
   * 生成單個預覽圖
   */
  async generatePreview(file: File, options: PreviewOptions): Promise<PreviewResult> {
    const timer = logger.timer('圖片預覽生成')

    // 智慧品質和尺寸調整（如果啟用）
    let optimizedOptions = options
    let wasOptimized = false
    let qualityReduction = 0
    let sizeReduction = 0

    if (this.enableSmartQualityAdjustment || this.enableSmartSizeAdjustment) {
      const optimalSize = this.enableSmartSizeAdjustment
        ? this.getOptimalSize(options, file)
        : { width: options.maxWidth, height: options.maxHeight, shouldScale: false }

      const optimalQuality = this.enableSmartQualityAdjustment
        ? this.getOptimalQuality(file, { width: optimalSize.width, height: optimalSize.height })
        : options.quality

      wasOptimized = optimalSize.shouldScale || optimalQuality !== options.quality
      qualityReduction = options.quality - optimalQuality
      sizeReduction =
        ((options.maxWidth * options.maxHeight - optimalSize.width * optimalSize.height) /
          (options.maxWidth * options.maxHeight)) *
        100

      optimizedOptions = {
        ...options,
        maxWidth: optimalSize.width,
        maxHeight: optimalSize.height,
        quality: optimalQuality,
      }
    }

    const cacheKey = this.generateCacheKey(file, optimizedOptions)

    try {
      // 檢查快取
      if (this.previewCache.has(cacheKey)) {
        const cached = this.previewCache.get(cacheKey)!
        timer.end({
          metadata: {
            source: 'cache',
            optimized: wasOptimized,
          },
        })
        return cached
      }

      // 驗證檔案
      this.validateFile(file)

      // 生成預覽圖
      const result = await this.processImage(file, optimizedOptions)

      // 快取結果
      this.cacheResult(cacheKey, result)

      // Blob URL 已由 previewBlobGroup 自動管理

      // 更新統計資料
      this.updatePerformanceStats(wasOptimized, qualityReduction, sizeReduction)

      timer.end({
        metadata: {
          fileName: file.name,
          originalOptions: `${options.maxWidth}x${options.maxHeight}_q${options.quality}`,
          optimizedOptions: `${optimizedOptions.maxWidth}x${optimizedOptions.maxHeight}_q${optimizedOptions.quality.toFixed(2)}`,
          dimensions: `${result.width}x${result.height}`,
          format: result.format,
          size: result.size,
          wasOptimized,
          qualityReduction: qualityReduction.toFixed(3),
          sizeReduction: sizeReduction.toFixed(1) + '%',
        },
      })

      logger.debug('預覽圖生成完成', {
        module: 'ImagePreviewService',
        metadata: {
          fileName: file.name,
          originalSize: file.size,
          previewSize: result.size,
          compressionRatio: Math.round((file.size / result.size) * 100) / 100,
          processingTime: result.processingTime,
        },
      })

      return result
    } catch (error) {
      timer.end()
      logger.error('預覽圖生成失敗', error as Error, {
        module: 'ImagePreviewService',
        action: 'generatePreview',
        metadata: {
          fileName: file.name,
          options,
        },
      })
      throw error
    }
  }

  /**
   * 生成縮圖
   */
  async generateThumbnail(file: File, size: ThumbnailSize): Promise<string> {
    const options: PreviewOptions = {
      maxWidth: size.width,
      maxHeight: size.height,
      quality: 0.8,
      format: 'webp',
      maintainAspectRatio: false, // 縮圖通常需要固定尺寸
      backgroundFill: '#ffffff',
    }

    const result = await this.generatePreview(file, options)
    return result.url
  }

  /**
   * 批量生成多種尺寸預覽圖
   */
  async generateMultiplePreviews(
    file: File,
    options: BatchPreviewOptions
  ): Promise<BatchPreviewResult> {
    const timer = logger.timer('批量預覽圖生成')
    const results = new Map<string, PreviewResult>()
    const errors = new Map<string, Error>()

    try {
      // 限制並行處理數量
      const concurrent = options.concurrent || 3
      const chunks = this.chunkArray(options.sizes, concurrent)

      for (const chunk of chunks) {
        const promises = chunk.map(async size => {
          try {
            const previewOptions: PreviewOptions = {
              ...options.baseOptions,
              maxWidth: size.width,
              maxHeight: size.height,
            }

            const result = await this.generatePreview(file, previewOptions)
            const key = size.name || `${size.width}x${size.height}`
            results.set(key, result)
          } catch (error) {
            const key = size.name || `${size.width}x${size.height}`
            errors.set(key, error as Error)
          }
        })

        await Promise.all(promises)
      }

      const totalTime = timer.end({
        metadata: {
          fileName: file.name,
          sizesCount: options.sizes.length,
          successCount: results.size,
          errorCount: errors.size,
        },
      })

      logger.info('批量預覽圖生成完成', {
        module: 'ImagePreviewService',
        metadata: {
          fileName: file.name,
          totalSizes: options.sizes.length,
          successCount: results.size,
          errorCount: errors.size,
          processingTime: totalTime,
        },
      })

      return {
        file,
        results,
        errors,
        totalProcessingTime: totalTime,
      }
    } catch (error) {
      timer.end()
      logger.error('批量預覽圖生成失敗', error as Error, {
        module: 'ImagePreviewService',
        action: 'generateMultiplePreviews',
        metadata: {
          fileName: file.name,
          sizesCount: options.sizes.length,
        },
      })
      throw error
    }
  }

  /**
   * 生成標準尺寸預覽圖
   */
  async generateStandardPreviews(
    file: File,
    baseOptions?: Partial<PreviewOptions>
  ): Promise<BatchPreviewResult> {
    const options: BatchPreviewOptions = {
      sizes: Object.values(this.DEFAULT_SIZES),
      baseOptions: {
        quality: 0.85,
        format: 'webp',
        enableSharpening: true,
        enableColorCorrection: true,
        maintainAspectRatio: true,
        ...baseOptions,
      },
    }

    return this.generateMultiplePreviews(file, options)
  }

  /**
   * 創建 Blob URL
   */
  createBlobURL(file: File): string {
    return this.previewBlobGroup.create(file, {
      fileName: file.name,
      fileSize: file.size,
      mimeType: file.type,
      purpose: 'temp',
    })
  }

  /**
   * 釋放 Blob URL
   */
  revokeBlobURL(url: string): boolean {
    return blobURLManager.revokeURL(url)
  }

  /**
   * 批量釋放檔案相關的所有 Blob URLs
   */
  revokeFileURLs(fileName: string): void {
    // 新的 BlobURLManager 不支援按檔案名批量釋放
    // 但支援按群組批量釋放，可考慮使用子群組
    logger.warn('revokeFileURLs 已廢棄，建議使用 revokeGroup 或讓 BlobURLManager 自動管理')
  }

  /**
   * 清理所有 Blob URLs 和快取
   */
  cleanup(): void {
    // 清理所有預覽群組的 Blob URLs
    this.previewBlobGroup.revokeAll()

    // 清理預覽快取
    this.previewCache.clear()

    logger.info('ImagePreviewService 清理完成')
  }

  /**
   * 取得服務統計資訊
   */
  getStats(): {
    cacheSize: number
    previewGroupURLs: number
    blobManagerStats: any
  } {
    const previewGroupURLs = this.previewBlobGroup.getCount()
    const blobManagerStats = blobURLManager.getStats()

    return {
      cacheSize: this.previewCache.size,
      previewGroupURLs,
      blobManagerStats,
    }
  }

  // ========== 私有方法 ==========

  /**
   * 處理圖片
   */
  private async processImage(file: File, options: PreviewOptions): Promise<PreviewResult> {
    const startTime = performance.now()

    return new Promise((resolve, reject) => {
      const canvas = document.createElement('canvas')
      const ctx = canvas.getContext('2d', { alpha: true, willReadFrequently: false })
      const img = new Image()

      if (!ctx) {
        reject(new Error('無法建立 Canvas 2D Context'))
        return
      }

      img.onload = () => {
        try {
          const { width, height } = this.calculateDimensions(img, options)

          canvas.width = width
          canvas.height = height

          // 設定高品質渲染
          ctx.imageSmoothingEnabled = true
          ctx.imageSmoothingQuality = 'high'

          // 背景填充（用於不維持長寬比的情況）
          if (!options.maintainAspectRatio && options.backgroundFill) {
            ctx.fillStyle = options.backgroundFill
            ctx.fillRect(0, 0, width, height)
          }

          // 計算繪製位置（置中）
          const drawWidth = options.maintainAspectRatio ? width : img.width * (width / img.width)
          const drawHeight = options.maintainAspectRatio
            ? height
            : img.height * (height / img.height)
          const offsetX = (width - drawWidth) / 2
          const offsetY = (height - drawHeight) / 2

          // 色彩校正
          if (options.enableColorCorrection) {
            ctx.filter = 'contrast(1.05) saturate(1.02) brightness(1.01)'
          }

          // 繪製圖片
          ctx.drawImage(img, offsetX, offsetY, drawWidth, drawHeight)

          // 銳化處理
          if (options.enableSharpening) {
            this.applySharpeningFilter(ctx, width, height)
          }

          // 智能格式轉換：優先使用 WebP，不支援時使用後備格式
          if (options.format === 'webp') {
            this.smartFormatConversion(canvas, options, startTime).then(resolve).catch(reject)
          } else {
            // 直接轉換為指定格式
            canvas.toBlob(
              blob => {
                if (!blob) {
                  reject(new Error('Canvas toBlob 失敗'))
                  return
                }

                const processingTime = performance.now() - startTime
                const url = this.previewBlobGroup.create(blob, {
                  fileName: file.name,
                  fileSize: blob.size,
                  mimeType: this.getOutputMimeType(options.format),
                  purpose: 'preview',
                })

                resolve({
                  url,
                  width,
                  height,
                  size: blob.size,
                  format: options.format,
                  quality: options.quality,
                  processingTime: Math.round(processingTime),
                })
              },
              this.getOutputMimeType(options.format),
              options.quality
            )
          }
        } catch (error) {
          reject(error)
        }
      }

      img.onerror = () => {
        reject(new Error(`圖片載入失敗: ${file.name}`))
      }

      img.crossOrigin = 'anonymous'
      img.decoding = 'async'
      img.src = URL.createObjectURL(file)
    })
  }

  /**
   * 計算目標尺寸
   */
  private calculateDimensions(
    img: HTMLImageElement,
    options: PreviewOptions
  ): { width: number; height: number } {
    if (!options.maintainAspectRatio) {
      return {
        width: options.maxWidth,
        height: options.maxHeight,
      }
    }

    const scale = Math.min(
      options.maxWidth / img.width,
      options.maxHeight / img.height,
      1 // 不放大圖片
    )

    return {
      width: Math.floor(img.width * scale),
      height: Math.floor(img.height * scale),
    }
  }

  /**
   * 應用銳化濾鏡
   */
  private applySharpeningFilter(
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number
  ): void {
    try {
      const imageData = ctx.getImageData(0, 0, width, height)
      const data = imageData.data
      const newData = new Uint8ClampedArray(data)

      // 適中的銳化核心
      const kernel = [0, -0.2, 0, -0.2, 1.8, -0.2, 0, -0.2, 0]

      // 應用卷積
      for (let y = 1; y < height - 1; y++) {
        for (let x = 1; x < width - 1; x++) {
          const idx = (y * width + x) * 4

          for (let c = 0; c < 3; c++) {
            // RGB
            let sum = 0
            for (let ky = -1; ky <= 1; ky++) {
              for (let kx = -1; kx <= 1; kx++) {
                const kidx = ((y + ky) * width + (x + kx)) * 4 + c
                sum += data[kidx] * kernel[(ky + 1) * 3 + (kx + 1)]
              }
            }
            newData[idx + c] = Math.max(0, Math.min(255, sum))
          }
        }
      }

      const newImageData = new ImageData(newData, width, height)
      ctx.putImageData(newImageData, 0, 0)
    } catch (error) {
      // 銳化失敗不影響主要功能
      logger.debug('銳化濾鏡失敗', {
        module: 'ImagePreviewService',
        metadata: { error: (error as Error).message },
      })
    }
  }

  /**
   * 驗證檔案
   */
  private validateFile(file: File): void {
    const allowedTypes = [
      'image/jpeg',
      'image/jpg',
      'image/png',
      'image/webp',
      'image/avif',
      'image/gif',
    ]
    const maxSize = 50 * 1024 * 1024 // 50MB

    if (!allowedTypes.includes(file.type)) {
      throw new Error(`不支援的檔案格式: ${file.type}`)
    }

    if (file.size > maxSize) {
      throw new Error(`檔案過大: ${Math.round(file.size / 1024 / 1024)}MB，最大限制 50MB`)
    }

    if (file.size < 100) {
      throw new Error('檔案過小，可能損壞')
    }
  }

  /**
   * 生成快取鍵
   */
  private generateCacheKey(file: File, options: PreviewOptions): string {
    const optionsStr = `${options.maxWidth}x${options.maxHeight}_${options.quality}_${options.format}`
    return `${file.name}_${file.size}_${file.lastModified}_${optionsStr}`
  }

  /**
   * 快取結果
   */
  private cacheResult(key: string, result: PreviewResult): void {
    if (this.previewCache.size >= this.CACHE_SIZE_LIMIT) {
      // 移除最舊的項目
      const iterator = this.previewCache.keys()
      const firstKey = iterator.next().value
      if (firstKey) {
        const oldResult = this.previewCache.get(firstKey)
        if (oldResult) {
          URL.revokeObjectURL(oldResult.url)
          this.previewCache.delete(firstKey)
        }
      }
    }

    this.previewCache.set(key, result)
  }

  // 舊的 Blob URL 追蹤方法已移除，現在由 BlobURLManager 統一管理

  /**
   * 智慧品質調整系統
   * 根據檔案大小、裝置效能、網路狀況自動調整預覽品質
   */
  private getOptimalQuality(file: File, targetSize?: { width: number; height: number }): number {
    const deviceInfo = this.getDevicePerformanceInfo()
    const networkInfo = this.getNetworkInfo()
    const fileInfo = this.analyzeFileCharacteristics(file, targetSize)

    // 基礎品質分數 (0.5 - 1.0)
    let qualityScore = 0.8 // 預設品質

    // 根據檔案大小調整
    if (fileInfo.sizeMB < 0.5) {
      qualityScore += 0.1 // 小檔案可用較高品質
    } else if (fileInfo.sizeMB > 5) {
      qualityScore -= 0.2 // 大檔案降低品質
    } else if (fileInfo.sizeMB > 2) {
      qualityScore -= 0.1
    }

    // 根據檔案複雜度調整
    if (fileInfo.estimatedComplexity === 'high') {
      qualityScore -= 0.1 // 複雜圖片降低品質
    } else if (fileInfo.estimatedComplexity === 'low') {
      qualityScore += 0.05 // 簡單圖片可稍微提升品質
    }

    // 根據裝置效能調整
    if (deviceInfo.tier === 'low') {
      qualityScore -= 0.2 // 低階裝置大幅降低品質
    } else if (deviceInfo.tier === 'high') {
      qualityScore += 0.1 // 高階裝置提升品質
    }

    // 根據網路狀況調整
    if (networkInfo.effectiveType === '2g' || networkInfo.effectiveType === 'slow-2g') {
      qualityScore -= 0.25 // 慢速網路大幅降低品質
    } else if (networkInfo.effectiveType === '3g') {
      qualityScore -= 0.15
    } else if (networkInfo.effectiveType === '4g' || networkInfo.effectiveType === '5g') {
      qualityScore += 0.05 // 快速網路可稍微提升品質
    }

    // 根據目標尺寸調整
    if (targetSize) {
      const targetPixels = targetSize.width * targetSize.height
      if (targetPixels < 100 * 100) {
        // 小尺寸預覽
        qualityScore -= 0.1
      } else if (targetPixels > 800 * 800) {
        // 大尺寸預覽
        qualityScore += 0.05
      }
    }

    // 記憶體壓力調整
    if (deviceInfo.memoryPressure === 'high') {
      qualityScore -= 0.15
    } else if (deviceInfo.memoryPressure === 'critical') {
      qualityScore -= 0.25
    }

    // 確保品質在合理範圍內
    qualityScore = Math.max(0.4, Math.min(0.95, qualityScore))

    logger.debug('智慧品質調整', {
      metadata: {
        originalFile: file.name,
        fileSize: fileInfo.sizeMB,
        complexity: fileInfo.estimatedComplexity,
        deviceTier: deviceInfo.tier,
        networkType: networkInfo.effectiveType,
        memoryPressure: deviceInfo.memoryPressure,
        finalQuality: qualityScore,
      },
    })

    return qualityScore
  }

  /**
   * 分析檔案特性
   */
  private analyzeFileCharacteristics(
    file: File,
    targetSize?: { width: number; height: number }
  ): {
    sizeMB: number
    estimatedComplexity: 'low' | 'medium' | 'high'
    aspectRatio?: number
  } {
    const sizeMB = file.size / (1024 * 1024)

    // 根據檔案類型和大小估算複雜度
    let estimatedComplexity: 'low' | 'medium' | 'high' = 'medium'

    if (file.type === 'image/png') {
      // PNG 通常表示較複雜的圖像或有透明度
      estimatedComplexity = sizeMB > 2 ? 'high' : 'medium'
    } else if (file.type === 'image/jpeg') {
      // JPEG 複雜度主要看檔案大小
      if (sizeMB > 3) {
        estimatedComplexity = 'high'
      } else if (sizeMB < 0.5) {
        estimatedComplexity = 'low'
      }
    } else if (file.type === 'image/webp') {
      // WebP 通常已經優化過
      estimatedComplexity = sizeMB > 1.5 ? 'high' : 'medium'
    }

    return {
      sizeMB,
      estimatedComplexity,
    }
  }

  /**
   * 取得裝置效能資訊
   */
  private getDevicePerformanceInfo(): {
    tier: 'low' | 'medium' | 'high'
    memoryPressure: 'normal' | 'high' | 'critical'
    cores: number
  } {
    let tier: 'low' | 'medium' | 'high' = 'medium'
    let memoryPressure: 'normal' | 'high' | 'critical' = 'normal'
    let cores = 4 // 預設值

    if (typeof window !== 'undefined') {
      // 檢查硬體並行度
      cores = navigator.hardwareConcurrency || 4

      // 根據 CPU 核心數判斷效能層級
      if (cores <= 2) {
        tier = 'low'
      } else if (cores >= 8) {
        tier = 'high'
      }

      // 檢查記憶體資訊 (如果支援)
      if ('memory' in performance && (performance as any).memory) {
        const memInfo = (performance as any).memory
        const memoryUsageRatio = memInfo.usedJSHeapSize / memInfo.jsHeapSizeLimit

        if (memoryUsageRatio > 0.9) {
          memoryPressure = 'critical'
        } else if (memoryUsageRatio > 0.75) {
          memoryPressure = 'high'
        }
      }

      // 檢查裝置記憶體 (如果支援)
      if ('deviceMemory' in navigator) {
        const deviceMemory = (navigator as any).deviceMemory
        if (deviceMemory <= 2) {
          tier = 'low'
          memoryPressure = 'high'
        } else if (deviceMemory >= 8) {
          tier = 'high'
        }
      }
    }

    return { tier, memoryPressure, cores }
  }

  /**
   * 取得網路資訊
   */
  private getNetworkInfo(): {
    effectiveType: '2g' | '3g' | '4g' | '5g' | 'slow-2g' | 'unknown'
    downlink: number
    rtt: number
    saveData: boolean
  } {
    let effectiveType: '2g' | '3g' | '4g' | '5g' | 'slow-2g' | 'unknown' = 'unknown'
    let downlink = 1 // 預設 1 Mbps
    let rtt = 100 // 預設 100ms
    let saveData = false

    if (typeof window !== 'undefined' && 'connection' in navigator) {
      const connection = (navigator as any).connection
      if (connection) {
        effectiveType = connection.effectiveType || 'unknown'
        downlink = connection.downlink || 1
        rtt = connection.rtt || 100
        saveData = connection.saveData || false
      }
    }

    return { effectiveType, downlink, rtt, saveData }
  }

  /**
   * 智慧尺寸調整
   * 根據裝置和網路狀況調整目標尺寸
   */
  private getOptimalSize(
    originalOptions: PreviewOptions,
    file: File
  ): { width: number; height: number; shouldScale: boolean } {
    const deviceInfo = this.getDevicePerformanceInfo()
    const networkInfo = this.getNetworkInfo()

    let scaleMultiplier = 1.0
    let shouldScale = false

    // 低階裝置縮小尺寸
    if (deviceInfo.tier === 'low') {
      scaleMultiplier *= 0.75
      shouldScale = true
    }

    // 慢速網路縮小尺寸
    if (networkInfo.effectiveType === '2g' || networkInfo.effectiveType === 'slow-2g') {
      scaleMultiplier *= 0.6
      shouldScale = true
    } else if (networkInfo.effectiveType === '3g') {
      scaleMultiplier *= 0.8
      shouldScale = true
    }

    // 節省資料模式
    if (networkInfo.saveData) {
      scaleMultiplier *= 0.7
      shouldScale = true
    }

    // 記憶體壓力下縮小尺寸
    if (deviceInfo.memoryPressure === 'critical') {
      scaleMultiplier *= 0.6
      shouldScale = true
    } else if (deviceInfo.memoryPressure === 'high') {
      scaleMultiplier *= 0.8
      shouldScale = true
    }

    // 大檔案額外縮小
    const fileSizeMB = file.size / (1024 * 1024)
    if (fileSizeMB > 5) {
      scaleMultiplier *= 0.85
      shouldScale = true
    }

    const width = Math.floor(originalOptions.maxWidth * scaleMultiplier)
    const height = Math.floor(originalOptions.maxHeight * scaleMultiplier)

    // 確保最小尺寸
    const minSize = 100
    const finalWidth = Math.max(minSize, width)
    const finalHeight = Math.max(minSize, height)

    if (shouldScale) {
      logger.debug('智慧尺寸調整', {
        metadata: {
          original: `${originalOptions.maxWidth}x${originalOptions.maxHeight}`,
          final: `${finalWidth}x${finalHeight}`,
          scaleMultiplier,
          deviceTier: deviceInfo.tier,
          networkType: networkInfo.effectiveType,
          saveData: networkInfo.saveData,
          fileSizeMB,
        },
      })
    }

    return { width: finalWidth, height: finalHeight, shouldScale }
  }

  /**
   * 更新效能統計
   */
  private updatePerformanceStats(
    wasOptimized: boolean,
    qualityReduction: number,
    sizeReduction: number
  ): void {
    this.performanceStats.totalPreviews++

    if (wasOptimized) {
      this.performanceStats.optimizedPreviews++

      // 更新平均品質減少
      const prevAvg = this.performanceStats.avgQualityReduction
      const count = this.performanceStats.optimizedPreviews
      this.performanceStats.avgQualityReduction = (prevAvg * (count - 1) + qualityReduction) / count

      // 更新平均尺寸減少
      const prevSizeAvg = this.performanceStats.avgSizeReduction
      this.performanceStats.avgSizeReduction = (prevSizeAvg * (count - 1) + sizeReduction) / count
    }

    // 記錄記憶體使用樣本（最多保留 100 個）
    if (typeof window !== 'undefined' && 'memory' in performance) {
      const memInfo = (performance as any).memory
      if (memInfo) {
        this.performanceStats.memoryUsageSamples.push(memInfo.usedJSHeapSize)
        if (this.performanceStats.memoryUsageSamples.length > 100) {
          this.performanceStats.memoryUsageSamples.shift()
        }
      }
    }
  }

  /**
   * 設定智慧品質調整
   */
  setSmartQualityAdjustment(enabled: boolean): void {
    this.enableSmartQualityAdjustment = enabled
    logger.info(`智慧品質調整${enabled ? '已啟用' : '已停用'}`)
  }

  /**
   * 設定智慧尺寸調整
   */
  setSmartSizeAdjustment(enabled: boolean): void {
    this.enableSmartSizeAdjustment = enabled
    logger.info(`智慧尺寸調整${enabled ? '已啟用' : '已停用'}`)
  }

  /**
   * 取得效能統計
   */
  getPerformanceStats(): {
    totalPreviews: number
    optimizedPreviews: number
    optimizationRate: number
    avgQualityReduction: number
    avgSizeReduction: number
    memoryTrend: {
      current: number
      average: number
      peak: number
    } | null
    smartAdjustmentStatus: {
      qualityAdjustment: boolean
      sizeAdjustment: boolean
    }
  } {
    const optimizationRate =
      this.performanceStats.totalPreviews > 0
        ? (this.performanceStats.optimizedPreviews / this.performanceStats.totalPreviews) * 100
        : 0

    let memoryTrend = null
    if (this.performanceStats.memoryUsageSamples.length > 0) {
      const samples = this.performanceStats.memoryUsageSamples
      const current = samples[samples.length - 1]
      const average = samples.reduce((sum, val) => sum + val, 0) / samples.length
      const peak = Math.max(...samples)

      memoryTrend = { current, average, peak }
    }

    return {
      totalPreviews: this.performanceStats.totalPreviews,
      optimizedPreviews: this.performanceStats.optimizedPreviews,
      optimizationRate: Number(optimizationRate.toFixed(2)),
      avgQualityReduction: Number(this.performanceStats.avgQualityReduction.toFixed(3)),
      avgSizeReduction: Number(this.performanceStats.avgSizeReduction.toFixed(2)),
      memoryTrend,
      smartAdjustmentStatus: {
        qualityAdjustment: this.enableSmartQualityAdjustment,
        sizeAdjustment: this.enableSmartSizeAdjustment,
      },
    }
  }

  /**
   * 重置效能統計
   */
  resetPerformanceStats(): void {
    this.performanceStats = {
      totalPreviews: 0,
      optimizedPreviews: 0,
      avgQualityReduction: 0,
      avgSizeReduction: 0,
      memoryUsageSamples: [],
    }
    logger.info('效能統計已重置')
  }

  /**
   * 手動觸發效能調整建議
   */
  getPerformanceRecommendations(): {
    recommendations: string[]
    currentSettings: {
      qualityAdjustment: boolean
      sizeAdjustment: boolean
    }
    deviceInfo: {
      tier: 'low' | 'medium' | 'high'
      memoryPressure: 'normal' | 'high' | 'critical'
      cores: number
    }
    networkInfo: {
      effectiveType: '2g' | '3g' | '4g' | '5g' | 'slow-2g' | 'unknown'
      downlink: number
      rtt: number
      saveData: boolean
    }
  } {
    const deviceInfo = this.getDevicePerformanceInfo()
    const networkInfo = this.getNetworkInfo()
    const recommendations: string[] = []

    // 根據裝置效能建議
    if (deviceInfo.tier === 'low' && !this.enableSmartQualityAdjustment) {
      recommendations.push('建議啟用智慧品質調整以提升低階裝置效能')
    }

    if (deviceInfo.memoryPressure === 'high' || deviceInfo.memoryPressure === 'critical') {
      if (!this.enableSmartSizeAdjustment) {
        recommendations.push('建議啟用智慧尺寸調整以減少記憶體使用')
      }
      recommendations.push('建議定期清理 Blob URL 快取')
    }

    // 根據網路狀況建議
    if (
      (networkInfo.effectiveType === '2g' || networkInfo.effectiveType === '3g') &&
      (!this.enableSmartQualityAdjustment || !this.enableSmartSizeAdjustment)
    ) {
      recommendations.push('建議在慢速網路下啟用所有智慧調整')
    }

    if (networkInfo.saveData && !this.enableSmartQualityAdjustment) {
      recommendations.push('偵測到資料節省模式，建議啟用智慧品質調整')
    }

    // 根據統計資料建議
    const stats = this.getPerformanceStats()
    if (stats.totalPreviews > 10 && stats.optimizationRate < 20) {
      recommendations.push('優化比例較低，考慮調整智慧調整的敏感度')
    }

    if (recommendations.length === 0) {
      recommendations.push('目前設定已針對您的裝置和網路環境優化')
    }

    return {
      recommendations,
      currentSettings: {
        qualityAdjustment: this.enableSmartQualityAdjustment,
        sizeAdjustment: this.enableSmartSizeAdjustment,
      },
      deviceInfo,
      networkInfo,
    }
  }

  /**
   * 取得輸出 MIME 類型
   */
  private getOutputMimeType(format: 'webp' | 'jpeg' | 'png'): string {
    const mimeTypes = {
      webp: 'image/webp',
      jpeg: 'image/jpeg',
      png: 'image/png',
    }
    return mimeTypes[format]
  }

  /**
   * 將圖片轉換為 WebP 格式
   * 整合 compressImage 功能的高效能格式轉換
   */
  async convertToWebP(
    file: File,
    options?: {
      quality?: number
      maxWidth?: number
      maxHeight?: number
      enableFallback?: boolean
      compressionOptions?: {
        maxSizeMB?: number
        maxWidthOrHeight?: number
        useWebWorker?: boolean
      }
    }
  ): Promise<{
    webpFile: File | null
    fallbackFile?: File
    supported: boolean
    conversionTime: number
    originalSize: number
    compressedSize: number
  }> {
    const timer = logger.timer('WebP格式轉換')
    const config = {
      quality: options?.quality || 0.85,
      maxWidth: options?.maxWidth || 1920,
      maxHeight: options?.maxHeight || 1920,
      enableFallback: options?.enableFallback ?? true,
      compressionOptions: {
        maxSizeMB: 1,
        maxWidthOrHeight: 1920,
        useWebWorker: true,
        ...options?.compressionOptions,
      },
    }

    let webpFile: File | null = null
    let fallbackFile: File | undefined = undefined
    let supported = false

    try {
      // 檢查瀏覽器 WebP 支援度
      supported = await this.checkWebPSupport()

      if (!supported && !config.enableFallback) {
        throw new Error('WebP 格式不受支援且未啟用後備機制')
      }

      // 載入和處理圖片
      const img = new Image()
      const imageLoadPromise = new Promise<HTMLImageElement>((resolve, reject) => {
        img.onload = () => resolve(img)
        img.onerror = () => reject(new Error('圖片載入失敗'))
        img.src = URL.createObjectURL(file)
      })

      const loadedImg = await imageLoadPromise

      try {
        // 計算目標尺寸
        const { width: targetWidth, height: targetHeight } = this.calculateDimensions(loadedImg, {
          maxWidth: config.maxWidth,
          maxHeight: config.maxHeight,
          maintainAspectRatio: true,
          quality: config.quality,
          format: 'webp',
        })

        // 建立 Canvas
        const canvas = document.createElement('canvas')
        const ctx = canvas.getContext('2d', { alpha: true, willReadFrequently: false })

        if (!ctx) {
          throw new Error('無法建立 Canvas 2D context')
        }

        canvas.width = targetWidth
        canvas.height = targetHeight

        // 設定高品質繪製選項
        ctx.imageSmoothingEnabled = true
        ctx.imageSmoothingQuality = 'high'

        // 繪製圖片
        ctx.drawImage(loadedImg, 0, 0, targetWidth, targetHeight)

        // WebP 轉換
        if (supported) {
          try {
            webpFile = await this.canvasToWebPFile(canvas, config.quality, file.name)
            logger.info('WebP轉換成功', {
              metadata: {
                originalSize: file.size,
                webpSize: webpFile.size,
                compressionRatio:
                  (((file.size - webpFile.size) / file.size) * 100).toFixed(2) + '%',
              },
            })
          } catch (webpError) {
            logger.warn('WebP轉換失敗，使用後備方案', {
              metadata: { error: String(webpError) },
            })
            supported = false
          }
        }

        // 後備格式轉換 (JPEG)
        if (config.enableFallback || !supported) {
          try {
            fallbackFile = await this.canvasToJPEGFile(canvas, config.quality, file.name)
          } catch (fallbackError) {
            logger.error('後備格式轉換失敗', fallbackError as Error, {
              metadata: { fileName: file.name },
            })
          }
        }
      } finally {
        // 清理 Blob URL
        URL.revokeObjectURL(img.src)
      }

      // 如果有啟用壓縮選項，進一步壓縮結果
      if (config.compressionOptions && (webpFile || fallbackFile)) {
        try {
          // 動態導入 compressImage
          const { compressImage } = await import('@/lib/utils/image-utils')

          if (webpFile) {
            const compressedWebP = await compressImage(webpFile, config.compressionOptions)
            if (compressedWebP.size < webpFile.size) {
              webpFile = compressedWebP
            }
          }

          if (fallbackFile) {
            const compressedFallback = await compressImage(fallbackFile, config.compressionOptions)
            if (compressedFallback.size < fallbackFile.size) {
              fallbackFile = compressedFallback
            }
          }
        } catch (compressionError) {
          logger.warn('額外壓縮失敗', {
            metadata: { error: String(compressionError) },
          })
        }
      }

      const conversionTime = timer.end({
        metadata: {
          supported,
          enableFallback: config.enableFallback,
          originalSize: file.size,
          webpSize: webpFile?.size || 0,
          fallbackSize: fallbackFile?.size || 0,
        },
      })

      return {
        webpFile,
        fallbackFile,
        supported,
        conversionTime,
        originalSize: file.size,
        compressedSize: webpFile?.size || fallbackFile?.size || file.size,
      }
    } catch (error) {
      timer.end()
      logger.error('WebP格式轉換失敗', error as Error, {
        metadata: {
          fileName: file.name,
          fileSize: file.size,
        },
      })

      // 發生錯誤時，回傳原檔案作為後備
      return {
        webpFile: null,
        fallbackFile: file,
        supported: false,
        conversionTime: 0,
        originalSize: file.size,
        compressedSize: file.size,
      }
    }
  }

  /**
   * 智能格式轉換
   * 優先使用 WebP，不支援時自動使用 JPEG 後備
   */
  private async smartFormatConversion(
    canvas: HTMLCanvasElement,
    options: PreviewOptions,
    startTime: number
  ): Promise<PreviewResult> {
    const supported = await this.checkWebPSupport()

    return new Promise((resolve, reject) => {
      if (supported) {
        // 嘗試 WebP 轉換
        canvas.toBlob(
          webpBlob => {
            if (webpBlob) {
              const processingTime = performance.now() - startTime
              const url = this.previewBlobGroup.create(webpBlob, {
                fileName: 'preview.webp',
                fileSize: webpBlob.size,
                mimeType: 'image/webp',
                purpose: 'preview',
              })

              resolve({
                url,
                width: canvas.width,
                height: canvas.height,
                size: webpBlob.size,
                format: 'webp',
                quality: options.quality,
                processingTime: Math.round(processingTime),
              })
            } else {
              // WebP 失敗，使用 JPEG 後備
              this.fallbackToJPEG(canvas, options, startTime, resolve, reject)
            }
          },
          'image/webp',
          options.quality
        )
      } else {
        // 不支援 WebP，直接使用 JPEG 後備
        this.fallbackToJPEG(canvas, options, startTime, resolve, reject)
      }
    })
  }

  /**
   * JPEG 後備轉換
   */
  private fallbackToJPEG(
    canvas: HTMLCanvasElement,
    options: PreviewOptions,
    startTime: number,
    resolve: (result: PreviewResult) => void,
    reject: (error: Error) => void
  ): void {
    canvas.toBlob(
      jpegBlob => {
        if (!jpegBlob) {
          reject(new Error('JPEG 後備轉換失敗'))
          return
        }

        const processingTime = performance.now() - startTime
        const url = this.previewBlobGroup.create(jpegBlob, {
          fileName: 'preview_fallback.jpg',
          fileSize: jpegBlob.size,
          mimeType: 'image/jpeg',
          purpose: 'preview',
        })

        resolve({
          url,
          width: canvas.width,
          height: canvas.height,
          size: jpegBlob.size,
          format: 'jpeg', // 實際使用的格式
          quality: options.quality,
          processingTime: Math.round(processingTime),
        })
      },
      'image/jpeg',
      options.quality
    )
  }

  /**
   * 檢查瀏覽器 WebP 支援度
   */
  private async checkWebPSupport(): Promise<boolean> {
    // 使用快取避免重複檢查
    if (typeof window !== 'undefined' && (window as any).__webpSupported !== undefined) {
      return (window as any).__webpSupported
    }

    try {
      const webpData =
        'data:image/webp;base64,UklGRjoAAABXRUJQVlA4IC4AAACyAgCdASoCAAIALmk0mk0iIiIiIgBoSygABc6WWgAA/veff/0PP8bA//LwYAAA'

      const supported = await new Promise<boolean>(resolve => {
        const img = new Image()
        img.onload = () => resolve(img.width === 2 && img.height === 2)
        img.onerror = () => resolve(false)
        img.src = webpData
      })

      if (typeof window !== 'undefined') {
        ;(window as any).__webpSupported = supported
      }

      return supported
    } catch {
      return false
    }
  }

  /**
   * 將 Canvas 轉換為 WebP 檔案
   */
  private async canvasToWebPFile(
    canvas: HTMLCanvasElement,
    quality: number,
    originalFileName: string
  ): Promise<File> {
    return new Promise((resolve, reject) => {
      canvas.toBlob(
        blob => {
          if (!blob) {
            reject(new Error('WebP Blob 生成失敗'))
            return
          }

          const fileName = this.generateWebPFileName(originalFileName)
          const file = new File([blob], fileName, { type: 'image/webp' })
          resolve(file)
        },
        'image/webp',
        quality
      )
    })
  }

  /**
   * 將 Canvas 轉換為 JPEG 檔案（後備格式）
   */
  private async canvasToJPEGFile(
    canvas: HTMLCanvasElement,
    quality: number,
    originalFileName: string
  ): Promise<File> {
    return new Promise((resolve, reject) => {
      canvas.toBlob(
        blob => {
          if (!blob) {
            reject(new Error('JPEG Blob 生成失敗'))
            return
          }

          const fileName = this.generateFallbackFileName(originalFileName, 'jpg')
          const file = new File([blob], fileName, { type: 'image/jpeg' })
          resolve(file)
        },
        'image/jpeg',
        quality
      )
    })
  }

  /**
   * 生成 WebP 檔案名稱
   */
  private generateWebPFileName(originalFileName: string): string {
    const nameWithoutExt = originalFileName.replace(/\.[^/.]+$/, '')
    return `${nameWithoutExt}_webp_${Date.now()}.webp`
  }

  /**
   * 生成後備檔案名稱
   */
  private generateFallbackFileName(originalFileName: string, extension: string): string {
    const nameWithoutExt = originalFileName.replace(/\.[^/.]+$/, '')
    return `${nameWithoutExt}_fallback_${Date.now()}.${extension}`
  }

  /**
   * 批次 WebP 轉換
   * 同時處理多個檔案的格式轉換
   */
  async batchConvertToWebP(
    files: File[],
    options?: {
      quality?: number
      maxWidth?: number
      maxHeight?: number
      enableFallback?: boolean
      concurrency?: number
      progressCallback?: (completed: number, total: number) => void
    }
  ): Promise<{
    results: Array<{
      originalFile: File
      webpFile: File | null
      fallbackFile?: File
      supported: boolean
      error?: string
    }>
    totalOriginalSize: number
    totalCompressedSize: number
    averageCompressionRatio: number
    processingTime: number
  }> {
    const timer = logger.timer('批次WebP轉換')
    const config = {
      concurrency: options?.concurrency || 3,
      ...options,
    }

    const results: Array<{
      originalFile: File
      webpFile: File | null
      fallbackFile?: File
      supported: boolean
      error?: string
    }> = []

    let totalOriginalSize = 0
    let totalCompressedSize = 0

    try {
      // 分批處理檔案
      const batches = this.chunkArray(files, config.concurrency)
      let completedFiles = 0

      for (const batch of batches) {
        const batchPromises = batch.map(async file => {
          try {
            const result = await this.convertToWebP(file, config)

            const finalFile = result.webpFile || result.fallbackFile || file
            totalOriginalSize += result.originalSize
            totalCompressedSize += finalFile.size

            return {
              originalFile: file,
              webpFile: result.webpFile,
              fallbackFile: result.fallbackFile,
              supported: result.supported,
            }
          } catch (error) {
            totalOriginalSize += file.size
            totalCompressedSize += file.size

            return {
              originalFile: file,
              webpFile: null,
              fallbackFile: file,
              supported: false,
              error: String(error),
            }
          }
        })

        const batchResults = await Promise.allSettled(batchPromises)

        batchResults.forEach(result => {
          if (result.status === 'fulfilled') {
            results.push(result.value)
          } else {
            // 處理失敗的情況
            results.push({
              originalFile: batch[results.length] || files[results.length],
              webpFile: null,
              supported: false,
              error: String(result.reason),
            })
          }

          completedFiles++
          config.progressCallback?.(completedFiles, files.length)
        })
      }

      const averageCompressionRatio =
        totalOriginalSize > 0
          ? ((totalOriginalSize - totalCompressedSize) / totalOriginalSize) * 100
          : 0

      const processingTime = timer.end({
        metadata: {
          fileCount: files.length,
          successCount: results.filter(r => r.webpFile || r.fallbackFile).length,
          totalOriginalSize,
          totalCompressedSize,
          averageCompressionRatio: averageCompressionRatio.toFixed(2) + '%',
        },
      })

      return {
        results,
        totalOriginalSize,
        totalCompressedSize,
        averageCompressionRatio,
        processingTime,
      }
    } catch (error) {
      timer.end()
      logger.error('批次WebP轉換失敗', error as Error)
      throw error
    }
  }

  /**
   * 產生響應式預覽圖片
   * 根據不同斷點生成多種尺寸的預覽圖
   */
  async generateResponsivePreviews(
    file: File,
    options?: ResponsivePreviewOptions
  ): Promise<MultiSizePreviewResult> {
    const timer = logger.timer('響應式預覽生成')
    const config = {
      breakpoints: options?.breakpoints || ['mobile', 'tablet', 'desktop'],
      baseOptions: options?.baseOptions || {},
      enableWebP: options?.enableWebP ?? true,
      generateFallbacks: options?.generateFallbacks ?? true,
      ...options,
    }

    try {
      const results: Record<string, PreviewResult> = {}
      const errors: Array<{ breakpoint: string; error: Error }> = []

      // 根據斷點選擇對應尺寸
      const breakpointSizes = {
        mobile: this.DEFAULT_SIZES.small,
        tablet: this.DEFAULT_SIZES.medium,
        desktop: this.DEFAULT_SIZES.large,
        xlarge: this.DEFAULT_SIZES.xlarge,
      }

      // 批次生成所有斷點的預覽圖
      const previewPromises = config.breakpoints.map(async breakpoint => {
        try {
          const targetSize =
            breakpointSizes[breakpoint as keyof typeof breakpointSizes] || this.DEFAULT_SIZES.medium

          const previewOptions: PreviewOptions = {
            maxWidth: targetSize.width,
            maxHeight: targetSize.height,
            quality: 0.85,
            format: config.enableWebP ? 'webp' : 'jpeg',
            maintainAspectRatio: true,
            ...config.baseOptions,
          }

          const result = await this.generatePreview(file, previewOptions)
          results[breakpoint] = result

          // 生成後備格式
          if (config.generateFallbacks && config.enableWebP) {
            const fallbackOptions = { ...previewOptions, format: 'jpeg' as const }
            const fallbackResult = await this.generatePreview(file, fallbackOptions)
            results[`${breakpoint}_fallback`] = fallbackResult
          }
        } catch (error) {
          logger.error('響應式預覽生成失敗', error as Error, {
            metadata: { breakpoint },
          })
          errors.push({ breakpoint, error: error as Error })
        }
      })

      await Promise.allSettled(previewPromises)

      const duration = timer.end({
        metadata: {
          breakpointCount: config.breakpoints.length,
          successCount: Object.keys(results).length,
          errorCount: errors.length,
        },
      })

      return {
        results,
        breakpoints: config.breakpoints,
        errors,
        metadata: {
          processingTime: duration,
          totalPreviews: Object.keys(results).length,
          enabledWebP: config.enableWebP,
          generatedFallbacks: config.generateFallbacks,
        },
      }
    } catch (error) {
      timer.end()
      logger.error('響應式預覽批次生成失敗', error as Error)
      throw error
    }
  }

  /**
   * 使用預定義尺寸集合產生預覽圖片
   */
  async generateSizeSetPreviews(
    file: File,
    sizeSetName: string,
    options?: CustomSizeSet
  ): Promise<MultiSizePreviewResult> {
    const timer = logger.timer('尺寸集合預覽生成')

    try {
      const targetSizeSet = options?.customSet || this.SIZE_SETS[sizeSetName]

      if (!targetSizeSet) {
        throw new Error(`未知的尺寸集合: ${sizeSetName}`)
      }

      const results: Record<string, PreviewResult> = {}
      const errors: Array<{ sizeName: string; error: Error }> = []

      // 批次處理所有尺寸
      const sizePromises = targetSizeSet.sizes.map(async sizeConfig => {
        const sizeName = `${sizeConfig.width}x${sizeConfig.height}`

        try {
          const previewOptions: PreviewOptions = {
            maxWidth: sizeConfig.width,
            maxHeight: sizeConfig.height,
            quality: options?.quality || 0.85,
            format: options?.format || 'webp',
            maintainAspectRatio: sizeConfig.maintainAspect ?? true,
            ...options?.baseOptions,
          }

          const result = await this.generatePreview(file, previewOptions)
          results[sizeName] = result
        } catch (error) {
          logger.error('尺寸集合預覽生成失敗', error as Error, {
            metadata: { sizeName, sizeSet: sizeSetName },
          })
          errors.push({ sizeName, error: error as Error })
        }
      })

      await Promise.allSettled(sizePromises)

      const duration = timer.end({
        metadata: {
          sizeSet: sizeSetName,
          targetSizes: targetSizeSet.sizes.length,
          successCount: Object.keys(results).length,
          errorCount: errors.length,
        },
      })

      return {
        results,
        sizeSet: targetSizeSet,
        errors,
        metadata: {
          processingTime: duration,
          totalPreviews: Object.keys(results).length,
          sizeSetName,
        },
      }
    } catch (error) {
      timer.end()
      logger.error('尺寸集合預覽批次生成失敗', error as Error, {
        metadata: { sizeSetName },
      })
      throw error
    }
  }

  /**
   * 產生完整的多尺寸預覽套件
   * 結合響應式和特定尺寸集合的功能
   */
  async generateComprehensivePreviews(
    file: File,
    options?: {
      includeSizeSet?: string
      includeResponsive?: boolean
      responsiveOptions?: ResponsivePreviewOptions
      sizeSetOptions?: CustomSizeSet
      baseOptions?: PreviewOptions
    }
  ): Promise<{
    responsive?: MultiSizePreviewResult
    sizeSet?: MultiSizePreviewResult
    metadata: {
      totalPreviews: number
      processingTime: number
      fileSize: number
    }
  }> {
    const timer = logger.timer('完整預覽套件生成')

    try {
      const results: {
        responsive?: MultiSizePreviewResult
        sizeSet?: MultiSizePreviewResult
      } = {}

      // 並行處理響應式和尺寸集合預覽
      const promises: Promise<void>[] = []

      if (options?.includeResponsive !== false) {
        promises.push(
          this.generateResponsivePreviews(file, {
            baseOptions: options?.baseOptions,
            ...options?.responsiveOptions,
          }).then(result => {
            results.responsive = result
          })
        )
      }

      if (options?.includeSizeSet) {
        promises.push(
          this.generateSizeSetPreviews(file, options.includeSizeSet, {
            baseOptions: options?.baseOptions,
            ...options?.sizeSetOptions,
          }).then(result => {
            results.sizeSet = result
          })
        )
      }

      await Promise.allSettled(promises)

      const totalPreviews =
        (results.responsive ? Object.keys(results.responsive.results).length : 0) +
        (results.sizeSet ? Object.keys(results.sizeSet.results).length : 0)

      const duration = timer.end({
        metadata: {
          includeResponsive: !!results.responsive,
          includeSizeSet: !!results.sizeSet,
          totalPreviews,
          fileSize: file.size,
        },
      })

      return {
        ...results,
        metadata: {
          totalPreviews,
          processingTime: duration,
          fileSize: file.size,
        },
      }
    } catch (error) {
      timer.end()
      logger.error('完整預覽套件生成失敗', error as Error)
      throw error
    }
  }

  /**
   * 將陣列分塊
   */
  private chunkArray<T>(array: T[], chunkSize: number): T[][] {
    const chunks: T[][] = []
    for (let i = 0; i < array.length; i += chunkSize) {
      chunks.push(array.slice(i, i + chunkSize))
    }
    return chunks
  }
}

/**
 * 導出單例實例
 */
export const imagePreviewService = ImagePreviewService.getInstance()

/**
 * 預設預覽選項
 */
export const DEFAULT_PREVIEW_OPTIONS: PreviewOptions = {
  maxWidth: 800,
  maxHeight: 600,
  quality: 0.85,
  format: 'webp',
  enableSharpening: true,
  enableColorCorrection: true,
  maintainAspectRatio: true,
}

/**
 * 縮圖預設選項
 */
export const DEFAULT_THUMBNAIL_OPTIONS: PreviewOptions = {
  maxWidth: 150,
  maxHeight: 150,
  quality: 0.8,
  format: 'webp',
  maintainAspectRatio: false,
  backgroundFill: '#f5f5f5',
}

/**
 * 多尺寸預覽結果接口
 */
export interface MultiSizePreviewResult {
  results: Record<string, PreviewResult>
  errors?: Array<{ breakpoint?: string; sizeName?: string; error: Error }>
  breakpoints?: string[]
  sizeSet?: {
    name?: string
    sizes: Array<{
      width: number
      height: number
      maintainAspect?: boolean
    }>
  }
  metadata: {
    processingTime: number
    totalPreviews: number
    [key: string]: any
  }
}

/**
 * WebP 轉換結果接口
 */
export interface WebPConversionResult {
  webpFile: File | null
  fallbackFile?: File
  supported: boolean
  conversionTime: number
  originalSize: number
  compressedSize: number
}

/**
 * WebP 轉換選項
 */
export interface WebPConversionOptions {
  quality?: number
  maxWidth?: number
  maxHeight?: number
  enableFallback?: boolean
  compressionOptions?: {
    maxSizeMB?: number
    maxWidthOrHeight?: number
    useWebWorker?: boolean
  }
}

/**
 * 批次 WebP 轉換結果
 */
export interface BatchWebPConversionResult {
  results: Array<{
    originalFile: File
    webpFile: File | null
    fallbackFile?: File
    supported: boolean
    error?: string
  }>
  totalOriginalSize: number
  totalCompressedSize: number
  averageCompressionRatio: number
  processingTime: number
}

/**
 * 批次 WebP 轉換選項
 */
export interface BatchWebPConversionOptions {
  quality?: number
  maxWidth?: number
  maxHeight?: number
  enableFallback?: boolean
  concurrency?: number
  progressCallback?: (completed: number, total: number) => void
}
