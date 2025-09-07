'use client'

import { createContext, useContext, useState, useCallback, ReactNode, useEffect } from 'react'
import LoadingSpinner, { LoadingOverlay } from './LoadingSpinner'
import { logger } from '@/lib/logger'

interface LoadingTask {
  id: string
  message: string
  timeout?: number
  startTime: number
}

interface LoadingContextType {
  isLoading: boolean
  currentTasks: LoadingTask[]
  startLoading: (id: string, message?: string, timeout?: number) => void
  stopLoading: (id: string) => void
  stopAllLoading: () => void
}

const LoadingContext = createContext<LoadingContextType | null>(null)

interface LoadingManagerProps {
  children: ReactNode
  defaultTimeout?: number
  showOverlay?: boolean
  overlayMessage?: string
}

export function LoadingManager({ 
  children, 
  defaultTimeout = 30000, // 30 秒預設超時
  showOverlay = true,
  overlayMessage = '載入中...'
}: LoadingManagerProps) {
  const [tasks, setTasks] = useState<LoadingTask[]>([])

  const startLoading = useCallback((id: string, message = '載入中...', timeout = defaultTimeout) => {
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
        startTime: Date.now()
      }

      return [...prev, newTask]
    })
  }, [defaultTimeout])

  const stopLoading = useCallback((id: string) => {
    setTasks(prev => prev.filter(task => task.id !== id))
  }, [])

  const stopAllLoading = useCallback(() => {
    setTasks([])
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
            metadata: { taskId: task.id, timeout: task.timeout }
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
  const currentMessage = tasks.length > 0 ? tasks[0].message : overlayMessage

  return (
    <LoadingContext.Provider value={{
      isLoading,
      currentTasks: tasks,
      startLoading,
      stopLoading,
      stopAllLoading
    }}>
      {children}
      {showOverlay && <LoadingOverlay show={isLoading} message={currentMessage} />}
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
  const { startLoading, stopLoading } = useLoading()

  const executeWithLoading = useCallback(
    (asyncFunction: any, taskId = `task-${Date.now()}`, message = '載入中...', timeout?: number): Promise<any> => {
    return (async () => {
      try {
        startLoading(taskId, message, timeout)
        const result = await asyncFunction()
        return result
      } finally {
        stopLoading(taskId)
      }
    })()
  }, [startLoading, stopLoading])

  return { executeWithLoading }
}

// 載入狀態指示器組件
export function LoadingIndicator({ 
  className = '',
  size = 'md',
  showMessage = true,
  message = '載入中...'
}: {
  className?: string
  size?: 'sm' | 'md' | 'lg'
  showMessage?: boolean
  message?: string
}) {
  const { isLoading } = useLoading()

  if (!isLoading) return null

  return (
    <div className={`flex items-center justify-center space-x-3 ${className}`}>
      <LoadingSpinner size={size} />
      {showMessage && (
        <span className="text-gray-600 font-medium">{message}</span>
      )}
    </div>
  )
}

// 條件式載入包裝器
export function LoadingWrapper({ 
  loading = false,
  fallback,
  children 
}: {
  loading?: boolean
  fallback?: ReactNode
  children: ReactNode
}) {
  const { isLoading } = useLoading()
  const showLoading = loading || isLoading

  if (showLoading) {
    return (
      <>
        {fallback || (
          <div className="flex items-center justify-center py-8">
            <LoadingSpinner size="lg" />
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
  showProgress = false 
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
          <p className="text-sm text-gray-600">
            {currentTasks[0].message}
          </p>
        )}
      </div>
    </div>
  )
}