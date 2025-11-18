import React from 'react'
import Link from 'next/link'
import { cn } from '@/lib/utils/cn'
import { UserIcon } from './icons'

interface AuthButtonStatesProps {
  isMobile: boolean
  baseClasses: string
  loginClasses: string
}

/**
 * 載入狀態元件
 */
export const LoadingState = React.memo<AuthButtonStatesProps>(
  ({ isMobile, baseClasses, loginClasses }) => (
    <div className={cn(baseClasses, loginClasses)}>
      {isMobile ? (
        <>
          <UserIcon className="w-4 h-4 inline mr-1" />
          載入中...
        </>
      ) : (
        <>
          <UserIcon className="w-4 h-4" />
          <span>載入中...</span>
        </>
      )}
    </div>
  )
)

LoadingState.displayName = 'LoadingState'

/**
 * 初始狀態元件（SSR 用）
 */
export const InitialState = React.memo<AuthButtonStatesProps>(
  ({ isMobile, baseClasses, loginClasses }) => (
    <div className={cn(baseClasses, loginClasses)} suppressHydrationWarning>
      {isMobile ? (
        <>
          <UserIcon className="w-4 h-4 inline mr-1" />
          登入
        </>
      ) : (
        <>
          <UserIcon className="w-4 h-4" />
          <span>登入</span>
        </>
      )}
    </div>
  )
)

InitialState.displayName = 'InitialState'

/**
 * 登入連結元件
 */
export const LoginLink = React.memo<AuthButtonStatesProps>(
  ({ isMobile, baseClasses, loginClasses }) => (
    <div className="relative">
      <Link href="/login" className={cn(baseClasses, loginClasses)}>
        {isMobile ? (
          <>
            <UserIcon className="w-4 h-4 mr-1" />
            登入
          </>
        ) : (
          <>
            <UserIcon className="w-4 h-4" />
            <span>登入</span>
          </>
        )}
      </Link>
    </div>
  )
)

LoginLink.displayName = 'LoginLink'
