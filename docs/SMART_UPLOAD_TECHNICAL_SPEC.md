# 智慧延遲上傳系統 - 技術規格書

## 📋 概述

本文檔詳細描述智慧延遲上傳系統的技術實施細節，包括核心元件設計、API 規格、資料結構和實作指南。

## 🏗️ 核心架構元件

### 1. LocalImageCache - 本地快取服務

```typescript
// src/lib/storage/LocalImageCache.ts
export interface CachedImage {
  id: string
  file: File
  preview: string
  thumbnail: string
  metadata: ImageMetadata
  timestamp: number
  status: CacheStatus
  priority: Priority
}

export interface ImageMetadata {
  originalName: string
  size: number
  type: string
  dimensions: { width: number; height: number }
  checksum: string
  compressionRatio: number
  exif?: ExifData
}

export type CacheStatus = 'pending' | 'uploading' | 'uploaded' | 'failed' | 'expired'
export type Priority = 'low' | 'normal' | 'high' | 'critical'

export class LocalImageCache {
  private static instance: LocalImageCache
  private db: IDBDatabase | null = null
  private memoryCache = new Map<string, CachedImage>()
  private readonly MEMORY_LIMIT = 50 * 1024 * 1024 // 50MB
  private readonly DB_NAME = 'SmartUploadCache'
  private readonly DB_VERSION = 1
  private readonly STORE_NAME = 'images'

  // 單例模式
  static getInstance(): LocalImageCache {
    if (!LocalImageCache.instance) {
      LocalImageCache.instance = new LocalImageCache()
    }
    return LocalImageCache.instance
  }

  // 初始化 IndexedDB
  async init(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.DB_NAME, this.DB_VERSION)

      request.onerror = () => reject(request.error)
      request.onsuccess = () => {
        this.db = request.result
        resolve()
      }

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result

        if (!db.objectStoreNames.contains(this.STORE_NAME)) {
          const store = db.createObjectStore(this.STORE_NAME, { keyPath: 'id' })
          store.createIndex('status', 'status', { unique: false })
          store.createIndex('timestamp', 'timestamp', { unique: false })
          store.createIndex('priority', 'priority', { unique: false })
        }
      }
    })
  }

  // 儲存檔案
  async storeFile(file: File, options: StoreOptions = {}): Promise<string> {
    const id = this.generateId()
    const metadata = await this.extractMetadata(file)
    const preview = await this.generatePreview(file)
    const thumbnail = await this.generateThumbnail(file)

    const cachedImage: CachedImage = {
      id,
      file,
      preview,
      thumbnail,
      metadata,
      timestamp: Date.now(),
      status: 'pending',
      priority: options.priority || 'normal'
    }

    // 小檔案存記憶體，大檔案存 IndexedDB
    if (file.size < 1024 * 1024) { // 1MB
      this.storeInMemory(cachedImage)
    } else {
      await this.storeInDB(cachedImage)
    }

    // 觸發智慧上傳決策
    this.triggerSmartUploadDecision(cachedImage)

    return id
  }

  // 取得檔案
  async getFile(id: string): Promise<CachedImage | null> {
    // 優先從記憶體查找
    if (this.memoryCache.has(id)) {
      return this.memoryCache.get(id)!
    }

    // 從 IndexedDB 查找
    return this.getFromDB(id)
  }

  // 移除檔案
  async removeFile(id: string): Promise<void> {
    // 從記憶體移除
    if (this.memoryCache.has(id)) {
      const cachedImage = this.memoryCache.get(id)!
      URL.revokeObjectURL(cachedImage.preview)
      URL.revokeObjectURL(cachedImage.thumbnail)
      this.memoryCache.delete(id)
    }

    // 從 IndexedDB 移除
    await this.removeFromDB(id)
  }

  // 清理過期檔案
  async clearExpired(maxAge = 24 * 60 * 60 * 1000): Promise<number> {
    const cutoff = Date.now() - maxAge
    let cleanedCount = 0

    // 清理記憶體
    for (const [id, image] of this.memoryCache) {
      if (image.timestamp < cutoff) {
        await this.removeFile(id)
        cleanedCount++
      }
    }

    // 清理 IndexedDB
    if (!this.db) return cleanedCount

    const transaction = this.db.transaction([this.STORE_NAME], 'readwrite')
    const store = transaction.objectStore(this.STORE_NAME)
    const index = store.index('timestamp')
    const range = IDBKeyRange.upperBound(cutoff)

    const request = index.openCursor(range)
    request.onsuccess = (event) => {
      const cursor = (event.target as IDBRequest).result
      if (cursor) {
        cursor.delete()
        cleanedCount++
        cursor.continue()
      }
    }

    return new Promise((resolve) => {
      transaction.oncomplete = () => resolve(cleanedCount)
    })
  }

  // 私有方法
  private generateId(): string {
    return `cache_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  private async extractMetadata(file: File): Promise<ImageMetadata> {
    return new Promise((resolve) => {
      const img = new Image()
      const reader = new FileReader()

      reader.onload = () => {
        img.onload = () => {
          resolve({
            originalName: file.name,
            size: file.size,
            type: file.type,
            dimensions: { width: img.width, height: img.height },
            checksum: this.calculateChecksum(reader.result as ArrayBuffer),
            compressionRatio: 1.0
          })
        }
        img.src = reader.result as string
      }

      reader.readAsDataURL(file)
    })
  }

  private async generatePreview(file: File): Promise<string> {
    return new Promise((resolve) => {
      const canvas = document.createElement('canvas')
      const ctx = canvas.getContext('2d')!
      const img = new Image()

      img.onload = () => {
        const maxSize = 800
        const ratio = Math.min(maxSize / img.width, maxSize / img.height)

        canvas.width = img.width * ratio
        canvas.height = img.height * ratio

        ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
        canvas.toBlob((blob) => {
          resolve(URL.createObjectURL(blob!))
        }, 'image/webp', 0.85)
      }

      img.src = URL.createObjectURL(file)
    })
  }

  private async generateThumbnail(file: File): Promise<string> {
    // 類似 generatePreview，但生成更小的縮圖
    return new Promise((resolve) => {
      const canvas = document.createElement('canvas')
      const ctx = canvas.getContext('2d')!
      const img = new Image()

      img.onload = () => {
        const size = 150
        const ratio = Math.min(size / img.width, size / img.height)

        canvas.width = img.width * ratio
        canvas.height = img.height * ratio

        ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
        canvas.toBlob((blob) => {
          resolve(URL.createObjectURL(blob!))
        }, 'image/webp', 0.75)
      }

      img.src = URL.createObjectURL(file)
    })
  }
}
```

### 2. SmartUploadDecision - 智慧上傳決策引擎

```typescript
// src/lib/upload/SmartUploadDecision.ts
export interface UploadContext {
  formCompleteness: number      // 0-100
  userIdleTime: number         // 毫秒
  networkQuality: NetworkInfo
  fileSize: number
  availableStorage: number
  userBehavior: UserBehaviorData
  systemLoad: SystemLoadInfo
}

export interface NetworkInfo {
  type: 'wifi' | 'cellular' | 'ethernet' | 'unknown'
  downlink: number             // Mbps
  rtt: number                  // 毫秒
  effectiveType: '4g' | '3g' | '2g' | 'slow-2g'
}

export interface UserBehaviorData {
  averageFormFillTime: number
  completionRate: number
  abandonmentRate: number
  timeOfDay: number            // 0-23
}

export interface SystemLoadInfo {
  cpuUsage: number            // 0-100
  memoryUsage: number         // 0-100
  activeUploads: number
}

export class SmartUploadDecision {
  private weights = {
    formCompleteness: 0.3,
    userBehavior: 0.25,
    network: 0.2,
    fileSize: 0.15,
    systemLoad: 0.1
  }

  shouldUploadNow(context: UploadContext): UploadDecision {
    const scores = this.calculateScores(context)
    const totalScore = this.weightedSum(scores)

    return {
      shouldUpload: totalScore > 0.6,
      confidence: totalScore,
      reasoning: this.generateReasoning(scores),
      suggestedDelay: this.calculateDelay(totalScore),
      priority: this.determinePriority(context, totalScore)
    }
  }

  private calculateScores(context: UploadContext): ScoreBreakdown {
    return {
      formCompleteness: this.scoreFormCompleteness(context.formCompleteness),
      userBehavior: this.scoreUserBehavior(context.userBehavior),
      network: this.scoreNetwork(context.networkQuality),
      fileSize: this.scoreFileSize(context.fileSize),
      systemLoad: this.scoreSystemLoad(context.systemLoad)
    }
  }

  private scoreFormCompleteness(completeness: number): number {
    // S 曲線評分：70% 以上開始快速增長
    return 1 / (1 + Math.exp(-0.1 * (completeness - 70)))
  }

  private scoreUserBehavior(behavior: UserBehaviorData): number {
    const abandonmentPenalty = 1 - (behavior.abandonmentRate / 100)
    const completionBonus = behavior.completionRate / 100
    const timeBonus = this.getTimeOfDayBonus(behavior.timeOfDay)

    return (abandonmentPenalty * 0.4 + completionBonus * 0.4 + timeBonus * 0.2)
  }

  private scoreNetwork(network: NetworkInfo): number {
    const typeScores = { wifi: 1, ethernet: 1, cellular: 0.6, unknown: 0.3 }
    const typeScore = typeScores[network.type] || 0.3

    const speedScore = Math.min(network.downlink / 10, 1) // 10Mbps = 滿分
    const latencyScore = Math.max(0, 1 - network.rtt / 1000) // 1000ms = 0分

    return (typeScore * 0.4 + speedScore * 0.4 + latencyScore * 0.2)
  }

  private scoreFileSize(size: number): number {
    // 小檔案得分高，大檔案得分低
    const sizeInMB = size / (1024 * 1024)
    if (sizeInMB < 1) return 1
    if (sizeInMB < 5) return 0.8
    if (sizeInMB < 10) return 0.5
    return 0.2
  }

  private scoreSystemLoad(load: SystemLoadInfo): number {
    const cpuScore = Math.max(0, 1 - load.cpuUsage / 100)
    const memoryScore = Math.max(0, 1 - load.memoryUsage / 100)
    const uploadScore = Math.max(0, 1 - load.activeUploads / 5) // 5個並行上傳為上限

    return (cpuScore + memoryScore + uploadScore) / 3
  }

  private getTimeOfDayBonus(hour: number): number {
    // 工作時間 (9-17) 較高分，凌晨 (1-5) 較低分
    if (hour >= 9 && hour <= 17) return 1
    if (hour >= 6 && hour <= 8 || hour >= 18 && hour <= 22) return 0.8
    if (hour >= 23 || hour <= 5) return 0.4
    return 0.6
  }
}

export interface UploadDecision {
  shouldUpload: boolean
  confidence: number           // 0-1
  reasoning: string[]
  suggestedDelay: number      // 毫秒
  priority: Priority
}

export interface ScoreBreakdown {
  formCompleteness: number
  userBehavior: number
  network: number
  fileSize: number
  systemLoad: number
}
```

### 3. BackgroundUploadQueue - 背景上傳佇列

```typescript
// src/lib/upload/BackgroundUploadQueue.ts
export interface UploadTask {
  id: string
  cachedImageId: string
  file: File
  destination: UploadDestination
  priority: Priority
  retryCount: number
  maxRetries: number
  metadata: TaskMetadata
  createdAt: number
  startedAt?: number
  completedAt?: number
  error?: Error
}

export interface UploadDestination {
  bucket: string
  path: string
  module: string
  entityId: string
}

export interface TaskMetadata {
  formId: string
  userId: string
  sessionId: string
  userAgent: string
  source: 'manual' | 'auto' | 'retry'
}

export class BackgroundUploadQueue {
  private static instance: BackgroundUploadQueue
  private queue = new PriorityQueue<UploadTask>()
  private activeUploads = new Map<string, UploadWorker>()
  private completedTasks = new Map<string, UploadResult>()
  private retryManager: RetryManager
  private rateLimiter: RateLimiter
  private eventEmitter: EventEmitter

  // 配置
  private readonly MAX_CONCURRENT_UPLOADS = 3
  private readonly UPLOAD_TIMEOUT = 30000 // 30秒
  private readonly RETRY_DELAYS = [1000, 2000, 5000, 10000] // 指數退避

  static getInstance(): BackgroundUploadQueue {
    if (!BackgroundUploadQueue.instance) {
      BackgroundUploadQueue.instance = new BackgroundUploadQueue()
    }
    return BackgroundUploadQueue.instance
  }

  constructor() {
    this.retryManager = new RetryManager(this.RETRY_DELAYS)
    this.rateLimiter = new RateLimiter(10, 60000) // 每分鐘最多10個請求
    this.eventEmitter = new EventEmitter()

    // 啟動處理循環
    this.startProcessingLoop()
  }

  // 添加上傳任務
  async addTask(task: UploadTask): Promise<void> {
    // 檢查重複任務
    if (this.isDuplicateTask(task)) {
      throw new Error('重複的上傳任務')
    }

    // 檢查速率限制
    if (!await this.rateLimiter.checkLimit()) {
      throw new Error('上傳速率超限，請稍後再試')
    }

    this.queue.enqueue(task, this.calculatePriority(task))
    this.eventEmitter.emit('taskAdded', task)

    logger.info('上傳任務已加入佇列', {
      metadata: {
        taskId: task.id,
        priority: task.priority,
        queueSize: this.queue.size()
      }
    })
  }

  // 處理下一個任務
  private async processNext(): Promise<void> {
    if (this.activeUploads.size >= this.MAX_CONCURRENT_UPLOADS) {
      return // 達到並行限制
    }

    const task = this.queue.dequeue()
    if (!task) return // 佇列為空

    const worker = new UploadWorker(task, {
      timeout: this.UPLOAD_TIMEOUT,
      onProgress: (progress) => this.handleProgress(task.id, progress),
      onComplete: (result) => this.handleComplete(task.id, result),
      onError: (error) => this.handleError(task.id, error)
    })

    this.activeUploads.set(task.id, worker)
    task.startedAt = Date.now()

    try {
      await worker.start()
    } catch (error) {
      this.handleError(task.id, error as Error)
    }
  }

  // 處理進度更新
  private handleProgress(taskId: string, progress: UploadProgress): void {
    this.eventEmitter.emit('progress', { taskId, progress })
  }

  // 處理完成
  private handleComplete(taskId: string, result: UploadResult): void {
    const task = this.getActiveTask(taskId)
    if (!task) return

    task.completedAt = Date.now()
    this.completedTasks.set(taskId, result)
    this.activeUploads.delete(taskId)

    this.eventEmitter.emit('complete', { taskId, result })

    logger.info('上傳任務完成', {
      metadata: {
        taskId,
        duration: task.completedAt - (task.startedAt || task.createdAt),
        fileSize: result.fileSize
      }
    })

    // 繼續處理佇列
    this.processNext()
  }

  // 處理錯誤
  private async handleError(taskId: string, error: Error): Promise<void> {
    const task = this.getActiveTask(taskId)
    if (!task) return

    task.error = error
    task.retryCount++
    this.activeUploads.delete(taskId)

    // 判斷是否需要重試
    if (await this.shouldRetry(task, error)) {
      const delay = this.retryManager.getDelay(task.retryCount)

      logger.warn('上傳任務失敗，將重試', {
        metadata: {
          taskId,
          retryCount: task.retryCount,
          delay,
          error: error.message
        }
      })

      // 延遲重試
      setTimeout(() => {
        task.metadata.source = 'retry'
        this.addTask(task)
      }, delay)
    } else {
      logger.error('上傳任務最終失敗', error, {
        metadata: {
          taskId,
          retryCount: task.retryCount,
          finalError: error.message
        }
      })

      this.eventEmitter.emit('failed', { taskId, error })
    }

    // 繼續處理佇列
    this.processNext()
  }

  // 開始處理循環
  private startProcessingLoop(): void {
    setInterval(async () => {
      try {
        await this.processNext()
      } catch (error) {
        logger.error('佇列處理循環錯誤', error as Error)
      }
    }, 100) // 每100ms檢查一次

    // 清理完成的任務
    setInterval(() => {
      this.cleanupCompletedTasks()
    }, 60000) // 每分鐘清理一次
  }

  // 計算任務優先權
  private calculatePriority(task: UploadTask): number {
    const priorityScores = { critical: 100, high: 75, normal: 50, low: 25 }
    let score = priorityScores[task.priority]

    // 根據檔案大小調整（小檔案優先）
    const sizeInMB = task.file.size / (1024 * 1024)
    if (sizeInMB < 1) score += 10
    else if (sizeInMB > 10) score -= 10

    // 根據等待時間調整（等待久的優先）
    const waitTime = Date.now() - task.createdAt
    score += Math.min(waitTime / 1000 / 60, 20) // 每分鐘+1分，最多+20

    return score
  }

  // 判斷是否重試
  private async shouldRetry(task: UploadTask, error: Error): Promise<boolean> {
    if (task.retryCount >= task.maxRetries) return false

    // 不重試的錯誤類型
    const nonRetryableErrors = ['ValidationError', 'AuthError', 'FileTooLarge']
    if (nonRetryableErrors.some(type => error.message.includes(type))) {
      return false
    }

    // 網路錯誤才重試
    return error.message.includes('NetworkError') ||
           error.message.includes('timeout') ||
           error.message.includes('5')  // 5xx HTTP 錯誤
  }

  // 取消任務
  async cancelTask(taskId: string): Promise<boolean> {
    // 取消排隊中的任務
    if (this.queue.remove(taskId)) {
      this.eventEmitter.emit('cancelled', { taskId })
      return true
    }

    // 取消進行中的任務
    const worker = this.activeUploads.get(taskId)
    if (worker) {
      await worker.cancel()
      this.activeUploads.delete(taskId)
      this.eventEmitter.emit('cancelled', { taskId })
      return true
    }

    return false
  }

  // 暫停所有任務
  async pauseAll(): Promise<void> {
    for (const [taskId, worker] of this.activeUploads) {
      await worker.pause()
    }
    this.eventEmitter.emit('paused')
  }

  // 恢復所有任務
  async resumeAll(): Promise<void> {
    for (const [taskId, worker] of this.activeUploads) {
      await worker.resume()
    }
    this.eventEmitter.emit('resumed')
  }

  // 獲取佇列狀態
  getStatus(): QueueStatus {
    return {
      queued: this.queue.size(),
      active: this.activeUploads.size,
      completed: this.completedTasks.size,
      totalProcessed: this.completedTasks.size + this.getFailedCount()
    }
  }

  // 清理已完成的任務
  private cleanupCompletedTasks(): void {
    const oneDayAgo = Date.now() - 24 * 60 * 60 * 1000

    for (const [taskId, result] of this.completedTasks) {
      if (result.completedAt < oneDayAgo) {
        this.completedTasks.delete(taskId)
      }
    }
  }
}

export interface UploadProgress {
  loaded: number
  total: number
  percentage: number
  speed: number              // bytes/sec
  remainingTime: number      // seconds
}

export interface UploadResult {
  taskId: string
  url: string
  path: string
  fileSize: number
  uploadTime: number
  completedAt: number
}

export interface QueueStatus {
  queued: number
  active: number
  completed: number
  totalProcessed: number
}
```

## 🔧 實作指南

### 階段 1：環境準備
1. **安裝依賴**
```bash
npm install idb workbox-sw workbox-strategies workbox-routing
npm install --save-dev @types/dom-webcodecs-api
```

2. **配置 TypeScript**
```json
// tsconfig.json
{
  "compilerOptions": {
    "target": "ES2020",
    "lib": ["DOM", "DOM.Iterable", "WebWorker"],
    "types": ["dom-webcodecs-api"]
  }
}
```

3. **設定 PWA 配置**
```javascript
// next.config.js
const withPWA = require('next-pwa')({
  dest: 'public',
  register: true,
  skipWaiting: true,
})

module.exports = withPWA({
  experimental: {
    webVitalsAttribution: ['CLS', 'LCP']
  }
})
```

### 階段 2：核心服務實作
按照上述類別定義實作各個核心服務，重點注意：

1. **錯誤處理**：所有異步操作都要有適當的錯誤處理
2. **記憶體管理**：及時清理 Blob URLs 和大物件
3. **效能優化**：使用 RequestIdleCallback 和 Web Workers
4. **向後相容**：提供 localStorage 後備方案

### 階段 3：UI 元件整合
修改現有的 ImageUploader 元件以整合新系統：

```typescript
// 新的 SmartImageUploader
export default function SmartImageUploader({
  onUploadSuccess,
  onUploadError,
  ...props
}) {
  const [cachedImages, setCachedImages] = useState<CachedImage[]>([])
  const cache = LocalImageCache.getInstance()
  const queue = BackgroundUploadQueue.getInstance()

  const handleFileSelect = async (files: File[]) => {
    for (const file of files) {
      const id = await cache.storeFile(file)
      const cachedImage = await cache.getFile(id)

      if (cachedImage) {
        setCachedImages(prev => [...prev, cachedImage])
      }
    }
  }

  // 其他邏輯...
}
```

### 階段 4：測試與部署
1. **單元測試**：測試每個核心類別的功能
2. **整合測試**：測試整個流程的運作
3. **效能測試**：測試大量檔案的處理能力
4. **相容性測試**：測試各種瀏覽器和裝置

## 📊 監控指標

### 核心指標
- **上傳成功率**: 目標 > 95%
- **平均上傳時間**: 目標 < 5秒
- **快取命中率**: 目標 > 80%
- **孤立檔案數量**: 目標 < 5%

### 業務指標
- **使用者放棄率**: 目標降低 30%
- **表單完成率**: 目標提升 20%
- **儲存空間使用**: 目標節省 90%

---

*此技術規格將隨開發進展持續更新和完善*