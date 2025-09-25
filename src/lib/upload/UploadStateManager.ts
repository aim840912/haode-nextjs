/**
 * UploadStateManager - 上傳狀態管理器
 *
 * 功能特色：
 * - 集中管理所有上傳任務的狀態
 * - 提供狀態訂閱和通知機制
 * - 支援狀態持久化到本地存儲
 * - 處理狀態同步和衝突解決
 * - 提供詳細的狀態查詢和統計
 */

import { logger } from '@/lib/logger'

export type UploadStatus = 'pending' | 'uploading' | 'uploaded' | 'failed' | 'cancelled' | 'paused'

export interface UploadState {
  id: string
  fileId: string // CachedImage ID
  fileName: string
  fileSize: number
  status: UploadStatus
  progress: UploadProgress
  error?: Error
  retryCount: number
  maxRetries: number
  priority: Priority
  createdAt: number
  startedAt?: number
  completedAt?: number
  lastModified: number
  metadata: UploadMetadata
}

export interface UploadProgress {
  loaded: number // 已上傳位元組
  total: number // 總位元組數
  percentage: number // 百分比 0-100
  speed: number // 上傳速度 bytes/sec
  remainingTime: number // 剩餘時間 seconds
  estimatedFinishTime: number // 預估完成時間戳
}

export interface UploadMetadata {
  formId: string // 表單ID
  userId: string // 用戶ID
  sessionId: string // 會話ID
  uploadDecisionId?: string // 智慧決策ID
  source: 'manual' | 'auto' | 'retry' // 上傳來源
  networkType: string // 網路類型
  userAgent: string // 用戶代理
  context?: Record<string, any> // 額外上下文
}

export type Priority = 'low' | 'normal' | 'high' | 'critical'

export interface StateListener {
  (state: UploadState, previousState?: UploadState): void
}

export interface StateFilter {
  status?: UploadStatus[]
  priority?: Priority[]
  fileId?: string
  formId?: string
  userId?: string
  dateRange?: { start: number; end: number }
}

export interface StateStatistics {
  totalUploads: number
  byStatus: Record<UploadStatus, number>
  byPriority: Record<Priority, number>
  averageUploadTime: number
  successRate: number
  totalBytesUploaded: number
  currentActiveUploads: number
  pendingUploads: number
  failedUploads: number
}

export class UploadStateManager {
  private static instance: UploadStateManager

  // 狀態存儲
  private states = new Map<string, UploadState>()
  private listeners = new Set<StateListener>()
  private filteredListeners = new Map<string, { filter: StateFilter; callback: StateListener }>()

  // 持久化配置
  private readonly STORAGE_KEY = 'smart_upload_states'
  private readonly STORAGE_VERSION = '1.0'
  private readonly MAX_STORED_STATES = 1000
  private readonly STATE_RETENTION_DAYS = 7

  // 統計快取
  private statisticsCache: StateStatistics | null = null
  private statisticsCacheTimestamp = 0
  private readonly STATS_CACHE_TTL = 30000 // 30秒

  // 同步配置
  private syncInProgress = false
  private pendingUpdates = new Set<string>()

  /**
   * 單例模式
   */
  static getInstance(): UploadStateManager {
    if (!UploadStateManager.instance) {
      UploadStateManager.instance = new UploadStateManager()
    }
    return UploadStateManager.instance
  }

  constructor() {
    this.loadFromStorage()
    this.startSyncLoop()
    this.startCleanupLoop()
  }

  /**
   * 創建新的上傳狀態
   */
  createUploadState(config: {
    fileId: string
    fileName: string
    fileSize: number
    priority?: Priority
    maxRetries?: number
    metadata: Partial<UploadMetadata>
  }): UploadState {
    const id = this.generateStateId()
    const now = Date.now()

    const state: UploadState = {
      id,
      fileId: config.fileId,
      fileName: config.fileName,
      fileSize: config.fileSize,
      status: 'pending',
      progress: {
        loaded: 0,
        total: config.fileSize,
        percentage: 0,
        speed: 0,
        remainingTime: 0,
        estimatedFinishTime: 0,
      },
      retryCount: 0,
      maxRetries: config.maxRetries || 3,
      priority: config.priority || 'normal',
      createdAt: now,
      lastModified: now,
      metadata: {
        formId: config.metadata.formId || '',
        userId: config.metadata.userId || '',
        sessionId: config.metadata.sessionId || this.generateSessionId(),
        source: config.metadata.source || 'manual',
        networkType: config.metadata.networkType || 'unknown',
        userAgent: config.metadata.userAgent || this.getUserAgent(),
        ...config.metadata,
      },
    }

    this.setState(state)

    logger.info('創建上傳狀態', {
      metadata: {
        stateId: id,
        fileId: config.fileId,
        fileName: config.fileName,
        fileSize: this.formatBytes(config.fileSize),
        priority: config.priority,
      },
    })

    return state
  }

  /**
   * 更新上傳狀態
   */
  updateState(stateId: string, updates: Partial<Omit<UploadState, 'id' | 'createdAt'>>): boolean {
    const currentState = this.states.get(stateId)
    if (!currentState) {
      logger.warn('嘗試更新不存在的狀態', { metadata: { stateId } })
      return false
    }

    const previousState = { ...currentState }
    const newState: UploadState = {
      ...currentState,
      ...updates,
      lastModified: Date.now(),
    }

    // 特殊狀態轉換處理
    if (updates.status && updates.status !== currentState.status) {
      this.handleStatusTransition(newState, currentState.status, updates.status)
    }

    this.setState(newState)
    this.notifyListeners(newState, previousState)

    return true
  }

  /**
   * 更新上傳進度
   */
  updateProgress(stateId: string, progress: Partial<UploadProgress>): boolean {
    const state = this.states.get(stateId)
    if (!state || state.status !== 'uploading') {
      return false
    }

    const currentTime = Date.now()
    const newProgress: UploadProgress = {
      ...state.progress,
      ...progress,
    }

    // 計算上傳速度
    if (progress.loaded && progress.loaded > state.progress.loaded) {
      const timeDiff = (currentTime - (state.startedAt || state.createdAt)) / 1000
      if (timeDiff > 0) {
        newProgress.speed = progress.loaded / timeDiff
      }
    }

    // 計算剩餘時間
    if (newProgress.speed > 0) {
      const remaining = newProgress.total - newProgress.loaded
      newProgress.remainingTime = remaining / newProgress.speed
      newProgress.estimatedFinishTime = currentTime + newProgress.remainingTime * 1000
    }

    // 計算百分比
    if (newProgress.total > 0) {
      newProgress.percentage = Math.min((newProgress.loaded / newProgress.total) * 100, 100)
    }

    return this.updateState(stateId, {
      progress: newProgress,
      lastModified: currentTime,
    })
  }

  /**
   * 取得單一狀態
   */
  getState(stateId: string): UploadState | null {
    return this.states.get(stateId) || null
  }

  /**
   * 取得所有狀態
   */
  getAllStates(): UploadState[] {
    return Array.from(this.states.values())
  }

  /**
   * 根據條件篩選狀態
   */
  getFilteredStates(filter: StateFilter): UploadState[] {
    return this.getAllStates().filter(state => this.matchesFilter(state, filter))
  }

  /**
   * 刪除狀態
   */
  removeState(stateId: string): boolean {
    const state = this.states.get(stateId)
    if (!state) return false

    this.states.delete(stateId)
    this.pendingUpdates.add(stateId)
    this.invalidateStatisticsCache()

    logger.debug('移除上傳狀態', {
      metadata: { stateId, status: state.status },
    })

    return true
  }

  /**
   * 清理過期狀態
   */
  cleanup(maxAge?: number): number {
    const cutoff = Date.now() - (maxAge || this.STATE_RETENTION_DAYS * 24 * 60 * 60 * 1000)
    let cleanedCount = 0

    for (const [stateId, state] of this.states) {
      const shouldClean =
        state.lastModified < cutoff &&
        (state.status === 'uploaded' || state.status === 'failed' || state.status === 'cancelled')

      if (shouldClean) {
        this.removeState(stateId)
        cleanedCount++
      }
    }

    if (cleanedCount > 0) {
      logger.info('清理過期上傳狀態', {
        metadata: { cleanedCount, cutoffDate: new Date(cutoff).toISOString() },
      })
    }

    return cleanedCount
  }

  /**
   * 訂閱狀態變更
   */
  subscribe(listener: StateListener): () => void {
    this.listeners.add(listener)

    return () => {
      this.listeners.delete(listener)
    }
  }

  /**
   * 訂閱篩選後的狀態變更
   */
  subscribeFiltered(filter: StateFilter, listener: StateListener): () => void {
    const id = this.generateListenerId()
    this.filteredListeners.set(id, { filter, callback: listener })

    return () => {
      this.filteredListeners.delete(id)
    }
  }

  /**
   * 取得統計資料
   */
  getStatistics(): StateStatistics {
    const now = Date.now()

    // 使用快取的統計資料（如果未過期）
    if (this.statisticsCache && now - this.statisticsCacheTimestamp < this.STATS_CACHE_TTL) {
      return this.statisticsCache
    }

    const states = this.getAllStates()
    const stats: StateStatistics = {
      totalUploads: states.length,
      byStatus: {
        pending: 0,
        uploading: 0,
        uploaded: 0,
        failed: 0,
        cancelled: 0,
        paused: 0,
      },
      byPriority: {
        low: 0,
        normal: 0,
        high: 0,
        critical: 0,
      },
      averageUploadTime: 0,
      successRate: 0,
      totalBytesUploaded: 0,
      currentActiveUploads: 0,
      pendingUploads: 0,
      failedUploads: 0,
    }

    let totalUploadTime = 0
    let completedUploads = 0

    for (const state of states) {
      // 狀態統計
      stats.byStatus[state.status]++
      stats.byPriority[state.priority]++

      // 上傳時間統計
      if (state.completedAt && state.startedAt) {
        totalUploadTime += state.completedAt - state.startedAt
        completedUploads++
      }

      // 字節統計
      if (state.status === 'uploaded') {
        stats.totalBytesUploaded += state.fileSize
      }

      // 活動統計
      if (state.status === 'uploading' || state.status === 'paused') {
        stats.currentActiveUploads++
      }

      if (state.status === 'pending') {
        stats.pendingUploads++
      }

      if (state.status === 'failed') {
        stats.failedUploads++
      }
    }

    // 計算平均值
    if (completedUploads > 0) {
      stats.averageUploadTime = totalUploadTime / completedUploads
    }

    // 計算成功率
    if (stats.totalUploads > 0) {
      stats.successRate = (stats.byStatus.uploaded / stats.totalUploads) * 100
    }

    // 快取統計結果
    this.statisticsCache = stats
    this.statisticsCacheTimestamp = now

    return stats
  }

  /**
   * 匯出狀態資料
   */
  exportStates(filter?: StateFilter): { states: UploadState[]; metadata: any } {
    const states = filter ? this.getFilteredStates(filter) : this.getAllStates()

    return {
      states,
      metadata: {
        exportTime: Date.now(),
        version: this.STORAGE_VERSION,
        totalStates: states.length,
        statistics: this.getStatistics(),
      },
    }
  }

  /**
   * 匯入狀態資料
   */
  importStates(data: { states: UploadState[]; metadata?: any }): number {
    let importedCount = 0

    for (const state of data.states) {
      // 驗證狀態資料
      if (this.validateState(state)) {
        this.setState(state)
        importedCount++
      }
    }

    if (importedCount > 0) {
      this.saveToStorage()
      this.invalidateStatisticsCache()

      logger.info('匯入上傳狀態', {
        metadata: { importedCount, totalStates: data.states.length },
      })
    }

    return importedCount
  }

  /**
   * 私有方法：設定狀態
   */
  private setState(state: UploadState): void {
    this.states.set(state.id, state)
    this.pendingUpdates.add(state.id)
    this.invalidateStatisticsCache()
  }

  /**
   * 私有方法：處理狀態轉換
   */
  private handleStatusTransition(
    newState: UploadState,
    oldStatus: UploadStatus,
    newStatus: UploadStatus
  ): void {
    const now = Date.now()

    switch (newStatus) {
      case 'uploading':
        if (!newState.startedAt) {
          newState.startedAt = now
        }
        break

      case 'uploaded':
      case 'failed':
      case 'cancelled':
        if (!newState.completedAt) {
          newState.completedAt = now
        }
        break

      case 'failed':
        newState.retryCount++
        break
    }

    logger.debug('上傳狀態轉換', {
      metadata: {
        stateId: newState.id,
        oldStatus,
        newStatus,
        fileName: newState.fileName,
      },
    })
  }

  /**
   * 私有方法：通知監聽者
   */
  private notifyListeners(newState: UploadState, previousState?: UploadState): void {
    // 通知全域監聽者
    for (const listener of this.listeners) {
      try {
        listener(newState, previousState)
      } catch (error) {
        logger.error('狀態監聽者錯誤', error as Error, {
          metadata: { stateId: newState.id },
        })
      }
    }

    // 通知篩選監聽者
    for (const [id, { filter, callback }] of this.filteredListeners) {
      if (this.matchesFilter(newState, filter)) {
        try {
          callback(newState, previousState)
        } catch (error) {
          logger.error('篩選狀態監聽者錯誤', error as Error, {
            metadata: { stateId: newState.id, listenerId: id },
          })
        }
      }
    }
  }

  /**
   * 私有方法：檢查狀態是否符合篩選條件
   */
  private matchesFilter(state: UploadState, filter: StateFilter): boolean {
    if (filter.status && !filter.status.includes(state.status)) return false
    if (filter.priority && !filter.priority.includes(state.priority)) return false
    if (filter.fileId && state.fileId !== filter.fileId) return false
    if (filter.formId && state.metadata.formId !== filter.formId) return false
    if (filter.userId && state.metadata.userId !== filter.userId) return false

    if (filter.dateRange) {
      const timestamp = state.createdAt
      if (timestamp < filter.dateRange.start || timestamp > filter.dateRange.end) return false
    }

    return true
  }

  /**
   * 私有方法：驗證狀態資料
   */
  private validateState(state: any): state is UploadState {
    return (
      typeof state === 'object' &&
      typeof state.id === 'string' &&
      typeof state.fileId === 'string' &&
      typeof state.fileName === 'string' &&
      typeof state.fileSize === 'number' &&
      ['pending', 'uploading', 'uploaded', 'failed', 'cancelled', 'paused'].includes(
        state.status
      ) &&
      typeof state.progress === 'object' &&
      typeof state.retryCount === 'number' &&
      typeof state.createdAt === 'number'
    )
  }

  /**
   * 私有方法：從存儲載入
   */
  private loadFromStorage(): void {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY)
      if (!stored) return

      const data = JSON.parse(stored)
      if (data.version === this.STORAGE_VERSION) {
        for (const state of data.states) {
          if (this.validateState(state)) {
            this.states.set(state.id, state)
          }
        }

        logger.debug('從存儲載入狀態', {
          metadata: { loadedCount: this.states.size },
        })
      }
    } catch (error) {
      logger.error('載入存儲狀態失敗', error as Error)
    }
  }

  /**
   * 私有方法：保存到存儲
   */
  private saveToStorage(): void {
    try {
      const states = Array.from(this.states.values()).slice(-this.MAX_STORED_STATES) // 只保存最新的狀態

      const data = {
        version: this.STORAGE_VERSION,
        timestamp: Date.now(),
        states,
      }

      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(data))
    } catch (error) {
      logger.error('保存狀態到存儲失敗', error as Error)
    }
  }

  /**
   * 私有方法：開始同步循環
   */
  private startSyncLoop(): void {
    setInterval(async () => {
      if (!this.syncInProgress && this.pendingUpdates.size > 0) {
        this.syncInProgress = true

        try {
          this.saveToStorage()
          this.pendingUpdates.clear()
        } catch (error) {
          logger.error('狀態同步失敗', error as Error)
        } finally {
          this.syncInProgress = false
        }
      }
    }, 5000) // 每5秒同步一次
  }

  /**
   * 私有方法：開始清理循環
   */
  private startCleanupLoop(): void {
    setInterval(
      () => {
        try {
          this.cleanup()
        } catch (error) {
          logger.error('狀態清理循環錯誤', error as Error)
        }
      },
      60 * 60 * 1000
    ) // 每小時清理一次
  }

  /**
   * 私有方法：無效化統計快取
   */
  private invalidateStatisticsCache(): void {
    this.statisticsCache = null
    this.statisticsCacheTimestamp = 0
  }

  /**
   * 工具方法
   */
  private generateStateId(): string {
    return `state_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  private generateListenerId(): string {
    return `listener_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  private getUserAgent(): string {
    return typeof window !== 'undefined' ? window.navigator.userAgent : 'Unknown'
  }

  private formatBytes(bytes: number): string {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  /**
   * 重置所有狀態
   */
  reset(): void {
    this.states.clear()
    this.listeners.clear()
    this.filteredListeners.clear()
    this.pendingUpdates.clear()
    this.invalidateStatisticsCache()

    try {
      localStorage.removeItem(this.STORAGE_KEY)
    } catch (error) {
      logger.error('清除存儲失敗', error as Error)
    }

    logger.info('上傳狀態管理器已重置')
  }
}

/**
 * 導出單例實例
 */
export const uploadStateManager = UploadStateManager.getInstance()

/**
 * 便捷函數：創建上傳狀態
 */
export function createUploadState(
  config: Parameters<UploadStateManager['createUploadState']>[0]
): UploadState {
  return uploadStateManager.createUploadState(config)
}

/**
 * 便捷函數：更新上傳進度
 */
export function updateUploadProgress(stateId: string, progress: Partial<UploadProgress>): boolean {
  return uploadStateManager.updateProgress(stateId, progress)
}

/**
 * 便捷函數：獲取活躍上傳
 */
export function getActiveUploads(): UploadState[] {
  return uploadStateManager.getFilteredStates({
    status: ['uploading', 'paused'],
  })
}

/**
 * 便捷函數：獲取失敗上傳
 */
export function getFailedUploads(): UploadState[] {
  return uploadStateManager.getFilteredStates({
    status: ['failed'],
  })
}
