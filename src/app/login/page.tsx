'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/auth-context'
import { useToast } from '@/components/Toast'
import AuthErrorBoundary from '@/components/AuthErrorBoundary'
import { logger } from '@/lib/logger'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const { login, isLoading } = useAuth()
  const { success, error: showError } = useToast()
  const router = useRouter()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    try {
      logger.debug('開始登入流程', { metadata: { email, action: 'login_start' } })
      await login({ email, password })
      logger.info('登入成功', { metadata: { email, action: 'login_success' } })

      // 顯示成功提示
      success('登入成功', '歡迎回來！')

      // 使用 Next.js router 進行導航，而不是強制重新載入
      router.push('/')
    } catch (err) {
      logger.error('登入錯誤', err as Error, { metadata: { email, action: 'login_error' } })
      const errorMessage = err instanceof Error ? err.message : '登入失敗，請稍後再試'

      // 顯示錯誤提示和設定錯誤狀態
      showError('登入失敗', errorMessage)
      setError(errorMessage)
    }
  }

  return (
    <AuthErrorBoundary>
      <div className="min-h-screen bg-gradient-to-br from-amber-50 to-orange-50 flex items-center justify-center py-12 px-4">
        <div className="max-w-md w-full space-y-8">
          {/* Header */}
          <div className="text-center">
            <Link href="/" className="inline-block mb-6">
              <div className="text-3xl font-bold text-amber-900 tracking-tight">豪德茶業</div>
              <div className="text-sm text-amber-700/70 font-medium tracking-wider">HAUDE TEA</div>
            </Link>
            <h2 className="text-2xl font-semibold text-gray-800 mb-2">歡迎回來</h2>
            <p className="text-gray-600">登入您的帳號以繼續</p>
          </div>

          {/* Login Form */}
          <div className="bg-white rounded-2xl shadow-xl p-8">
            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-red-600 text-sm">{error}</p>
              </div>
            )}

            {/* 新用戶提示 */}
            <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <h3 className="text-sm font-medium text-blue-800 mb-2">歡迎加入</h3>
              <div className="text-xs text-blue-700">首次使用請先註冊帳號，即可享受完整的體驗</div>
            </div>

            <form onSubmit={handleLogin} className="space-y-6">
              {/* Email Input */}
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                  電子郵件
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  required
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-colors text-gray-800 placeholder-gray-500"
                  placeholder="請輸入您的電子郵件"
                />
              </div>

              {/* Password Input */}
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                  密碼
                </label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  required
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-colors text-gray-800 placeholder-gray-500"
                  placeholder="請輸入您的密碼"
                />
              </div>

              {/* Forgot Password */}
              <div className="flex items-center justify-end">
                <Link
                  href="/forgot-password"
                  className="text-sm text-amber-600 hover:text-amber-800 transition-colors"
                >
                  忘記密碼？
                </Link>
              </div>

              {/* Login Button */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-amber-900 text-white py-3 px-4 rounded-lg font-semibold hover:bg-amber-800 focus:ring-2 focus:ring-amber-500 focus:ring-offset-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? '登入中...' : '登入'}
              </button>
            </form>

            {/* Register Link */}
            <div className="mt-6 text-center">
              <p className="text-sm text-gray-600">
                還沒有帳號？{' '}
                <Link
                  href="/register"
                  className="text-amber-600 hover:text-amber-800 font-medium transition-colors"
                >
                  立即註冊
                </Link>
              </p>
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
    </AuthErrorBoundary>
  )
}
