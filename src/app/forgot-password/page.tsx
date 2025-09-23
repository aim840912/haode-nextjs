'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useToast } from '@/components/ui/feedback/Toast'
import { logger } from '@/lib/logger'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')
  const { success: showSuccess, error: showError } = useToast()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setIsLoading(true)

    try {
      logger.debug('發送密碼重設請求', { metadata: { email, action: 'forgot_password_request' } })

      const response = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      })

      const result = await response.json()

      if (response.ok) {
        setSuccess(true)
        logger.info('密碼重設郵件發送成功', {
          metadata: { email, action: 'forgot_password_success' },
        })
        showSuccess('郵件已發送', '請檢查您的電子郵件收件匣')
      } else {
        const errorMessage = result.error || '發送失敗，請稍後再試'
        setError(errorMessage)
        showError('發送失敗', errorMessage)
        logger.error('密碼重設郵件發送失敗', new Error(errorMessage), {
          metadata: { email, action: 'forgot_password_error' },
        })
      }
    } catch (err) {
      const errorMessage = '網路錯誤，請稍後再試'
      setError(errorMessage)
      showError('發送失敗', errorMessage)
      logger.error('密碼重設網路錯誤', err as Error, {
        metadata: { email, action: 'forgot_password_network_error' },
      })
    } finally {
      setIsLoading(false)
    }
  }

  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-amber-50 to-orange-50 flex items-center justify-center py-12 px-4">
        <div className="max-w-md w-full space-y-8">
          {/* Header */}
          <div className="text-center">
            <Link href="/" className="inline-block mb-6">
              <div className="text-3xl font-bold text-amber-900 tracking-tight">豪德製茶所</div>
              <div className="text-sm text-amber-700/70 font-medium tracking-wider">HAUDE TEA</div>
            </Link>
            <div className="text-6xl mb-4">📧</div>
            <h2 className="text-2xl font-semibold text-gray-800 mb-2">郵件已發送</h2>
            <p className="text-gray-600">密碼重設連結已發送至您的信箱</p>
          </div>

          {/* Success Card */}
          <div className="bg-white rounded-2xl shadow-xl p-8">
            <div className="text-center space-y-4">
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="flex items-center justify-center mb-2">
                  <span className="text-green-500 text-2xl">✅</span>
                </div>
                <p className="text-green-800 font-medium">重設郵件已發送到</p>
                <p className="text-green-700 text-sm break-all">{email}</p>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-left">
                <h3 className="font-medium text-blue-900 mb-2">接下來的步驟：</h3>
                <ol className="text-sm text-blue-800 space-y-1">
                  <li>1. 檢查您的電子郵件收件匣</li>
                  <li>2. 點擊郵件中的重設密碼連結</li>
                  <li>3. 設定新密碼</li>
                  <li>4. 使用新密碼登入</li>
                </ol>
              </div>

              <div className="text-xs text-gray-500 bg-gray-50 p-3 rounded-lg">
                <p>📌 重設連結將在 1 小時後失效</p>
                <p>📌 如果沒有收到郵件，請檢查垃圾郵件資料夾</p>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="mt-6 space-y-3">
              <button
                onClick={() => setSuccess(false)}
                className="w-full bg-amber-900 text-white py-3 px-4 rounded-lg font-semibold hover:bg-amber-800 focus:ring-2 focus:ring-amber-500 focus:ring-offset-2 transition-colors"
              >
                重新發送郵件
              </button>

              <Link
                href="/login"
                className="block w-full text-center py-3 px-4 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50 focus:ring-2 focus:ring-amber-500 focus:ring-offset-2 transition-colors"
              >
                返回登入
              </Link>
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 to-orange-50 flex items-center justify-center py-12 px-4">
      <div className="max-w-md w-full space-y-8">
        {/* Header */}
        <div className="text-center">
          <Link href="/" className="inline-block mb-6">
            <div className="text-3xl font-bold text-amber-900 tracking-tight">豪德製茶所</div>
            <div className="text-sm text-amber-700/70 font-medium tracking-wider">HAUDE TEA</div>
          </Link>
          <div className="text-6xl mb-4">🔑</div>
          <h2 className="text-2xl font-semibold text-gray-800 mb-2">忘記密碼？</h2>
          <p className="text-gray-600">輸入您的電子郵件，我們將發送重設連結</p>
        </div>

        {/* Form */}
        <div className="bg-white rounded-2xl shadow-xl p-8">
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-600 text-sm">{error}</p>
            </div>
          )}

          {/* Rate Limit Notice */}
          <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <h3 className="text-sm font-medium text-yellow-800 mb-2">請注意</h3>
            <div className="text-xs text-yellow-700">
              為避免濫用，每小時最多只能發送 2 封重設郵件
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
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
                placeholder="請輸入您註冊時使用的電子郵件"
              />
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading || !email.trim()}
              className="w-full bg-amber-900 text-white py-3 px-4 rounded-lg font-semibold hover:bg-amber-800 focus:ring-2 focus:ring-amber-500 focus:ring-offset-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? '發送中...' : '發送重設連結'}
            </button>
          </form>

          {/* Back to Login */}
          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600">
              想起密碼了？{' '}
              <Link
                href="/login"
                className="text-amber-600 hover:text-amber-800 font-medium transition-colors"
              >
                返回登入
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
  )
}
