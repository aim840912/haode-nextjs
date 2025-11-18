'use client'

import { createContext, useCallback, useEffect, useState } from 'react'
import { logger } from '@/lib/logger'
import { LoadingOverlay } from '../LoadingSpinner'
import type { LoadingContextType, LoadingManagerProps, LoadingProgress, LoadingTask } from './types'

export const LoadingContext = createContext<LoadingContextType | null>(null)

/**
 * 載入管理器 Provider
 *
 * 提供全域載入狀態管理，支援：
 * - 多任務並行載入
 * - 優先級管理
 * - 智慧顯示延遲（避免閃爍）
 * - 自動超時處理
 * - 進度追蹤
 */
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
  }, [tasks, enableSmartLoading, defaultShowDelayMs])

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
