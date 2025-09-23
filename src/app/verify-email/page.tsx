'use client'

import { useSearchParams } from 'next/navigation'
import { useState } from 'react'
import Link from 'next/link'
import { useAuth } from '@/contexts/AuthContext'
import { useToast } from '@/components/ui/feedback/Toast'
import { getSupabaseClient } from '@/lib/database/supabase-auth'
import { logger } from '@/lib/logger'

export default function VerifyEmailPage() {
  const searchParams = useSearchParams()
  const email = searchParams.get('email') || ''
  const [resending, setResending] = useState(false)
  const [resendSuccess, setResendSuccess] = useState(false)
  const { success, error: showError } = useToast()
  const { user } = useAuth()
  const supabase = getSupabaseClient()

  const handleResendEmail = async () => {
    if (!email) {
      showError('找不到電子郵件地址')
      return
    }

    setResending(true)
    setResendSuccess(false)

    try {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: email,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      })

      if (error) {
        throw error
      }

      setResendSuccess(true)
      success('重新發送成功', '請檢查您的收件箱')

      logger.info('驗證郵件重新發送成功', {
        metadata: { email: email.substring(0, email.indexOf('@')) + '***' },
      })
    } catch (error) {
      logger.error('重新發送驗證郵件失敗', error as Error, {
        metadata: { email: email.substring(0, email.indexOf('@')) + '***' },
      })

      const errorMessage = error instanceof Error ? error.message : '重新發送失敗'
      showError(errorMessage)
    } finally {
      setResending(false)
    }
  }

  // 如果用戶已經登入且郵件已驗證，重定向到個人頁面
  if (user && (user as any).email_confirmed_at) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-amber-50 to-orange-50 flex items-center justify-center py-12 px-4">
        <div className="max-w-md w-full text-center">
          <div className="bg-white rounded-2xl shadow-xl p-8">
            <div className="mb-6">
              <div className="inline-flex items-center justify-center w-20 h-20 bg-green-100 rounded-full">
                <span className="text-3xl">✅</span>
              </div>
            </div>

            <h2 className="text-2xl font-semibold text-gray-800 mb-4">郵件已驗證</h2>

            <p className="text-gray-600 mb-6">您的郵件地址已成功驗證</p>

            <Link
              href="/profile"
              className="inline-block bg-amber-600 text-white px-6 py-3 rounded-lg hover:bg-amber-700 transition-colors"
            >
              前往個人頁面
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 to-orange-50 flex items-center justify-center py-12 px-4">
      <div className="max-w-md w-full text-center">
        {/* Header */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-block mb-6">
            <div className="text-3xl font-bold text-amber-900 tracking-tight">豪德農場</div>
            <div className="text-sm text-amber-700/70 font-medium tracking-wider">HAUDE FARM</div>
          </Link>
        </div>

        <div className="bg-white rounded-2xl shadow-xl p-8">
          {/* 郵件圖示 */}
          <div className="mb-6">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-amber-100 rounded-full">
              <span className="text-3xl">📧</span>
            </div>
          </div>

          <h2 className="text-2xl font-semibold text-gray-800 mb-4">請驗證您的電子郵件</h2>

          <p className="text-gray-600 mb-6">
            我們已經發送驗證郵件到
            <br />
            <span className="font-medium text-gray-800 break-all">{email}</span>
          </p>

          <div className="space-y-4 mb-6">
            <p className="text-sm text-gray-500">請檢查您的收件箱並點擊驗證連結以完成註冊</p>

            <div className="text-xs text-gray-400">⚠️ 請同時檢查垃圾郵件資料夾</div>
          </div>

          {/* 重新發送區域 */}
          <div className="border-t pt-6">
            {resendSuccess ? (
              <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                <p className="text-green-700 text-sm">✅ 驗證郵件已重新發送</p>
              </div>
            ) : (
              <div className="mb-4">
                <p className="text-sm text-gray-600 mb-3">沒收到郵件？</p>
                <button
                  onClick={handleResendEmail}
                  disabled={resending}
                  className="text-amber-600 hover:text-amber-700 text-sm underline disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {resending ? '重新發送中...' : '重新發送驗證郵件'}
                </button>
              </div>
            )}
          </div>

          <div className="border-t pt-6">
            <Link href="/login" className="text-amber-600 hover:text-amber-700 text-sm">
              已經驗證？前往登入
            </Link>
            <span className="mx-2 text-gray-300">|</span>
            <Link href="/register" className="text-gray-500 hover:text-gray-700 text-sm">
              使用其他郵件註冊
            </Link>
          </div>
        </div>

        {/* 注意事項 */}
        <div className="mt-6 text-xs text-gray-500 space-y-1">
          <p>💡 驗證郵件有效期為 24 小時</p>
          <p>🔒 為了您的帳戶安全，請務必完成郵件驗證</p>
        </div>
      </div>
    </div>
  )
}
