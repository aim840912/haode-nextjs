'use client'

import { createContext, useContext, useState, useCallback, ReactNode, useEffect } from 'react'
import LoadingSpinner, { LoadingOverlay } from './LoadingSpinner'
import { logger } from '@/lib/logger'

interface LoadingProgress {
  current: number
  total: number
  message?: string
}

interface LoadingTask {
  id: string
  message: string
  timeout?: number
  startTime: number
  progress?: LoadingProgress
  priority?: 'low' | 'normal' | 'high'
  showDelayMs?: number
}

interface LoadingContextType {
  isLoading: boolean
  shouldShowLoading: boolean
  currentTasks: LoadingTask[]
  highPriorityTasks: LoadingTask[]
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
  updateProgress: (id: string, progress: Partial<LoadingProgress>) => void
  stopLoading: (id: string) => void
  stopAllLoading: () => void
}

const LoadingContext = createContext<LoadingContextType | null>(null)

interface LoadingManagerProps {
  children: ReactNode
  defaultTimeout?: number
  showOverlay?: boolean
  overlayMessage?: string
  defaultShowDelayMs?: number
  enableSmartLoading?: boolean
}

export function LoadingManager({
  children,
  defaultTimeout = 30000, // 30 秒預設超時
  showOverlay = true,
  overlayMessage = '載入中...',
  defaultShowDelayMs = 200, // 預設 200ms 後才顯示載入
  enableSmartLoading = true,
}: LoadingManagerProps) {
  const [tasks, setTasks] = useState<LoadingTask[]>([])
  const [visibleTasks, setVisibleTasks] = useState<Set<string>>(new Set())

  // 智慧載入顯示：延遲顯示載入狀態
  useEffect(() => {
    const timeouts: Map<string, NodeJS.Timeout> = new Map()

    tasks.forEach(task => {
      const delayMs = enableSmartLoading ? (task.showDelayMs ?? defaultShowDelayMs) : 0

      // 高優先級任務立即顯示
      if (task.priority === 'high' || delayMs === 0) {
        setVisibleTasks(prev => new Set([...prev, task.id]))
        return
      }

      // 其他任務延遲顯示
      const timeout = setTimeout(() => {
        setVisibleTasks(prev => new Set([...prev, task.id]))
      }, delayMs)
      timeouts.set(task.id, timeout)
    })

    // 清理不存在的任務
    setVisibleTasks(prev => {
      const newSet = new Set<string>()
      tasks.forEach(task => {
        if (prev.has(task.id)) {
          newSet.add(task.id)
        }
      })
      return newSet
    })

    return () => {
      timeouts.forEach(timeout => clearTimeout(timeout))
    }
  }, [tasks, enableSmartLoading, defaultShowDelayMs]) // 移除 visibleTasks 避免循環依賴

  const startLoading = useCallback(
    (
      id: string,
      message = '載入中...',
      timeout = defaultTimeout,
      options: {
        priority?: 'low' | 'normal' | 'high'
        showDelayMs?: number
        progress?: LoadingProgress
      } = {}
    ) => {
      setTasks(prev => {
        // 防止重複的載入任務
        const existingTask = prev.find(task => task.id === id)
        if (existingTask) {
          return prev
        }

        const newTask: LoadingTask = {
          id,
          message,
          timeout,
          startTime: Date.now(),
          priority: options.priority || 'normal',
          showDelayMs: options.showDelayMs,
          progress: options.progress,
        }

        return [...prev, newTask]
      })
    },
    [defaultTimeout]
  )

  const updateProgress = useCallback((id: string, progress: Partial<LoadingProgress>) => {
    setTasks(prev =>
      prev.map(task =>
        task.id === id
          ? {
              ...task,
              progress: task.progress ? { ...task.progress, ...progress } : undefined,
            }
          : task
      )
    )
  }, [])

  const stopLoading = useCallback((id: string) => {
    setTasks(prev => prev.filter(task => task.id !== id))
    setVisibleTasks(prev => {
      const newSet = new Set(prev)
      newSet.delete(id)
      return newSet
    })
  }, [])

  const stopAllLoading = useCallback(() => {
    setTasks([])
    setVisibleTasks(new Set())
  }, [])

  // 處理超時
  useEffect(() => {
    if (tasks.length === 0) return

    const timeoutIds: NodeJS.Timeout[] = []

    tasks.forEach(task => {
      if (task.timeout) {
        const timeoutId = setTimeout(() => {
          logger.warn('Loading task timed out', {
            module: 'LoadingManager',
            action: 'handleTimeout',
            metadata: { taskId: task.id, timeout: task.timeout },
          })
          stopLoading(task.id)
        }, task.timeout)
        timeoutIds.push(timeoutId)
      }
    })

    return () => {
      timeoutIds.forEach(id => clearTimeout(id))
    }
  }, [tasks, stopLoading])

  const isLoading = tasks.length > 0
  const shouldShowLoading = visibleTasks.size > 0
  const highPriorityTasks = tasks.filter(task => task.priority === 'high')

  // 顯示最高優先級任務的訊息
  const currentTask = highPriorityTasks.length > 0 ? highPriorityTasks[0] : tasks[0]
  const currentMessage = currentTask?.message || overlayMessage

  return (
    <LoadingContext.Provider
      value={{
        isLoading,
        shouldShowLoading,
        currentTasks: tasks,
        highPriorityTasks,
        startLoading,
        updateProgress,
        stopLoading,
        stopAllLoading,
      }}
    >
      {children}
      {showOverlay && <LoadingOverlay show={shouldShowLoading} message={currentMessage} />}
    </LoadingContext.Provider>
  )
}

export function useLoading() {
  const context = useContext(LoadingContext)
  if (!context) {
    throw new Error('useLoading must be used within a LoadingManager')
  }
  return context
}

// 便利的 Hook：自動管理載入狀態
export function useAsyncLoading() {
  const { startLoading, stopLoading, updateProgress } = useLoading()

  const executeWithLoading = useCallback(
    async (
      asyncFunction: (updateProgress: (progress: Partial<LoadingProgress>) => void) => Promise<any>,
      taskId = `task-${Date.now()}`,
      message = '載入中...',
      options: {
        timeout?: number
        priority?: 'low' | 'normal' | 'high'
        showDelayMs?: number
      } = {}
    ): Promise<any> => {
      try {
        startLoading(taskId, message, options.timeout, options)
        const result = await asyncFunction(progress => updateProgress(taskId, progress))
        return result
      } finally {
        stopLoading(taskId)
      }
    },
    [startLoading, stopLoading, updateProgress]
  )

  return { executeWithLoading }
}

// 載入狀態指示器組件
export function LoadingIndicator({
  className = '',
  size = 'md',
  showMessage = true,
  message = '載入中...',
  showProgress = false,
}: {
  className?: string
  size?: 'sm' | 'md' | 'lg'
  showMessage?: boolean
  message?: string
  showProgress?: boolean
}) {
  const { shouldShowLoading, currentTasks } = useLoading()

  if (!shouldShowLoading) return null

  const currentTask = currentTasks[0]
  const displayMessage = currentTask?.message || message
  const progress = currentTask?.progress

  return (
    <div className={`flex items-center justify-center space-x-3 ${className}`}>
      <LoadingSpinner size={size} />
      {showMessage && (
        <div className="text-center">
          <span className="text-gray-600 font-medium block">{displayMessage}</span>
          {showProgress && progress && (
            <div className="mt-2 w-48 bg-gray-200 rounded-full h-2">
              <div
                className="bg-amber-600 h-2 rounded-full transition-all duration-300 ease-out"
                style={{ width: `${Math.min(100, (progress.current / progress.total) * 100)}%` }}
              />
              {progress.message && <p className="text-xs text-gray-500 mt-1">{progress.message}</p>}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// 條件式載入包裝器
export function LoadingWrapper({
  loading = false,
  fallback,
  children,
  useSmartLoading = true,
}: {
  loading?: boolean
  fallback?: ReactNode
  children: ReactNode
  useSmartLoading?: boolean
}) {
  const { isLoading, shouldShowLoading } = useLoading()
  const showLoading = loading || (useSmartLoading ? shouldShowLoading : isLoading)

  if (showLoading) {
    return (
      <>
        {fallback || (
          <div className="flex items-center justify-center py-8">
            <LoadingIndicator size="lg" showProgress />
          </div>
        )}
      </>
    )
  }

  return <>{children}</>
}

// 頁面級載入狀態
export function PageLoading({
  message = '頁面載入中...',
  showProgress = false,
}: {
  message?: string
  showProgress?: boolean
}) {
  const { currentTasks } = useLoading()
  const [progress, setProgress] = useState(0)

  useEffect(() => {
    if (!showProgress || currentTasks.length === 0) return

    const interval = setInterval(() => {
      setProgress(prev => {
        const newProgress = prev + Math.random() * 15
        return newProgress > 90 ? 90 : newProgress
      })
    }, 200)

    return () => clearInterval(interval)
  }, [showProgress, currentTasks.length])

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center max-w-md mx-auto p-6">
        <div className="mb-6">
          <LoadingSpinner size="xl" />
        </div>

        <h2 className="text-xl font-semibold text-gray-900 mb-4">{message}</h2>

        {showProgress && (
          <div className="w-full bg-gray-200 rounded-full h-2 mb-4">
            <div
              className="bg-amber-600 h-2 rounded-full transition-all duration-300 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>
        )}

        {currentTasks.length > 0 && (
          <p className="text-sm text-gray-600">{currentTasks[0].message}</p>
        )}
      </div>
    </div>
  )
}
