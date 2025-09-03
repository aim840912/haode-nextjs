'use client'

import { Component, ReactNode, ErrorInfo } from 'react'
import { logger } from '@/lib/logger'

interface Props {
  children: ReactNode
  fallback?: ReactNode
  onError?: (error: Error, errorInfo: ErrorInfo) => void
}

interface State {
  hasError: boolean
  error?: Error
}

export class ErrorBoundary extends Component<Props, State> {
  static displayName = 'ErrorBoundary';
  
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false }
  }
  
  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }
  
  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // 使用統一 logger 記錄 React 元件錯誤
    logger.fatal('ErrorBoundary 捕獲 React 組件錯誤', error, {
      component: 'ErrorBoundary',
      action: 'componentDidCatch',
      metadata: {
        errorMessage: error.message,
        errorStack: error.stack,
        componentStack: errorInfo.componentStack,
        errorBoundary: 'global'
      }
    });
    
    // 呼叫自定義錯誤處理器
    if (this.props.onError) {
      this.props.onError(error, errorInfo)
    }
    
    // 未來可以發送錯誤報告到監控服務
    // Sentry.captureException(error, { extra: errorInfo })
  }
  
  render() {
    if (this.state.hasError) {
      // 使用自定義 fallback 或預設錯誤界面
      if (this.props.fallback) {
        return this.props.fallback
      }
      
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="text-center max-w-md mx-auto p-6">
            <div className="w-16 h-16 mx-auto mb-4 bg-red-100 rounded-full flex items-center justify-center">
              <svg 
                className="w-8 h-8 text-red-600" 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  strokeWidth={2} 
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" 
                />
              </svg>
            </div>
            
            <h2 className="text-xl font-bold text-gray-900 mb-2">
              頁面載入發生錯誤
            </h2>
            
            <p className="text-gray-600 mb-6">
              很抱歉，頁面載入時發生了問題。請嘗試重新整理頁面，或稍後再試。
            </p>
            
            <div className="space-y-3">
              <button 
                onClick={() => this.setState({ hasError: false })}
                className="w-full bg-amber-600 text-white px-4 py-2 rounded-lg hover:bg-amber-700 transition-colors font-medium"
              >
                重新嘗試
              </button>
              
              <button 
                onClick={() => window.location.href = '/'}
                className="w-full bg-gray-200 text-gray-800 px-4 py-2 rounded-lg hover:bg-gray-300 transition-colors font-medium"
              >
                返回首頁
              </button>
            </div>
            
            {process.env.NODE_ENV === 'development' && this.state.error && (
              <details className="mt-4 text-left">
                <summary className="cursor-pointer text-sm text-gray-500 hover:text-gray-700">
                  錯誤詳情 (開發模式)
                </summary>
                <pre className="mt-2 text-xs text-red-600 bg-red-50 p-3 rounded overflow-auto">
                  {this.state.error.stack}
                </pre>
              </details>
            )}
          </div>
        </div>
      )
    }
    
    return this.props.children
  }
}

// 輕量級錯誤邊界 - 用於組件級別
export function ComponentErrorBoundary({ children, fallback }: {
  children: ReactNode
  fallback?: ReactNode
}) {
  return (
    <ErrorBoundary 
      fallback={fallback || (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 m-4">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">
                組件載入失敗
              </h3>
              <p className="text-sm text-red-700 mt-1">
                此區塊暫時無法顯示，請重新整理頁面。
              </p>
            </div>
          </div>
        </div>
      )}
    >
      {children}
    </ErrorBoundary>
  )
}

ComponentErrorBoundary.displayName = 'ComponentErrorBoundary';