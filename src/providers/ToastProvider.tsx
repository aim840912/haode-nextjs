'use client'

import React, { createContext, useContext, useReducer, ReactNode } from 'react'
import { createPortal } from 'react-dom'

export type ToastType = 'success' | 'error' | 'warning' | 'info'

export interface Toast {
  id: string
  type: ToastType
  message: string
  duration?: number
}

interface ToastState {
  toasts: Toast[]
}

type ToastAction = { type: 'ADD_TOAST'; payload: Toast } | { type: 'REMOVE_TOAST'; payload: string }

const ToastContext = createContext<{
  addToast: (message: string, type?: ToastType, duration?: number) => void
  removeToast: (id: string) => void
} | null>(null)

function toastReducer(state: ToastState, action: ToastAction): ToastState {
  switch (action.type) {
    case 'ADD_TOAST':
      return {
        ...state,
        toasts: [...state.toasts, action.payload],
      }
    case 'REMOVE_TOAST':
      return {
        ...state,
        toasts: state.toasts.filter(toast => toast.id !== action.payload),
      }
    default:
      return state
  }
}

function ToastComponent({ toast, onRemove }: { toast: Toast; onRemove: (id: string) => void }) {
  React.useEffect(() => {
    const duration = toast.duration || 5000
    const timer = setTimeout(() => {
      onRemove(toast.id)
    }, duration)

    return () => clearTimeout(timer)
  }, [toast.id, toast.duration, onRemove])

  const getToastStyles = () => {
    const baseStyles =
      'p-4 rounded-lg shadow-lg flex items-start space-x-3 max-w-sm transform transition-all duration-300 ease-in-out'

    switch (toast.type) {
      case 'success':
        return `${baseStyles} bg-green-50 border-l-4 border-green-500`
      case 'error':
        return `${baseStyles} bg-red-50 border-l-4 border-red-500`
      case 'warning':
        return `${baseStyles} bg-amber-50 border-l-4 border-amber-500`
      case 'info':
      default:
        return `${baseStyles} bg-blue-50 border-l-4 border-blue-500`
    }
  }

  const getIcon = () => {
    switch (toast.type) {
      case 'success':
        return <div className="text-green-500 text-xl">✓</div>
      case 'error':
        return <div className="text-red-500 text-xl">✗</div>
      case 'warning':
        return <div className="text-amber-500 text-xl">⚠</div>
      case 'info':
      default:
        return <div className="text-blue-500 text-xl">ℹ</div>
    }
  }

  return (
    <div className={getToastStyles()}>
      {getIcon()}
      <div className="flex-1">
        <p className="text-sm text-gray-900">{toast.message}</p>
      </div>
      <button
        onClick={() => onRemove(toast.id)}
        className="text-gray-400 hover:text-gray-600 text-lg leading-none"
      >
        ×
      </button>
    </div>
  )
}

function ToastContainer({ toasts, onRemove }: { toasts: Toast[]; onRemove: (id: string) => void }) {
  if (typeof window === 'undefined') return null

  return createPortal(
    <div className="fixed bottom-4 right-4 z-50 space-y-3">
      {toasts.map(toast => (
        <ToastComponent key={toast.id} toast={toast} onRemove={onRemove} />
      ))}
    </div>,
    document.body
  )
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(toastReducer, { toasts: [] })

  const addToast = React.useCallback(
    (message: string, type: ToastType = 'info', duration?: number) => {
      const id = Math.random().toString(36).substr(2, 9)
      dispatch({
        type: 'ADD_TOAST',
        payload: {
          id,
          message,
          type,
          duration,
        },
      })
    },
    []
  )

  const removeToast = React.useCallback((id: string) => {
    dispatch({
      type: 'REMOVE_TOAST',
      payload: id,
    })
  }, [])

  return (
    <ToastContext.Provider value={{ addToast, removeToast }}>
      {children}
      <ToastContainer toasts={state.toasts} onRemove={removeToast} />
    </ToastContext.Provider>
  )
}

export function useToast() {
  const context = useContext(ToastContext)
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider')
  }
  return context
}
