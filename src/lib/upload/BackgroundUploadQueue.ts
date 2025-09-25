/**
 * BackgroundUploadQueue - 背景上傳佇列系統
 *
 * 功能特色：
 * - 智慧優先權佇列管理
 * - 並行上傳控制 (最多3個並行)
 * - 指數退避重試機制
 * - 速率限制器
 * - 上傳進度追蹤
 * - 暫停/恢復/取消功能
 * - 頻寬自適應調整
 */

import { logger } from '@/lib/logger'
import { uploadStateManager, type UploadState, type Priority } from './UploadStateManager'
import { UploadWorker } from './UploadWorker'

export type TaskStatus = 'queued' | 'uploading' | 'completed' | 'failed' | 'cancelled' | 'paused'

export interface UploadTask {
  id: string
  cachedImageId: string // LocalImageCache 中的 ID
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
  abortController?: AbortController
  stateId?: string // UploadStateManager 中的狀態 ID
}

export interface UploadDestination {
  bucket: string // Supabase 儲存桶
  path: string // 上傳路徑
  module: string // 模組名稱 (products, news, etc.)
  entityId: string // 實體 ID
  isPublic: boolean // 是否為公開檔案
}

export interface TaskMetadata {
  formId: string // 表單 ID
  userId: string // 用戶 ID
  sessionId: string // 會話 ID
  userAgent: string // 用戶代理
  source: 'manual' | 'auto' | 'retry' // 上傳來源
  networkType: string // 網路類型
  uploadDecisionId?: string // 智慧決策 ID
  context?: Record<string, any> // 額外上下文
}

export interface UploadProgress {
  loaded: number // 已上傳位元組
  total: number // 總位元組數
  percentage: number // 百分比 0-100
  speed: number // 上傳速度 bytes/sec
  remainingTime: number // 剩餘時間 seconds
  chunkIndex?: number // 當前分片索引
  totalChunks?: number // 總分片數
}

export interface UploadResult {
  taskId: string
  id?: string // 資料庫中的圖片 ID (UUID)
  url: string // 上傳後的檔案 URL
  path: string // 儲存路徑
  fileSize: number // 檔案大小
  uploadTime: number // 上傳耗時 (毫秒)
  completedAt: number // 完成時間戳
  checksum?: string // 檔案校驗和
}

export interface QueueStatus {
  queued: number // 佇列中的任務數
  active: number // 進行中的任務數
  completed: number // 已完成的任務數
  failed: number // 失敗的任務數
  paused: number // 暫停的任務數
  totalProcessed: number // 總處理數量
  averageSpeed: number // 平均上傳速度
  totalBytesUploaded: number // 總上傳位元組數
  isPaused: boolean // 佇列是否暫停
}

export interface QueueSettings {
  maxConcurrentUploads: number // 最大並行上傳數
  uploadTimeout: number // 上傳超時時間 (毫秒)
  retryDelays: number[] // 重試延遲時間表
  rateLimitPerMinute: number // 每分鐘速率限制
  chunkSize: number // 分片大小 (位元組)
  autoStart: boolean // 是否自動開始處理
}

export interface TaskEventMap {
  'task:added': { task: UploadTask }
  'task:started': { task: UploadTask }
  'task:progress': { taskId: string; progress: UploadProgress }
  'task:completed': { taskId: string; result: UploadResult; task: UploadTask }
  'task:failed': { taskId: string; error: Error }
  'task:cancelled': { taskId: string }
  'task:paused': { taskId: string }
  'task:resumed': { taskId: string }
  'queue:paused': {}
  'queue:resumed': {}
  'queue:empty': {}
}

/**
 * 優先權佇列實作
 */
class PriorityQueue<T> {
  private items: Array<{ item: T; priority: number; timestamp: number }> = []

  enqueue(item: T, priority: number): void {
    const entry = { item, priority, timestamp: Date.now() }

    // 找到正確的插入位置
    let inserted = false
    for (let i = 0; i < this.items.length; i++) {
      if (
        priority > this.items[i].priority ||
        (priority === this.items[i].priority && entry.timestamp < this.items[i].timestamp)
      ) {
        this.items.splice(i, 0, entry)
        inserted = true
        break
      }
    }

    if (!inserted) {
      this.items.push(entry)
    }
  }

  dequeue(): T | null {
    const entry = this.items.shift()
    return entry ? entry.item : null
  }

  peek(): T | null {
    return this.items.length > 0 ? this.items[0].item : null
  }

  size(): number {
    return this.items.length
  }

  isEmpty(): boolean {
    return this.items.length === 0
  }

  remove(predicate: (item: T) => boolean): boolean {
    const index = this.items.findIndex(entry => predicate(entry.item))
    if (index !== -1) {
      this.items.splice(index, 1)
      return true
    }
    return false
  }

  clear(): void {
    this.items = []
  }

  toArray(): T[] {
    return this.items.map(entry => entry.item)
  }
}

/**
 * 速率限制器
 */
class RateLimiter {
  private requests: number[] = []

  constructor(
    private maxRequests: number,
    private windowMs: number
  ) {}

  async checkLimit(): Promise<boolean> {
    const now = Date.now()
    const windowStart = now - this.windowMs

    // 清理過期的請求記錄
    this.requests = this.requests.filter(timestamp => timestamp > windowStart)

    if (this.requests.length >= this.maxRequests) {
      return false // 超過限制
    }

    this.requests.push(now)
    return true
  }

  getRemainingRequests(): number {
    return Math.max(0, this.maxRequests - this.requests.length)
  }

  getResetTime(): number {
    if (this.requests.length === 0) return 0
    return this.requests[0] + this.windowMs
  }
}

/**
 * 重試管理器
 */
class RetryManager {
  constructor(private retryDelays: number[]) {}

  getDelay(attempt: number): number {
    const index = Math.min(attempt - 1, this.retryDelays.length - 1)
    const baseDelay = this.retryDelays[index] || this.retryDelays[this.retryDelays.length - 1]

    // 加入隨機抖動避免雷群效應
    const jitter = Math.random() * 0.3 + 0.85 // 85-115% 的隨機變化
    return Math.floor(baseDelay * jitter)
  }

  shouldRetry(attempt: number, maxRetries: number, error: Error): boolean {
    if (attempt >= maxRetries) return false

    // 不重試的錯誤類型
    const nonRetryableErrors = [
      'ValidationError',
      'AuthError',
      'FileTooLarge',
      'UnsupportedFileType',
      'QuotaExceeded',
    ]

    const errorMessage = error.message
    if (nonRetryableErrors.some(type => errorMessage.includes(type))) {
      return false
    }

    // 只重試網路相關錯誤
    return (
      errorMessage.includes('NetworkError') ||
      errorMessage.includes('timeout') ||
      errorMessage.includes('5') || // 5xx HTTP 錯誤
      errorMessage.includes('ECONNRESET') ||
      errorMessage.includes('ETIMEDOUT')
    )
  }
}

/**
 * 背景上傳佇列主類別
 */
export class BackgroundUploadQueue {
  private static instance: BackgroundUploadQueue

  // 核心組件
  private queue = new PriorityQueue<UploadTask>()
  private activeUploads = new Map<string, UploadWorker>()
  private completedTasks = new Map<string, UploadResult>()
  private failedTasks = new Map<string, Error>()

  // 管理組件
  private retryManager: RetryManager
  private rateLimiter: RateLimiter
  private eventListeners = new Map<keyof TaskEventMap, Set<Function>>()

  // 佇列狀態
  private isPaused = false
  private isProcessing = false
  private processingInterval: NodeJS.Timeout | null = null

  // 統計資料
  private stats = {
    totalTasks: 0,
    completedTasks: 0,
    failedTasks: 0,
    cancelledTasks: 0,
    totalBytesUploaded: 0,
    totalUploadTime: 0,
    speedHistory: [] as number[],
  }

  // 設定
  private settings: QueueSettings = {
    maxConcurrentUploads: 3,
    uploadTimeout: 30000, // 30秒
    retryDelays: [1000, 2000, 5000, 10000], // 指數退避
    rateLimitPerMinute: 10,
    chunkSize: 1024 * 1024, // 1MB 分片
    autoStart: true,
  }

  /**
   * 單例模式
   */
  static getInstance(): BackgroundUploadQueue {
    if (!BackgroundUploadQueue.instance) {
      BackgroundUploadQueue.instance = new BackgroundUploadQueue()
    }
    return BackgroundUploadQueue.instance
  }

  constructor() {
    this.retryManager = new RetryManager(this.settings.retryDelays)
    this.rateLimiter = new RateLimiter(this.settings.rateLimitPerMinute, 60000)

    if (this.settings.autoStart) {
      this.startProcessing()
    }

    // 清理定時器
    setInterval(() => {
      this.cleanupCompletedTasks()
    }, 60000) // 每分鐘清理一次
  }

  /**
   * 添加上傳任務到佇列
   */
  async addTask(task: Omit<UploadTask, 'id' | 'createdAt'>): Promise<string> {
    const taskId = this.generateTaskId()
    const fullTask: UploadTask = {
      ...task,
      id: taskId,
      createdAt: Date.now(),
      abortController: new AbortController(),
    }

    // 檢查重複任務
    if (this.isDuplicateTask(fullTask)) {
      throw new Error(`重複的上傳任務: ${task.cachedImageId}`)
    }

    // 檢查速率限制
    if (!(await this.rateLimiter.checkLimit())) {
      const resetTime = this.rateLimiter.getResetTime()
      throw new Error(`上傳速率超限，請在 ${new Date(resetTime).toLocaleTimeString()} 後重試`)
    }

    // 創建對應的狀態管理記錄
    const uploadState = uploadStateManager.createUploadState({
      fileId: task.cachedImageId,
      fileName: task.file.name,
      fileSize: task.file.size,
      priority: task.priority,
      maxRetries: task.maxRetries,
      metadata: task.metadata,
    })

    fullTask.stateId = uploadState.id

    // 計算任務優先權並加入佇列
    const priority = this.calculatePriority(fullTask)
    this.queue.enqueue(fullTask, priority)

    this.stats.totalTasks++

    // 觸發事件
    this.emit('task:added', { task: fullTask })

    logger.info('上傳任務已加入佇列', {
      metadata: {
        taskId,
        fileName: task.file.name,
        fileSize: this.formatBytes(task.file.size),
        priority: task.priority,
        calculatedPriority: priority,
        queueSize: this.queue.size(),
        activeUploads: this.activeUploads.size,
      },
    })

    return taskId
  }

  /**
   * 開始處理佇列
   */
  startProcessing(): void {
    if (this.isProcessing) return

    this.isProcessing = true
    this.processingInterval = setInterval(() => {
      this.processNext()
    }, 100) // 每100ms檢查一次

    logger.info('背景上傳佇列開始處理')
  }

  /**
   * 停止處理佇列
   */
  stopProcessing(): void {
    if (!this.isProcessing) return

    this.isProcessing = false
    if (this.processingInterval) {
      clearInterval(this.processingInterval)
      this.processingInterval = null
    }

    logger.info('背景上傳佇列停止處理')
  }

  /**
   * 暫停所有上傳
   */
  async pauseAll(): Promise<void> {
    if (this.isPaused) {
      logger.debug('佇列已經暫停，跳過重複暫停操作')
      return
    }

    this.isPaused = true

    // 暫停所有進行中的上傳
    const pausePromises = Array.from(this.activeUploads.values()).map(async worker => {
      try {
        await worker.pause()
        this.emit('task:paused', { taskId: worker.getTaskId() })
        logger.debug('任務暫停成功', {
          metadata: { taskId: worker.getTaskId() },
        })
      } catch (error) {
        logger.error('暫停上傳任務失敗', error as Error, {
          metadata: { taskId: worker.getTaskId() },
        })
      }
    })

    await Promise.allSettled(pausePromises)

    // 停止佇列處理間隔
    if (this.processingInterval) {
      clearInterval(this.processingInterval)
      this.processingInterval = null
    }

    this.emit('queue:paused', {})
    logger.info('所有上傳任務已暫停', {
      metadata: {
        activeUploads: this.activeUploads.size,
        queuedTasks: this.queue.size(),
        totalPausedTasks: this.activeUploads.size,
      },
    })
  }

  /**
   * 恢復所有上傳
   */
  async resumeAll(): Promise<void> {
    if (!this.isPaused) {
      logger.debug('佇列未暫停，跳過恢復操作')
      return
    }

    this.isPaused = false

    // 恢復所有暫停的上傳
    const resumePromises = Array.from(this.activeUploads.values()).map(async worker => {
      try {
        await worker.resume()
        this.emit('task:resumed', { taskId: worker.getTaskId() })
        logger.debug('任務恢復成功', {
          metadata: { taskId: worker.getTaskId() },
        })
      } catch (error) {
        logger.error('恢復上傳任務失敗', error as Error, {
          metadata: { taskId: worker.getTaskId() },
        })
      }
    })

    await Promise.allSettled(resumePromises)

    // 重新啟動佇列處理
    this.startProcessing()

    this.emit('queue:resumed', {})
    logger.info('所有上傳任務已恢復', {
      metadata: {
        activeUploads: this.activeUploads.size,
        queuedTasks: this.queue.size(),
        totalResumedTasks: this.activeUploads.size,
      },
    })

    // 立即嘗試處理佇列中的任務
    setTimeout(() => this.processNext(), 100)
  }

  /**
   * 取消特定任務
   */
  async cancelTask(taskId: string): Promise<boolean> {
    logger.info('開始取消任務', { metadata: { taskId } })

    // 1. 嘗試從佇列中移除
    const queuedTask = this.findTaskInQueue(taskId)
    if (queuedTask) {
      const removedFromQueue = this.queue.remove(task => task.id === taskId)

      if (removedFromQueue) {
        // 更新統計
        this.stats.cancelledTasks = (this.stats.cancelledTasks || 0) + 1

        // 更新狀態管理
        if (queuedTask.stateId) {
          uploadStateManager.updateState(queuedTask.stateId, {
            status: 'cancelled',
            completedAt: Date.now(),
          })
        }

        // 取消 AbortController（如果存在）
        if (queuedTask.abortController) {
          queuedTask.abortController.abort('任務從佇列中取消')
        }

        this.emit('task:cancelled', { taskId })
        logger.info('任務已從佇列中取消', {
          metadata: {
            taskId,
            fileName: queuedTask.file.name,
            queuedDuration: Date.now() - queuedTask.createdAt,
            priority: queuedTask.priority,
          },
        })
        return true
      }
    }

    // 2. 嘗試取消進行中的任務
    const worker = this.activeUploads.get(taskId)
    if (worker) {
      try {
        const task = worker.getTask()
        const stats = worker.getStats()

        // 記錄取消前的狀態
        logger.debug('取消進行中任務', {
          metadata: {
            taskId,
            fileName: task.file.name,
            status: worker.getStatus(),
            uploadedBytes: this.formatBytes(stats.uploadedBytes),
            totalBytes: this.formatBytes(stats.totalBytes),
            elapsedTime: `${stats.elapsedTime}ms`,
          },
        })

        // 執行取消
        await worker.cancel()

        // 從活躍上傳中移除
        this.activeUploads.delete(taskId)

        // 更新統計
        this.stats.cancelledTasks = (this.stats.cancelledTasks || 0) + 1

        // 更新狀態管理
        if (task.stateId) {
          uploadStateManager.updateState(task.stateId, {
            status: 'cancelled',
            completedAt: Date.now(),
            error: new Error('用戶取消上傳'),
          })
        }

        this.emit('task:cancelled', { taskId })
        logger.info('進行中任務已取消', {
          metadata: {
            taskId,
            fileName: task.file.name,
            uploadedPercentage:
              stats.totalBytes > 0
                ? `${((stats.uploadedBytes / stats.totalBytes) * 100).toFixed(1)}%`
                : '0%',
            elapsedTime: `${stats.elapsedTime}ms`,
          },
        })

        // 立即嘗試處理佇列中的下一個任務
        setTimeout(() => this.processNext(), 100)

        return true
      } catch (error) {
        logger.error('取消任務失敗', error as Error, { metadata: { taskId } })
        return false
      }
    }

    logger.warn('找不到要取消的任務', { metadata: { taskId } })
    return false
  }

  /**
   * 暫停特定任務
   */
  async pauseTask(taskId: string): Promise<boolean> {
    // 檢查是否為進行中的任務
    const worker = this.activeUploads.get(taskId)
    if (worker) {
      try {
        await worker.pause()
        this.emit('task:paused', { taskId })
        logger.info('任務已暫停', { metadata: { taskId } })
        return true
      } catch (error) {
        logger.error('暫停任務失敗', error as Error, { metadata: { taskId } })
        return false
      }
    }

    // 如果任務在佇列中，標記為暫停狀態
    const task = this.findTaskInQueue(taskId)
    if (task) {
      // 更新任務狀態（這裡需要擴展 UploadTask 來包含暫停狀態）
      if (task.stateId) {
        uploadStateManager.updateState(task.stateId, { status: 'pending' }) // 暫時使用 pending
      }

      logger.info('佇列中的任務標記為暫停', { metadata: { taskId } })
      return true
    }

    logger.warn('找不到指定的任務', { metadata: { taskId } })
    return false
  }

  /**
   * 恢復特定任務
   */
  async resumeTask(taskId: string): Promise<boolean> {
    // 檢查是否為進行中的任務
    const worker = this.activeUploads.get(taskId)
    if (worker) {
      try {
        await worker.resume()
        this.emit('task:resumed', { taskId })
        logger.info('任務已恢復', { metadata: { taskId } })
        return true
      } catch (error) {
        logger.error('恢復任務失敗', error as Error, { metadata: { taskId } })
        return false
      }
    }

    // 如果任務在佇列中且處於暫停狀態，恢復處理
    const task = this.findTaskInQueue(taskId)
    if (task) {
      if (task.stateId) {
        uploadStateManager.updateState(task.stateId, { status: 'pending' })
      }

      // 如果佇列沒有暫停，立即嘗試處理
      if (!this.isPaused) {
        setTimeout(() => this.processNext(), 100)
      }

      logger.info('佇列中的任務已恢復', { metadata: { taskId } })
      return true
    }

    logger.warn('找不到指定的任務', { metadata: { taskId } })
    return false
  }

  /**
   * 檢查任務是否處於暫停狀態
   */
  isTaskPaused(taskId: string): boolean {
    const worker = this.activeUploads.get(taskId)
    if (worker) {
      return worker.getStatus() === 'paused'
    }

    // 對於佇列中的任務，暫時返回 false
    // 如果需要更精確的暫停狀態，需要擴展資料結構
    return false
  }

  /**
   * 獲取佇列暫停狀態
   */
  isPausedState(): boolean {
    return this.isPaused
  }

  /**
   * 獲取佇列狀態
   */
  getStatus(): QueueStatus {
    const averageSpeed =
      this.stats.speedHistory.length > 0
        ? this.stats.speedHistory.reduce((sum, speed) => sum + speed, 0) /
          this.stats.speedHistory.length
        : 0

    // 計算暫停的任務數量
    let pausedTasks = 0
    this.activeUploads.forEach(worker => {
      if (worker.getStatus() === 'paused') {
        pausedTasks++
      }
    })

    return {
      queued: this.queue.size(),
      active: this.activeUploads.size - pausedTasks, // 活躍任務 = 總任務 - 暫停任務
      completed: this.stats.completedTasks,
      failed: this.stats.failedTasks,
      paused: pausedTasks,
      totalProcessed: this.stats.completedTasks + this.stats.failedTasks,
      averageSpeed,
      totalBytesUploaded: this.stats.totalBytesUploaded,
      isPaused: this.isPaused,
    }
  }

  /**
   * 獲取特定任務狀態
   */
  getTaskStatus(taskId: string): TaskStatus | null {
    // 檢查是否在佇列中
    const queueTask = this.findTaskInQueue(taskId)
    if (queueTask) return 'queued'

    // 檢查是否在進行中
    if (this.activeUploads.has(taskId)) return 'uploading'

    // 檢查是否已完成
    if (this.completedTasks.has(taskId)) return 'completed'

    // 檢查是否失敗
    if (this.failedTasks.has(taskId)) return 'failed'

    return null
  }

  /**
   * 事件監聽
   */
  on<K extends keyof TaskEventMap>(
    event: K,
    listener: (data: TaskEventMap[K]) => void
  ): () => void {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, new Set())
    }

    this.eventListeners.get(event)!.add(listener)

    // 返回取消監聽函數
    return () => {
      const listeners = this.eventListeners.get(event)
      if (listeners) {
        listeners.delete(listener)
      }
    }
  }

  /**
   * 處理下一個任務
   */
  private async processNext(): Promise<void> {
    if (
      this.isPaused ||
      this.activeUploads.size >= this.settings.maxConcurrentUploads ||
      this.queue.isEmpty()
    ) {
      // 佇列為空時觸發事件
      if (this.queue.isEmpty() && this.activeUploads.size === 0) {
        this.emit('queue:empty', {})
      }

      return
    }

    const task = this.queue.dequeue()
    if (!task) return

    // 更新狀態為開始上傳
    if (task.stateId) {
      uploadStateManager.updateState(task.stateId, {
        status: 'uploading',
        startedAt: Date.now(),
      })
    }

    try {
      const worker = new UploadWorker(task, {
        timeout: this.settings.uploadTimeout,
        chunkSize: this.settings.chunkSize,
        onProgress: (progress: any) => this.handleProgress(task.id, progress),
        onComplete: (result: any) => this.handleComplete(task.id, result),
        onError: (error: any) => this.handleError(task.id, error),
      })

      this.activeUploads.set(task.id, worker)
      task.startedAt = Date.now()

      this.emit('task:started', { task })

      await worker.start()
    } catch (error) {
      await this.handleError(task.id, error as Error)
    }
  }

  /**
   * 處理上傳進度
   */
  private handleProgress(taskId: string, progress: UploadProgress): void {
    // 更新狀態管理器
    const task = this.findActiveTask(taskId)
    if (task?.stateId) {
      uploadStateManager.updateProgress(task.stateId, progress)
    }

    // 記錄速度歷史
    if (progress.speed > 0) {
      this.stats.speedHistory.push(progress.speed)
      if (this.stats.speedHistory.length > 100) {
        this.stats.speedHistory.shift() // 只保留最近100個記錄
      }

      // 頻寬自適應調整
      this.adaptBandwidth(progress.speed)
    }

    this.emit('task:progress', { taskId, progress })
  }

  /**
   * 頻寬自適應調整
   */
  private adaptBandwidth(currentSpeed: number): void {
    // 只有在有足夠數據時才進行調整
    if (this.stats.speedHistory.length < 10) return

    const recentSpeeds = this.stats.speedHistory.slice(-10) // 最近10個記錄
    const averageSpeed = recentSpeeds.reduce((sum, speed) => sum + speed, 0) / recentSpeeds.length
    const speedVariation = this.calculateSpeedVariation(recentSpeeds)

    // 網路狀況分類
    const networkCondition = this.classifyNetworkCondition(averageSpeed, speedVariation)

    // 根據網路狀況調整設定
    const newSettings = this.calculateOptimalSettings(networkCondition, averageSpeed)

    // 應用新設定（如果有顯著變化）
    if (this.shouldUpdateSettings(newSettings)) {
      this.updateNetworkSettings(newSettings)

      logger.debug('頻寬自適應調整', {
        metadata: {
          networkCondition,
          averageSpeed: this.formatBytes(averageSpeed || 0) + '/s',
          speedVariation: speedVariation.toFixed(2),
          newChunkSize: this.formatBytes(newSettings.chunkSize || 0),
          newMaxConcurrent: newSettings.maxConcurrentUploads,
        },
      })
    }
  }

  /**
   * 計算速度變異係數
   */
  private calculateSpeedVariation(speeds: number[]): number {
    if (speeds.length < 2) return 0

    const average = speeds.reduce((sum, speed) => sum + speed, 0) / speeds.length
    const variance =
      speeds.reduce((sum, speed) => sum + Math.pow(speed - average, 2), 0) / speeds.length
    const standardDeviation = Math.sqrt(variance)

    return average > 0 ? standardDeviation / average : 0 // 變異係數
  }

  /**
   * 網路狀況分類
   */
  private classifyNetworkCondition(
    averageSpeed: number,
    speedVariation: number
  ): 'excellent' | 'good' | 'fair' | 'poor' {
    const speedMBps = averageSpeed / (1024 * 1024) // 轉換為 MB/s

    // 網路狀況判斷邏輯
    if (speedMBps >= 5 && speedVariation < 0.3) {
      return 'excellent' // 高速穩定
    } else if (speedMBps >= 2 && speedVariation < 0.5) {
      return 'good' // 中高速較穩定
    } else if (speedMBps >= 0.5 && speedVariation < 0.8) {
      return 'fair' // 中速不太穩定
    } else {
      return 'poor' // 低速或不穩定
    }
  }

  /**
   * 計算最佳設定
   */
  private calculateOptimalSettings(
    networkCondition: string,
    averageSpeed: number
  ): Partial<QueueSettings> {
    const baseMB = 1024 * 1024

    switch (networkCondition) {
      case 'excellent':
        return {
          chunkSize: baseMB * 4, // 4MB 分片
          maxConcurrentUploads: 3, // 維持3個並行
          rateLimitPerMinute: 15, // 提高速率限制
          uploadTimeout: 60000, // 延長超時時間
        }

      case 'good':
        return {
          chunkSize: baseMB * 2, // 2MB 分片
          maxConcurrentUploads: 3, // 維持3個並行
          rateLimitPerMinute: 12, // 適中速率限制
          uploadTimeout: 45000, // 適中超時時間
        }

      case 'fair':
        return {
          chunkSize: baseMB * 1, // 1MB 分片
          maxConcurrentUploads: 2, // 降低並行數
          rateLimitPerMinute: 10, // 標準速率限制
          uploadTimeout: 30000, // 標準超時時間
        }

      case 'poor':
        return {
          chunkSize: baseMB * 0.5, // 512KB 分片
          maxConcurrentUploads: 1, // 單一並行
          rateLimitPerMinute: 8, // 降低速率限制
          uploadTimeout: 20000, // 縮短超時時間
        }

      default:
        return {}
    }
  }

  /**
   * 判斷是否需要更新設定
   */
  private shouldUpdateSettings(newSettings: Partial<QueueSettings>): boolean {
    // 檢查關鍵設定是否有顯著變化
    const chunkSizeChange =
      newSettings.chunkSize &&
      Math.abs(newSettings.chunkSize - this.settings.chunkSize) > this.settings.chunkSize * 0.2 // 變化超過20%

    const concurrencyChange =
      newSettings.maxConcurrentUploads &&
      newSettings.maxConcurrentUploads !== this.settings.maxConcurrentUploads

    const rateLimitChange =
      newSettings.rateLimitPerMinute &&
      Math.abs(newSettings.rateLimitPerMinute - this.settings.rateLimitPerMinute) >= 2 // 變化超過2個請求

    return !!(chunkSizeChange || concurrencyChange || rateLimitChange)
  }

  /**
   * 更新網路設定
   */
  private updateNetworkSettings(newSettings: Partial<QueueSettings>): void {
    const oldSettings = { ...this.settings }

    // 更新設定
    this.settings = { ...this.settings, ...newSettings }

    // 重新初始化相關組件
    if (newSettings.retryDelays || newSettings.rateLimitPerMinute) {
      this.rateLimiter = new RateLimiter(this.settings.rateLimitPerMinute, 60000)
    }

    // 記錄設定變更
    logger.info('頻寬自適應設定已更新', {
      metadata: {
        oldSettings: {
          chunkSize: this.formatBytes(oldSettings.chunkSize),
          maxConcurrentUploads: oldSettings.maxConcurrentUploads,
          rateLimitPerMinute: oldSettings.rateLimitPerMinute,
        },
        newSettings: {
          chunkSize: newSettings.chunkSize ? this.formatBytes(newSettings.chunkSize) : 'unchanged',
          maxConcurrentUploads: newSettings.maxConcurrentUploads || 'unchanged',
          rateLimitPerMinute: newSettings.rateLimitPerMinute || 'unchanged',
        },
      },
    })
  }

  /**
   * 處理上傳完成
   */
  private handleComplete(taskId: string, result: UploadResult): void {
    const task = this.findActiveTask(taskId)
    if (!task) return

    // 更新統計
    this.stats.completedTasks++
    this.stats.totalBytesUploaded += result.fileSize
    if (task.startedAt) {
      this.stats.totalUploadTime += result.uploadTime
    }

    // 記錄結果
    this.completedTasks.set(taskId, result)
    this.activeUploads.delete(taskId)

    // 更新狀態管理器
    if (task.stateId) {
      uploadStateManager.updateState(task.stateId, {
        status: 'uploaded',
        completedAt: Date.now(),
      })
    }

    this.emit('task:completed', { taskId, result, task })

    logger.info('上傳任務完成', {
      metadata: {
        taskId,
        fileName: task.file.name,
        fileSize: this.formatBytes(result.fileSize),
        uploadTime: `${(result.uploadTime / 1000).toFixed(2)}s`,
        speed: this.formatBytes(result.fileSize / (result.uploadTime / 1000)) + '/s',
        url: result.url,
      },
    })

    // 繼續處理佇列
    setTimeout(() => this.processNext(), 10)
  }

  /**
   * 處理上傳錯誤
   */
  private async handleError(taskId: string, error: Error): Promise<void> {
    const task = this.findActiveTask(taskId)
    if (!task) return

    task.error = error
    task.retryCount++
    this.activeUploads.delete(taskId)

    // 判斷是否需要重試
    if (this.retryManager.shouldRetry(task.retryCount, task.maxRetries, error)) {
      const delay = this.retryManager.getDelay(task.retryCount)

      logger.warn('上傳任務失敗，將重試', {
        metadata: {
          taskId,
          fileName: task.file.name,
          retryCount: task.retryCount,
          maxRetries: task.maxRetries,
          delay: `${delay}ms`,
          error: error.message,
        },
      })

      // 更新狀態為等待重試
      if (task.stateId) {
        uploadStateManager.updateState(task.stateId, {
          status: 'pending',
          error: error,
        })
      }

      // 延遲重試
      setTimeout(() => {
        task.metadata.source = 'retry'
        task.abortController = new AbortController() // 重新創建 AbortController
        const priority = this.calculatePriority(task)
        this.queue.enqueue(task, priority)
      }, delay)
    } else {
      // 最終失敗
      this.stats.failedTasks++
      this.failedTasks.set(taskId, error)

      // 更新狀態管理器
      if (task.stateId) {
        uploadStateManager.updateState(task.stateId, {
          status: 'failed',
          completedAt: Date.now(),
          error: error,
        })
      }

      this.emit('task:failed', { taskId, error })

      logger.error('上傳任務最終失敗', error, {
        metadata: {
          taskId,
          fileName: task.file.name,
          retryCount: task.retryCount,
          maxRetries: task.maxRetries,
        },
      })
    }

    // 繼續處理佇列
    setTimeout(() => this.processNext(), 10)
  }

  /**
   * 計算任務優先權
   */
  private calculatePriority(task: UploadTask): number {
    const priorityScores: Record<Priority, number> = {
      critical: 100,
      high: 75,
      normal: 50,
      low: 25,
    }

    let score = priorityScores[task.priority]

    // 檔案大小調整（小檔案優先）
    const sizeInMB = task.file.size / (1024 * 1024)
    if (sizeInMB < 1) {
      score += 10
    } else if (sizeInMB > 10) {
      score -= 10
    }

    // 等待時間調整（等待久的優先）
    const waitTime = Date.now() - task.createdAt
    const waitMinutes = waitTime / (1000 * 60)
    score += Math.min(waitMinutes, 20) // 每分鐘+1分，最多+20

    // 重試次數調整（重試多的優先）
    score += task.retryCount * 5

    return score
  }

  /**
   * 檢查重複任務
   */
  private isDuplicateTask(newTask: UploadTask): boolean {
    // 檢查佇列中是否有相同的 cachedImageId
    const queueTasks = this.queue.toArray()
    if (queueTasks.some(task => task.cachedImageId === newTask.cachedImageId)) {
      return true
    }

    // 檢查進行中的任務
    for (const [_, worker] of this.activeUploads) {
      if (worker.getCachedImageId() === newTask.cachedImageId) {
        return true
      }
    }

    return false
  }

  /**
   * 查找佇列中的任務
   */
  private findTaskInQueue(taskId: string): UploadTask | null {
    const tasks = this.queue.toArray()
    return tasks.find(task => task.id === taskId) || null
  }

  /**
   * 查找進行中的任務
   */
  private findActiveTask(taskId: string): UploadTask | null {
    const worker = this.activeUploads.get(taskId)
    return worker ? worker.getTask() : null
  }

  /**
   * 清理已完成的任務
   */
  private cleanupCompletedTasks(): void {
    const oneDayAgo = Date.now() - 24 * 60 * 60 * 1000
    let cleanedCount = 0

    // 清理完成的任務
    for (const [taskId, result] of this.completedTasks) {
      if (result.completedAt < oneDayAgo) {
        this.completedTasks.delete(taskId)
        cleanedCount++
      }
    }

    // 清理失敗的任務
    for (const [taskId] of this.failedTasks) {
      // 對於失敗的任務，我們需要檢查任務的創建時間
      // 由於我們沒有直接存儲任務創建時間，這裡簡化為也清理一天前的
      this.failedTasks.delete(taskId)
      cleanedCount++
    }

    if (cleanedCount > 0) {
      logger.debug('清理已完成任務', { metadata: { cleanedCount } })
    }
  }

  /**
   * 觸發事件
   */
  private emit<K extends keyof TaskEventMap>(event: K, data: TaskEventMap[K]): void {
    const listeners = this.eventListeners.get(event)
    if (!listeners) return

    for (const listener of listeners) {
      try {
        listener(data)
      } catch (error) {
        logger.error('事件監聽器錯誤', error as Error, {
          metadata: { event, data },
        })
      }
    }
  }

  /**
   * 工具方法
   */
  private generateTaskId(): string {
    return `task_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  private formatBytes(bytes: number): string {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  /**
   * 更新設定
   */
  updateSettings(newSettings: Partial<QueueSettings>): void {
    this.settings = { ...this.settings, ...newSettings }

    // 重新初始化相關組件
    if (newSettings.retryDelays) {
      this.retryManager = new RetryManager(this.settings.retryDelays)
    }

    if (newSettings.rateLimitPerMinute) {
      this.rateLimiter = new RateLimiter(this.settings.rateLimitPerMinute, 60000)
    }

    logger.info('佇列設定已更新', { metadata: { newSettings } })
  }

  /**
   * 獲取設定
   */
  getSettings(): QueueSettings {
    return { ...this.settings }
  }

  /**
   * 重置佇列
   */
  async reset(): Promise<void> {
    // 取消所有進行中的任務
    const cancelPromises = Array.from(this.activeUploads.keys()).map(taskId =>
      this.cancelTask(taskId)
    )
    await Promise.allSettled(cancelPromises)

    // 清空佇列
    this.queue.clear()
    this.completedTasks.clear()
    this.failedTasks.clear()

    // 重置統計
    this.stats = {
      totalTasks: 0,
      completedTasks: 0,
      failedTasks: 0,
      cancelledTasks: 0,
      totalBytesUploaded: 0,
      totalUploadTime: 0,
      speedHistory: [],
    }

    logger.info('背景上傳佇列已重置')
  }

  /**
   * 獲取所有任務ID（包括佇列中和進行中的）
   */
  getAllTaskIds(): string[] {
    const queuedTasks = this.queue.toArray().map(task => task.id)
    const activeTasks = Array.from(this.activeUploads.keys())
    return [...queuedTasks, ...activeTasks]
  }
}

// 導入實際的 UploadWorker 實作
export { UploadWorker, type UploadWorkerOptions } from './UploadWorker'

/**
 * 導出單例實例
 */
export const backgroundUploadQueue = BackgroundUploadQueue.getInstance()

/**
 * 便捷函數：添加上傳任務
 */
export async function addUploadTask(task: Omit<UploadTask, 'id' | 'createdAt'>): Promise<string> {
  return backgroundUploadQueue.addTask(task)
}

/**
 * 便捷函數：獲取佇列狀態
 */
export function getQueueStatus(): QueueStatus {
  return backgroundUploadQueue.getStatus()
}

/**
 * 便捷函數：暫停所有上傳
 */
export async function pauseAllUploads(): Promise<void> {
  return backgroundUploadQueue.pauseAll()
}

/**
 * 便捷函數：恢復所有上傳
 */
export async function resumeAllUploads(): Promise<void> {
  return backgroundUploadQueue.resumeAll()
}

/**
 * 便捷函數：暫停特定任務
 */
export async function pauseTask(taskId: string): Promise<boolean> {
  return backgroundUploadQueue.pauseTask(taskId)
}

/**
 * 便捷函數：恢復特定任務
 */
export async function resumeTask(taskId: string): Promise<boolean> {
  return backgroundUploadQueue.resumeTask(taskId)
}

/**
 * 便捷函數：檢查任務是否暫停
 */
export function isTaskPaused(taskId: string): boolean {
  return backgroundUploadQueue.isTaskPaused(taskId)
}

/**
 * 便捷函數：檢查佇列是否暫停
 */
export function isQueuePaused(): boolean {
  return backgroundUploadQueue.isPausedState()
}

/**
 * 便捷函數：取消特定任務
 */
export async function cancelTask(taskId: string): Promise<boolean> {
  return backgroundUploadQueue.cancelTask(taskId)
}

/**
 * 便捷函數：批量取消任務
 */
export async function cancelTasks(taskIds: string[]): Promise<boolean[]> {
  const cancelPromises = taskIds.map(taskId => backgroundUploadQueue.cancelTask(taskId))
  return Promise.all(cancelPromises)
}

/**
 * 便捷函數：取消所有任務（包括佇列中和進行中的）
 */
export async function cancelAllTasks(): Promise<{
  cancelled: number
  failed: number
  total: number
}> {
  const queueStatus = backgroundUploadQueue.getStatus()
  const totalTasks = queueStatus.queued + queueStatus.active + queueStatus.paused

  if (totalTasks === 0) {
    return { cancelled: 0, failed: 0, total: 0 }
  }

  // 獲取所有任務 ID
  const allTaskIds = backgroundUploadQueue.getAllTaskIds()

  // 批量取消
  const results = await cancelTasks(allTaskIds)

  const cancelled = results.filter(result => result).length
  const failed = results.filter(result => !result).length

  logger.info('批量取消任務完成', {
    metadata: {
      total: allTaskIds.length,
      cancelled,
      failed,
    },
  })

  return { cancelled, failed, total: allTaskIds.length }
}
