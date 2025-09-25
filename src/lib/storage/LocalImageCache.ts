/**
 * LocalImageCache - 本地圖片快取服務
 *
 * 提供智慧延遲上傳系統的核心本地快取功能
 * - IndexedDB 儲存大檔案（>1MB）
 * - Memory Cache 儲存小檔案（<1MB）
 * - LRU 清理策略
 * - 檔案壓縮和格式轉換
 */

import { logger } from '@/lib/logger'
import { compressImage, validateImageFile, generateFileName } from '@/lib/utils/image-utils'

export interface CachedImage {
  id: string
  file: File
  preview: string
  thumbnail: string
  metadata: ImageMetadata
  timestamp: number
  status: CacheStatus
  priority: Priority
  lastAccessed: number
  accessCount: number
  memoryScore: number
}

export interface ImageMetadata {
  originalName: string
  size: number
  type: string
  dimensions: { width: number; height: number }
  checksum: string
  compressionRatio: number

  // EXIF 數據
  exif?: ExifData

  // 圖片品質和特徵
  quality?: number
  hasAlpha?: boolean
  colorDepth?: number
  aspectRatio: number

  // 效能相關
  estimatedLoadTime?: number
  previewSize?: number
  thumbnailSize?: number

  // 檔案資訊
  lastModified?: number
  encoding?: string

  // 色彩分析（可選）
  dominantColors?: string[]
  averageBrightness?: number

  // 內容識別（可選）
  detectedObjects?: string[]
  isAnimated?: boolean
  frameCount?: number
}

export interface ExifData {
  // 攝影資訊
  camera?: string
  lens?: string
  timestamp?: string
  dateTimeOriginal?: string

  // 拍攝參數
  aperture?: number
  shutterSpeed?: string
  iso?: number
  focalLength?: number
  flash?: boolean

  // 圖片資訊
  orientation?: number
  colorSpace?: string
  whiteBalance?: string
  exposureMode?: string
  meteringMode?: string

  // 地理位置
  gps?: {
    lat: number
    lng: number
    altitude?: number
    timestamp?: string
  }

  // 軟體資訊
  software?: string
  artist?: string
  copyright?: string

  // 原始數據（供進階使用）
  raw?: Record<string, any>
}

export interface StoreOptions {
  priority?: Priority
  compress?: boolean
  generatePreview?: boolean
  generateThumbnail?: boolean
  previewOptions?: PreviewOptions
  thumbnailOptions?: ThumbnailOptions
}

export interface PreviewOptions {
  maxWidth?: number
  maxHeight?: number
  quality?: number
  format?: 'webp' | 'jpeg' | 'png'
  enableSharpening?: boolean
  enableColorCorrection?: boolean
}

export interface ThumbnailOptions {
  size?: number
  quality?: number
  format?: 'webp' | 'jpeg' | 'png'
  crop?: 'center' | 'top' | 'bottom' | 'left' | 'right' | 'cover' | 'contain'
}

export interface ClearExpiredOptions {
  respectPriority?: boolean
  forceCleanup?: boolean
  targetMemoryUsage?: number
  batchSize?: number
  includeActive?: boolean
}

export interface ClearExpiredResult {
  cleanedFiles: number
  reclaimedMemory: number
  reclaimedStorage: number
  skippedFiles: number
  errors: string[]
  strategy: 'expired_only' | 'standard_lru' | 'aggressive_lru'
  duration: number
  memoryPressureBefore: string
  memoryPressureAfter: string
  details: {
    expiredFiles: number
    lruFiles: number
    failedFiles: number
    protectedFiles: number
  }
}

export interface LRUDecision {
  needed: boolean
  aggressive: boolean
  targetCleanupSize: number
  reason: string
}

export interface CleanupBatch {
  candidates: Array<{ id: string; image: CachedImage; score: number }>
  targetSize: number
  protectedFiles: number
}

export interface PreviewResult {
  url: string
  width: number
  height: number
  size: number
  format: string
  quality: number
}

export interface CacheStats {
  // 基礎統計
  totalFiles: number
  totalSize: number
  memoryFiles: number
  memorySize: number
  dbFiles: number
  dbSize: number
  oldestTimestamp: number
  newestTimestamp: number

  // 狀態分析
  statusBreakdown: Record<CacheStatus, number>
  priorityBreakdown: Record<Priority, number>

  // 記憶體管理
  memoryUsageRatio: number
  memoryPressureLevel: string
  averageFileSize: number
  averageMemoryScore: number

  // 效能指標
  cacheHitRate: number
  uploadSuccessRate: number
  averageProcessingTime: number
  lastCleanupTime: number
  cleanupFrequency: number

  // 檔案分析
  largestFile: { name: string; size: number } | null
  mostAccessedFile: { name: string; accessCount: number } | null
  expiredFiles: number
  orphanedFiles: number

  // 時間統計
  averageAge: number
  filesOlderThan24h: number
  filesOlderThan7d: number

  // 類型分析
  fileTypeBreakdown: Record<string, number>
  compressionRatio: number

  // 系統資源
  indexedDBQuota: number
  indexedDBUsed: number
  indexedDBAvailable: number
}

export type CacheStatus = 'pending' | 'uploading' | 'uploaded' | 'failed' | 'expired'
export type Priority = 'low' | 'normal' | 'high' | 'critical'

/**
 * LocalImageCache 類別
 * 實作智慧圖片快取管理
 */
export class LocalImageCache {
  private static instance: LocalImageCache
  private db: IDBDatabase | null = null
  private memoryCache = new Map<string, CachedImage>()
  private readonly MEMORY_LIMIT = 50 * 1024 * 1024 // 50MB
  private readonly DB_NAME = 'SmartUploadCache'
  private readonly DB_VERSION = 1
  private readonly STORE_NAME = 'images'
  private readonly MAX_PREVIEW_WIDTH = 800
  private readonly MAX_PREVIEW_HEIGHT = 600
  private readonly THUMBNAIL_SIZE = 200
  private isInitialized = false
  private initPromise: Promise<void> | null = null
  private initAttempts = 0
  private readonly MAX_INIT_ATTEMPTS = 3
  // 記憶體快取管理相關
  private readonly MEMORY_WARNING_THRESHOLD = 0.8 // 80% 使用率警告
  private readonly MEMORY_CRITICAL_THRESHOLD = 0.95 // 95% 使用率緊急清理
  private readonly LRU_BATCH_SIZE = 5 // 批量清理數量
  private memoryPressureLevel: 'low' | 'medium' | 'high' | 'critical' = 'low'
  private lastCleanupTime = 0
  private readonly MIN_CLEANUP_INTERVAL = 30 * 1000 // 30 秒最小清理間隔

  // 統計追蹤變數
  private cacheHits = 0
  private cacheMisses = 0
  private uploadSuccesses = 0
  private uploadFailures = 0
  private processingTimes: number[] = []
  private cleanupHistory: number[] = []

  /**
   * 單例模式 - 確保整個應用只有一個快取實例
   */
  static getInstance(): LocalImageCache {
    if (!LocalImageCache.instance) {
      LocalImageCache.instance = new LocalImageCache()
    }
    return LocalImageCache.instance
  }

  /**
   * 初始化 IndexedDB 連接
   * 包含瀏覽器相容性檢查、錯誤處理和重試機制
   */
  async init(): Promise<void> {
    // 如果已經初始化完成，直接返回
    if (this.isInitialized) {
      return
    }

    // 如果正在初始化中，返回現有的 Promise
    if (this.initPromise) {
      return this.initPromise
    }

    // 創建新的初始化 Promise
    this.initPromise = this.performInit()

    try {
      await this.initPromise
    } catch (error) {
      // 重置 initPromise，允許重試
      this.initPromise = null
      throw error
    }
  }

  /**
   * 執行實際的初始化邏輯
   */
  private async performInit(): Promise<void> {
    const timer = logger.timer('IndexedDB 初始化')

    try {
      // 1. 檢查瀏覽器支援
      this.checkBrowserSupport()

      // 2. 檢查儲存空間配額
      await this.checkStorageQuota()

      // 3. 執行初始化
      await this.initializeDatabase()

      // 4. 驗證資料庫連接
      await this.validateDatabaseConnection()

      // 5. 清理過期資料
      await this.cleanupOnInit()

      this.isInitialized = true
      timer.end({
        metadata: {
          dbName: this.DB_NAME,
          version: this.DB_VERSION,
          attempts: this.initAttempts + 1,
        },
      })

      logger.info('IndexedDB 初始化完成', {
        module: 'LocalImageCache',
        metadata: {
          dbName: this.DB_NAME,
          version: this.DB_VERSION,
          attempts: this.initAttempts + 1,
          memoryLimit: this.MEMORY_LIMIT,
        },
      })
    } catch (error) {
      timer.end()
      this.initAttempts++

      // 如果達到最大重試次數，記錄致命錯誤
      if (this.initAttempts >= this.MAX_INIT_ATTEMPTS) {
        logger.error('IndexedDB 初始化失敗，已達最大重試次數', error as Error, {
          module: 'LocalImageCache',
          action: 'performInit',
          metadata: {
            attempts: this.initAttempts,
            maxAttempts: this.MAX_INIT_ATTEMPTS,
          },
        })
        throw new Error(`IndexedDB 初始化失敗: ${(error as Error).message}`)
      }

      // 延遲後重試
      const retryDelay = Math.pow(2, this.initAttempts) * 1000 // 指數退避
      logger.warn(`IndexedDB 初始化失敗，${retryDelay}ms 後重試`, {
        module: 'LocalImageCache',
        metadata: {
          attempts: this.initAttempts,
          retryDelay,
          error: (error as Error).message,
        },
      })

      await new Promise(resolve => setTimeout(resolve, retryDelay))
      return this.performInit() // 遞迴重試
    }
  }

  /**
   * 檢查瀏覽器對 IndexedDB 的支援
   */
  private checkBrowserSupport(): void {
    if (!('indexedDB' in window)) {
      throw new Error('瀏覽器不支援 IndexedDB')
    }

    if (!('Promise' in window)) {
      throw new Error('瀏覽器不支援 Promise，無法使用非同步功能')
    }

    if (!('Blob' in window)) {
      throw new Error('瀏覽器不支援 Blob，無法處理檔案')
    }

    if (!('URL' in window) || !('createObjectURL' in URL)) {
      throw new Error('瀏覽器不支援 URL.createObjectURL，無法建立預覽')
    }

    logger.debug('瀏覽器相容性檢查通過', {
      module: 'LocalImageCache',
      metadata: {
        userAgent: navigator.userAgent,
        indexedDBSupported: true,
        blobSupported: true,
        urlSupported: true,
      },
    })
  }

  /**
   * 檢查儲存空間配額
   */
  private async checkStorageQuota(): Promise<void> {
    if ('storage' in navigator && 'estimate' in navigator.storage) {
      try {
        const estimate = await navigator.storage.estimate()
        const usedMB = Math.round((estimate.usage || 0) / 1024 / 1024)
        const quotaMB = Math.round((estimate.quota || 0) / 1024 / 1024)
        const usagePercent = estimate.quota
          ? Math.round(((estimate.usage || 0) / estimate.quota) * 100)
          : 0

        logger.debug('儲存空間配額檢查', {
          module: 'LocalImageCache',
          metadata: {
            usedMB,
            quotaMB,
            usagePercent,
            available: quotaMB - usedMB,
          },
        })

        // 警告：儲存空間不足
        if (usagePercent > 90) {
          logger.warn('儲存空間使用率過高', {
            module: 'LocalImageCache',
            metadata: { usagePercent, quotaMB, usedMB },
          })
        }

        // 錯誤：儲存空間嚴重不足
        if (usagePercent > 98) {
          throw new Error(`儲存空間不足 (使用率: ${usagePercent}%)`)
        }
      } catch (error) {
        logger.warn('無法檢查儲存空間配額', {
          module: 'LocalImageCache',
          metadata: { error: (error as Error).message },
        })
      }
    } else {
      logger.debug('瀏覽器不支援 Storage API，跳過配額檢查', {
        module: 'LocalImageCache',
      })
    }
  }

  /**
   * 初始化資料庫連接
   */
  private async initializeDatabase(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.DB_NAME, this.DB_VERSION)

      request.onerror = () => {
        const error = new Error(`IndexedDB 開啟失敗: ${request.error?.message || 'Unknown error'}`)
        reject(error)
      }

      request.onblocked = () => {
        logger.warn('IndexedDB 被其他頁面阻擋，請關閉其他頁籤', {
          module: 'LocalImageCache',
          action: 'initializeDatabase',
        })
        // 不要直接 reject，給予時間等待其他頁面關閉
        setTimeout(() => {
          reject(new Error('IndexedDB 初始化被阻擋，可能有其他頁面正在使用'))
        }, 10000) // 10 秒超時
      }

      request.onsuccess = () => {
        this.db = request.result

        // 監聽資料庫連接錯誤
        this.db.onerror = event => {
          logger.error('IndexedDB 運行時錯誤', new Error('Database runtime error'), {
            module: 'LocalImageCache',
            action: 'runtime',
            metadata: { event: event.type },
          })
        }

        // 監聽版本變更（其他頁面升級資料庫）
        this.db.onversionchange = () => {
          logger.warn('IndexedDB 版本變更，需要重新載入頁面', {
            module: 'LocalImageCache',
            action: 'versionchange',
          })
          this.db?.close()
          this.db = null
          this.isInitialized = false
        }

        resolve()
      }

      request.onupgradeneeded = event => {
        const db = (event.target as IDBOpenDBRequest).result
        const transaction = (event.target as IDBOpenDBRequest).transaction!

        try {
          this.upgradeDatabase(db, event.oldVersion, event.newVersion || this.DB_VERSION)
        } catch (error) {
          logger.error('資料庫升級失敗', error as Error, {
            module: 'LocalImageCache',
            action: 'onupgradeneeded',
            metadata: {
              oldVersion: event.oldVersion,
              newVersion: event.newVersion,
            },
          })
          transaction.abort()
          reject(error)
        }
      }
    })
  }

  /**
   * 資料庫結構升級
   */
  private upgradeDatabase(db: IDBDatabase, oldVersion: number, newVersion: number): void {
    logger.info('開始資料庫結構升級', {
      module: 'LocalImageCache',
      metadata: { oldVersion, newVersion },
    })

    // 版本 1: 建立基礎結構
    if (oldVersion < 1) {
      this.createInitialSchema(db)
    }

    // 未來版本的升級邏輯可以在這裡添加
    // if (oldVersion < 2) {
    //   this.upgradeToVersion2(db)
    // }

    logger.info('資料庫結構升級完成', {
      module: 'LocalImageCache',
      metadata: { oldVersion, newVersion },
    })
  }

  /**
   * 建立初始資料庫結構
   */
  private createInitialSchema(db: IDBDatabase): void {
    if (!db.objectStoreNames.contains(this.STORE_NAME)) {
      const store = db.createObjectStore(this.STORE_NAME, { keyPath: 'id' })

      // 建立索引以支援快速查詢
      store.createIndex('status', 'status', { unique: false })
      store.createIndex('timestamp', 'timestamp', { unique: false })
      store.createIndex('priority', 'priority', { unique: false })
      store.createIndex('size', 'metadata.size', { unique: false })
      store.createIndex('type', 'metadata.type', { unique: false })

      logger.info('建立 IndexedDB object store 和索引', {
        module: 'LocalImageCache',
        metadata: {
          storeName: this.STORE_NAME,
          indexes: ['status', 'timestamp', 'priority', 'size', 'type'],
        },
      })
    }
  }

  /**
   * 驗證資料庫連接
   */
  private async validateDatabaseConnection(): Promise<void> {
    if (!this.db) {
      throw new Error('資料庫連接驗證失敗：資料庫未初始化')
    }

    try {
      // 嘗試執行簡單的讀取操作來驗證連接
      const transaction = this.db.transaction([this.STORE_NAME], 'readonly')
      const store = transaction.objectStore(this.STORE_NAME)

      await new Promise<void>((resolve, reject) => {
        const countRequest = store.count()
        countRequest.onsuccess = () => {
          logger.debug('資料庫連接驗證成功', {
            module: 'LocalImageCache',
            metadata: { recordCount: countRequest.result },
          })
          resolve()
        }
        countRequest.onerror = () => reject(countRequest.error)
      })
    } catch (error) {
      throw new Error(`資料庫連接驗證失敗: ${(error as Error).message}`)
    }
  }

  /**
   * 初始化時清理過期資料
   */
  private async cleanupOnInit(): Promise<void> {
    try {
      const cleanupResult = await this.clearExpired(7 * 24 * 60 * 60 * 1000) // 7 天
      if (cleanupResult.cleanedFiles > 0) {
        logger.info('初始化時清理過期資料完成', {
          module: 'LocalImageCache',
          metadata: {
            cleanedFiles: cleanupResult.cleanedFiles,
            reclaimedMemoryMB:
              Math.round((cleanupResult.reclaimedMemory / 1024 / 1024) * 100) / 100,
            strategy: cleanupResult.strategy,
          },
        })
      }
    } catch (error) {
      // 清理失敗不應該阻止初始化
      logger.warn('初始化時清理過期資料失敗', {
        module: 'LocalImageCache',
        metadata: { error: (error as Error).message },
      })
    }
  }

  /**
   * 儲存檔案到快取
   */
  async storeFile(file: File, options: StoreOptions = {}): Promise<string> {
    // 確保已初始化
    if (!this.isInitialized) {
      await this.init()
    }

    // 驗證檔案
    const validation = await validateImageFile(file)
    if (!validation.valid) {
      throw new Error(`檔案驗證失敗: ${validation.error}`)
    }

    const id = this.generateId()
    const timer = logger.timer('快取檔案儲存')

    try {
      // 壓縮檔案（如果需要）
      let processedFile = file
      if (options.compress !== false && file.size > 1024 * 1024) {
        processedFile = await compressImage(file, {
          maxSizeMB: 2,
          maxWidthOrHeight: 1920,
          quality: 0.8,
        })
      }

      // 提取元數據
      const metadata = await this.extractMetadata(processedFile, file)

      // 生成預覽圖
      const preview =
        options.generatePreview !== false
          ? await this.generatePreview(processedFile, options.previewOptions)
          : ''

      // 生成縮圖
      const thumbnail =
        options.generateThumbnail !== false
          ? await this.generateThumbnail(processedFile, options.thumbnailOptions)
          : ''

      const now = Date.now()
      const cachedImage: CachedImage = {
        id,
        file: processedFile,
        preview,
        thumbnail,
        metadata,
        timestamp: now,
        status: 'pending',
        priority: options.priority || 'normal',
        lastAccessed: now,
        accessCount: 1,
        memoryScore: this.calculateMemoryScore(
          processedFile.size,
          options.priority || 'normal',
          now
        ),
      }

      // 決定儲存位置：小檔案存記憶體，大檔案存 IndexedDB
      if (processedFile.size < 1024 * 1024) {
        // 1MB
        this.storeInMemory(cachedImage)
      } else {
        await this.storeInDB(cachedImage)
      }

      const duration = timer.end({
        metadata: {
          fileId: id,
          originalSize: file.size,
          processedSize: processedFile.size,
          compressionRatio: file.size / processedFile.size,
          storageType: processedFile.size < 1024 * 1024 ? 'memory' : 'indexeddb',
        },
      })

      // 記錄處理時間統計
      this.recordProcessingTime(duration)

      logger.info('檔案儲存到快取成功', {
        module: 'LocalImageCache',
        metadata: {
          fileId: id,
          fileName: file.name,
          size: processedFile.size,
          storageType: processedFile.size < 1024 * 1024 ? 'memory' : 'indexeddb',
          processingTime: duration,
        },
      })

      return id
    } catch (error) {
      timer.end()
      logger.error('檔案儲存到快取失敗', error as Error, {
        module: 'LocalImageCache',
        action: 'storeFile',
        metadata: {
          fileName: file.name,
          fileSize: file.size,
          options,
        },
      })
      throw error
    }
  }

  /**
   * 從快取取得檔案
   */
  async getFile(id: string): Promise<CachedImage | null> {
    // 優先從記憶體快取查找
    if (this.memoryCache.has(id)) {
      const cachedImage = this.memoryCache.get(id)!

      // 記錄快取命中
      this.recordCacheHit()

      // 更新使用追蹤資訊
      this.updateAccessInfo(cachedImage)
      this.memoryCache.set(id, cachedImage)

      logger.debug('從記憶體快取取得檔案', {
        module: 'LocalImageCache',
        metadata: {
          fileId: id,
          fileName: cachedImage.metadata.originalName,
          accessCount: cachedImage.accessCount,
          memoryScore: cachedImage.memoryScore,
        },
      })
      return cachedImage
    }

    // 從 IndexedDB 查找
    const cachedImage = await this.getFromDB(id)

    if (cachedImage) {
      // 記錄快取命中（IndexedDB）
      this.recordCacheHit()

      // 如果是小檔案且記憶體有空間，提升到記憶體快取
      if (cachedImage.metadata.size < 1024 * 1024) {
        const memoryUsage = this.getMemoryUsage()
        if (memoryUsage.usageRatio < this.MEMORY_WARNING_THRESHOLD) {
          this.updateAccessInfo(cachedImage)
          this.storeInMemory(cachedImage)
          logger.debug('從 IndexedDB 提升到記憶體快取', {
            module: 'LocalImageCache',
            metadata: {
              fileId: id,
              fileName: cachedImage.metadata.originalName,
              fileSize: cachedImage.metadata.size,
            },
          })
        }
      }
    } else {
      // 記錄快取未命中
      this.recordCacheMiss()
    }

    return cachedImage
  }

  /**
   * 從快取移除檔案
   */
  async removeFile(id: string): Promise<void> {
    const timer = logger.timer('移除快取檔案')

    try {
      // 從記憶體移除
      if (this.memoryCache.has(id)) {
        const cachedImage = this.memoryCache.get(id)!

        // 清理 Blob URLs
        if (cachedImage.preview && cachedImage.preview.startsWith('blob:')) {
          URL.revokeObjectURL(cachedImage.preview)
        }
        if (cachedImage.thumbnail && cachedImage.thumbnail.startsWith('blob:')) {
          URL.revokeObjectURL(cachedImage.thumbnail)
        }

        this.memoryCache.delete(id)
        logger.debug('從記憶體快取移除檔案', {
          module: 'LocalImageCache',
          metadata: { fileId: id },
        })
      }

      // 從 IndexedDB 移除
      await this.removeFromDB(id)

      timer.end({ metadata: { fileId: id } })
    } catch (error) {
      timer.end()
      logger.error('移除快取檔案失敗', error as Error, {
        module: 'LocalImageCache',
        action: 'removeFile',
        metadata: { fileId: id },
      })
      throw error
    }
  }

  /**
   * 清理過期檔案 (智慧 LRU 策略)
   */
  async clearExpired(
    maxAge = 24 * 60 * 60 * 1000,
    options?: ClearExpiredOptions
  ): Promise<ClearExpiredResult> {
    const timer = logger.timer('智慧 LRU 清理')
    const startTime = Date.now()
    const cutoff = startTime - maxAge

    // 解析選項
    const config = {
      maxAge,
      respectPriority: options?.respectPriority ?? true,
      forceCleanup: options?.forceCleanup ?? false,
      targetMemoryUsage: options?.targetMemoryUsage ?? 0.7, // 目標記憶體使用率70%
      batchSize: options?.batchSize ?? this.LRU_BATCH_SIZE,
      includeActive: options?.includeActive ?? false,
    }

    const result: ClearExpiredResult = {
      cleanedFiles: 0,
      reclaimedMemory: 0,
      reclaimedStorage: 0,
      skippedFiles: 0,
      errors: [],
      strategy: 'expired_only',
      duration: 0,
      memoryPressureBefore: this.memoryPressureLevel,
      memoryPressureAfter: this.memoryPressureLevel,
      details: {
        expiredFiles: 0,
        lruFiles: 0,
        failedFiles: 0,
        protectedFiles: 0,
      },
    }

    try {
      // 階段1：清理明確過期的檔案
      const expiredResult = await this.cleanupExpiredFiles(cutoff, config)
      this.mergeCleanupResults(result, expiredResult)

      // 階段2：根據記憶體壓力決定是否進行 LRU 清理
      const memoryUsage = this.getMemoryUsage()
      const shouldPerformLRU = this.shouldPerformLRUCleanup(memoryUsage, config)

      if (shouldPerformLRU.needed) {
        result.strategy = shouldPerformLRU.aggressive ? 'aggressive_lru' : 'standard_lru'
        const lruResult = await this.performLRUCleanup(config, shouldPerformLRU)
        this.mergeCleanupResults(result, lruResult)
      }

      // 階段3：清理 IndexedDB 過期檔案
      if (this.db) {
        const dbResult = await this.cleanupExpiredFromDB(cutoff)
        result.reclaimedStorage += dbResult.reclaimedStorage
        result.cleanedFiles += dbResult.cleanedFiles
        result.details.expiredFiles += dbResult.cleanedFiles
      }

      // 更新記憶體壓力等級
      const finalMemoryUsage = this.getMemoryUsage()
      this.updateMemoryPressureLevel(finalMemoryUsage.usageRatio)
      result.memoryPressureAfter = this.memoryPressureLevel

      result.duration = Date.now() - startTime
      timer.end({
        metadata: {
          ...result,
          memoryUsageBefore: memoryUsage.usageRatio,
          memoryUsageAfter: finalMemoryUsage.usageRatio,
        },
      })

      // 記錄清理結果
      this.logCleanupResult(result, config)

      return result
    } catch (error) {
      timer.end()
      result.duration = Date.now() - startTime
      result.errors.push((error as Error).message)

      logger.error('智慧 LRU 清理失敗', error as Error, {
        module: 'LocalImageCache',
        action: 'clearExpired',
        metadata: { partialResult: result },
      })

      return result
    }
  }

  /**
   * 清理明確過期的檔案
   */
  private async cleanupExpiredFiles(
    cutoff: number,
    config: any
  ): Promise<Partial<ClearExpiredResult>> {
    const result: Partial<ClearExpiredResult> = {
      cleanedFiles: 0,
      reclaimedMemory: 0,
      skippedFiles: 0,
      errors: [],
      details: {
        expiredFiles: 0,
        lruFiles: 0,
        failedFiles: 0,
        protectedFiles: 0,
      },
    }

    const expiredFiles: string[] = []

    // 收集過期檔案
    for (const [id, image] of this.memoryCache) {
      if (image.timestamp < cutoff || image.status === 'expired') {
        // 檢查是否受保護
        if (
          config.respectPriority &&
          (image.priority === 'critical' || (!config.includeActive && image.status === 'uploading'))
        ) {
          result.skippedFiles!++
          result.details!.protectedFiles++
          continue
        }
        expiredFiles.push(id)
      }
    }

    // 批量清理過期檔案
    for (const id of expiredFiles) {
      try {
        const image = this.memoryCache.get(id)
        if (image) {
          await this.removeFile(id)
          result.cleanedFiles!++
          result.reclaimedMemory! += image.metadata.size
          result.details!.expiredFiles++
        }
      } catch (error) {
        result.errors!.push(`清理檔案 ${id} 失敗: ${(error as Error).message}`)
        result.details!.failedFiles++
      }
    }

    return result
  }

  /**
   * 決定是否需要進行 LRU 清理
   */
  private shouldPerformLRUCleanup(
    memoryUsage: { totalFiles: number; totalSize: number; usageRatio: number },
    config: any
  ): LRUDecision {
    const now = Date.now()
    const timeSinceLastCleanup = now - this.lastCleanupTime

    // 強制清理模式
    if (config.forceCleanup) {
      return {
        needed: true,
        aggressive: true,
        targetCleanupSize: this.MEMORY_LIMIT * 0.3,
        reason: 'force_cleanup_requested',
      }
    }

    // 檢查記憶體壓力
    if (memoryUsage.usageRatio >= this.MEMORY_CRITICAL_THRESHOLD) {
      return {
        needed: true,
        aggressive: true,
        targetCleanupSize: this.MEMORY_LIMIT * 0.4, // 激進清理40%
        reason: 'critical_memory_pressure',
      }
    }

    if (memoryUsage.usageRatio >= this.MEMORY_WARNING_THRESHOLD) {
      return {
        needed: true,
        aggressive: false,
        targetCleanupSize: this.MEMORY_LIMIT * 0.2, // 標準清理20%
        reason: 'high_memory_pressure',
      }
    }

    // 檢查目標使用率
    if (memoryUsage.usageRatio > config.targetMemoryUsage) {
      return {
        needed: true,
        aggressive: false,
        targetCleanupSize: memoryUsage.totalSize - this.MEMORY_LIMIT * config.targetMemoryUsage,
        reason: 'target_usage_exceeded',
      }
    }

    // 長時間未清理的定期清理
    if (timeSinceLastCleanup > 2 * 60 * 60 * 1000 && memoryUsage.usageRatio > 0.5) {
      // 2 小時且超過50%使用率
      return {
        needed: true,
        aggressive: false,
        targetCleanupSize: this.MEMORY_LIMIT * 0.1, // 溫和清理10%
        reason: 'periodic_cleanup',
      }
    }

    return {
      needed: false,
      aggressive: false,
      targetCleanupSize: 0,
      reason: 'no_cleanup_needed',
    }
  }

  /**
   * 執行 LRU 清理
   */
  private async performLRUCleanup(
    config: any,
    decision: LRUDecision
  ): Promise<Partial<ClearExpiredResult>> {
    const result: Partial<ClearExpiredResult> = {
      cleanedFiles: 0,
      reclaimedMemory: 0,
      skippedFiles: 0,
      errors: [],
      details: {
        expiredFiles: 0,
        lruFiles: 0,
        failedFiles: 0,
        protectedFiles: 0,
      },
    }

    // 準備清理批次
    const batch = this.prepareLRUBatch(decision, config)
    let cleanedSize = 0

    // 執行批量清理
    for (const { id, image } of batch.candidates) {
      if (cleanedSize >= decision.targetCleanupSize) {
        break
      }

      try {
        await this.removeFile(id)
        result.cleanedFiles!++
        result.reclaimedMemory! += image.metadata.size
        result.details!.lruFiles++
        cleanedSize += image.metadata.size

        // 批次間短暫暫停，避免阻塞主線程
        if (result.cleanedFiles! % config.batchSize === 0) {
          await new Promise(resolve => setTimeout(resolve, 1))
        }
      } catch (error) {
        result.errors!.push(`LRU 清理檔案 ${id} 失敗: ${(error as Error).message}`)
        result.details!.failedFiles++
      }
    }

    // 更新最後清理時間並記錄清理事件
    this.lastCleanupTime = Date.now()
    this.recordCleanupEvent()

    return result
  }

  /**
   * 準備 LRU 清理批次
   */
  private prepareLRUBatch(decision: LRUDecision, config: any): CleanupBatch {
    const candidates: Array<{ id: string; image: CachedImage; score: number }> = []
    let protectedFiles = 0

    // 收集候選檔案並計算分數
    for (const [id, image] of this.memoryCache) {
      // 保護高優先級檔案
      if (config.respectPriority) {
        if (image.priority === 'critical') {
          protectedFiles++
          continue
        }
        if (image.priority === 'high' && !decision.aggressive) {
          protectedFiles++
          continue
        }
        if (!config.includeActive && (image.status === 'uploading' || image.status === 'pending')) {
          protectedFiles++
          continue
        }
      }

      const score = this.calculateCurrentMemoryScore(image)
      candidates.push({ id, image, score })
    }

    // 按分數排序（分數越低越優先清理）
    candidates.sort((a, b) => a.score - b.score)

    // 限制候選數量
    const maxCandidates = Math.min(
      candidates.length,
      decision.aggressive ? candidates.length : Math.ceil(candidates.length * 0.5)
    )

    return {
      candidates: candidates.slice(0, maxCandidates),
      targetSize: decision.targetCleanupSize,
      protectedFiles,
    }
  }

  /**
   * 清理 IndexedDB 中的過期檔案（增強版）
   */
  private async cleanupExpiredFromDB(
    cutoff: number
  ): Promise<{ cleanedFiles: number; reclaimedStorage: number }> {
    if (!this.db) {
      return { cleanedFiles: 0, reclaimedStorage: 0 }
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([this.STORE_NAME], 'readwrite')
      const store = transaction.objectStore(this.STORE_NAME)
      const index = store.index('timestamp')
      const range = IDBKeyRange.upperBound(cutoff)

      let cleanedFiles = 0
      let reclaimedStorage = 0

      const request = index.openCursor(range)

      request.onsuccess = event => {
        const cursor = (event.target as IDBRequest).result
        if (cursor) {
          const image = cursor.value as CachedImage
          reclaimedStorage += image.metadata.size
          cursor.delete()
          cleanedFiles++
          cursor.continue()
        }
      }

      transaction.oncomplete = () => {
        resolve({ cleanedFiles, reclaimedStorage })
      }

      transaction.onerror = () => {
        reject(new Error(`IndexedDB 清理失敗: ${transaction.error?.message}`))
      }
    })
  }

  /**
   * 合併清理結果
   */
  private mergeCleanupResults(
    target: ClearExpiredResult,
    source: Partial<ClearExpiredResult>
  ): void {
    target.cleanedFiles += source.cleanedFiles || 0
    target.reclaimedMemory += source.reclaimedMemory || 0
    target.skippedFiles += source.skippedFiles || 0
    if (source.errors) {
      target.errors.push(...source.errors)
    }
    if (source.details) {
      target.details.expiredFiles += source.details.expiredFiles || 0
      target.details.lruFiles += source.details.lruFiles || 0
      target.details.failedFiles += source.details.failedFiles || 0
      target.details.protectedFiles += source.details.protectedFiles || 0
    }
  }

  /**
   * 記錄清理結果
   */
  private logCleanupResult(result: ClearExpiredResult, config: any): void {
    const logLevel = result.errors.length > 0 ? 'warn' : 'info'
    const memoryReclaimedMB = Math.round((result.reclaimedMemory / 1024 / 1024) * 100) / 100
    const storageReclaimedMB = Math.round((result.reclaimedStorage / 1024 / 1024) * 100) / 100

    logger[logLevel]('智慧 LRU 清理完成', {
      module: 'LocalImageCache',
      metadata: {
        strategy: result.strategy,
        duration: result.duration,
        cleanedFiles: result.cleanedFiles,
        skippedFiles: result.skippedFiles,
        memoryReclaimedMB,
        storageReclaimedMB,
        totalReclaimedMB: memoryReclaimedMB + storageReclaimedMB,
        memoryPressureChange: `${result.memoryPressureBefore} → ${result.memoryPressureAfter}`,
        errorCount: result.errors.length,
        details: result.details,
        config: {
          respectPriority: config.respectPriority,
          targetMemoryUsage: `${Math.round(config.targetMemoryUsage * 100)}%`,
          batchSize: config.batchSize,
        },
      },
    })

    // 記錄錯誤詳情
    if (result.errors.length > 0) {
      logger.warn('清理過程中發生錯誤', {
        module: 'LocalImageCache',
        metadata: {
          errorCount: result.errors.length,
          errors: result.errors.slice(0, 3), // 只記錄前3個錯誤避免日誌過長
        },
      })
    }
  }

  /**
   * 手動觸發智慧 LRU 清理
   */
  async triggerSmartCleanup(options?: ClearExpiredOptions): Promise<ClearExpiredResult> {
    const enhancedOptions: ClearExpiredOptions = {
      forceCleanup: true,
      respectPriority: true,
      targetMemoryUsage: 0.6, // 較激進的目標使用率60%
      ...options,
    }

    logger.info('手動觸發智慧 LRU 清理', {
      module: 'LocalImageCache',
      metadata: {
        currentMemoryPressure: this.memoryPressureLevel,
        memoryUsage: this.getMemoryUsage(),
        options: enhancedOptions,
      },
    })

    return await this.clearExpired(7 * 24 * 60 * 60 * 1000, enhancedOptions) // 7天
  }

  /**
   * 獲取 LRU 清理建議
   */
  getLRUCleanupRecommendation(): {
    recommended: boolean
    reason: string
    urgency: 'low' | 'medium' | 'high' | 'critical'
    estimatedSavings: number
    estimatedFiles: number
  } {
    const memoryUsage = this.getMemoryUsage()
    const now = Date.now()
    const timeSinceLastCleanup = now - this.lastCleanupTime

    // 計算可清理的檔案
    const candidates = Array.from(this.memoryCache.values())
      .filter(
        image =>
          image.priority !== 'critical' &&
          image.status !== 'uploading' &&
          now - image.lastAccessed > 30 * 60 * 1000 // 30分鐘未存取
      )
      .sort((a, b) => this.calculateCurrentMemoryScore(a) - this.calculateCurrentMemoryScore(b))

    const estimatedFiles = Math.floor(candidates.length * 0.3) // 可清理30%
    const estimatedSavings = candidates
      .slice(0, estimatedFiles)
      .reduce((sum, image) => sum + image.metadata.size, 0)

    // 判斷急迫性和建議
    if (memoryUsage.usageRatio >= this.MEMORY_CRITICAL_THRESHOLD) {
      return {
        recommended: true,
        reason: '記憶體使用率已達臨界值，強烈建議立即清理',
        urgency: 'critical',
        estimatedSavings,
        estimatedFiles,
      }
    }

    if (memoryUsage.usageRatio >= this.MEMORY_WARNING_THRESHOLD) {
      return {
        recommended: true,
        reason: '記憶體使用率偏高，建議進行清理以釋放空間',
        urgency: 'high',
        estimatedSavings,
        estimatedFiles,
      }
    }

    if (timeSinceLastCleanup > 4 * 60 * 60 * 1000 && memoryUsage.usageRatio > 0.4) {
      // 4小時且超過40%
      return {
        recommended: true,
        reason: '長時間未進行清理，建議定期維護',
        urgency: 'medium',
        estimatedSavings,
        estimatedFiles,
      }
    }

    if (candidates.length > 20) {
      // 超過20個候選檔案
      return {
        recommended: true,
        reason: '存在較多低使用頻率檔案，可考慮清理',
        urgency: 'low',
        estimatedSavings,
        estimatedFiles,
      }
    }

    return {
      recommended: false,
      reason: '目前記憶體使用狀況良好，暫無清理需求',
      urgency: 'low',
      estimatedSavings: 0,
      estimatedFiles: 0,
    }
  }

  /**
   * 取得快取統計資訊（增強版）
   */
  async getStats(): Promise<CacheStats> {
    const timer = logger.timer('計算快取統計')
    const now = Date.now()

    // 初始化統計結構
    const stats: CacheStats = {
      // 基礎統計
      totalFiles: 0,
      totalSize: 0,
      memoryFiles: 0,
      memorySize: 0,
      dbFiles: 0,
      dbSize: 0,
      oldestTimestamp: now,
      newestTimestamp: 0,

      // 狀態分析
      statusBreakdown: {
        pending: 0,
        uploading: 0,
        uploaded: 0,
        failed: 0,
        expired: 0,
      },
      priorityBreakdown: {
        low: 0,
        normal: 0,
        high: 0,
        critical: 0,
      },

      // 記憶體管理
      memoryUsageRatio: 0,
      memoryPressureLevel: this.memoryPressureLevel,
      averageFileSize: 0,
      averageMemoryScore: 0,

      // 效能指標
      cacheHitRate: 0,
      uploadSuccessRate: 0,
      averageProcessingTime: 0,
      lastCleanupTime: this.lastCleanupTime,
      cleanupFrequency: 0,

      // 檔案分析
      largestFile: null,
      mostAccessedFile: null,
      expiredFiles: 0,
      orphanedFiles: 0,

      // 時間統計
      averageAge: 0,
      filesOlderThan24h: 0,
      filesOlderThan7d: 0,

      // 類型分析
      fileTypeBreakdown: {},
      compressionRatio: 0,

      // 系統資源
      indexedDBQuota: 0,
      indexedDBUsed: 0,
      indexedDBAvailable: 0,
    }

    try {
      // 統計記憶體快取
      await this.calculateMemoryStats(stats, now)

      // 統計 IndexedDB
      if (this.db) {
        await this.calculateDBStats(stats)
      }

      // 計算衍生統計
      this.calculateDerivedStats(stats, now)

      // 計算系統資源
      await this.calculateSystemResourceStats(stats)

      timer.end({
        metadata: {
          totalFiles: stats.totalFiles,
          memoryUsageRatio: Math.round(stats.memoryUsageRatio * 100),
          cacheHitRate: Math.round(stats.cacheHitRate * 100),
        },
      })

      return stats
    } catch (error) {
      timer.end()
      logger.error('計算快取統計失敗', error as Error, {
        module: 'LocalImageCache',
        action: 'getStats',
      })

      // 返回基礎統計作為後備
      return this.getBasicStats()
    }
  }

  /**
   * 計算記憶體快取統計
   */
  private async calculateMemoryStats(stats: CacheStats, now: number): Promise<void> {
    let totalMemoryScore = 0
    let totalOriginalSize = 0

    for (const [, image] of this.memoryCache) {
      stats.memoryFiles++
      stats.memorySize += image.metadata.size

      // 狀態統計
      stats.statusBreakdown[image.status]++
      stats.priorityBreakdown[image.priority]++

      // 時間統計
      stats.oldestTimestamp = Math.min(stats.oldestTimestamp, image.timestamp)
      stats.newestTimestamp = Math.max(stats.newestTimestamp, image.timestamp)

      const ageInMs = now - image.timestamp
      if (ageInMs > 24 * 60 * 60 * 1000) stats.filesOlderThan24h++
      if (ageInMs > 7 * 24 * 60 * 60 * 1000) stats.filesOlderThan7d++
      if (image.status === 'expired') stats.expiredFiles++

      // 檔案分析
      if (!stats.largestFile || image.metadata.size > stats.largestFile.size) {
        stats.largestFile = { name: image.metadata.originalName, size: image.metadata.size }
      }

      if (!stats.mostAccessedFile || image.accessCount > stats.mostAccessedFile.accessCount) {
        stats.mostAccessedFile = {
          name: image.metadata.originalName,
          accessCount: image.accessCount,
        }
      }

      // 類型分析
      const fileType = image.metadata.type || 'unknown'
      stats.fileTypeBreakdown[fileType] = (stats.fileTypeBreakdown[fileType] || 0) + 1

      // 記憶體分數
      totalMemoryScore += image.memoryScore

      // 壓縮比計算（如果有原始大小資訊）
      if (image.metadata.compressionRatio) {
        totalOriginalSize += image.metadata.size / image.metadata.compressionRatio
      }

      // 檢查孤立檔案（超過24小時未存取且狀態為pending）
      if (
        ageInMs > 24 * 60 * 60 * 1000 &&
        now - image.lastAccessed > 24 * 60 * 60 * 1000 &&
        image.status === 'pending'
      ) {
        stats.orphanedFiles++
      }
    }

    // 計算記憶體使用率和平均值
    const memoryUsage = this.getMemoryUsage()
    stats.memoryUsageRatio = memoryUsage.usageRatio
    stats.averageMemoryScore = stats.memoryFiles > 0 ? totalMemoryScore / stats.memoryFiles : 0

    // 計算平均檔案年齡
    if (stats.memoryFiles > 0) {
      const totalAge = Array.from(this.memoryCache.values()).reduce(
        (sum, image) => sum + (now - image.timestamp),
        0
      )
      stats.averageAge = totalAge / stats.memoryFiles
    }

    // 計算壓縮比
    if (totalOriginalSize > 0) {
      stats.compressionRatio = stats.memorySize / totalOriginalSize
    }
  }

  /**
   * 計算資料庫統計
   */
  private async calculateDBStats(stats: CacheStats): Promise<void> {
    const dbStats = await this.getDBStats()
    stats.dbFiles = dbStats.count
    stats.dbSize = dbStats.size
    stats.oldestTimestamp = Math.min(stats.oldestTimestamp, dbStats.oldestTimestamp)
    stats.newestTimestamp = Math.max(stats.newestTimestamp, dbStats.newestTimestamp)
  }

  /**
   * 計算衍生統計
   */
  private calculateDerivedStats(stats: CacheStats, now: number): void {
    // 總計
    stats.totalFiles = stats.memoryFiles + stats.dbFiles
    stats.totalSize = stats.memorySize + stats.dbSize

    // 平均檔案大小
    stats.averageFileSize = stats.totalFiles > 0 ? stats.totalSize / stats.totalFiles : 0

    // 快取命中率
    const totalRequests = this.cacheHits + this.cacheMisses
    stats.cacheHitRate = totalRequests > 0 ? this.cacheHits / totalRequests : 0

    // 上傳成功率
    const totalUploads = this.uploadSuccesses + this.uploadFailures
    stats.uploadSuccessRate = totalUploads > 0 ? this.uploadSuccesses / totalUploads : 0

    // 平均處理時間
    if (this.processingTimes.length > 0) {
      const recentTimes = this.processingTimes.slice(-100) // 只考慮最近100次
      stats.averageProcessingTime =
        recentTimes.reduce((sum, time) => sum + time, 0) / recentTimes.length
    }

    // 清理頻率（每小時清理次數）
    const recentCleanups = this.cleanupHistory.filter(time => now - time < 24 * 60 * 60 * 1000) // 24小時內
    stats.cleanupFrequency = recentCleanups.length / 24 // 每小時平均清理次數
  }

  /**
   * 計算系統資源統計
   */
  private async calculateSystemResourceStats(stats: CacheStats): Promise<void> {
    if ('storage' in navigator && 'estimate' in navigator.storage) {
      try {
        const estimate = await navigator.storage.estimate()
        stats.indexedDBQuota = estimate.quota || 0
        stats.indexedDBUsed = estimate.usage || 0
        stats.indexedDBAvailable = Math.max(0, stats.indexedDBQuota - stats.indexedDBUsed)
      } catch (error) {
        logger.warn('無法取得儲存配額資訊', {
          module: 'LocalImageCache',
          metadata: { error: (error as Error).message },
        })
      }
    }
  }

  /**
   * 獲取基礎統計（後備方案）
   */
  private getBasicStats(): CacheStats {
    const memoryUsage = this.getMemoryUsage()

    return {
      // 基礎統計
      totalFiles: memoryUsage.totalFiles,
      totalSize: memoryUsage.totalSize,
      memoryFiles: memoryUsage.totalFiles,
      memorySize: memoryUsage.totalSize,
      dbFiles: 0,
      dbSize: 0,
      oldestTimestamp: Date.now(),
      newestTimestamp: 0,

      // 狀態分析
      statusBreakdown: {
        pending: 0,
        uploading: 0,
        uploaded: 0,
        failed: 0,
        expired: 0,
      },
      priorityBreakdown: {
        low: 0,
        normal: 0,
        high: 0,
        critical: 0,
      },

      // 記憶體管理
      memoryUsageRatio: memoryUsage.usageRatio,
      memoryPressureLevel: this.memoryPressureLevel,
      averageFileSize:
        memoryUsage.totalFiles > 0 ? memoryUsage.totalSize / memoryUsage.totalFiles : 0,
      averageMemoryScore: 0,

      // 效能指標
      cacheHitRate: 0,
      uploadSuccessRate: 0,
      averageProcessingTime: 0,
      lastCleanupTime: this.lastCleanupTime,
      cleanupFrequency: 0,

      // 檔案分析
      largestFile: null,
      mostAccessedFile: null,
      expiredFiles: 0,
      orphanedFiles: 0,

      // 時間統計
      averageAge: 0,
      filesOlderThan24h: 0,
      filesOlderThan7d: 0,

      // 類型分析
      fileTypeBreakdown: {},
      compressionRatio: 0,

      // 系統資源
      indexedDBQuota: 0,
      indexedDBUsed: 0,
      indexedDBAvailable: 0,
    }
  }

  /**
   * 更新快取命中統計
   */
  recordCacheHit(): void {
    this.cacheHits++
  }

  /**
   * 更新快取未命中統計
   */
  recordCacheMiss(): void {
    this.cacheMisses++
  }

  /**
   * 記錄上傳成功
   */
  recordUploadSuccess(): void {
    this.uploadSuccesses++
  }

  /**
   * 記錄上傳失敗
   */
  recordUploadFailure(): void {
    this.uploadFailures++
  }

  /**
   * 記錄處理時間
   */
  recordProcessingTime(duration: number): void {
    this.processingTimes.push(duration)
    // 只保留最近 200 筆記錄
    if (this.processingTimes.length > 200) {
      this.processingTimes = this.processingTimes.slice(-200)
    }
  }

  /**
   * 記錄清理事件
   */
  recordCleanupEvent(): void {
    this.cleanupHistory.push(Date.now())
    // 只保留最近 7 天的記錄
    const cutoff = Date.now() - 7 * 24 * 60 * 60 * 1000
    this.cleanupHistory = this.cleanupHistory.filter(time => time > cutoff)
  }

  /**
   * 獲取快取統計摘要（輕量級版本）
   */
  getStatsSummary(): {
    files: number
    sizeMB: number
    memoryUsage: string
    cacheHitRate: string
    uploadSuccessRate: string
    lastCleanup: string
  } {
    const memoryUsage = this.getMemoryUsage()
    const totalRequests = this.cacheHits + this.cacheMisses
    const totalUploads = this.uploadSuccesses + this.uploadFailures

    return {
      files: memoryUsage.totalFiles,
      sizeMB: Math.round((memoryUsage.totalSize / 1024 / 1024) * 100) / 100,
      memoryUsage: `${Math.round(memoryUsage.usageRatio * 100)}%`,
      cacheHitRate:
        totalRequests > 0 ? `${Math.round((this.cacheHits / totalRequests) * 100)}%` : '0%',
      uploadSuccessRate:
        totalUploads > 0 ? `${Math.round((this.uploadSuccesses / totalUploads) * 100)}%` : '0%',
      lastCleanup:
        this.lastCleanupTime > 0
          ? `${Math.round((Date.now() - this.lastCleanupTime) / (1000 * 60))} 分鐘前`
          : '從未',
    }
  }

  /**
   * 檢查快取健康狀況
   */
  getCacheHealthStatus(): {
    status: 'excellent' | 'good' | 'warning' | 'critical'
    issues: string[]
    recommendations: string[]
  } {
    const issues: string[] = []
    const recommendations: string[] = []
    const memoryUsage = this.getMemoryUsage()
    const totalRequests = this.cacheHits + this.cacheMisses
    const cacheHitRate = totalRequests > 0 ? this.cacheHits / totalRequests : 0

    // 檢查記憶體使用狀況
    if (memoryUsage.usageRatio >= this.MEMORY_CRITICAL_THRESHOLD) {
      issues.push('記憶體使用率過高 (>95%)')
      recommendations.push('立即執行清理作業')
    } else if (memoryUsage.usageRatio >= this.MEMORY_WARNING_THRESHOLD) {
      issues.push('記憶體使用率偏高 (>80%)')
      recommendations.push('考慮執行清理作業')
    }

    // 檢查快取命中率
    if (cacheHitRate < 0.5 && totalRequests > 10) {
      issues.push(`快取命中率偏低 (${Math.round(cacheHitRate * 100)}%)`)
      recommendations.push('檢查快取策略和檔案存取模式')
    }

    // 檢查清理頻率
    const hoursSinceCleanup = (Date.now() - this.lastCleanupTime) / (1000 * 60 * 60)
    if (hoursSinceCleanup > 24 && memoryUsage.totalFiles > 5) {
      issues.push('超過 24 小時未進行清理')
      recommendations.push('定期執行清理以維持效能')
    }

    // 檢查過期檔案數量（估算）
    const now = Date.now()
    const expiredCount = Array.from(this.memoryCache.values()).filter(
      image => now - image.timestamp > 24 * 60 * 60 * 1000 || image.status === 'expired'
    ).length

    if (expiredCount > memoryUsage.totalFiles * 0.3) {
      issues.push(`較多過期檔案 (${expiredCount}/${memoryUsage.totalFiles})`)
      recommendations.push('清理過期檔案以釋放空間')
    }

    // 判斷整體健康狀況
    let status: 'excellent' | 'good' | 'warning' | 'critical'
    if (issues.length === 0 && cacheHitRate > 0.8) {
      status = 'excellent'
    } else if (issues.length <= 1 && !issues.some(issue => issue.includes('過高'))) {
      status = 'good'
    } else if (issues.some(issue => issue.includes('過高') || issue.includes('偏低'))) {
      status = 'warning'
    } else {
      status = 'critical'
    }

    return { status, issues, recommendations }
  }

  /**
   * 更新檔案狀態
   */
  async updateFileStatus(id: string, status: CacheStatus): Promise<void> {
    // 更新記憶體快取
    if (this.memoryCache.has(id)) {
      const image = this.memoryCache.get(id)!
      image.status = status
      this.memoryCache.set(id, image)
    }

    // 更新 IndexedDB
    if (this.db) {
      await this.updateStatusInDB(id, status)
    }

    logger.debug('更新檔案狀態', {
      module: 'LocalImageCache',
      metadata: { fileId: id, status },
    })
  }

  // ========== 私有方法 ==========

  /**
   * 生成唯一 ID
   */
  private generateId(): string {
    return `cache_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  /**
   * 提取圖片元數據
   * 包含基本資訊、EXIF 數據、色彩分析等完整元數據
   */
  private async extractMetadata(processedFile: File, originalFile: File): Promise<ImageMetadata> {
    const timer = logger.timer('圖片元數據提取')

    try {
      // 並行執行多個元數據提取任務
      const [basicMetadata, exifData, colorAnalysis, fileAnalysis] = await Promise.allSettled([
        this.extractBasicMetadata(processedFile, originalFile),
        this.extractExifData(processedFile),
        this.extractColorAnalysis(processedFile),
        this.extractFileAnalysis(processedFile, originalFile),
      ])

      // 合併所有元數據
      const baseMetadata = this.getSettledValue(
        basicMetadata,
        this.createFallbackBasicMetadata(processedFile, originalFile)
      )
      const exif = this.getSettledValue(exifData, undefined)
      const colorData = this.getSettledValue(colorAnalysis, {})
      const fileData = this.getSettledValue(fileAnalysis, {})

      const metadata: ImageMetadata = {
        ...baseMetadata,
        exif,
        ...colorData,
        ...fileData,
      }

      timer.end({
        metadata: {
          fileName: originalFile.name,
          fileSize: processedFile.size,
          dimensions: `${metadata.dimensions.width}x${metadata.dimensions.height}`,
          hasExif: !!metadata.exif,
          hasColorAnalysis: !!metadata.dominantColors,
        },
      })

      logger.debug('圖片元數據提取完成', {
        module: 'LocalImageCache',
        metadata: {
          fileName: metadata.originalName,
          dimensions: metadata.dimensions,
          aspectRatio: metadata.aspectRatio,
          hasAlpha: metadata.hasAlpha,
          compressionRatio: metadata.compressionRatio,
          exifFields: metadata.exif ? Object.keys(metadata.exif).length : 0,
        },
      })

      return metadata
    } catch (error) {
      timer.end()
      logger.error('圖片元數據提取失敗', error as Error, {
        module: 'LocalImageCache',
        action: 'extractMetadata',
        metadata: {
          fileName: originalFile.name,
          fileSize: processedFile.size,
        },
      })

      // 返回基本後備元數據
      return this.createFallbackBasicMetadata(processedFile, originalFile)
    }
  }

  /**
   * 提取基本圖片元數據
   */
  private async extractBasicMetadata(
    processedFile: File,
    originalFile: File
  ): Promise<ImageMetadata> {
    return new Promise((resolve, reject) => {
      const img = new Image()
      const reader = new FileReader()

      reader.onload = () => {
        img.onload = () => {
          const aspectRatio = img.width / img.height

          resolve({
            originalName: originalFile.name,
            size: processedFile.size,
            type: processedFile.type,
            dimensions: { width: img.width, height: img.height },
            checksum: this.calculateAdvancedChecksum(processedFile),
            compressionRatio: originalFile.size / processedFile.size,
            aspectRatio,
            lastModified: originalFile.lastModified,
            estimatedLoadTime: this.estimateLoadTime(processedFile.size),
            isAnimated: this.detectAnimatedFormat(processedFile.type),
            encoding: this.detectEncoding(processedFile.type),
          })
        }

        img.onerror = () => {
          reject(new Error('無法載入圖片進行基本分析'))
        }

        img.src = reader.result as string
      }

      reader.onerror = () => {
        reject(new Error('FileReader 讀取失敗'))
      }

      reader.readAsDataURL(processedFile)
    })
  }

  /**
   * 提取 EXIF 數據
   */
  private async extractExifData(file: File): Promise<ExifData | undefined> {
    // 只有 JPEG 和 TIFF 格式可能包含 EXIF
    if (!['image/jpeg', 'image/jpg', 'image/tiff'].includes(file.type)) {
      return undefined
    }

    return new Promise(resolve => {
      const reader = new FileReader()

      reader.onload = () => {
        try {
          const arrayBuffer = reader.result as ArrayBuffer
          const exifData = this.parseExifData(new Uint8Array(arrayBuffer))
          resolve(exifData)
        } catch (error) {
          logger.debug('EXIF 數據解析失敗', {
            module: 'LocalImageCache',
            metadata: {
              fileName: file.name,
              error: (error as Error).message,
            },
          })
          resolve(undefined)
        }
      }

      reader.onerror = () => resolve(undefined)
      reader.readAsArrayBuffer(file.slice(0, 64 * 1024)) // 只讀取前 64KB，EXIF 通常在檔案開頭
    })
  }

  /**
   * 色彩分析
   */
  private async extractColorAnalysis(file: File): Promise<Partial<ImageMetadata>> {
    return new Promise(resolve => {
      const img = new Image()
      const canvas = document.createElement('canvas')
      const ctx = canvas.getContext('2d')

      if (!ctx) {
        resolve({})
        return
      }

      img.onload = () => {
        try {
          // 使用小尺寸進行色彩分析以提升效能
          const maxSize = 100
          const scale = Math.min(maxSize / img.width, maxSize / img.height)
          canvas.width = Math.floor(img.width * scale)
          canvas.height = Math.floor(img.height * scale)

          ctx.drawImage(img, 0, 0, canvas.width, canvas.height)

          const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
          const analysis = this.analyzeImageColors(imageData)

          resolve({
            hasAlpha: analysis.hasAlpha,
            dominantColors: analysis.dominantColors,
            averageBrightness: analysis.averageBrightness,
            colorDepth: analysis.colorDepth,
          })
        } catch (error) {
          logger.debug('色彩分析失敗', {
            module: 'LocalImageCache',
            metadata: {
              fileName: file.name,
              error: (error as Error).message,
            },
          })
          resolve({})
        }
      }

      img.onerror = () => resolve({})
      img.src = URL.createObjectURL(file)
    })
  }

  /**
   * 檔案分析
   */
  private async extractFileAnalysis(
    processedFile: File,
    originalFile: File
  ): Promise<Partial<ImageMetadata>> {
    return {
      quality: this.estimateImageQuality(processedFile, originalFile),
      frameCount: await this.detectFrameCount(processedFile),
    }
  }

  /**
   * 解析 EXIF 數據（簡化版本）
   */
  private parseExifData(uint8Array: Uint8Array): ExifData | undefined {
    try {
      // 檢查是否為 JPEG 格式
      if (uint8Array[0] !== 0xff || uint8Array[1] !== 0xd8) {
        return undefined
      }

      // 簡化的 EXIF 解析（只提取基本資訊）
      let offset = 2
      const exifData: ExifData = {}

      // 尋找 EXIF 標記
      while (offset < uint8Array.length - 3) {
        if (uint8Array[offset] === 0xff && uint8Array[offset + 1] === 0xe1) {
          // 找到 EXIF 區段
          const exifLength = (uint8Array[offset + 2] << 8) | uint8Array[offset + 3]
          const exifBuffer = uint8Array.slice(offset + 4, offset + 4 + exifLength)

          // 檢查 EXIF 標識符
          const exifHeader = String.fromCharCode(...Array.from(exifBuffer.slice(0, 4)))
          if (exifHeader === 'Exif') {
            // 簡單解析一些基本 EXIF 標籤
            exifData.raw = { detected: true }

            // 檢測相機資訊（簡化版本）
            const dataString = String.fromCharCode(
              ...Array.from(exifBuffer.slice(6, Math.min(exifBuffer.length, 200)))
            )
            if (dataString.includes('Canon')) exifData.camera = 'Canon'
            else if (dataString.includes('Nikon')) exifData.camera = 'Nikon'
            else if (dataString.includes('Sony')) exifData.camera = 'Sony'
            else if (dataString.includes('Apple')) exifData.camera = 'Apple'

            // 檢測方向資訊
            if (exifBuffer.length > 20) {
              exifData.orientation = this.extractOrientation(exifBuffer)
            }
          }
          break
        }
        offset++
      }

      return Object.keys(exifData).length > 0 ? exifData : undefined
    } catch (error) {
      return undefined
    }
  }

  /**
   * 色彩分析演算法
   */
  private analyzeImageColors(imageData: ImageData): {
    hasAlpha: boolean
    dominantColors: string[]
    averageBrightness: number
    colorDepth: number
  } {
    const data = imageData.data
    const pixels = data.length / 4
    let hasAlpha = false
    let totalBrightness = 0
    const colorMap = new Map<string, number>()
    const uniqueColors = new Set<string>()

    for (let i = 0; i < data.length; i += 4) {
      const r = data[i]
      const g = data[i + 1]
      const b = data[i + 2]
      const a = data[i + 3]

      if (a < 255) hasAlpha = true

      // 計算亮度
      const brightness = r * 0.299 + g * 0.587 + b * 0.114
      totalBrightness += brightness

      // 色彩量化（減少顏色數量以找到主要色彩）
      const quantizedR = Math.floor(r / 32) * 32
      const quantizedG = Math.floor(g / 32) * 32
      const quantizedB = Math.floor(b / 32) * 32
      const colorKey = `${quantizedR},${quantizedG},${quantizedB}`

      colorMap.set(colorKey, (colorMap.get(colorKey) || 0) + 1)
      uniqueColors.add(`${r},${g},${b}`)
    }

    // 找出最常見的顏色
    const sortedColors = Array.from(colorMap.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([color]) => {
        const [r, g, b] = color.split(',').map(Number)
        return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`
      })

    return {
      hasAlpha,
      dominantColors: sortedColors,
      averageBrightness: Math.round(totalBrightness / pixels),
      colorDepth: Math.min(Math.log2(uniqueColors.size), 24), // 估算色彩深度
    }
  }

  /**
   * 輔助方法
   */
  private getSettledValue<T>(result: PromiseSettledResult<T>, fallback: T): T {
    return result.status === 'fulfilled' ? result.value : fallback
  }

  private createFallbackBasicMetadata(processedFile: File, originalFile: File): ImageMetadata {
    return {
      originalName: originalFile.name,
      size: processedFile.size,
      type: processedFile.type,
      dimensions: { width: 0, height: 0 },
      checksum: this.calculateSimpleChecksum(originalFile.name + originalFile.size),
      compressionRatio: originalFile.size / processedFile.size,
      aspectRatio: 1,
      lastModified: originalFile.lastModified,
      estimatedLoadTime: this.estimateLoadTime(processedFile.size),
      isAnimated: this.detectAnimatedFormat(processedFile.type),
      encoding: this.detectEncoding(processedFile.type),
    }
  }

  private calculateAdvancedChecksum(file: File): string {
    // 基於檔案名、大小、修改時間和類型的更安全校驗碼
    const input = `${file.name}:${file.size}:${file.lastModified}:${file.type}`
    let hash = 0
    for (let i = 0; i < input.length; i++) {
      const char = input.charCodeAt(i)
      hash = (hash << 5) - hash + char
      hash = hash & hash // 轉換為32位整數
    }
    // 添加時間戳確保唯一性
    return `${hash.toString(36)}_${Date.now().toString(36)}`
  }

  private estimateLoadTime(sizeInBytes: number): number {
    // 基於檔案大小估算載入時間（假設網速為 1 Mbps）
    const bytesPerSecond = 125000 // 1 Mbps = 125 KB/s
    return Math.ceil((sizeInBytes / bytesPerSecond) * 1000) // 毫秒
  }

  private detectAnimatedFormat(type: string): boolean {
    return type === 'image/gif' || type === 'image/webp' // WebP 可能是動畫
  }

  private detectEncoding(type: string): string {
    const encodingMap: Record<string, string> = {
      'image/jpeg': 'JPEG',
      'image/jpg': 'JPEG',
      'image/png': 'PNG',
      'image/webp': 'WebP',
      'image/avif': 'AVIF',
      'image/gif': 'GIF',
    }
    return encodingMap[type] || 'Unknown'
  }

  private estimateImageQuality(processedFile: File, originalFile: File): number {
    // 基於壓縮比估算圖片品質
    const compressionRatio = originalFile.size / processedFile.size
    if (compressionRatio >= 3) return 60 // 高壓縮
    if (compressionRatio >= 2) return 75 // 中壓縮
    if (compressionRatio >= 1.5) return 85 // 低壓縮
    return 95 // 很少或無壓縮
  }

  private async detectFrameCount(file: File): Promise<number | undefined> {
    // 簡化版本：只檢測 GIF 是否可能是多幀動畫
    if (file.type === 'image/gif') {
      return new Promise(resolve => {
        const reader = new FileReader()
        reader.onload = () => {
          const buffer = reader.result as ArrayBuffer
          const uint8Array = new Uint8Array(buffer)
          // 簡單檢測 GIF 中的幀分隔符
          let frameCount = 0
          for (let i = 0; i < uint8Array.length - 1; i++) {
            if (uint8Array[i] === 0x21 && uint8Array[i + 1] === 0xf9) {
              frameCount++
            }
          }
          resolve(frameCount > 1 ? frameCount : 1)
        }
        reader.onerror = () => resolve(1)
        reader.readAsArrayBuffer(file.slice(0, Math.min(file.size, 10 * 1024))) // 只讀前 10KB
      })
    }
    return undefined
  }

  private extractOrientation(exifBuffer: Uint8Array): number {
    // 簡化的方向檢測（EXIF 標籤 0x0112）
    try {
      // 尋找方向標籤的簡化邏輯
      for (let i = 0; i < exifBuffer.length - 12; i++) {
        if (exifBuffer[i] === 0x01 && exifBuffer[i + 1] === 0x12) {
          // 找到方向標籤，返回值通常在後面幾個位元組
          return exifBuffer[i + 8] || 1
        }
      }
    } catch (error) {
      // 忽略解析錯誤
    }
    return 1 // 預設值
  }

  /**
   * 生成預覽圖（增強版）
   * 支援多種格式、品質設定、影像增強等功能
   */
  private async generatePreview(file: File, options?: PreviewOptions): Promise<string> {
    const timer = logger.timer('預覽圖生成')

    // 預設選項
    const opts: Required<PreviewOptions> = {
      maxWidth: options?.maxWidth || this.MAX_PREVIEW_WIDTH,
      maxHeight: options?.maxHeight || this.MAX_PREVIEW_HEIGHT,
      quality: options?.quality || 0.85,
      format: options?.format || 'webp',
      enableSharpening: options?.enableSharpening || false,
      enableColorCorrection: options?.enableColorCorrection || false,
    }

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
          // 計算最佳縮放比例
          const scale = Math.min(
            opts.maxWidth / img.width,
            opts.maxHeight / img.height,
            1 // 不放大圖片
          )

          const targetWidth = Math.floor(img.width * scale)
          const targetHeight = Math.floor(img.height * scale)

          canvas.width = targetWidth
          canvas.height = targetHeight

          // 設定高品質渲染
          ctx.imageSmoothingEnabled = true
          ctx.imageSmoothingQuality = 'high'

          // 色彩校正（可選）
          if (opts.enableColorCorrection) {
            this.applyColorCorrection(ctx, targetWidth, targetHeight)
          }

          // 繪製圖片
          ctx.drawImage(img, 0, 0, targetWidth, targetHeight)

          // 銳化處理（可選）
          if (opts.enableSharpening && scale < 0.8) {
            this.applySharpeningFilter(ctx, targetWidth, targetHeight)
          }

          // 決定輸出格式和品質
          const outputFormat = this.getOutputMimeType(opts.format)
          const outputQuality = this.adjustQualityBySize(opts.quality, targetWidth * targetHeight)

          // 轉換為 Blob URL
          canvas.toBlob(
            blob => {
              timer.end({
                metadata: {
                  originalSize: `${img.width}x${img.height}`,
                  previewSize: `${targetWidth}x${targetHeight}`,
                  scale: Math.round(scale * 100) / 100,
                  format: opts.format,
                  quality: outputQuality,
                  blobSize: blob?.size || 0,
                },
              })

              if (blob) {
                const url = URL.createObjectURL(blob)

                logger.debug('預覽圖生成成功', {
                  module: 'LocalImageCache',
                  metadata: {
                    fileName: file.name,
                    originalSize: file.size,
                    previewSize: blob.size,
                    dimensions: `${targetWidth}x${targetHeight}`,
                    compressionRatio: Math.round((file.size / blob.size) * 100) / 100,
                    format: opts.format,
                  },
                })

                resolve(url)
              } else {
                // Blob 轉換失敗，使用後備方案
                logger.warn('預覽圖 Blob 轉換失敗，使用原檔案', {
                  module: 'LocalImageCache',
                  metadata: { fileName: file.name },
                })
                resolve(URL.createObjectURL(file))
              }
            },
            outputFormat,
            outputQuality
          )
        } catch (error) {
          timer.end()
          logger.error('預覽圖生成過程中發生錯誤', error as Error, {
            module: 'LocalImageCache',
            action: 'generatePreview',
            metadata: {
              fileName: file.name,
              options: opts,
            },
          })

          // 錯誤時使用原檔案
          resolve(URL.createObjectURL(file))
        }
      }

      img.onerror = error => {
        timer.end()
        logger.error('預覽圖載入失敗', new Error('Image load failed'), {
          module: 'LocalImageCache',
          action: 'generatePreview',
          metadata: {
            fileName: file.name,
            error: error,
          },
        })

        // 載入失敗時使用原檔案
        resolve(URL.createObjectURL(file))
      }

      // 設定 CORS 和快取策略
      img.crossOrigin = 'anonymous'
      img.decoding = 'async'
      img.src = URL.createObjectURL(file)
    })
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
   * 根據圖片大小調整品質
   */
  private adjustQualityBySize(baseQuality: number, pixels: number): number {
    // 大圖片使用稍低品質以節省空間
    if (pixels > 500 * 500) {
      return Math.max(baseQuality - 0.1, 0.6)
    }
    if (pixels > 200 * 200) {
      return Math.max(baseQuality - 0.05, 0.7)
    }
    return baseQuality
  }

  /**
   * 應用色彩校正
   */
  private applyColorCorrection(ctx: CanvasRenderingContext2D, width: number, height: number): void {
    // 簡單的色彩增強 - 增加對比度和飽和度
    ctx.filter = 'contrast(1.1) saturate(1.05)'
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

      // 簡化的銳化核心 (3x3)
      const kernel = [0, -0.25, 0, -0.25, 2, -0.25, 0, -0.25, 0]

      for (let y = 1; y < height - 1; y++) {
        for (let x = 1; x < width - 1; x++) {
          const idx = (y * width + x) * 4

          for (let c = 0; c < 3; c++) {
            // RGB, 跳過 Alpha
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

      ctx.putImageData(new ImageData(newData, width, height), 0, 0)
    } catch (error) {
      logger.debug('銳化濾鏡應用失敗', {
        module: 'LocalImageCache',
        metadata: { error: (error as Error).message },
      })
    }
  }

  /**
   * 生成縮圖
   */
  private async generateThumbnail(file: File, options?: ThumbnailOptions): Promise<string> {
    const timer = logger.timer('生成縮圖')

    try {
      // 設定預設選項
      const config = {
        size: options?.size || this.THUMBNAIL_SIZE,
        quality: options?.quality || 0.85,
        format: options?.format || ('webp' as const),
        crop: options?.crop || ('center' as const),
      }

      return await new Promise<string>((resolve, reject) => {
        const canvas = document.createElement('canvas')
        const ctx = canvas.getContext('2d')
        const img = new Image()

        if (!ctx) {
          reject(new Error('無法建立 Canvas 2D context'))
          return
        }

        img.onload = () => {
          try {
            // 設定畫布尺寸
            canvas.width = config.size
            canvas.height = config.size

            // 計算繪製區域
            const { drawParams } = this.calculateThumbnailDimensions(
              img.width,
              img.height,
              config.size,
              config.crop
            )

            // 啟用高品質縮放
            ctx.imageSmoothingEnabled = true
            ctx.imageSmoothingQuality = 'high'

            // 繪製縮圖
            ctx.drawImage(
              img,
              drawParams.sx,
              drawParams.sy,
              drawParams.sWidth,
              drawParams.sHeight,
              drawParams.dx,
              drawParams.dy,
              drawParams.dWidth,
              drawParams.dHeight
            )

            // 轉換為 Blob URL
            canvas.toBlob(
              blob => {
                if (blob) {
                  const url = URL.createObjectURL(blob)
                  timer.end({
                    metadata: {
                      size: config.size,
                      format: config.format,
                      originalSize: `${img.width}x${img.height}`,
                      blobSize: blob.size,
                    },
                  })
                  resolve(url)
                } else {
                  // 後備：返回原始檔案的 Blob URL
                  const fallbackUrl = URL.createObjectURL(file)
                  timer.end({ metadata: { fallback: true } })
                  resolve(fallbackUrl)
                }
              },
              config.format === 'webp'
                ? 'image/webp'
                : config.format === 'jpeg'
                  ? 'image/jpeg'
                  : 'image/png',
              config.quality
            )
          } catch (error) {
            timer.end()
            logger.error('縮圖繪製失敗', error as Error, {
              module: 'LocalImageCache',
              action: 'generateThumbnail',
              metadata: {
                fileName: file.name,
                imageSize: `${img.width}x${img.height}`,
                config,
              },
            })
            // 後備：返回原始檔案的 Blob URL
            resolve(URL.createObjectURL(file))
          }
        }

        img.onerror = error => {
          timer.end()
          logger.error('圖片載入失敗', new Error('Image load failed'), {
            module: 'LocalImageCache',
            action: 'generateThumbnail',
            metadata: { fileName: file.name, fileType: file.type },
          })
          // 後備：返回原始檔案的 Blob URL
          resolve(URL.createObjectURL(file))
        }

        // 設定圖片來源
        img.src = URL.createObjectURL(file)
      })
    } catch (error) {
      timer.end()
      logger.error('縮圖生成失敗', error as Error, {
        module: 'LocalImageCache',
        action: 'generateThumbnail',
        metadata: { fileName: file.name },
      })

      // 最終後備：返回原始檔案的 Blob URL
      return URL.createObjectURL(file)
    }
  }

  /**
   * 計算縮圖繪製參數
   */
  private calculateThumbnailDimensions(
    imgWidth: number,
    imgHeight: number,
    targetSize: number,
    crop: 'center' | 'top' | 'bottom' | 'left' | 'right' | 'cover' | 'contain'
  ) {
    if (crop === 'contain') {
      // 完整顯示，可能有留白
      const scale = Math.min(targetSize / imgWidth, targetSize / imgHeight)
      const scaledWidth = imgWidth * scale
      const scaledHeight = imgHeight * scale

      return {
        drawParams: {
          sx: 0,
          sy: 0,
          sWidth: imgWidth,
          sHeight: imgHeight,
          dx: (targetSize - scaledWidth) / 2,
          dy: (targetSize - scaledHeight) / 2,
          dWidth: scaledWidth,
          dHeight: scaledHeight,
        },
      }
    }

    // Cover 模式（預設）：填滿整個區域，可能裁切
    const scale = Math.max(targetSize / imgWidth, targetSize / imgHeight)
    const scaledWidth = imgWidth * scale
    const scaledHeight = imgHeight * scale

    let sx = 0,
      sy = 0,
      sWidth = imgWidth,
      sHeight = imgHeight

    // 計算裁切區域
    if (scaledWidth > targetSize) {
      const cropWidth = targetSize / scale
      switch (crop) {
        case 'left':
          sx = 0
          break
        case 'right':
          sx = imgWidth - cropWidth
          break
        case 'center':
        default:
          sx = (imgWidth - cropWidth) / 2
          break
      }
      sWidth = cropWidth
    }

    if (scaledHeight > targetSize) {
      const cropHeight = targetSize / scale
      switch (crop) {
        case 'top':
          sy = 0
          break
        case 'bottom':
          sy = imgHeight - cropHeight
          break
        case 'center':
        default:
          sy = (imgHeight - cropHeight) / 2
          break
      }
      sHeight = cropHeight
    }

    return {
      drawParams: {
        sx,
        sy,
        sWidth,
        sHeight,
        dx: 0,
        dy: 0,
        dWidth: targetSize,
        dHeight: targetSize,
      },
    }
  }

  /**
   * 生成多種尺寸的縮圖
   */
  async generateMultipleThumbnails(
    file: File,
    sizes: { name: string; size: number; options?: Partial<ThumbnailOptions> }[]
  ): Promise<Record<string, string>> {
    const results: Record<string, string> = {}

    // 使用 Promise.allSettled 並行生成多個縮圖
    const thumbnailPromises = sizes.map(async ({ name, size, options }) => {
      try {
        const thumbnailOptions: ThumbnailOptions = {
          size,
          quality: 0.85,
          format: 'webp',
          crop: 'center',
          ...options,
        }

        const url = await this.generateThumbnail(file, thumbnailOptions)
        return { name, url }
      } catch (error) {
        logger.warn('生成特定尺寸縮圖失敗', {
          module: 'LocalImageCache',
          metadata: {
            fileName: file.name,
            thumbnailName: name,
            size,
            error: (error as Error).message,
          },
        })
        return { name, url: URL.createObjectURL(file) }
      }
    })

    const thumbnailResults = await Promise.allSettled(thumbnailPromises)

    thumbnailResults.forEach(result => {
      if (result.status === 'fulfilled') {
        results[result.value.name] = result.value.url
      }
    })

    return results
  }

  /**
   * 預設縮圖尺寸設定
   */
  static readonly STANDARD_THUMBNAIL_SIZES = {
    small: { name: 'small', size: 100, options: { quality: 0.8 } },
    medium: { name: 'medium', size: 200, options: { quality: 0.85 } },
    large: { name: 'large', size: 300, options: { quality: 0.9 } },
  } as const

  /**
   * 生成標準尺寸縮圖集
   */
  async generateStandardThumbnails(file: File): Promise<Record<string, string>> {
    const sizes = Object.values(LocalImageCache.STANDARD_THUMBNAIL_SIZES)
    return await this.generateMultipleThumbnails(file, sizes)
  }

  /**
   * 計算簡單校驗碼
   */
  private calculateSimpleChecksum(input: string): string {
    let hash = 0
    for (let i = 0; i < input.length; i++) {
      const char = input.charCodeAt(i)
      hash = (hash << 5) - hash + char
      hash = hash & hash // 轉換為32位整數
    }
    return hash.toString(36)
  }

  /**
   * 儲存到記憶體快取
   */
  private storeInMemory(cachedImage: CachedImage): void {
    const memoryUsage = this.getMemoryUsage()

    // 更新記憶體壓力等級
    this.updateMemoryPressureLevel(memoryUsage.usageRatio)

    // 檢查是否需要清理記憶體
    if (memoryUsage.totalSize + cachedImage.metadata.size > this.MEMORY_LIMIT) {
      this.performMemoryCleanup(cachedImage.metadata.size)
    }

    // 儲存到記憶體快取
    this.memoryCache.set(cachedImage.id, cachedImage)

    // 記錄儲存資訊
    const newUsage = this.getMemoryUsage()
    logger.debug('檔案儲存到記憶體快取', {
      module: 'LocalImageCache',
      metadata: {
        fileId: cachedImage.id,
        fileName: cachedImage.metadata.originalName,
        fileSize: cachedImage.metadata.size,
        priority: cachedImage.priority,
        memoryScore: cachedImage.memoryScore,
        usageRatio: newUsage.usageRatio,
        totalFiles: newUsage.totalFiles,
      },
    })
  }

  /**
   * 執行記憶體清理
   */
  private performMemoryCleanup(incomingFileSize: number): void {
    const timer = logger.timer('記憶體快取清理')
    const now = Date.now()

    // 避免頻繁清理
    if (now - this.lastCleanupTime < this.MIN_CLEANUP_INTERVAL) {
      return
    }

    this.lastCleanupTime = now
    let targetCleanupSize = incomingFileSize
    let cleanedCount = 0
    let cleanedSize = 0

    // 根據記憶體壓力等級決定清理策略
    if (this.memoryPressureLevel === 'critical') {
      targetCleanupSize = Math.max(incomingFileSize, this.MEMORY_LIMIT * 0.3) // 清理30%空間
    } else if (this.memoryPressureLevel === 'high') {
      targetCleanupSize = Math.max(incomingFileSize, this.MEMORY_LIMIT * 0.2) // 清理20%空間
    }

    // 獲取候選清理項目，按記憶體分數排序（分數越低越優先清理）
    const candidates = Array.from(this.memoryCache.entries())
      .map(([id, image]) => ({
        id,
        image,
        score: this.calculateCurrentMemoryScore(image),
      }))
      .sort((a, b) => a.score - b.score)

    // 執行批量清理
    for (const candidate of candidates) {
      if (cleanedSize >= targetCleanupSize && cleanedCount >= this.LRU_BATCH_SIZE) {
        break
      }

      // 不清理高優先權或最近使用的項目
      if (
        candidate.image.priority === 'critical' ||
        now - candidate.image.lastAccessed < 60 * 1000
      ) {
        // 1分鐘內使用過
        continue
      }

      // 執行清理
      this.removeFromMemoryOnly(candidate.id, candidate.image)
      cleanedSize += candidate.image.metadata.size
      cleanedCount++
    }

    timer.end({
      metadata: {
        cleanedCount,
        cleanedSize,
        targetCleanupSize,
        memoryPressureLevel: this.memoryPressureLevel,
        remainingFiles: this.memoryCache.size,
      },
    })

    logger.info('記憶體快取清理完成', {
      module: 'LocalImageCache',
      metadata: {
        cleanedCount,
        cleanedSizeMB: Math.round((cleanedSize / 1024 / 1024) * 100) / 100,
        targetSizeMB: Math.round((targetCleanupSize / 1024 / 1024) * 100) / 100,
        memoryPressureLevel: this.memoryPressureLevel,
        remainingFiles: this.memoryCache.size,
      },
    })
  }

  /**
   * 更新使用追蹤資訊
   */
  private updateAccessInfo(cachedImage: CachedImage): void {
    const now = Date.now()
    cachedImage.lastAccessed = now
    cachedImage.accessCount++
    cachedImage.memoryScore = this.calculateCurrentMemoryScore(cachedImage)
  }

  /**
   * 計算記憶體分數（分數越高越重要，越不容易被清理）
   */
  private calculateMemoryScore(fileSize: number, priority: Priority, timestamp: number): number {
    const now = Date.now()
    const age = now - timestamp

    // 基礎分數（檔案越小分數越高）
    let score = Math.max(100 - (fileSize / 1024 / 1024) * 10, 10) // 1MB = 10分扣分

    // 優先權加權
    const priorityWeight = {
      critical: 50,
      high: 30,
      normal: 0,
      low: -20,
    }
    score += priorityWeight[priority]

    // 時間衰減（新檔案分數更高）
    const hoursSinceCreated = age / (1000 * 60 * 60)
    score *= Math.exp(-hoursSinceCreated * 0.1) // 指數衰減

    return Math.max(score, 1)
  }

  /**
   * 計算當前記憶體分數（考慮使用頻率）
   */
  private calculateCurrentMemoryScore(cachedImage: CachedImage): number {
    const now = Date.now()
    const baseScore = this.calculateMemoryScore(
      cachedImage.metadata.size,
      cachedImage.priority,
      cachedImage.timestamp
    )

    // 使用頻率加權
    const accessFrequency =
      cachedImage.accessCount / Math.max((now - cachedImage.timestamp) / (1000 * 60 * 60), 1)
    const frequencyBonus = Math.min(accessFrequency * 10, 50)

    // 最近使用加權
    const timeSinceLastAccess = now - cachedImage.lastAccessed
    const recencyBonus = Math.max(20 - timeSinceLastAccess / (1000 * 60 * 5), 0) // 5分鐘內20分

    return baseScore + frequencyBonus + recencyBonus
  }

  /**
   * 更新記憶體壓力等級
   */
  private updateMemoryPressureLevel(usageRatio: number): void {
    let newLevel: typeof this.memoryPressureLevel

    if (usageRatio >= this.MEMORY_CRITICAL_THRESHOLD) {
      newLevel = 'critical'
    } else if (usageRatio >= this.MEMORY_WARNING_THRESHOLD) {
      newLevel = 'high'
    } else if (usageRatio >= 0.6) {
      newLevel = 'medium'
    } else {
      newLevel = 'low'
    }

    if (newLevel !== this.memoryPressureLevel) {
      this.memoryPressureLevel = newLevel
      logger.info('記憶體壓力等級變更', {
        module: 'LocalImageCache',
        metadata: {
          newLevel,
          usageRatio: Math.round(usageRatio * 100),
          totalFiles: this.memoryCache.size,
        },
      })
    }
  }

  /**
   * 取得記憶體使用情況
   */
  private getMemoryUsage(): { totalSize: number; totalFiles: number; usageRatio: number } {
    let totalSize = 0
    let totalFiles = 0

    for (const [, image] of this.memoryCache) {
      totalSize += image.metadata.size
      totalFiles++
    }

    return {
      totalSize,
      totalFiles,
      usageRatio: totalSize / this.MEMORY_LIMIT,
    }
  }

  /**
   * 僅從記憶體移除（不觸發完整的檔案移除）
   */
  private removeFromMemoryOnly(id: string, cachedImage: CachedImage): void {
    // 清理 Blob URLs
    if (cachedImage.preview && cachedImage.preview.startsWith('blob:')) {
      URL.revokeObjectURL(cachedImage.preview)
    }
    if (cachedImage.thumbnail && cachedImage.thumbnail.startsWith('blob:')) {
      URL.revokeObjectURL(cachedImage.thumbnail)
    }

    // 從記憶體快取移除
    this.memoryCache.delete(id)

    logger.debug('從記憶體快取移除檔案', {
      module: 'LocalImageCache',
      metadata: {
        fileId: id,
        fileName: cachedImage.metadata.originalName,
        fileSize: cachedImage.metadata.size,
        memoryScore: cachedImage.memoryScore,
      },
    })
  }

  /**
   * 取得記憶體快取統計資訊
   */
  getMemoryStats(): {
    totalFiles: number
    totalSize: number
    usageRatio: number
    memoryPressureLevel: string
    averageScore: number
    highPriorityFiles: number
  } {
    const usage = this.getMemoryUsage()
    let totalScore = 0
    let highPriorityFiles = 0

    for (const [, image] of this.memoryCache) {
      totalScore += image.memoryScore
      if (image.priority === 'high' || image.priority === 'critical') {
        highPriorityFiles++
      }
    }

    return {
      totalFiles: usage.totalFiles,
      totalSize: usage.totalSize,
      usageRatio: usage.usageRatio,
      memoryPressureLevel: this.memoryPressureLevel,
      averageScore: usage.totalFiles > 0 ? totalScore / usage.totalFiles : 0,
      highPriorityFiles,
    }
  }

  /**
   * 儲存到 IndexedDB
   */
  private async storeInDB(cachedImage: CachedImage): Promise<void> {
    if (!this.db) {
      throw new Error('IndexedDB 未初始化')
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([this.STORE_NAME], 'readwrite')
      const store = transaction.objectStore(this.STORE_NAME)
      const request = store.add(cachedImage)

      request.onsuccess = () => resolve()
      request.onerror = () => reject(request.error)
    })
  }

  /**
   * 從 IndexedDB 取得檔案
   */
  private async getFromDB(id: string): Promise<CachedImage | null> {
    if (!this.db) {
      return null
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([this.STORE_NAME], 'readonly')
      const store = transaction.objectStore(this.STORE_NAME)
      const request = store.get(id)

      request.onsuccess = () => {
        const result = request.result as CachedImage | undefined
        if (result) {
          logger.debug('從 IndexedDB 取得檔案', {
            module: 'LocalImageCache',
            metadata: { fileId: id, fileName: result.metadata.originalName },
          })
        }
        resolve(result || null)
      }
      request.onerror = () => reject(request.error)
    })
  }

  /**
   * 從 IndexedDB 移除檔案
   */
  private async removeFromDB(id: string): Promise<void> {
    if (!this.db) {
      return
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([this.STORE_NAME], 'readwrite')
      const store = transaction.objectStore(this.STORE_NAME)
      const request = store.delete(id)

      request.onsuccess = () => {
        logger.debug('從 IndexedDB 移除檔案', {
          module: 'LocalImageCache',
          metadata: { fileId: id },
        })
        resolve()
      }
      request.onerror = () => reject(request.error)
    })
  }

  /**
   * 更新 IndexedDB 中的狀態
   */
  private async updateStatusInDB(id: string, status: CacheStatus): Promise<void> {
    if (!this.db) {
      return
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([this.STORE_NAME], 'readwrite')
      const store = transaction.objectStore(this.STORE_NAME)

      const getRequest = store.get(id)
      getRequest.onsuccess = () => {
        const image = getRequest.result as CachedImage
        if (image) {
          image.status = status
          const updateRequest = store.put(image)
          updateRequest.onsuccess = () => resolve()
          updateRequest.onerror = () => reject(updateRequest.error)
        } else {
          resolve() // 檔案不存在，視為成功
        }
      }
      getRequest.onerror = () => reject(getRequest.error)
    })
  }

  /**
   * 取得 IndexedDB 統計資訊
   */
  private async getDBStats(): Promise<{
    count: number
    size: number
    oldestTimestamp: number
    newestTimestamp: number
  }> {
    if (!this.db) {
      return { count: 0, size: 0, oldestTimestamp: Date.now(), newestTimestamp: 0 }
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([this.STORE_NAME], 'readonly')
      const store = transaction.objectStore(this.STORE_NAME)
      const request = store.openCursor()

      let count = 0
      let size = 0
      let oldestTimestamp = Date.now()
      let newestTimestamp = 0

      request.onsuccess = event => {
        const cursor = (event.target as IDBRequest).result
        if (cursor) {
          const image = cursor.value as CachedImage
          count++
          size += image.metadata.size
          oldestTimestamp = Math.min(oldestTimestamp, image.timestamp)
          newestTimestamp = Math.max(newestTimestamp, image.timestamp)
          cursor.continue()
        } else {
          resolve({ count, size, oldestTimestamp, newestTimestamp })
        }
      }

      request.onerror = () => reject(request.error)
    })
  }
}

/**
 * 導出單例實例
 */
export const localImageCache = LocalImageCache.getInstance()
