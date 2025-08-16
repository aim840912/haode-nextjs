'use client';

import { createContext, useContext, useState, ReactNode, useCallback } from 'react';

export type ToastType = 'success' | 'error' | 'warning' | 'info' | 'loading';

export interface Toast {
  id: string;
  type: ToastType;
  title: string;
  message?: string;
  duration?: number;
  progress?: number; // 0-100 for loading toasts
  persistent?: boolean; // 不自動消失
  actions?: ToastAction[];
}

export interface ToastAction {
  label: string;
  onClick: () => void;
  variant?: 'primary' | 'secondary';
}

interface ToastContextType {
  toasts: Toast[];
  showToast: (toast: Omit<Toast, 'id'>) => void;
  removeToast: (id: string) => void;
  updateToast: (id: string, updates: Partial<Toast>) => void;
  success: (title: string, message?: string, actions?: ToastAction[]) => void;
  error: (title: string, message?: string, actions?: ToastAction[]) => void;
  warning: (title: string, message?: string, actions?: ToastAction[]) => void;
  info: (title: string, message?: string, actions?: ToastAction[]) => void;
  loading: (title: string, message?: string, progress?: number) => string;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  }, []);

  const updateToast = useCallback((id: string, updates: Partial<Toast>) => {
    setToasts(prev => prev.map(toast => 
      toast.id === id ? { ...toast, ...updates } : toast
    ));
  }, []);

  const showToast = useCallback((toast: Omit<Toast, 'id'>) => {
    const id = Math.random().toString(36).substring(2, 9);
    const newToast = { ...toast, id };
    
    setToasts(prev => {
      // 限制 Toast 數量為最多 5 個
      const updated = [...prev, newToast];
      return updated.slice(-5);
    });
    
    // 自動移除（除非是持久化的或載入中的）
    if (!newToast.persistent && newToast.type !== 'loading') {
      setTimeout(() => {
        removeToast(id);
      }, toast.duration || 5000);
    }

    return id;
  }, [removeToast]);

  const success = useCallback((title: string, message?: string, actions?: ToastAction[]) => {
    showToast({ type: 'success', title, message, actions });
  }, [showToast]);

  const error = useCallback((title: string, message?: string, actions?: ToastAction[]) => {
    showToast({ type: 'error', title, message, actions, duration: 8000 });
  }, [showToast]);

  const warning = useCallback((title: string, message?: string, actions?: ToastAction[]) => {
    showToast({ type: 'warning', title, message, actions, duration: 7000 });
  }, [showToast]);

  const info = useCallback((title: string, message?: string, actions?: ToastAction[]) => {
    showToast({ type: 'info', title, message, actions });
  }, [showToast]);

  const loading = useCallback((title: string, message?: string, progress?: number) => {
    return showToast({ 
      type: 'loading', 
      title, 
      message, 
      progress,
      persistent: true 
    });
  }, [showToast]);

  return (
    <ToastContext.Provider value={{
      toasts,
      showToast,
      removeToast,
      updateToast,
      success,
      error,
      warning,
      info,
      loading
    }}>
      {children}
      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (context === undefined) {
    throw new Error('useToast 必須在 ToastProvider 內使用');
  }
  return context;
}

function ToastContainer({ toasts, onRemove }: { toasts: Toast[]; onRemove: (id: string) => void }) {
  if (toasts.length === 0) return null;

  return (
    <div className="fixed top-4 right-4 z-50 space-y-2">
      {toasts.map(toast => (
        <ToastItem key={toast.id} toast={toast} onRemove={onRemove} />
      ))}
    </div>
  );
}

function ToastItem({ toast, onRemove }: { toast: Toast; onRemove: (id: string) => void }) {
  const getToastStyles = () => {
    const baseStyles = 'flex flex-col p-4 rounded-lg shadow-lg max-w-sm w-full transition-all duration-300 transform';
    
    switch (toast.type) {
      case 'success':
        return `${baseStyles} bg-green-50 border-l-4 border-green-500`;
      case 'error':
        return `${baseStyles} bg-red-50 border-l-4 border-red-500`;
      case 'warning':
        return `${baseStyles} bg-yellow-50 border-l-4 border-yellow-500`;
      case 'info':
        return `${baseStyles} bg-blue-50 border-l-4 border-blue-500`;
      case 'loading':
        return `${baseStyles} bg-amber-50 border-l-4 border-amber-500`;
      default:
        return `${baseStyles} bg-gray-50 border-l-4 border-gray-500`;
    }
  };

  const getIconStyles = () => {
    switch (toast.type) {
      case 'success':
        return 'text-green-500';
      case 'error':
        return 'text-red-500';
      case 'warning':
        return 'text-yellow-500';
      case 'info':
        return 'text-blue-500';
      case 'loading':
        return 'text-amber-500';
      default:
        return 'text-gray-500';
    }
  };

  const getIcon = () => {
    switch (toast.type) {
      case 'success':
        return '✓';
      case 'error':
        return '✕';
      case 'warning':
        return '⚠';
      case 'info':
        return 'ⓘ';
      case 'loading':
        return (
          <div className="animate-spin rounded-full h-4 w-4 border-2 border-amber-600 border-t-transparent"></div>
        );
      default:
        return 'ⓘ';
    }
  };

  return (
    <div className={getToastStyles()}>
      <div className="flex items-start space-x-3">
        <div className={`flex-shrink-0 w-6 h-6 flex items-center justify-center rounded-full font-bold text-sm ${getIconStyles()}`}>
          {getIcon()}
        </div>
        
        <div className="flex-1 min-w-0">
          <h4 className="text-sm font-medium text-gray-900">{toast.title}</h4>
          {toast.message && (
            <p className="mt-1 text-sm text-gray-600">{toast.message}</p>
          )}
          
          {/* Progress Bar for Loading Toasts */}
          {toast.type === 'loading' && toast.progress !== undefined && (
            <div className="mt-2 w-full bg-gray-200 rounded-full h-1.5">
              <div 
                className="bg-amber-600 h-1.5 rounded-full transition-all duration-300 ease-out"
                style={{ width: `${Math.min(100, Math.max(0, toast.progress))}%` }}
              />
            </div>
          )}
          
          {/* Action Buttons */}
          {toast.actions && toast.actions.length > 0 && (
            <div className="mt-3 flex space-x-2">
              {toast.actions.map((action, index) => (
                <button
                  key={index}
                  onClick={action.onClick}
                  className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${
                    action.variant === 'primary'
                      ? 'bg-amber-600 text-white hover:bg-amber-700'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {action.label}
                </button>
              ))}
            </div>
          )}
        </div>
        
        {/* Close Button */}
        {toast.type !== 'loading' && (
          <button
            onClick={() => onRemove(toast.id)}
            className="flex-shrink-0 ml-4 text-gray-400 hover:text-gray-600 focus:outline-none"
          >
            <span className="sr-only">關閉</span>
            <span className="text-lg">×</span>
          </button>
        )}
      </div>
    </div>
  );
}