/**
 * Toast Context 和 Provider
 */

'use client'

import React, { createContext, useState, useCallback } from 'react'
import type { Toast, ToastAction, ToastContextType } from '../types'
import { ToastContainer } from '../components/ToastContainer'

const ToastContext = createContext<ToastContextType | undefined>(undefined)

interface ToastProviderProps {
  children: React.ReactNode
}

export function ToastProvider({ children }: ToastProviderProps) {
  const [toasts, setToasts] = useState<Toast[]>([])

  const removeToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(toast => toast.id !== id))
  }, [])

  const updateToast = useCallback((id: string, updates: Partial<Toast>) => {
    setToasts(prev => prev.map(toast => (toast.id === id ? { ...toast, ...updates } : toast)))
  }, [])

  const showToast = useCallback(
    (toast: Omit<Toast, 'id'>) => {
      const id = Math.random().toString(36).substring(2, 9)
      const newToast = { ...toast, id }

      setToasts(prev => {
        // 限制 Toast 數量為最多 5 個
        const updated = [...prev, newToast]
        return updated.slice(-5)
      })

      // 自動移除（除非是持久化的或載入中的）
      if (!newToast.persistent && newToast.type !== 'loading') {
        setTimeout(() => {
          removeToast(id)
        }, toast.duration || 5000)
      }

      return id
    },
    [removeToast]
  )

  const success = useCallback(
    (title: string, message?: string, actions?: ToastAction[]) => {
      showToast({ type: 'success', title, message, actions })
    },
    [showToast]
  )

  const error = useCallback(
    (title: string, message?: string, actions?: ToastAction[]) => {
      showToast({ type: 'error', title, message, actions, duration: 8000 })
    },
    [showToast]
  )

  const warning = useCallback(
    (title: string, message?: string, actions?: ToastAction[]) => {
      showToast({ type: 'warning', title, message, actions, duration: 7000 })
    },
    [showToast]
  )

  const info = useCallback(
    (title: string, message?: string, actions?: ToastAction[]) => {
      showToast({ type: 'info', title, message, actions })
    },
    [showToast]
  )

  const loading = useCallback(
    (title: string, message?: string, progress?: number) => {
      return showToast({
        type: 'loading',
        title,
        message,
        progress,
        persistent: true,
      })
    },
    [showToast]
  )

  return (
    <ToastContext.Provider
      value={{
        toasts,
        showToast,
        removeToast,
        updateToast,
        success,
        error,
        warning,
        info,
        loading,
      }}
    >
      {children}
      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </ToastContext.Provider>
  )
}

export { ToastContext }
