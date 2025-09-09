'use client'

import { useEffect, useState, Suspense } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { logger } from '@/lib/logger'

interface ErrorInfo {
  title: string
  message: string
  emoji: string
  actions: {
    primary?: {
      text: string
      href: string
    }
    secondary?: {
      text: string
      href: string
    }
  }
}

const ERROR_TYPES: Record<string, ErrorInfo> = {
  invalid_link: {
    title: '連結無效',
    message: '此連結無效或已過期，請重新申請密碼重設',
    emoji: '🔗',
    actions: {
      primary: {
        text: '重新申請',
        href: '/forgot-password',
      },
      secondary: {
        text: '返回登入',
        href: '/login',
      },
    },
  },
  verification_failed: {
    title: '驗證失敗',
    message: '連結驗證失敗，可能已過期或已被使用',
    emoji: '❌',
    actions: {
      primary: {
        text: '重新申請',
        href: '/forgot-password',
      },
      secondary: {
        text: '聯絡客服',
        href: '/contact',
      },
    },
  },
  server_error: {
    title: '系統錯誤',
    message: '服務暫時無法使用，請稍後再試',
    emoji: '⚠️',
    actions: {
      primary: {
        text: '重新嘗試',
        href: '/forgot-password',
      },
      secondary: {
        text: '返回首頁',
        href: '/',
      },
    },
  },
  token_expired: {
    title: '連結已過期',
    message: '重設連結已過期（有效期 1 小時），請重新申請',
    emoji: '⏰',
    actions: {
      primary: {
        text: '重新申請',
        href: '/forgot-password',
      },
      secondary: {
        text: '返回登入',
        href: '/login',
      },
    },
  },
  token_used: {
    title: '連結已使用',
    message: '此重設連結已經使用過，每個連結只能使用一次',
    emoji: '🔒',
    actions: {
      primary: {
        text: '重新申請',
        href: '/forgot-password',
      },
      secondary: {
        text: '返回登入',
        href: '/login',
      },
    },
  },
}

// 載入中元件
function LoadingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 to-orange-50 flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-900 mx-auto"></div>
        <p className="mt-4 text-gray-600">載入中...</p>
      </div>
    </div>
  )
}

// 錯誤內容元件（使用 useSearchParams）
function AuthErrorContent() {
  const searchParams = useSearchParams()
  const [errorInfo, setErrorInfo] = useState<ErrorInfo | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const error = searchParams.get('error')
    const message = searchParams.get('message')

    logger.info('認證錯誤頁面載入', {
      module: 'AuthErrorPage',
      action: 'page_load',
      metadata: { errorType: error, hasCustomMessage: !!message },
    })

    if (error) {
      const info = ERROR_TYPES[error]
      if (info) {
        // 使用預定義的錯誤資訊
        setErrorInfo(info)
      } else {
        // 未知錯誤類型，使用通用錯誤
        setErrorInfo({
          title: '發生錯誤',
          message: message || '發生未預期的錯誤，請稍後再試',
          emoji: '❓',
          actions: {
            primary: {
              text: '重新嘗試',
              href: '/forgot-password',
            },
            secondary: {
              text: '返回首頁',
              href: '/',
            },
          },
        })
      }
    } else {
      // 沒有錯誤參數，顯示通用錯誤
      setErrorInfo({
        title: '頁面錯誤',
        message: '無法識別的錯誤類型，請返回重新操作',
        emoji: '🚫',
        actions: {
          primary: {
            text: '返回登入',
            href: '/login',
          },
          secondary: {
            text: '返回首頁',
            href: '/',
          },
        },
      })

      logger.warn('認證錯誤頁面缺少錯誤參數', {
        module: 'AuthErrorPage',
        action: 'missing_error_param',
      })
    }

    setIsLoading(false)
  }, [searchParams])

  if (isLoading || !errorInfo) {
    return <LoadingPage />
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 to-orange-50 flex items-center justify-center py-12 px-4">
      <div className="max-w-md w-full space-y-8">
        {/* Header */}
        <div className="text-center">
          <Link href="/" className="inline-block mb-6">
            <div className="text-3xl font-bold text-amber-900 tracking-tight">豪德茶業</div>
            <div className="text-sm text-amber-700/70 font-medium tracking-wider">HAUDE TEA</div>
          </Link>
          <div className="text-6xl mb-4">{errorInfo.emoji}</div>
          <h2 className="text-2xl font-semibold text-gray-800 mb-2">{errorInfo.title}</h2>
          <p className="text-gray-600">{errorInfo.message}</p>
        </div>

        {/* Error Card */}
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <div className="text-center space-y-6">
            {/* Error Details */}
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-center justify-center mb-2">
                <span className="text-red-500 text-2xl">⚠️</span>
              </div>
              <p className="text-red-800 font-medium">操作失敗</p>
              <p className="text-red-700 text-sm mt-1">{errorInfo.message}</p>
            </div>

            {/* Help Information */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-left">
              <h3 className="font-medium text-blue-900 mb-2">可能的解決方案：</h3>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>• 檢查您的電子郵件是否有新的重設連結</li>
                <li>• 確認連結完整且未被截斷</li>
                <li>• 嘗試重新申請密碼重設</li>
                <li>• 清除瀏覽器快取後重試</li>
                <li>• 如問題持續，請聯絡客服</li>
              </ul>
            </div>

            {/* Action Buttons */}
            <div className="space-y-3">
              {errorInfo.actions.primary && (
                <Link
                  href={errorInfo.actions.primary.href}
                  className="block w-full bg-amber-900 text-white py-3 px-4 rounded-lg font-semibold hover:bg-amber-800 focus:ring-2 focus:ring-amber-500 focus:ring-offset-2 transition-colors text-center"
                >
                  {errorInfo.actions.primary.text}
                </Link>
              )}

              {errorInfo.actions.secondary && (
                <Link
                  href={errorInfo.actions.secondary.href}
                  className="block w-full py-3 px-4 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50 focus:ring-2 focus:ring-amber-500 focus:ring-offset-2 transition-colors text-center"
                >
                  {errorInfo.actions.secondary.text}
                </Link>
              )}
            </div>

            {/* Contact Support */}
            <div className="text-xs text-gray-500 bg-gray-50 p-3 rounded-lg">
              <p>📞 如需協助，請聯絡客服</p>
              <p>💌 或發送郵件至 support@haudetea.com</p>
            </div>
          </div>
        </div>

        {/* Back to Home */}
        <div className="text-center">
          <Link href="/" className="text-sm text-gray-500 hover:text-amber-600 transition-colors">
            ← 返回首頁
          </Link>
        </div>
      </div>
    </div>
  )
}

// 主要導出函數，使用 Suspense 包裝
export default function AuthErrorPage() {
  return (
    <Suspense fallback={<LoadingPage />}>
      <AuthErrorContent />
    </Suspense>
  )
}
