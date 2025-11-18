import { useCallback, useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useToast } from '@/components/ui/feedback/Toast'
import { useAuth } from '@/contexts/AuthContext'
import { fetchUserInterests } from '@/lib/api/user-interests-api'
import { logger } from '@/lib/logger'
import { UseAuthButtonReturn } from './types'

/**
 * AuthButton 業務邏輯 Hook
 *
 * 負責：
 * - 用戶認證狀態管理
 * - 興趣產品數量載入
 * - 登出處理
 * - 下拉選單開關
 * - 客戶端掛載狀態
 */
export function useAuthButton(): UseAuthButtonReturn {
  const router = useRouter()
  const { user, logout, isLoading } = useAuth()
  const { success, error: showError } = useToast()
  const [isLoggingOut, setIsLoggingOut] = useState(false)
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  const [interestedCount, setInterestedCount] = useState(0)
  const [hasMounted, setHasMounted] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  // 客戶端掛載狀態
  useEffect(() => {
    setHasMounted(true)
  }, [])

  // 點擊外部關閉下拉選單
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

  // 載入興趣產品數量
  useEffect(() => {
    if (!hasMounted) return

    const updateInterestedCount = async () => {
      if (user?.id) {
        // 已登入：從 API 取得數量
        try {
          const interests = await fetchUserInterests()
          setInterestedCount(interests.length)
        } catch (error) {
          if (error instanceof Error && error.message.includes('401')) {
            logger.info('User not authorized for interests API', {
              metadata: { userId: user?.id },
            })
            setInterestedCount(0)
            return
          }

          logger.error('Error fetching interests count', error as Error, {
            metadata: { userId: user?.id },
          })
          setInterestedCount(0)
        }
      } else {
        // 未登入：從 localStorage 取得數量
        if (typeof window !== 'undefined') {
          const savedInterests = localStorage.getItem('interestedProducts')
          if (savedInterests) {
            try {
              const productIds = JSON.parse(savedInterests)
              setInterestedCount(productIds.length)
            } catch (error) {
              logger.error('Error parsing localStorage interests', error as Error)
              setInterestedCount(0)
            }
          } else {
            setInterestedCount(0)
          }
        }
      }
    }

    updateInterestedCount()

    // 監聽自定義事件（同頁面更新）
    const handleCustomUpdate = () => {
      updateInterestedCount()
    }

    if (typeof window !== 'undefined') {
      window.addEventListener('interestedProductsUpdated', handleCustomUpdate)

      return () => {
        window.removeEventListener('interestedProductsUpdated', handleCustomUpdate)
      }
    }
  }, [user?.id, hasMounted])

  // 處理登出
  const handleLogout = useCallback(async () => {
    if (isLoggingOut) return

    setIsLoggingOut(true)
    setIsDropdownOpen(false)
    try {
      await logout()
      success('登出成功', '您已成功登出帳號')
      router.push('/')
    } catch (error) {
      // 檢查是否為預期的錯誤（session 已失效等）
      const err = error as { message?: string; status?: number }
      const isExpectedError =
        err.message?.includes('Invalid Refresh Token') ||
        err.message?.includes('refresh_token_not_found') ||
        err.message?.includes('Auth session missing') ||
        err.status === 403 ||
        err.status === 401

      if (isExpectedError) {
        logger.info('Session 已失效但登出成功', {
          metadata: {
            userId: user?.id,
            errorMessage: err.message,
          },
        })
        success('登出成功', '您已成功登出帳號')
        router.push('/')
      } else {
        logger.error('登出失敗', error as Error, {
          metadata: { userId: user?.id },
        })

        const errorMessage = error instanceof Error ? error.message : '登出失敗，請稍後再試'
        showError('登出失敗', errorMessage)
      }
    } finally {
      setIsLoggingOut(false)
    }
  }, [isLoggingOut, logout, success, user?.id, showError, router])

  // 切換下拉選單
  const toggleDropdown = useCallback(() => {
    setIsDropdownOpen(prev => !prev)
  }, [])

  // 關閉下拉選單
  const closeDropdown = useCallback(() => {
    setIsDropdownOpen(false)
  }, [])

  return {
    user,
    isLoading,
    isLoggingOut,
    isDropdownOpen,
    interestedCount,
    hasMounted,
    dropdownRef: dropdownRef as React.RefObject<HTMLDivElement>,
    handleLogout,
    toggleDropdown,
    closeDropdown,
  }
}
