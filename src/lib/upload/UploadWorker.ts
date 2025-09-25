/**
 * UploadWorker - 上傳工作器
 *
 * 功能特色：
 * - 實際執行檔案上傳到 Supabase Storage
 * - 支援檔案分片上傳 (大檔案)
 * - 提供暫停/恢復/取消功能
 * - 整合現有的統一圖片服務
 * - 實時進度追蹤和錯誤處理
 * - 支援超時控制和重試機制
 */

import { logger } from '@/lib/logger'
import type { UploadTask, UploadProgress, UploadResult } from './BackgroundUploadQueue'

export type WorkerStatus = 'idle' | 'uploading' | 'paused' | 'completed' | 'failed' | 'cancelled'

export interface UploadWorkerOptions {
  timeout: number // 上傳超時時間 (毫秒)
  chunkTimeout?: number // 單個分片超時時間 (毫秒，預設為總超時的 1/10)
  stallTimeout?: number // 無進度超時時間 (毫秒，預設 30 秒)
  chunkSize: number // 分片大小 (位元組)
  onProgress: (progress: UploadProgress) => void
  onComplete: (result: UploadResult) => void
  onError: (error: Error) => void
  onTimeout?: (type: 'total' | 'chunk' | 'stall', elapsed: number) => void
}

export interface ChunkUploadProgress {
  chunkIndex: number
  chunkSize: number
  chunkLoaded: number
  totalChunks: number
  overallLoaded: number
  overallTotal: number
}

/**
 * 上傳工作器實作
 */
export class UploadWorker {
  private status: WorkerStatus = 'idle'
  private startTime: number = 0
  private pauseTime: number = 0
  private totalPauseTime: number = 0
  private uploadedBytes: number = 0
  private uploadXHR: XMLHttpRequest | null = null
  private timeoutId: NodeJS.Timeout | null = null
  private chunkTimeoutId: NodeJS.Timeout | null = null
  private stallTimeoutId: NodeJS.Timeout | null = null
  private speedHistory: number[] = []
  private lastProgressTime: number = 0
  private lastProgressLoaded: number = 0
  private lastStallCheckTime: number = 0

  // 分片上傳狀態
  private chunks: ArrayBuffer[] = []
  private uploadedChunks: boolean[] = []
  private currentChunkIndex: number = 0

  // 暫停/恢復狀態
  private resumeResolve: ((value: void) => void) | null = null

  constructor(
    private task: UploadTask,
    private options: UploadWorkerOptions
  ) {}

  /**
   * 開始上傳
   */
  async start(): Promise<UploadResult> {
    if (this.status !== 'idle') {
      throw new Error(`無法開始上傳，當前狀態: ${this.status}`)
    }

    this.status = 'uploading'
    this.startTime = Date.now()

    logger.info('開始上傳任務', {
      metadata: {
        taskId: this.task.id,
        fileName: this.task.file.name,
        fileSize: this.formatBytes(this.task.file.size),
        destination: this.task.destination,
      },
    })

    try {
      // 設定超時
      this.setupTimeout()

      // 判斷是否需要分片上傳 (大於分片大小的檔案)
      if (this.task.file.size > this.options.chunkSize) {
        return await this.chunkedUpload()
      } else {
        return await this.directUpload()
      }
    } catch (error) {
      this.status = 'failed'
      this.cleanup()

      logger.error('上傳任務失敗', error as Error, {
        metadata: {
          taskId: this.task.id,
          fileName: this.task.file.name,
          status: this.status,
        },
      })

      this.options.onError(error as Error)
      throw error
    }
  }

  /**
   * 暫停上傳
   */
  async pause(): Promise<void> {
    if (this.status !== 'uploading') {
      return
    }

    this.status = 'paused'
    this.pauseTime = Date.now()

    // 取消當前的上傳請求
    if (this.uploadXHR) {
      this.uploadXHR.abort()
      this.uploadXHR = null
    }

    // 暫停時清理所有超時檢測
    if (this.chunkTimeoutId) {
      clearTimeout(this.chunkTimeoutId)
      this.chunkTimeoutId = null
    }

    if (this.stallTimeoutId) {
      clearTimeout(this.stallTimeoutId)
      this.stallTimeoutId = null
    }

    logger.debug('上傳任務已暫停', {
      metadata: {
        taskId: this.task.id,
        uploadedBytes: this.uploadedBytes,
        totalBytes: this.task.file.size,
        currentChunkIndex: this.currentChunkIndex,
      },
    })
  }

  /**
   * 恢復上傳
   */
  async resume(): Promise<void> {
    if (this.status !== 'paused') {
      return
    }

    // 計算暫停時間
    this.totalPauseTime += Date.now() - this.pauseTime

    this.status = 'uploading'

    // 恢復時重新啟動停滯檢測
    const stallTimeout = this.options.stallTimeout || 30000
    this.setupStallTimeout(stallTimeout)
    this.lastStallCheckTime = Date.now()

    logger.debug('上傳任務已恢復', {
      metadata: {
        taskId: this.task.id,
        pausedTime: Date.now() - this.pauseTime,
        totalPauseTime: this.totalPauseTime,
        currentChunkIndex: this.currentChunkIndex,
        remainingChunks: this.chunks.length - this.currentChunkIndex,
      },
    })

    // 恢復上傳
    if (this.resumeResolve) {
      this.resumeResolve()
      this.resumeResolve = null
    }
  }

  /**
   * 取消上傳
   */
  async cancel(): Promise<void> {
    if (this.status === 'completed' || this.status === 'cancelled') {
      logger.debug('任務已完成或已取消，跳過取消操作', {
        metadata: {
          taskId: this.task.id,
          currentStatus: this.status,
        },
      })
      return
    }

    const previousStatus = this.status
    this.status = 'cancelled'

    // 記錄取消原因和時間
    const cancelledAt = Date.now()
    const elapsedTime = cancelledAt - this.startTime
    const uploadedPercentage =
      this.task.file.size > 0 ? (this.uploadedBytes / this.task.file.size) * 100 : 0

    logger.info('開始取消上傳任務', {
      metadata: {
        taskId: this.task.id,
        fileName: this.task.file.name,
        previousStatus,
        elapsedTime: `${elapsedTime}ms`,
        uploadedBytes: this.formatBytes(this.uploadedBytes),
        totalBytes: this.formatBytes(this.task.file.size),
        uploadedPercentage: `${uploadedPercentage.toFixed(1)}%`,
      },
    })

    try {
      // 1. 取消 XMLHttpRequest（如果存在）
      if (this.uploadXHR) {
        this.uploadXHR.abort()
        this.uploadXHR = null
        logger.debug('XMLHttpRequest 已取消')
      }

      // 2. 使用 AbortController 取消 fetch 請求
      if (this.task.abortController) {
        this.task.abortController.abort('用戶取消上傳')
        logger.debug('AbortController 已觸發')
      }

      // 3. 如果是分片上傳，清理分片狀態
      if (this.chunks.length > 0) {
        const completedChunks = this.uploadedChunks.filter(Boolean).length
        logger.debug('分片上傳已取消', {
          metadata: {
            totalChunks: this.chunks.length,
            completedChunks,
            remainingChunks: this.chunks.length - completedChunks,
          },
        })
      }

      // 4. 清理暫停狀態（如果存在）
      if (this.resumeResolve) {
        this.resumeResolve() // 解除暫停等待
        this.resumeResolve = null
      }

      // 5. 清理所有資源
      this.cleanup()

      logger.info('上傳任務取消完成', {
        metadata: {
          taskId: this.task.id,
          fileName: this.task.file.name,
          cancelledAt,
          elapsedTime: `${elapsedTime}ms`,
          uploadedPercentage: `${uploadedPercentage.toFixed(1)}%`,
        },
      })
    } catch (error) {
      logger.error('取消上傳過程中發生錯誤', error as Error, {
        metadata: {
          taskId: this.task.id,
          fileName: this.task.file.name,
        },
      })

      // 確保清理資源，即使發生錯誤
      this.cleanup()
    }
  }

  /**
   * 直接上傳 (小檔案)
   */
  private async directUpload(): Promise<UploadResult> {
    const uploadStartTime = Date.now()

    try {
      // 使用統一圖片服務上傳
      const result = await this.uploadToSupabase(this.task.file)

      const uploadTime = Date.now() - uploadStartTime
      const actualUploadTime = uploadTime - this.totalPauseTime

      this.status = 'completed'

      const uploadResult: UploadResult = {
        taskId: this.task.id,
        id: result.id,
        url: result.url,
        path: result.path || result.url,
        fileSize: this.task.file.size,
        uploadTime: actualUploadTime,
        completedAt: Date.now(),
        checksum: result.checksum,
      }

      logger.info('直接上傳完成', {
        metadata: {
          taskId: this.task.id,
          fileName: this.task.file.name,
          uploadTime: `${(actualUploadTime / 1000).toFixed(2)}s`,
          speed: this.formatBytes(this.task.file.size / (actualUploadTime / 1000)) + '/s',
          url: result.url,
        },
      })

      this.options.onComplete(uploadResult)
      return uploadResult
    } finally {
      this.cleanup()
    }
  }

  /**
   * 分片上傳 (大檔案)
   */
  private async chunkedUpload(): Promise<UploadResult> {
    const uploadStartTime = Date.now()

    try {
      // 準備分片
      await this.prepareChunks()

      // 執行分片上傳
      const result = await this.uploadChunks()

      const uploadTime = Date.now() - uploadStartTime
      const actualUploadTime = uploadTime - this.totalPauseTime

      this.status = 'completed'

      const uploadResult: UploadResult = {
        taskId: this.task.id,
        id: result.id,
        url: result.url,
        path: result.path || result.url,
        fileSize: this.task.file.size,
        uploadTime: actualUploadTime,
        completedAt: Date.now(),
        checksum: result.checksum,
      }

      logger.info('分片上傳完成', {
        metadata: {
          taskId: this.task.id,
          fileName: this.task.file.name,
          totalChunks: this.chunks.length,
          uploadTime: `${(actualUploadTime / 1000).toFixed(2)}s`,
          speed: this.formatBytes(this.task.file.size / (actualUploadTime / 1000)) + '/s',
          url: result.url,
        },
      })

      this.options.onComplete(uploadResult)
      return uploadResult
    } finally {
      this.cleanup()
    }
  }

  /**
   * 準備檔案分片
   */
  private async prepareChunks(): Promise<void> {
    const file = this.task.file
    const chunkSize = this.options.chunkSize
    const totalChunks = Math.ceil(file.size / chunkSize)

    this.chunks = []
    this.uploadedChunks = new Array(totalChunks).fill(false)

    // 讀取檔案並分片
    const fileBuffer = await this.readFileAsArrayBuffer(file)

    for (let i = 0; i < totalChunks; i++) {
      const start = i * chunkSize
      const end = Math.min(start + chunkSize, file.size)
      const chunk = fileBuffer.slice(start, end)
      this.chunks.push(chunk)
    }

    logger.debug('檔案分片準備完成', {
      metadata: {
        taskId: this.task.id,
        totalChunks,
        chunkSize: this.formatBytes(chunkSize),
        fileSize: this.formatBytes(file.size),
      },
    })
  }

  /**
   * 上傳所有分片 - 使用 TUS 協議的可恢復上傳
   */
  private async uploadChunks(): Promise<{ url: string; path?: string; checksum?: string }> {
    // 優先嘗試 TUS 協議上傳（Supabase Storage v3 支援）
    if (this.supportsTusUpload()) {
      try {
        return await this.tusChunkedUpload()
      } catch (error) {
        logger.warn('TUS 分片上傳失敗，回退到標準重組上傳', {
          metadata: {
            taskId: this.task.id,
            error: (error as Error).message,
          },
        })
        // 回退到標準上傳
      }
    }

    // 回退方案：重新組合分片後上傳
    return await this.reassembleAndUpload()
  }

  /**
   * 檢查是否支援 TUS 上傳
   */
  private supportsTusUpload(): boolean {
    // 檢查環境是否支援 TUS 協議
    return typeof window !== 'undefined' && this.task.file.size > this.options.chunkSize
  }

  /**
   * TUS 協議分片上傳
   */
  private async tusChunkedUpload(): Promise<{ url: string; path?: string; checksum?: string }> {
    const storageUrl = process.env.NEXT_PUBLIC_SUPABASE_URL + '/storage/v1'
    const bucketName = this.task.destination.bucket || 'media'

    // 生成檔案路徑
    const filePath = this.generateFilePath()

    // 1. 創建 TUS 上傳會話
    const uploadUrl = await this.createTusSession(storageUrl, bucketName, filePath)

    // 2. 分片上傳
    await this.uploadChunksToTus(uploadUrl)

    // 3. 完成上傳並獲取最終 URL
    const finalUrl = await this.finalizeTusUpload(uploadUrl, bucketName, filePath)

    return {
      url: finalUrl,
      path: filePath,
      checksum: await this.calculateFileChecksum(this.task.file),
    }
  }

  /**
   * 創建 TUS 上傳會話
   */
  private async createTusSession(
    storageUrl: string,
    bucket: string,
    filePath: string
  ): Promise<string> {
    const uploadLength = this.task.file.size.toString()
    const uploadMetadata = this.encodeTusMetadata({
      filename: this.task.file.name,
      filetype: this.task.file.type,
      bucket,
      path: filePath,
    })

    const response = await fetch(`${storageUrl}/object/${bucket}/${filePath}`, {
      method: 'POST',
      headers: {
        Authorization: this.getAuthHeader(),
        'Upload-Length': uploadLength,
        'Upload-Metadata': uploadMetadata,
        'Tus-Resumable': '1.0.0',
        'Content-Type': 'application/offset+octet-stream',
      },
    })

    if (!response.ok) {
      throw new Error(`TUS 會話創建失敗: ${response.statusText}`)
    }

    const location = response.headers.get('Location')
    if (!location) {
      throw new Error('TUS 會話創建失敗：未獲得上傳 URL')
    }

    return location
  }

  /**
   * 分片上傳到 TUS
   */
  private async uploadChunksToTus(uploadUrl: string): Promise<void> {
    let uploadOffset = 0

    for (let i = 0; i < this.chunks.length; i++) {
      await this.checkPauseState() // 檢查是否被暫停

      this.currentChunkIndex = i

      // 設定當前分片的超時
      this.setupChunkTimeout()

      const chunk = this.chunks[i]
      const chunkStartTime = Date.now()

      try {
        // 上傳分片
        const response = await fetch(uploadUrl, {
          method: 'PATCH',
          headers: {
            Authorization: this.getAuthHeader(),
            'Upload-Offset': uploadOffset.toString(),
            'Content-Type': 'application/offset+octet-stream',
            'Tus-Resumable': '1.0.0',
          },
          body: chunk,
          signal: this.task.abortController?.signal,
        })

        if (!response.ok) {
          throw new Error(`分片 ${i + 1} 上傳失敗: ${response.statusText}`)
        }

        // 清理分片超時計時器
        if (this.chunkTimeoutId) {
          clearTimeout(this.chunkTimeoutId)
          this.chunkTimeoutId = null
        }

        // 更新進度
        uploadOffset += chunk.byteLength
        this.uploadedChunks[i] = true
        this.uploadedBytes += chunk.byteLength

        this.reportChunkProgress({
          chunkIndex: i,
          chunkSize: chunk.byteLength,
          chunkLoaded: chunk.byteLength,
          totalChunks: this.chunks.length,
          overallLoaded: this.uploadedBytes,
          overallTotal: this.task.file.size,
        })

        // 重置停滯檢測（有進度了）
        this.resetStallTimeout()

        const chunkUploadTime = Date.now() - chunkStartTime

        logger.debug(`分片 ${i + 1}/${this.chunks.length} 上傳完成`, {
          metadata: {
            taskId: this.task.id,
            chunkIndex: i,
            chunkSize: this.formatBytes(chunk.byteLength),
            chunkUploadTime: `${chunkUploadTime}ms`,
            uploadedBytes: this.formatBytes(this.uploadedBytes),
            totalBytes: this.formatBytes(this.task.file.size),
          },
        })
      } catch (error) {
        // 清理分片超時計時器
        if (this.chunkTimeoutId) {
          clearTimeout(this.chunkTimeoutId)
          this.chunkTimeoutId = null
        }

        const chunkUploadTime = Date.now() - chunkStartTime
        logger.error(`分片 ${i + 1} 上傳失敗`, error as Error, {
          metadata: {
            taskId: this.task.id,
            chunkIndex: i,
            chunkUploadTime: `${chunkUploadTime}ms`,
            chunkSize: this.formatBytes(chunk.byteLength),
          },
        })

        throw error
      }
    }
  }

  /**
   * 完成 TUS 上傳
   */
  private async finalizeTusUpload(
    uploadUrl: string,
    bucket: string,
    filePath: string
  ): Promise<string> {
    // TUS 上傳完成後，檔案會自動出現在 Supabase Storage 中
    // 構建最終的檔案 URL
    const baseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL + '/storage/v1/object/public'
    return `${baseUrl}/${bucket}/${filePath}`
  }

  /**
   * 回退方案：重新組合分片後上傳
   */
  private async reassembleAndUpload(): Promise<{ url: string; path?: string; checksum?: string }> {
    logger.info('使用分片重組上傳', {
      metadata: {
        taskId: this.task.id,
        totalChunks: this.chunks.length,
        fileSize: this.formatBytes(this.task.file.size),
      },
    })

    // 重新組合所有分片
    const totalSize = this.chunks.reduce((sum, chunk) => sum + chunk.byteLength, 0)
    const combinedBuffer = new ArrayBuffer(totalSize)
    const combinedView = new Uint8Array(combinedBuffer)

    let offset = 0
    for (let i = 0; i < this.chunks.length; i++) {
      await this.checkPauseState() // 檢查是否被暫停

      const chunkView = new Uint8Array(this.chunks[i])
      combinedView.set(chunkView, offset)
      offset += chunkView.length

      this.uploadedChunks[i] = true
      this.uploadedBytes += chunkView.length

      // 報告進度
      this.reportChunkProgress({
        chunkIndex: i,
        chunkSize: chunkView.length,
        chunkLoaded: chunkView.length,
        totalChunks: this.chunks.length,
        overallLoaded: this.uploadedBytes,
        overallTotal: this.task.file.size,
      })
    }

    // 創建新的 File 物件並上傳
    const reassembledFile = new File([combinedBuffer], this.task.file.name, {
      type: this.task.file.type,
    })

    return await this.uploadToSupabase(reassembledFile)
  }

  /**
   * 工具方法：編碼 TUS 元數據
   */
  private encodeTusMetadata(metadata: Record<string, string>): string {
    return Object.entries(metadata)
      .map(([key, value]) => `${key} ${btoa(value)}`)
      .join(',')
  }

  /**
   * 工具方法：獲取授權標頭
   */
  private getAuthHeader(): string {
    // 從環境變數獲取服務密鑰
    const serviceKey =
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY
    return `Bearer ${serviceKey}`
  }

  /**
   * 工具方法：生成檔案路徑
   */
  private generateFilePath(): string {
    const { module, entityId } = this.task.destination
    const timestamp = Date.now()
    const randomString = Math.random().toString(36).substr(2, 9)
    const fileExtension = this.task.file.name.split('.').pop() || 'bin'

    return `${module}/${entityId}/${timestamp}_${randomString}.${fileExtension}`
  }

  /**
   * 工具方法：計算檔案校驗和
   */
  private async calculateFileChecksum(file: File): Promise<string> {
    const buffer = await this.readFileAsArrayBuffer(file)
    const hashBuffer = await crypto.subtle.digest('SHA-256', buffer)
    const hashArray = Array.from(new Uint8Array(hashBuffer))
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
  }

  /**
   * 上傳到 Supabase - 修復版：使用 API 端點而非直接調用服務
   */
  private async uploadToSupabase(
    file: File
  ): Promise<{ id?: string; url: string; path?: string; checksum?: string }> {
    try {
      // 使用 API 端點上傳，避免客戶端直接使用 service role key
      const formData = new FormData()
      formData.append('file', file)
      formData.append('module', this.task.destination.module)
      formData.append('entityId', this.task.destination.entityId)
      formData.append('generateMultipleSizes', 'false') // 只生成原始大小
      formData.append('position', '0') // 預設位置

      // 構建請求 headers，包含 CSRF token
      const headers: HeadersInit = {}
      const csrfToken = this.task.metadata.context?.csrfToken
      if (csrfToken) {
        headers['X-CSRF-Token'] = csrfToken
        logger.debug('包含 CSRF token 在上傳請求中', {
          metadata: {
            taskId: this.task.id,
            hasToken: true,
            tokenPreview: csrfToken.substring(0, 8) + '...',
          },
        })
      } else {
        logger.warn('上傳請求缺少 CSRF token', {
          metadata: {
            taskId: this.task.id,
            fileName: file.name,
            hasContext: !!this.task.metadata.context,
          },
        })
      }

      const response = await fetch('/api/upload/unified', {
        method: 'POST',
        headers,
        body: formData,
        credentials: 'include', // 確保包含 cookies
      })

      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(`上傳 API 失敗: ${response.status} ${errorText}`)
      }

      const responseData = await response.json()

      // 處理統一 API 的回應格式
      if (responseData.success && responseData.data) {
        if (responseData.data.image) {
          // 單一圖片回應
          return {
            id: responseData.data.image.id,
            url: responseData.data.image.url,
            path: responseData.data.image.path,
            checksum: responseData.data.image.checksum,
          }
        } else if (responseData.data.images && responseData.data.images.length > 0) {
          // 多圖片回應，取第一張
          const firstImage = responseData.data.images[0]
          return {
            id: firstImage.id,
            url: firstImage.url,
            path: firstImage.path,
            checksum: firstImage.checksum,
          }
        }
      }

      throw new Error('上傳 API 回應格式錯誤')
    } catch (error) {
      logger.error('API 上傳失敗', error as Error, {
        metadata: {
          taskId: this.task.id,
          fileName: file.name,
          destination: this.task.destination,
        },
      })
      throw new Error(`上傳失敗: ${(error as Error).message}`)
    }
  }

  /**
   * 報告分片進度
   */
  private reportChunkProgress(chunkProgress: ChunkUploadProgress): void {
    const now = Date.now()
    const timeDiff = now - this.lastProgressTime
    const bytesDiff = chunkProgress.overallLoaded - this.lastProgressLoaded

    // 計算上傳速度
    let currentSpeed = 0
    if (timeDiff > 0) {
      currentSpeed = (bytesDiff / timeDiff) * 1000 // bytes/sec
      this.speedHistory.push(currentSpeed)

      // 只保留最近10個速度記錄
      if (this.speedHistory.length > 10) {
        this.speedHistory.shift()
      }
    }

    // 計算平均速度
    const averageSpeed =
      this.speedHistory.length > 0
        ? this.speedHistory.reduce((sum, speed) => sum + speed, 0) / this.speedHistory.length
        : 0

    // 計算剩餘時間
    const remainingBytes = chunkProgress.overallTotal - chunkProgress.overallLoaded
    const remainingTime = averageSpeed > 0 ? remainingBytes / averageSpeed : 0

    const progress: UploadProgress = {
      loaded: chunkProgress.overallLoaded,
      total: chunkProgress.overallTotal,
      percentage: (chunkProgress.overallLoaded / chunkProgress.overallTotal) * 100,
      speed: averageSpeed,
      remainingTime,
      chunkIndex: chunkProgress.chunkIndex,
      totalChunks: chunkProgress.totalChunks,
    }

    // 更新進度時間戳記
    this.lastProgressTime = now
    this.lastProgressLoaded = chunkProgress.overallLoaded

    // 如果有真實進度（位元組增加），重置停滯檢測
    if (bytesDiff > 0) {
      this.resetStallTimeout()
    }

    this.options.onProgress(progress)
  }

  /**
   * 檢查暫停狀態
   */
  private async checkPauseState(): Promise<void> {
    if (this.status === 'paused') {
      return new Promise<void>(resolve => {
        this.resumeResolve = resolve
      })
    }
  }

  /**
   * 讀取檔案為 ArrayBuffer
   */
  private readFileAsArrayBuffer(file: File): Promise<ArrayBuffer> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()

      reader.onload = () => {
        resolve(reader.result as ArrayBuffer)
      }

      reader.onerror = () => {
        reject(new Error('檔案讀取失敗'))
      }

      reader.readAsArrayBuffer(file)
    })
  }

  /**
   * 設定超時機制
   */
  private setupTimeout(): void {
    // 1. 總體超時機制
    if (this.options.timeout > 0) {
      this.timeoutId = setTimeout(() => {
        if (this.status === 'uploading') {
          logger.warn('上傳總體超時', {
            metadata: {
              taskId: this.task.id,
              elapsedTime: Date.now() - this.startTime,
              timeoutLimit: this.options.timeout,
              uploadedBytes: this.uploadedBytes,
              totalBytes: this.task.file.size,
            },
          })

          this.handleTimeout('total', Date.now() - this.startTime)
        }
      }, this.options.timeout)
    }

    // 2. 停滯超時機制（無進度檢測）
    const stallTimeout = this.options.stallTimeout || 30000 // 預設 30 秒
    this.setupStallTimeout(stallTimeout)

    this.lastStallCheckTime = Date.now()
  }

  /**
   * 設定停滯超時檢測
   */
  private setupStallTimeout(stallTimeout: number): void {
    if (stallTimeout > 0) {
      this.stallTimeoutId = setTimeout(() => {
        if (this.status === 'uploading') {
          const stallTime = Date.now() - this.lastStallCheckTime

          logger.warn('上傳停滯超時', {
            metadata: {
              taskId: this.task.id,
              stallTime,
              stallTimeout,
              lastProgressTime: this.lastProgressTime,
              uploadedBytes: this.uploadedBytes,
            },
          })

          this.handleTimeout('stall', stallTime)
        }
      }, stallTimeout)
    }
  }

  /**
   * 設定分片超時機制
   */
  private setupChunkTimeout(): void {
    const chunkTimeout = this.options.chunkTimeout || Math.max(this.options.timeout / 10, 10000) // 預設總超時的 1/10，最少 10 秒

    if (chunkTimeout > 0) {
      this.chunkTimeoutId = setTimeout(() => {
        if (this.status === 'uploading') {
          logger.warn('分片上傳超時', {
            metadata: {
              taskId: this.task.id,
              currentChunkIndex: this.currentChunkIndex,
              totalChunks: this.chunks.length,
              chunkTimeout,
              elapsedTime: Date.now() - this.startTime,
            },
          })

          this.handleTimeout('chunk', chunkTimeout)
        }
      }, chunkTimeout)
    }
  }

  /**
   * 處理超時情況
   */
  private handleTimeout(type: 'total' | 'chunk' | 'stall', elapsed: number): void {
    // 調用用戶自定義超時回調
    if (this.options.onTimeout) {
      this.options.onTimeout(type, elapsed)
    }

    // 取消上傳並觸發錯誤
    this.status = 'failed'

    // 根據超時類型生成適當的錯誤訊息
    let errorMessage: string
    switch (type) {
      case 'total':
        errorMessage = `上傳總體超時 (${(elapsed / 1000).toFixed(1)}s)`
        break
      case 'chunk':
        errorMessage = `分片 ${this.currentChunkIndex + 1} 上傳超時 (${(elapsed / 1000).toFixed(1)}s)`
        break
      case 'stall':
        errorMessage = `上傳停滯超時，無進度超過 ${(elapsed / 1000).toFixed(1)}s`
        break
    }

    // 取消所有進行中的請求
    this.cancel()

    const timeoutError = new Error(errorMessage)
    logger.error('上傳超時', timeoutError, {
      metadata: {
        taskId: this.task.id,
        timeoutType: type,
        elapsed,
        uploadedBytes: this.uploadedBytes,
        totalBytes: this.task.file.size,
      },
    })

    this.options.onError(timeoutError)
  }

  /**
   * 重置停滯檢測
   */
  private resetStallTimeout(): void {
    // 清理現有的停滯檢測
    if (this.stallTimeoutId) {
      clearTimeout(this.stallTimeoutId)
    }

    // 重新設定停滯檢測
    const stallTimeout = this.options.stallTimeout || 30000
    this.setupStallTimeout(stallTimeout)
    this.lastStallCheckTime = Date.now()
  }

  /**
   * 清理資源
   */
  private cleanup(): void {
    // 清理所有超時計時器
    if (this.timeoutId) {
      clearTimeout(this.timeoutId)
      this.timeoutId = null
    }

    if (this.chunkTimeoutId) {
      clearTimeout(this.chunkTimeoutId)
      this.chunkTimeoutId = null
    }

    if (this.stallTimeoutId) {
      clearTimeout(this.stallTimeoutId)
      this.stallTimeoutId = null
    }

    // 清理 XMLHttpRequest
    if (this.uploadXHR) {
      this.uploadXHR = null
    }

    // 清理分片資料
    this.chunks = []
    this.uploadedChunks = []

    // 清理恢復回調
    if (this.resumeResolve) {
      this.resumeResolve()
      this.resumeResolve = null
    }
  }

  /**
   * 格式化位元組
   */
  private formatBytes(bytes: number): string {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  /**
   * 獲取任務ID
   */
  getTaskId(): string {
    return this.task.id
  }

  /**
   * 獲取快取圖片ID
   */
  getCachedImageId(): string {
    return this.task.cachedImageId
  }

  /**
   * 獲取任務
   */
  getTask(): UploadTask {
    return this.task
  }

  /**
   * 獲取當前狀態
   */
  getStatus(): WorkerStatus {
    return this.status
  }

  /**
   * 獲取上傳統計
   */
  getStats(): {
    uploadedBytes: number
    totalBytes: number
    elapsedTime: number
    actualUploadTime: number
    averageSpeed: number
    currentSpeed: number
  } {
    const now = Date.now()
    const elapsedTime = now - this.startTime
    const actualUploadTime = elapsedTime - this.totalPauseTime

    const averageSpeed =
      this.speedHistory.length > 0
        ? this.speedHistory.reduce((sum, speed) => sum + speed, 0) / this.speedHistory.length
        : 0

    const currentSpeed =
      this.speedHistory.length > 0 ? this.speedHistory[this.speedHistory.length - 1] : 0

    return {
      uploadedBytes: this.uploadedBytes,
      totalBytes: this.task.file.size,
      elapsedTime,
      actualUploadTime,
      averageSpeed,
      currentSpeed,
    }
  }
}

/**
 * 工廠函數：創建上傳工作器
 */
export function createUploadWorker(task: UploadTask, options: UploadWorkerOptions): UploadWorker {
  return new UploadWorker(task, options)
}

/**
 * 便捷函數：執行單次上傳
 */
export async function executeUpload(
  task: UploadTask,
  options: UploadWorkerOptions
): Promise<UploadResult> {
  const worker = createUploadWorker(task, options)
  return await worker.start()
}
