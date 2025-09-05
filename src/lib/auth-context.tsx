'use client'

import { createContext, useContext, useEffect, useState, useCallback, ReactNode } from 'react'
import { User, LoginRequest, RegisterRequest } from '@/types/auth'
import {
  supabase,
  getUserProfile,
  signInUser,
  signOutUser,
  signUpUser,
  updateProfile as updateUserProfile,
} from '@/lib/supabase-auth'
import { UserInterestsService } from '@/services/userInterestsService'
import { Session } from '@supabase/supabase-js'
import { logger } from '@/lib/logger'

interface AuthContextType {
  user: User | null
  isLoading: boolean
  login: (credentials: LoginRequest) => Promise<void>
  register: (userData: RegisterRequest) => Promise<void>
  logout: () => Promise<void>
  updateProfile: (updates: Partial<User>) => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

interface AuthProviderProps {
  children: ReactNode
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  // 檢查是否為 refresh token 錯誤
  const isRefreshTokenError = (error: unknown): boolean => {
    const err = error as { message?: string; name?: string }
    return (
      err?.message?.includes('Invalid Refresh Token') ||
      err?.message?.includes('refresh_token_not_found') ||
      err?.message?.includes('Refresh Token Not Found') ||
      err?.name === 'AuthApiError'
    )
  }

  // 強制登出並清理狀態
  const handleForceLogout = async (reason: string) => {
    logger.info('Force logout triggered', {
      metadata: { reason, action: 'force_logout' },
    })

    try {
      // 清除本地狀態
      setUser(null)
      setIsLoading(false)

      // 清除 Supabase session（不等待結果）
      supabase.auth.signOut().catch(() => {
        // 忽略登出錯誤，因為 token 可能已經無效
      })

      // 清除瀏覽器儲存
      if (typeof window !== 'undefined') {
        localStorage.removeItem('supabase.auth.token')
        // 清除所有 Supabase 相關的 localStorage 項目
        Object.keys(localStorage).forEach(key => {
          if (key.startsWith('sb-') || key.includes('supabase')) {
            localStorage.removeItem(key)
          }
        })

        // 清除所有 cookies
        document.cookie.split(';').forEach(function (c) {
          document.cookie = c
            .replace(/^ +/, '')
            .replace(/=.*/, '=;expires=' + new Date().toUTCString() + ';path=/')
        })
      }

      logger.info('Force logout completed', {
        metadata: { reason, action: 'force_logout_completed' },
      })
    } catch (error) {
      logger.error('Error during force logout', error as Error, {
        metadata: { reason, action: 'force_logout_error' },
      })
    }
  }

  // 處理認證狀態變化
  const handleAuthStateChange = useCallback(
    async (session: Session | null) => {
      try {
        if (session?.user) {
          try {
            // 從 profiles 表取得使用者詳細資訊
            const profile = await getUserProfile(session.user.id)
            if (profile) {
              const userData: User = {
                id: profile.id,
                email: session.user.email!,
                name: profile.name,
                phone: profile.phone || undefined,
                address: profile.address || undefined,
                role: profile.role,
                createdAt: profile.created_at,
                updatedAt: profile.updated_at,
              }
              setUser(userData)

              // 同步興趣清單（登入成功後）
              await syncUserInterests(userData.id)
            } else {
              // 如果找不到 profile，建立基本使用者資訊
              logger.warn('Profile not found, creating basic user info', {
                metadata: { userId: session.user.id, action: 'profile_not_found' },
              })
              const basicUser: User = {
                id: session.user.id,
                email: session.user.email!,
                name: session.user.user_metadata?.name || session.user.email!.split('@')[0],
                role: 'customer',
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
              }
              setUser(basicUser)

              // 同步興趣清單（登入成功後）
              await syncUserInterests(basicUser.id)
            }
          } catch (error) {
            // 檢查是否為認證相關錯誤
            if (isRefreshTokenError(error)) {
              logger.error('Authentication error during profile fetch', error as Error, {
                metadata: { userId: session.user.id, action: 'auth_error_profile_fetch' },
              })
              handleForceLogout('profile_fetch_auth_error')
              return
            }

            logger.error('Error fetching profile', error as Error, {
              metadata: { userId: session.user.id, action: 'fetch_profile_error' },
            })
            // 即使取得 profile 失敗，仍然設定基本使用者資訊
            const basicUser: User = {
              id: session.user.id,
              email: session.user.email!,
              name: session.user.user_metadata?.name || session.user.email!.split('@')[0],
              role: 'customer',
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            }
            setUser(basicUser)

            // 同步興趣清單（登入成功後）
            await syncUserInterests(basicUser.id)
          }
        } else {
          setUser(null)
        }
      } catch (error) {
        logger.error('Unexpected error in handleAuthStateChange', error as Error, {
          metadata: { action: 'handle_auth_state_change_error' },
        })
        // 如果是認證錯誤，強制登出
        if (isRefreshTokenError(error)) {
          handleForceLogout('auth_state_change_error')
          return
        }
        setUser(null)
      } finally {
        setIsLoading(false)
      }
    },
    [isRefreshTokenError, handleForceLogout]
  )

  // 監聽 Supabase 認證狀態變化
  useEffect(() => {
    // 取得初始 session，加入錯誤處理
    supabase.auth
      .getSession()
      .then(({ data: { session } }: { data: { session: Session | null } }) => {
        handleAuthStateChange(session)
      })
      .catch((error: unknown) => {
        logger.error('Failed to get initial session', error as Error, {
          metadata: { action: 'get_initial_session' },
        })
        // 如果是 refresh token 錯誤，強制登出
        if (isRefreshTokenError(error)) {
          handleForceLogout('refresh_token_error')
        }
        setIsLoading(false)
      })

    // 監聽認證狀態變化
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event: string, session: Session | null) => {
      // 特殊處理 TOKEN_REFRESHED 和 SIGNED_OUT 事件
      if (event === 'TOKEN_REFRESHED' && !session) {
        logger.warn('Token refresh failed, forcing logout', {
          metadata: { action: 'token_refresh_failed' },
        })
        handleForceLogout('token_refresh_failed')
        return
      }

      handleAuthStateChange(session)
    })

    return () => subscription.unsubscribe()
  }, [handleAuthStateChange, isRefreshTokenError, handleForceLogout])

  // 同步使用者興趣清單
  const syncUserInterests = async (userId: string) => {
    try {
      // 取得本地興趣清單
      const localInterests = UserInterestsService.getLocalInterests()

      // 同步到雲端並取得合併後的清單
      const mergedInterests = await UserInterestsService.syncLocalInterests(userId, localInterests)

      // 清除本地儲存，改用雲端資料
      UserInterestsService.clearLocalInterests()

      logger.debug('User interests synced', {
        metadata: { count: mergedInterests.length, action: 'sync_interests' },
      })
    } catch (error) {
      logger.error('Error syncing user interests', error as Error, {
        metadata: { action: 'sync_interests' },
      })
    }
  }

  const login = async (credentials: LoginRequest): Promise<void> => {
    setIsLoading(true)

    try {
      await signInUser(credentials.email, credentials.password)
      // 認證狀態變化會由 onAuthStateChange 處理
    } catch (error) {
      setIsLoading(false)
      throw error
    }
  }

  const register = async (userData: RegisterRequest): Promise<void> => {
    setIsLoading(true)

    try {
      await signUpUser(userData.email, userData.password, userData.name, userData.phone)
      // 認證狀態變化會由 onAuthStateChange 處理
    } catch (error) {
      setIsLoading(false)
      throw error
    }
  }

  const logout = async () => {
    try {
      // 立即清除使用者狀態，避免在登出過程中查詢 profile
      setUser(null)
      setIsLoading(false)
      await signOutUser()
    } catch (error) {
      logger.error('Logout error', error as Error, { metadata: { action: 'logout_error' } })
      // 確保狀態已清除
      setUser(null)
      setIsLoading(false)
    }
  }

  const updateProfile = async (updates: Partial<User>): Promise<void> => {
    if (!user) {
      throw new Error('未登入')
    }

    setIsLoading(true)

    try {
      const updatedProfile = await updateUserProfile(user.id, {
        name: updates.name,
        phone: updates.phone,
        address: updates.address,
        role: updates.role,
      })

      if (updatedProfile) {
        const updatedUser: User = {
          ...user,
          name: updatedProfile.name,
          phone: updatedProfile.phone || undefined,
          address: updatedProfile.address || undefined,
          role: updatedProfile.role,
          updatedAt: updatedProfile.updated_at,
        }
        setUser(updatedUser)
      }
    } catch (error) {
      throw error
    } finally {
      setIsLoading(false)
    }
  }

  const value: AuthContextType = {
    user,
    isLoading,
    login,
    register,
    logout,
    updateProfile,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
