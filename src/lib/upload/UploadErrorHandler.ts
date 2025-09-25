import { logger } from '@/lib/logger'

export type UploadErrorType =
  | 'network' // 網路連線問題
  | 'file_size' // 檔案大小超出限制
  | 'file_type' // 不支援的檔案類型
  | 'storage_full' // 儲存空間不足
  | 'permission' // 權限不足
  | 'server' // 伺服器內部錯誤
  | 'timeout' // 上傳逾時
  | 'cancelled' // 用戶取消
  | 'quota_exceeded' // 超出配額
  | 'unknown' // 未知錯誤

export interface UploadError {
  type: UploadErrorType
  message: string
  details?: string
  retryable: boolean
  userFriendlyMessage: string
  suggestedAction: string
  errorCode?: string
}

export interface RetryOptions {
  maxRetries: number
  baseDelay: number
  backoffMultiplier: number
  maxDelay: number
  retryableErrors: UploadErrorType[]
}

/**
 * 上傳錯誤處理器
 *
 * 功能特色：
 * - 智慧錯誤分類和診斷
 * - 用戶友好的錯誤訊息
 * - 自動重試策略
 * - 錯誤恢復建議
 */
export class UploadErrorHandler {
  private static readonly DEFAULT_RETRY_OPTIONS: RetryOptions = {
    maxRetries: 3,
    baseDelay: 1000, // 1秒
    backoffMultiplier: 2,
    maxDelay: 30000, // 30秒
    retryableErrors: ['network', 'server', 'timeout', 'storage_full'],
  }

  private static readonly ERROR_MESSAGES: Record<
    UploadErrorType,
    {
      message: string
      userFriendlyMessage: string
      suggestedAction: string
    }
  > = {
    network: {
      message: '網路連線問題',
      userFriendlyMessage: '網路連線不穩定，上傳失敗',
      suggestedAction: '請檢查網路連線，然後重試上傳',
    },
    file_size: {
      message: '檔案大小超出限制',
      userFriendlyMessage: '檔案過大，無法上傳',
      suggestedAction: '請選擇較小的檔案（建議小於10MB）',
    },
    file_type: {
      message: '不支援的檔案類型',
      userFriendlyMessage: '檔案格式不支援',
      suggestedAction: '請選擇JPG、PNG或GIF格式的圖片',
    },
    storage_full: {
      message: '儲存空間不足',
      userFriendlyMessage: '伺服器儲存空間不足',
      suggestedAction: '請稍後再試，或聯繫系統管理員',
    },
    permission: {
      message: '權限不足',
      userFriendlyMessage: '沒有上傳權限',
      suggestedAction: '請聯繫管理員獲取上傳權限',
    },
    server: {
      message: '伺服器內部錯誤',
      userFriendlyMessage: '伺服器發生錯誤',
      suggestedAction: '請稍後重試，如問題持續請聯繫技術支援',
    },
    timeout: {
      message: '上傳逾時',
      userFriendlyMessage: '上傳時間過長，操作逾時',
      suggestedAction: '請檢查網路連線，然後重試',
    },
    cancelled: {
      message: '用戶取消上傳',
      userFriendlyMessage: '上傳已取消',
      suggestedAction: '如需上傳，請重新選擇檔案',
    },
    quota_exceeded: {
      message: '超出上傳配額',
      userFriendlyMessage: '已達到上傳數量限制',
      suggestedAction: '請刪除一些現有圖片後再上傳',
    },
    unknown: {
      message: '未知錯誤',
      userFriendlyMessage: '發生未知錯誤',
      suggestedAction: '請重試，如問題持續請聯繫技術支援',
    },
  }

  /**
   * 分析錯誤並返回結構化錯誤資訊
   */
  static analyzeError(
    error: any,
    context?: {
      fileName?: string
      fileSize?: number
      fileType?: string
      uploadUrl?: string
      attemptNumber?: number
    }
  ): UploadError {
    let errorType: UploadErrorType = 'unknown'
    let details = ''
    let errorCode = ''

    // HTTP 狀態碼錯誤分析
    if (error.status || error.statusCode) {
      const status = error.status || error.statusCode
      errorCode = `HTTP_${status}`

      switch (status) {
        case 400:
          errorType = 'file_type'
          details = '請求格式錯誤或檔案不符合要求'
          break
        case 401:
        case 403:
          errorType = 'permission'
          details = '認證失敗或權限不足'
          break
        case 413:
          errorType = 'file_size'
          details = '檔案大小超出伺服器限制'
          break
        case 429:
          errorType = 'quota_exceeded'
          details = '請求過於頻繁或超出配額'
          break
        case 500:
        case 502:
        case 503:
          errorType = 'server'
          details = `伺服器錯誤 (${status})`
          break
        case 504:
          errorType = 'timeout'
          details = '伺服器回應逾時'
          break
        default:
          errorType = 'unknown'
          details = `HTTP 錯誤: ${status}`
      }
    }
    // 網路錯誤分析
    else if (error.message) {
      const message = error.message.toLowerCase()

      if (message.includes('network') || message.includes('fetch')) {
        errorType = 'network'
        details = '網路連線中斷或不穩定'
      } else if (message.includes('timeout') || message.includes('時間')) {
        errorType = 'timeout'
        details = '操作逾時'
      } else if (message.includes('cancel') || message.includes('abort')) {
        errorType = 'cancelled'
        details = '操作被取消'
      } else if (message.includes('size') || message.includes('large')) {
        errorType = 'file_size'
        details = '檔案大小問題'
      } else if (message.includes('type') || message.includes('format')) {
        errorType = 'file_type'
        details = '檔案類型問題'
      } else if (message.includes('storage') || message.includes('space')) {
        errorType = 'storage_full'
        details = '儲存空間問題'
      }
    }

    // 檔案大小檢查
    if (context?.fileSize && context.fileSize > 10 * 1024 * 1024) {
      // 10MB
      errorType = 'file_size'
      details = `檔案大小: ${(context.fileSize / 1024 / 1024).toFixed(1)}MB，超出建議限制`
    }

    // 檔案類型檢查
    if (
      context?.fileType &&
      !['image/jpeg', 'image/png', 'image/gif', 'image/webp'].includes(context.fileType)
    ) {
      errorType = 'file_type'
      details = `不支援的檔案類型: ${context.fileType}`
    }

    const errorInfo = this.ERROR_MESSAGES[errorType]
    const retryable = this.DEFAULT_RETRY_OPTIONS.retryableErrors.includes(errorType)

    const uploadError: UploadError = {
      type: errorType,
      message: errorInfo.message,
      details,
      retryable,
      userFriendlyMessage: errorInfo.userFriendlyMessage,
      suggestedAction: errorInfo.suggestedAction,
      errorCode,
    }

    // 記錄錯誤詳情
    logger.error('上傳錯誤分析', error, {
      metadata: {
        errorType,
        retryable,
        fileName: context?.fileName,
        fileSize: context?.fileSize,
        attemptNumber: context?.attemptNumber,
        errorCode,
      },
    })

    return uploadError
  }

  /**
   * 判斷是否應該重試
   */
  static shouldRetry(
    error: UploadError,
    attemptNumber: number,
    options?: Partial<RetryOptions>
  ): boolean {
    const opts = { ...this.DEFAULT_RETRY_OPTIONS, ...options }

    if (attemptNumber >= opts.maxRetries) {
      return false
    }

    if (!opts.retryableErrors.includes(error.type)) {
      return false
    }

    return true
  }

  /**
   * 計算重試延遲時間
   */
  static getRetryDelay(attemptNumber: number, options?: Partial<RetryOptions>): number {
    const opts = { ...this.DEFAULT_RETRY_OPTIONS, ...options }

    const delay = Math.min(
      opts.baseDelay * Math.pow(opts.backoffMultiplier, attemptNumber - 1),
      opts.maxDelay
    )

    // 添加隨機抖動避免同時重試
    const jitter = Math.random() * 0.1 * delay
    return Math.floor(delay + jitter)
  }

  /**
   * 建立錯誤恢復建議
   */
  static getRecoveryActions(
    error: UploadError,
    context?: {
      networkStatus?: 'online' | 'offline' | 'slow'
      availableStorage?: number
      userRole?: string
    }
  ): string[] {
    const actions: string[] = [error.suggestedAction]

    switch (error.type) {
      case 'network':
        if (context?.networkStatus === 'slow') {
          actions.push('嘗試在網路狀況較佳時重新上傳')
        }
        actions.push('檢查 WiFi 或行動網路連線')
        break

      case 'file_size':
        actions.push('使用圖片壓縮工具減小檔案大小')
        actions.push('選擇解析度較低的圖片')
        break

      case 'storage_full':
        if (context?.availableStorage && context.availableStorage < 1024 * 1024) {
          actions.push('目前可用空間不足 1MB，請清理舊檔案')
        }
        break

      case 'permission':
        if (context?.userRole === 'guest') {
          actions.push('請先登入帳戶')
        }
        break

      case 'quota_exceeded':
        actions.push('刪除不需要的圖片以釋放配額')
        actions.push('聯繫管理員增加上傳配額')
        break
    }

    return actions
  }

  /**
   * 格式化錯誤訊息用於顯示
   */
  static formatErrorMessage(error: UploadError, includeDetails = false): string {
    let message = error.userFriendlyMessage

    if (includeDetails && error.details) {
      message += `\n詳細資訊: ${error.details}`
    }

    if (error.errorCode) {
      message += ` (${error.errorCode})`
    }

    return message
  }

  /**
   * 建立重試提示訊息
   */
  static createRetryMessage(error: UploadError, attemptNumber: number, maxRetries: number): string {
    if (!error.retryable) {
      return `${error.userFriendlyMessage}\n${error.suggestedAction}`
    }

    if (attemptNumber < maxRetries) {
      return `上傳失敗 (第 ${attemptNumber} 次嘗試)，將自動重試...`
    }

    return `上傳失敗，已嘗試 ${maxRetries} 次。${error.suggestedAction}`
  }
}
