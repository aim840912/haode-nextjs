'use client'

import { Component, ReactNode, ErrorInfo } from 'react'
import Link from 'next/link'
import { authLogger } from '@/lib/logger'

interface AuthErrorBoundaryState {
  hasError: boolean
  error?: Error
  errorInfo?: ErrorInfo
}

interface AuthErrorBoundaryProps {
  children: ReactNode
  fallback?: ReactNode
}

export class AuthErrorBoundary extends Component<AuthErrorBoundaryProps, AuthErrorBoundaryState> {
  constructor(props: AuthErrorBoundaryProps) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error: Error): AuthErrorBoundaryState {
    return {
      hasError: true,
      error,
    }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // 檢查是否為 refresh token 錯誤
    const isRefreshTokenError =
      error.message.includes('Invalid Refresh Token') ||
      error.message.includes('refresh_token_not_found') ||
      error.message.includes('Refresh Token Not Found') ||
      error.name === 'AuthApiError'

    // 使用 authLogger 記錄認證錯誤邊界錯誤
    authLogger.fatal('AuthErrorBoundary 捕獲認證相關錯誤', error, {
      action: 'componentDidCatch',
      metadata: {
        component: 'AuthErrorBoundary',
        errorMessage: error.message,
        errorStack: error.stack,
        componentStack: errorInfo.componentStack,
        errorBoundary: 'authentication',
        isRefreshTokenError,
      },
    })

    this.setState({
      error,
      errorInfo,
    })

    // 如果是 refresh token 錯誤，自動清理瀏覽器資料
    if (isRefreshTokenError) {
      authLogger.warn('檢測到 refresh token 錯誤，建議清除瀏覽器資料', {
        metadata: {
          component: 'AuthErrorBoundary',
          errorMessage: error.message,
          action: 'refresh_token_error_detected',
        },
      })

      // 提示使用者清除瀏覽器資料
      setTimeout(() => {
        this.clearBrowserDataAndRedirect()
      }, 3000) // 3秒後自動清除
    }

    // 在開發環境下記錄詳細錯誤信息
    if (process.env.NODE_ENV === 'development') {
      authLogger.debug('認證錯誤詳情（開發模式）', {
        metadata: {
          component: 'AuthErrorBoundary',
          error: error.message,
          stack: error.stack,
          componentStack: errorInfo.componentStack,
          isRefreshTokenError,
        },
      })
    }
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: undefined, errorInfo: undefined })
  }

  clearBrowserDataAndRedirect = () => {
    try {
      authLogger.info('開始清除瀏覽器資料', {
        metadata: {
          component: 'AuthErrorBoundary',
          action: 'clear_browser_data',
        },
      })

      if (typeof window !== 'undefined') {
        // 清除 localStorage
        Object.keys(localStorage).forEach(key => {
          if (key.startsWith('sb-') || key.includes('supabase') || key.includes('auth')) {
            localStorage.removeItem(key)
          }
        })

        // 清除 sessionStorage
        Object.keys(sessionStorage).forEach(key => {
          if (key.startsWith('sb-') || key.includes('supabase') || key.includes('auth')) {
            sessionStorage.removeItem(key)
          }
        })

        // 清除所有相關的 cookies
        const cookies = document.cookie.split(';')
        cookies.forEach(function (c) {
          if (c.includes('sb-') || c.includes('supabase') || c.includes('auth')) {
            document.cookie = c
              .replace(/^ +/, '')
              .replace(/=.*/, '=;expires=' + new Date().toUTCString() + ';path=/')
          }
        })

        authLogger.info('瀏覽器資料清除完成，即將重定向', {
          metadata: {
            component: 'AuthErrorBoundary',
            action: 'clear_browser_data_completed',
          },
        })

        // 重定向到登入頁面
        window.location.href = '/login'
      }
    } catch (error) {
      authLogger.error('清除瀏覽器資料時發生錯誤', error as Error, {
        metadata: {
          component: 'AuthErrorBoundary',
          action: 'clear_browser_data_error',
        },
      })

      // 如果清除失敗，直接重新載入頁面
      window.location.reload()
    }
  }

  render() {
    if (this.state.hasError) {
      // 自定義錯誤 UI，如果有提供 fallback 則使用它
      if (this.props.fallback) {
        return this.props.fallback
      }

      return (
        <div className="min-h-screen bg-gradient-to-br from-amber-50 to-orange-50 flex items-center justify-center py-12 px-4">
          <div className="max-w-md w-full space-y-8">
            <div className="text-center">
              <div className="text-3xl font-bold text-amber-900 tracking-tight mb-6">豪德茶業</div>
              <div className="text-sm text-amber-700/70 font-medium tracking-wider mb-8">
                HAUDE TEA
              </div>

              <div className="bg-white rounded-2xl shadow-xl p-8">
                <div className="text-center">
                  <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 mb-4">
                    <svg
                      className="h-6 w-6 text-red-600"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 15.5c-.77.833.192 2.5 1.732 2.5z"
                      />
                    </svg>
                  </div>

                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    {this.state.error &&
                    (this.state.error.message.includes('Invalid Refresh Token') ||
                      this.state.error.message.includes('Refresh Token Not Found') ||
                      this.state.error.name === 'AuthApiError')
                      ? '登入狀態已過期'
                      : '登入系統暫時無法使用'}
                  </h3>

                  <p className="text-sm text-gray-600 mb-6">
                    {this.state.error &&
                    (this.state.error.message.includes('Invalid Refresh Token') ||
                      this.state.error.message.includes('Refresh Token Not Found') ||
                      this.state.error.name === 'AuthApiError')
                      ? '您的登入狀態已過期，我們將為您清除過期資料並導向登入頁面。'
                      : '我們遇到了一些技術問題，請稍後再試或聯繫客服協助。'}
                  </p>

                  {process.env.NODE_ENV === 'development' && this.state.error && (
                    <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-left">
                      <h4 className="text-xs font-medium text-red-800 mb-2">
                        開發模式 - 錯誤詳情:
                      </h4>
                      <pre className="text-xs text-red-700 whitespace-pre-wrap break-words">
                        {this.state.error.message}
                      </pre>
                    </div>
                  )}

                  <div className="space-y-3">
                    {this.state.error &&
                    (this.state.error.message.includes('Invalid Refresh Token') ||
                      this.state.error.message.includes('Refresh Token Not Found') ||
                      this.state.error.name === 'AuthApiError') ? (
                      // Refresh Token 錯誤專用按鈕
                      <>
                        <button
                          onClick={this.clearBrowserDataAndRedirect}
                          className="w-full bg-amber-900 text-white py-3 px-4 rounded-lg font-semibold hover:bg-amber-800 focus:ring-2 focus:ring-amber-500 focus:ring-offset-2 transition-colors"
                        >
                          清除資料並重新登入
                        </button>
                        <button
                          onClick={this.handleRetry}
                          className="w-full bg-gray-100 text-gray-700 py-3 px-4 rounded-lg font-semibold hover:bg-gray-200 focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-colors"
                        >
                          重新嘗試
                        </button>
                      </>
                    ) : (
                      // 一般錯誤按鈕
                      <>
                        <button
                          onClick={this.handleRetry}
                          className="w-full bg-amber-900 text-white py-3 px-4 rounded-lg font-semibold hover:bg-amber-800 focus:ring-2 focus:ring-amber-500 focus:ring-offset-2 transition-colors"
                        >
                          重新嘗試
                        </button>
                        <Link
                          href="/"
                          className="block w-full bg-gray-100 text-gray-700 py-3 px-4 rounded-lg font-semibold hover:bg-gray-200 focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-colors text-center"
                        >
                          返回首頁
                        </Link>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}

export default AuthErrorBoundary
