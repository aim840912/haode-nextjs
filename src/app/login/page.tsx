'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import AuthErrorBoundary from '@/components/ui/error/AuthErrorBoundary'
import { useToast } from '@/components/ui/feedback/Toast'
import { useAuth } from '@/contexts/AuthContext'
import { logger } from '@/lib/logger'
import { validateLoginInput, getLoginInputType } from '@/lib/utils/auth-helpers'

export default function LoginPage() {
  const [loginInput, setLoginInput] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [inputType, setInputType] = useState<'email' | 'phone' | 'invalid'>('invalid')
  const { login, isLoading, user } = useAuth()
  const { success, error: showError } = useToast()
  const router = useRouter()

  // 如果用戶已登入，自動導向到個人頁面
  useEffect(() => {
    if (user && !isLoading) {
      logger.info('已登入用戶訪問登入頁，重定向到個人頁面', {
        metadata: { userId: user.id, action: 'auto_redirect' },
      })
      router.push('/profile')
    }
  }, [user, isLoading, router])

  // 處理輸入變更並即時驗證
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setLoginInput(value)

    // 即時判斷輸入類型
    if (value.trim()) {
      const type = getLoginInputType(value)
      setInputType(type)
    } else {
      setInputType('invalid')
    }
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    // 驗證輸入格式
    const validation = validateLoginInput(loginInput)
    if (!validation.isValid) {
      setError(validation.errorMessage || '輸入格式無效')
      return
    }

    try {
      logger.debug('開始登入流程', {
        metadata: {
          inputType: validation.type,
          action: 'login_start',
        },
      })

      // 只有當輸入類型有效時才進行登入
      if (validation.type !== 'invalid') {
        await login({
          identifier: validation.normalizedInput,
          password,
          inputType: validation.type,
        })
      }

      logger.info('登入成功', {
        metadata: {
          inputType: validation.type,
          action: 'login_success',
        },
      })

      // 顯示成功提示
      success('登入成功', '歡迎回來！')

      // 使用 Next.js router 進行導航，而不是強制重新載入
      router.push('/')
    } catch (err) {
      logger.error('登入錯誤', err as Error, {
        metadata: {
          inputType: validation?.type || 'unknown',
          action: 'login_error',
        },
      })
      const errorMessage = err instanceof Error ? err.message : '登入失敗，請稍後再試'

      // 顯示錯誤提示和設定錯誤狀態
      showError('登入失敗', errorMessage)
      setError(errorMessage)
    }
  }

  return (
    <AuthErrorBoundary>
      <div className="min-h-screen bg-gradient-to-br from-amber-50 to-orange-50 dark:from-slate-900 dark:to-slate-800 flex items-center justify-center py-12 px-4">
        <div className="max-w-md w-full space-y-8">
          {/* Header */}
          <div className="text-center">
            <Link href="/" className="inline-block mb-6">
              <div className="text-3xl font-bold text-amber-900 dark:text-amber-300 tracking-tight">
                豪德製茶所
              </div>
              <div className="text-sm text-amber-700/70 dark:text-amber-400/70 font-medium tracking-wider">
                HAUDE TEA
              </div>
            </Link>
            <h2 className="text-2xl font-semibold text-gray-800 dark:text-gray-200 mb-2">
              歡迎回來
            </h2>
            <p className="text-gray-600 dark:text-gray-300">登入您的帳號以繼續</p>
          </div>

          {/* Login Form */}
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl p-8">
            {error && (
              <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-700 rounded-lg">
                <p className="text-red-600 dark:text-red-400 text-sm">{error}</p>
              </div>
            )}

            {/* 新用戶提示 */}
            <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-700 rounded-lg">
              <h3 className="text-sm font-medium text-blue-800 dark:text-blue-300 mb-2">
                歡迎加入
              </h3>
              <div className="text-xs text-blue-700 dark:text-blue-400">
                首次使用請先註冊帳號，即可享受完整的體驗
              </div>
            </div>

            <form onSubmit={handleLogin} className="space-y-6">
              {/* Login Input (Email or Phone) */}
              <div>
                <label
                  htmlFor="loginInput"
                  className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
                >
                  手機號碼或電子郵件
                </label>
                <div className="relative">
                  <input
                    id="loginInput"
                    name="loginInput"
                    type="text"
                    required
                    value={loginInput}
                    onChange={handleInputChange}
                    className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-colors text-gray-800 dark:text-gray-200 placeholder-gray-500 dark:placeholder-gray-400 dark:bg-slate-700 ${
                      loginInput && inputType === 'invalid'
                        ? 'border-red-300 dark:border-red-700 bg-red-50 dark:bg-red-900/20'
                        : 'border-gray-300 dark:border-slate-600'
                    }`}
                    placeholder="請輸入手機號碼或電子郵件"
                  />
                  {/* 輸入類型指示器 */}
                  {loginInput && inputType !== 'invalid' && (
                    <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                      <span className="text-xs bg-amber-100 dark:bg-amber-900/30 text-amber-800 dark:text-amber-300 px-2 py-1 rounded inline-flex items-center">
                        {inputType === 'email' ? (
                          // Email SVG 圖示
                          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
                            <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
                          </svg>
                        ) : (
                          // 手機 SVG 圖示
                          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z" />
                          </svg>
                        )}
                      </span>
                    </div>
                  )}
                </div>
                {/* 輸入提示 */}
                <div className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  支援格式：example@email.com 或 09xx-xxx-xxx
                </div>
              </div>

              {/* Password Input */}
              <div>
                <label
                  htmlFor="password"
                  className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
                >
                  密碼
                </label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  required
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-colors text-gray-800 dark:text-gray-200 placeholder-gray-500 dark:placeholder-gray-400 dark:bg-slate-700"
                  placeholder="請輸入您的密碼"
                />
              </div>

              {/* Forgot Password */}
              <div className="flex items-center justify-end">
                <Link
                  href="/forgot-password"
                  className="text-sm text-amber-600 dark:text-amber-400 hover:text-amber-800 dark:hover:text-amber-300 transition-colors"
                >
                  忘記密碼？
                </Link>
              </div>

              {/* Login Button */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-amber-900 dark:bg-amber-800 text-white py-3 px-4 rounded-lg font-semibold hover:bg-amber-800 dark:hover:bg-amber-700 focus:ring-2 focus:ring-amber-500 focus:ring-offset-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? '登入中...' : '登入'}
              </button>
            </form>

            {/* Register Link */}
            <div className="mt-6 text-center">
              <p className="text-sm text-gray-600 dark:text-gray-300">
                還沒有帳號？{' '}
                <Link
                  href="/register"
                  className="text-amber-600 dark:text-amber-400 hover:text-amber-800 dark:hover:text-amber-300 font-medium transition-colors"
                >
                  立即註冊
                </Link>
              </p>
            </div>
          </div>

          {/* Back to Home */}
          <div className="text-center">
            <Link
              href="/"
              className="text-sm text-gray-500 dark:text-gray-400 hover:text-amber-600 dark:hover:text-amber-400 transition-colors"
            >
              ← 返回首頁
            </Link>
          </div>
        </div>
      </div>
    </AuthErrorBoundary>
  )
}
