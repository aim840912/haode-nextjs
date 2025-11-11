'use client'

import { useState } from 'react'
import { signInWithProvider } from '@/lib/database/supabase-auth'
import { OAuthProvider } from '@/types/oauth'
import { SocialLoginButton } from './SocialLoginButton'

interface SocialLoginSectionProps {
  /** 啟用的 OAuth 提供者 */
  providers: OAuthProvider[]
  /** 登入成功後的導向 URL */
  redirectTo?: string
}

export function SocialLoginSection({ providers, redirectTo }: SocialLoginSectionProps) {
  const [loading, setLoading] = useState(false)

  const handleSocialLogin = async (provider: OAuthProvider) => {
    setLoading(true)

    try {
      const { error } = await signInWithProvider(provider, { redirectTo })

      if (error) {
        // 錯誤會在 signInWithProvider 中記錄
        // 這裡不顯示 toast，因為用戶會被導向到 OAuth 頁面
        console.error(`${provider} 登入失敗:`, error)
      }
      // 成功時會自動導向到 OAuth 頁面
    } catch (err) {
      console.error('登入過程發生錯誤:', err)
    } finally {
      // 通常不會執行到這裡，因為會導向到 OAuth 頁面
      setLoading(false)
    }
  }

  if (providers.length === 0) {
    return null
  }

  return (
    <div className="space-y-3">
      {/* 分隔線 */}
      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-gray-300 dark:border-gray-600" />
        </div>
        <div className="relative flex justify-center text-sm">
          <span className="px-4 bg-white dark:bg-gray-900 text-gray-500 dark:text-gray-400">
            或使用社交帳號登入
          </span>
        </div>
      </div>

      {/* 社交登入按鈕 */}
      <div className="space-y-2">
        {providers.map(provider => (
          <SocialLoginButton
            key={provider}
            provider={provider}
            onClick={handleSocialLogin}
            disabled={loading}
          />
        ))}
      </div>
    </div>
  )
}
