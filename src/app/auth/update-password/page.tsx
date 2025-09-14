'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/auth-context'
import { useToast } from '@/components/ui/feedback/Toast'
import { logger } from '@/lib/logger'
import LoadingSpinner from '@/components/ui/loading/LoadingSpinner'

export default function UpdatePasswordPage() {
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  const { user, isLoading: authLoading } = useAuth()
  const { success: showSuccess, error: showError } = useToast()
  const router = useRouter()

  // 檢查密碼強度
  const getPasswordStrength = (pwd: string) => {
    if (pwd.length < 6) return { strength: 'weak', message: '密碼過短（至少 6 個字元）' }
    if (pwd.length < 8) return { strength: 'medium', message: '建議至少 8 個字元' }

    const hasNumber = /\d/.test(pwd)
    const hasLower = /[a-z]/.test(pwd)
    const hasUpper = /[A-Z]/.test(pwd)
    const hasSymbol = /[^a-zA-Z0-9]/.test(pwd)

    const strengthCount = [hasNumber, hasLower, hasUpper, hasSymbol].filter(Boolean).length

    if (strengthCount >= 3 && pwd.length >= 8) {
      return { strength: 'strong', message: '密碼強度良好' }
    } else if (strengthCount >= 2 && pwd.length >= 8) {
      return { strength: 'medium', message: '密碼強度中等' }
    } else {
      return { strength: 'weak', message: '建議包含數字、大小寫字母和特殊符號' }
    }
  }

  const passwordStrength = password ? getPasswordStrength(password) : null

  // 檢查使用者是否已登入（透過密碼重設流程）
  useEffect(() => {
    if (!authLoading && !user) {
      logger.warn('未認證使用者嘗試存取更新密碼頁面', {
        module: 'UpdatePasswordPage',
        action: 'unauthorized_access',
      })
      router.push('/forgot-password')
    }
  }, [authLoading, user, router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    // 驗證密碼
    if (password.length < 6) {
      setError('密碼至少需要 6 個字元')
      return
    }

    if (password !== confirmPassword) {
      setError('密碼確認不一致')
      return
    }

    setIsLoading(true)

    try {
      logger.debug('開始更新密碼', {
        module: 'UpdatePasswordPage',
        action: 'update_password_start',
        metadata: { userEmail: user?.email },
      })

      const response = await fetch('/api/auth/update-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ password }),
      })

      const result = await response.json()

      if (response.ok) {
        setSuccess(true)
        logger.info('密碼更新成功', {
          module: 'UpdatePasswordPage',
          action: 'update_password_success',
          metadata: { userEmail: user?.email },
        })
        showSuccess('密碼更新成功', '請使用新密碼重新登入')

        // 延遲後跳轉到登入頁面
        setTimeout(() => {
          router.push('/login?success=password_updated')
        }, 2000)
      } else {
        const errorMessage = result.error || '更新失敗，請稍後再試'
        setError(errorMessage)
        showError('更新失敗', errorMessage)
        logger.error('密碼更新失敗', new Error(errorMessage), {
          module: 'UpdatePasswordPage',
          action: 'update_password_error',
          metadata: { userEmail: user?.email },
        })
      }
    } catch (err) {
      const errorMessage = '網路錯誤，請稍後再試'
      setError(errorMessage)
      showError('更新失敗', errorMessage)
      logger.error('密碼更新網路錯誤', err as Error, {
        module: 'UpdatePasswordPage',
        action: 'update_password_network_error',
        metadata: { userEmail: user?.email },
      })
    } finally {
      setIsLoading(false)
    }
  }

  // 載入中狀態
  if (authLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-amber-50 to-orange-50 flex items-center justify-center">
        <div className="text-center">
          <LoadingSpinner size="lg" />
          <p className="mt-4 text-gray-600">載入中...</p>
        </div>
      </div>
    )
  }

  // 未認證用戶
  if (!user) {
    return null // 已在 useEffect 中處理重定向
  }

  // 成功頁面
  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-amber-50 to-orange-50 flex items-center justify-center py-12 px-4">
        <div className="max-w-md w-full space-y-8">
          {/* Header */}
          <div className="text-center">
            <Link href="/" className="inline-block mb-6">
              <div className="text-3xl font-bold text-amber-900 tracking-tight">豪德茶業</div>
              <div className="text-sm text-amber-700/70 font-medium tracking-wider">HAUDE TEA</div>
            </Link>
            <div className="text-6xl mb-4">✅</div>
            <h2 className="text-2xl font-semibold text-gray-800 mb-2">密碼更新成功</h2>
            <p className="text-gray-600">您的新密碼已設定完成</p>
          </div>

          {/* Success Card */}
          <div className="bg-white rounded-2xl shadow-xl p-8">
            <div className="text-center space-y-4">
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="flex items-center justify-center mb-2">
                  <span className="text-green-500 text-2xl">🎉</span>
                </div>
                <p className="text-green-800 font-medium">密碼已成功更新</p>
                <p className="text-green-700 text-sm">您將自動跳轉至登入頁面</p>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-left">
                <h3 className="font-medium text-blue-900 mb-2">安全提醒：</h3>
                <ul className="text-sm text-blue-800 space-y-1">
                  <li>• 請使用新密碼重新登入</li>
                  <li>• 建議定期更換密碼</li>
                  <li>• 不要與他人分享您的密碼</li>
                  <li>• 如有異常活動請立即聯絡客服</li>
                </ul>
              </div>
            </div>

            {/* Action Button */}
            <div className="mt-6">
              <Link
                href="/login"
                className="block w-full text-center bg-amber-900 text-white py-3 px-4 rounded-lg font-semibold hover:bg-amber-800 focus:ring-2 focus:ring-amber-500 focus:ring-offset-2 transition-colors"
              >
                立即登入
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
            <div className="text-3xl font-bold text-amber-900 tracking-tight">豪德茶業</div>
            <div className="text-sm text-amber-700/70 font-medium tracking-wider">HAUDE TEA</div>
          </Link>
          <div className="text-6xl mb-4">🔐</div>
          <h2 className="text-2xl font-semibold text-gray-800 mb-2">設定新密碼</h2>
          <p className="text-gray-600">請為您的帳號設定一個安全的新密碼</p>
        </div>

        {/* Form */}
        <div className="bg-white rounded-2xl shadow-xl p-8">
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-600 text-sm">{error}</p>
            </div>
          )}

          {/* User Info */}
          <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <h3 className="text-sm font-medium text-blue-800 mb-1">設定密碼給</h3>
            <p className="text-blue-700 text-sm font-medium">{user?.email}</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Password Input */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                新密碼
              </label>
              <input
                id="password"
                name="password"
                type="password"
                required
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-colors text-gray-800 placeholder-gray-500"
                placeholder="請輸入新密碼（至少 6 個字元）"
              />

              {/* Password Strength Indicator */}
              {passwordStrength && (
                <div className="mt-2">
                  <div className="flex items-center space-x-2">
                    <div
                      className={`h-2 w-full rounded-full ${
                        passwordStrength.strength === 'strong'
                          ? 'bg-green-200'
                          : passwordStrength.strength === 'medium'
                            ? 'bg-yellow-200'
                            : 'bg-red-200'
                      }`}
                    >
                      <div
                        className={`h-2 rounded-full transition-all duration-300 ${
                          passwordStrength.strength === 'strong'
                            ? 'bg-green-500 w-full'
                            : passwordStrength.strength === 'medium'
                              ? 'bg-yellow-500 w-2/3'
                              : 'bg-red-500 w-1/3'
                        }`}
                      ></div>
                    </div>
                  </div>
                  <p
                    className={`text-xs mt-1 ${
                      passwordStrength.strength === 'strong'
                        ? 'text-green-600'
                        : passwordStrength.strength === 'medium'
                          ? 'text-yellow-600'
                          : 'text-red-600'
                    }`}
                  >
                    {passwordStrength.message}
                  </p>
                </div>
              )}
            </div>

            {/* Confirm Password Input */}
            <div>
              <label
                htmlFor="confirmPassword"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                確認新密碼
              </label>
              <input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                required
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-colors text-gray-800 placeholder-gray-500"
                placeholder="請再次輸入新密碼"
              />

              {/* Password Match Indicator */}
              {confirmPassword && (
                <div className="mt-2">
                  <p
                    className={`text-xs ${
                      password === confirmPassword ? 'text-green-600' : 'text-red-600'
                    }`}
                  >
                    {password === confirmPassword ? '✓ 密碼一致' : '✗ 密碼不一致'}
                  </p>
                </div>
              )}
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading || !password || !confirmPassword || password !== confirmPassword}
              className="w-full bg-amber-900 text-white py-3 px-4 rounded-lg font-semibold hover:bg-amber-800 focus:ring-2 focus:ring-amber-500 focus:ring-offset-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? '更新中...' : '更新密碼'}
            </button>
          </form>

          {/* Security Tips */}
          <div className="mt-6 bg-gray-50 rounded-lg p-4">
            <h3 className="text-sm font-medium text-gray-800 mb-2">密碼安全建議</h3>
            <ul className="text-xs text-gray-600 space-y-1">
              <li>• 至少 8 個字元，包含大小寫字母、數字和特殊符號</li>
              <li>• 避免使用個人資訊（生日、姓名等）</li>
              <li>• 不要重複使用其他網站的密碼</li>
            </ul>
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
