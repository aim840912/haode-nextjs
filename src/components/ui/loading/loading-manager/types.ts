import { ReactNode } from 'react'

/**
 * 載入進度資訊
 */
export interface LoadingProgress {
  /** 當前進度 */
  current: number
  /** 總進度 */
  total: number
  /** 進度訊息 */
  message?: string
}

/**
 * 載入任務
 */
export interface LoadingTask {
  /** 任務 ID */
  id: string
  /** 任務訊息 */
  message: string
  /** 超時時間（毫秒） */
  timeout?: number
  /** 開始時間 */
  startTime: number
  /** 進度資訊 */
  progress?: LoadingProgress
  /** 優先級 */
  priority?: 'low' | 'normal' | 'high'
  /** 顯示延遲（毫秒） */
  showDelayMs?: number
}

/**
 * Loading Context 類型
 */
export interface LoadingContextType {
  /** 是否有載入中的任務 */
  isLoading: boolean
  /** 是否應該顯示載入狀態 */
  shouldShowLoading: boolean
  /** 當前所有任務 */
  currentTasks: LoadingTask[]
  /** 高優先級任務 */
  highPriorityTasks: LoadingTask[]
  /** 開始載入 */
  startLoading: (
    id: string,
    message?: string,
    timeout?: number,
    options?: {
      priority?: 'low' | 'normal' | 'high'
      showDelayMs?: number
      progress?: LoadingProgress
    }
  ) => void
  /** 更新進度 */
  updateProgress: (id: string, progress: Partial<LoadingProgress>) => void
  /** 停止載入 */
  stopLoading: (id: string) => void
  /** 停止所有載入 */
  stopAllLoading: () => void
}

/**
 * LoadingManager Props
 */
export interface LoadingManagerProps {
  /** 子元件 */
  children: ReactNode
  /** 預設超時時間（毫秒） */
  defaultTimeout?: number
  /** 是否顯示覆蓋層 */
  showOverlay?: boolean
  /** 覆蓋層訊息 */
  overlayMessage?: string
  /** 預設顯示延遲（毫秒） */
  defaultShowDelayMs?: number
  /** 是否啟用智慧載入 */
  enableSmartLoading?: boolean
}

/**
 * LoadingIndicator Props
 */
export interface LoadingIndicatorProps {
  /** 自訂樣式 */
  className?: string
  /** 大小 */
  size?: 'sm' | 'md' | 'lg'
  /** 是否顯示訊息 */
  showMessage?: boolean
  /** 訊息文字 */
  message?: string
  /** 是否顯示進度條 */
  showProgress?: boolean
}

/**
 * LoadingWrapper Props
 */
export interface LoadingWrapperProps {
  /** 是否載入中 */
  loading?: boolean
  /** 載入時的替代內容 */
  fallback?: ReactNode
  /** 子元件 */
  children: ReactNode
  /** 是否使用智慧載入 */
  useSmartLoading?: boolean
}

/**
 * PageLoading Props
 */
export interface PageLoadingProps {
  /** 訊息文字 */
  message?: string
  /** 是否顯示進度條 */
  showProgress?: boolean
}
