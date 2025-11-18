/**
 * Toast 型別定義
 */

export type ToastType = 'success' | 'error' | 'warning' | 'info' | 'loading'

export type ToastPosition =
  | 'top-left'
  | 'top-center'
  | 'top-right'
  | 'bottom-left'
  | 'bottom-center'
  | 'bottom-right'

export interface Toast {
  id: string
  type: ToastType
  title: string
  message?: string
  position?: ToastPosition // Toast 顯示位置,預設為 bottom-right
  duration?: number
  progress?: number // 0-100 for loading toasts
  persistent?: boolean // 不自動消失
  actions?: ToastAction[]
}

export interface ToastAction {
  label: string
  onClick: () => void
  variant?: 'primary' | 'secondary'
}

export interface ToastContextType {
  toasts: Toast[]
  showToast: (toast: Omit<Toast, 'id'>) => void
  removeToast: (id: string) => void
  updateToast: (id: string, updates: Partial<Toast>) => void
  success: (title: string, message?: string, actions?: ToastAction[]) => void
  error: (title: string, message?: string, actions?: ToastAction[]) => void
  warning: (title: string, message?: string, actions?: ToastAction[]) => void
  info: (title: string, message?: string, actions?: ToastAction[]) => void
  loading: (title: string, message?: string, progress?: number) => string
}
