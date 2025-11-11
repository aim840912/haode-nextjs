'use client'

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  useRef,
  ReactNode,
} from 'react'
import { Session } from '@supabase/supabase-js'
import { syncLocalInterests as syncInterestsToCloud } from '@/lib/api/user-interests-api'
import {
  supabase,
  getUserProfile,
  signInWithPhoneOrEmail,
  signInWithProvider,
  signOutUser,
  signUpUser,
  updateProfile as updateUserProfile,
} from '@/lib/database/supabase-auth'
import { logger } from '@/lib/logger'
import { User, LoginRequest, RegisterRequest } from '@/types/auth'

interface AuthContextType {
  user: User | null
  isLoading: boolean
  login: (credentials: LoginRequest) => Promise<void>
  register: (userData: RegisterRequest) => Promise<void>
  logout: () => Promise<void>
  updateProfile: (updates: Partial<User>) => Promise<void>
  signInWithProvider: typeof signInWithProvider
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
  const isRefreshTokenError = useCallback((error: unknown): boolean => {
    const err = error as { message?: string; name?: string }
    return (
      err?.message?.includes('Invalid Refresh Token') ||
      err?.message?.includes('refresh_token_not_found') ||
      err?.message?.includes('Refresh Token Not Found') ||
      err?.name === 'AuthApiError'
    )
  }, [])

  // 強制登出並清理狀態
  const handleForceLogout = useCallback(async (reason: string) => {
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
  }, [])

  // 追蹤驗證狀態避免重複執行
  const validationRef = useRef<{ isValidating: boolean; lastValidation: number }>({
    isValidating: false,
    lastValidation: 0,
  })

  // 添加事件處理防抖機制
  const eventProcessingRef = useRef<{ lastEvent: string; lastTime: number }>({
    lastEvent: '',
    lastTime: 0,
  })

  // 定期驗證 session 有效性
  const validateSession = useCallback(async () => {
    // 嚴格檢查：必須有 user 且 user 有 id
    if (!user || !user.id) {
      logger.debug('跳過 session 驗證：沒有有效用戶', {
        metadata: { action: 'skip_validation_no_user', hasUser: !!user },
      })
      return false
    }

    // 防止重複執行
    const now = Date.now()
    if (validationRef.current.isValidating) {
      logger.debug('跳過 session 驗證：正在執行中', {
        metadata: { action: 'skip_validation_in_progress' },
      })
      return false
    }

    // 防止過於頻繁的驗證（至少間隔 30 秒）
    if (now - validationRef.current.lastValidation < 30000) {
      logger.debug('跳過 session 驗證：間隔時間太短', {
        metadata: {
          action: 'skip_validation_too_frequent',
          timeSinceLastValidation: now - validationRef.current.lastValidation,
        },
      })
      return false
    }

    validationRef.current.isValidating = true
    validationRef.current.lastValidation = now

    try {
      // 嘗試刷新 session 來驗證其有效性
      const {
        data: { session },
        error,
      } = await supabase.auth.refreshSession()

      if (error || !session) {
        // Session 驗證失敗時，記錄錯誤但不立即登出
        // 允許下次驗證時重試，避免因暫時性網路問題導致登出
        logger.warn('Session 驗證失敗，將在下次驗證時重試', {
          metadata: {
            action: 'session_validation_failed_will_retry',
            error: error?.message,
            hasSession: !!session,
            userId: user.id,
            errorType: error?.name,
          },
        })

        // 不執行 handleForceLogout，只返回 false
        // 如果問題持續存在，後續驗證會繼續記錄
        return false
      }

      logger.debug('Session 驗證成功', {
        metadata: { action: 'session_validation_success', userId: user.id },
      })
      return true
    } catch (error) {
      // Session 驗證發生例外時，記錄錯誤但不立即登出
      // 這可能是暫時性的網路問題或 API 延遲
      logger.error('Session 驗證時發生錯誤，將在下次驗證時重試', error as Error, {
        metadata: {
          action: 'session_validation_error_will_retry',
          userId: user.id,
          errorName: (error as Error).name,
        },
      })

      // 不執行 handleForceLogout，允許後續重試
      return false
    } finally {
      validationRef.current.isValidating = false
    }
  }, [user, handleForceLogout])

  // 設定定期 session 驗證（每 15 分鐘檢查一次）
  // 降低驗證頻率可減少因網路問題導致的驗證失敗
  useEffect(() => {
    if (!user || !user.id) return

    const interval = setInterval(
      () => {
        validateSession()
      },
      15 * 60 * 1000
    ) // 15 分鐘

    return () => clearInterval(interval)
    // validateSession 已包含 user 依賴，因此 user 變化時會重新創建 interval
  }, [validateSession, user])

  // 本地儲存工具函數
  const getLocalInterests = (): string[] => {
    try {
      if (typeof localStorage === 'undefined') {
        return []
      }
      const saved = localStorage.getItem('interestedProducts')
      return saved ? JSON.parse(saved) : []
    } catch (error) {
      logger.error('取得本地興趣清單失敗', error as Error, {
        metadata: { action: 'get_local_interests' },
      })
      return []
    }
  }

  const clearLocalInterests = (): void => {
    try {
      if (typeof localStorage !== 'undefined') {
        localStorage.removeItem('interestedProducts')
        // 觸發事件通知其他元件更新
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('interestedProductsUpdated'))
        }
      }
    } catch (error) {
      logger.error('清除本地興趣清單失敗', error as Error, {
        metadata: { action: 'clear_local_interests' },
      })
    }
  }

  // 同步使用者興趣清單
  const syncUserInterests = useCallback(async () => {
    try {
      // 取得本地興趣清單
      const localInterests = getLocalInterests()

      // 同步到雲端並取得合併後的清單（使用 API 呼叫）
      const mergedInterests = await syncInterestsToCloud(localInterests)

      // 清除本地儲存，改用雲端資料
      clearLocalInterests()

      logger.debug('User interests synced', {
        metadata: { count: mergedInterests.length, action: 'sync_interests' },
      })
    } catch (error) {
      logger.error('Error syncing user interests', error as Error, {
        metadata: { action: 'sync_interests' },
      })
    }
  }, [])

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
              await syncUserInterests()
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
              await syncUserInterests()
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
            await syncUserInterests()
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
    [isRefreshTokenError, handleForceLogout, syncUserInterests]
  )

  // 監聽 Supabase 認證狀態變化
  useEffect(() => {
    // 取得初始 session，加入強化的錯誤處理和驗證
    const initializeAuth = async () => {
      try {
        // 先嘗試取得本地 session
        const {
          data: { session },
          error: sessionError,
        } = await supabase.auth.getSession()

        if (sessionError) {
          logger.error('取得初始 session 失敗', sessionError as Error, {
            metadata: { action: 'get_initial_session_error' },
          })

          // 如果是 refresh token 錯誤，強制登出
          if (isRefreshTokenError(sessionError)) {
            handleForceLogout('initial_session_refresh_error')
            return
          }

          setIsLoading(false)
          return
        }

        // 如果有 session，進一步驗證其有效性
        if (session) {
          try {
            // 嘗試使用 session 取得用戶資訊來驗證有效性
            const {
              data: { user },
              error: userError,
            } = await supabase.auth.getUser()

            if (userError || !user) {
              logger.warn('初始 session 無效，清理並重新開始', {
                metadata: {
                  action: 'invalid_session_cleanup',
                  error: userError?.message,
                  hasUser: !!user,
                },
              })

              // 清理無效的 session
              await supabase.auth.signOut()
              handleForceLogout('invalid_session_found')
              return
            }

            // Session 有效，正常處理
            logger.info('初始 session 驗證成功', {
              metadata: { action: 'valid_session_found', userId: user.id },
            })
            handleAuthStateChange(session)
          } catch (validationError) {
            logger.error('驗證 session 時發生錯誤', validationError as Error, {
              metadata: { action: 'session_validation_failed' },
            })

            // 驗證失敗，清理狀態
            handleForceLogout('session_validation_failed')
          }
        } else {
          // 沒有 session，正常處理
          logger.debug('沒有初始 session', {
            metadata: { action: 'no_initial_session' },
          })
          handleAuthStateChange(null)
        }
      } catch (error) {
        logger.error('初始化認證時發生未預期錯誤', error as Error, {
          metadata: { action: 'auth_initialization_error' },
        })

        // 發生錯誤時，確保狀態被正確設定
        setIsLoading(false)
        setUser(null)
      }
    }

    initializeAuth()

    // 監聽認證狀態變化
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event: string, session: Session | null) => {
      const now = Date.now()
      const lastProcessing = eventProcessingRef.current

      // 防抖：相同事件在 1 秒內只處理一次
      if (lastProcessing.lastEvent === event && now - lastProcessing.lastTime < 1000) {
        logger.debug('跳過重複的認證事件', {
          metadata: { event, skipped: true, action: 'duplicate_event_skip' },
        })
        return
      }

      eventProcessingRef.current = { lastEvent: event, lastTime: now }

      logger.debug('Auth state change event', {
        metadata: { event, hasSession: !!session, action: 'auth_state_change' },
      })

      // 特殊處理各種認證事件
      if (event === 'SIGNED_OUT') {
        logger.info('檢測到登出事件，清理本地狀態', {
          metadata: { action: 'signed_out_event' },
        })
        handleForceLogout('signed_out_event')
        return
      }

      if (event === 'TOKEN_REFRESHED' && !session) {
        // Token refresh 失敗時，先嘗試重新取得 session，而不是立即登出
        logger.warn('Token refresh 返回空 session，嘗試重新取得', {
          metadata: { action: 'token_refresh_empty_session' },
        })

        try {
          const {
            data: { session: retrySession },
            error: retryError,
          } = await supabase.auth.getSession()

          if (retryError) {
            logger.error('重新取得 session 時發生錯誤', retryError as Error, {
              metadata: { action: 'retry_get_session_error' },
            })
            handleForceLogout('token_refresh_failed_after_retry')
            return
          }

          if (!retrySession) {
            logger.warn('重試後仍無法取得 session，執行登出', {
              metadata: { action: 'token_refresh_failed_after_retry' },
            })
            handleForceLogout('token_refresh_failed_after_retry')
            return
          }

          // 重試成功，更新 auth state
          logger.info('重新取得 session 成功', {
            metadata: { action: 'retry_get_session_success' },
          })
          handleAuthStateChange(retrySession)
        } catch (error) {
          logger.error('重試取得 session 時發生例外', error as Error, {
            metadata: { action: 'retry_get_session_exception' },
          })
          handleForceLogout('token_refresh_exception')
        }
        return
      }

      // 處理 session 失效的情況
      if (event === 'INITIAL_SESSION' && session) {
        try {
          // 驗證 session 是否真的有效
          const {
            data: { user },
            error,
          } = await supabase.auth.getUser()
          if (error || !user) {
            // 如果是嚴重的認證錯誤（如 refresh token 過期），才強制登出
            if (error && isRefreshTokenError(error)) {
              logger.warn('初始 session 包含無效的 refresh token，清理狀態', {
                metadata: {
                  action: 'invalid_initial_session_force_logout',
                  error: error?.message,
                },
              })
              handleForceLogout('invalid_initial_session')
              return
            }

            // 其他錯誤只記錄，不強制登出
            logger.warn('初始 session 驗證失敗，將在後續驗證時重試', {
              metadata: {
                action: 'invalid_initial_session_will_retry',
                error: error?.message,
              },
            })
            return
          }
        } catch (error) {
          // 驗證過程中的例外，記錄但不強制登出
          logger.error('驗證初始 session 時發生錯誤，將在後續驗證時重試', error as Error, {
            metadata: {
              action: 'session_validation_error_will_retry',
              errorName: (error as Error).name,
            },
          })
          return
        }
      }

      handleAuthStateChange(session)
    })

    return () => subscription.unsubscribe()
  }, [handleAuthStateChange, isRefreshTokenError, handleForceLogout])

  const login = async (credentials: LoginRequest): Promise<void> => {
    setIsLoading(true)

    try {
      // 使用新的雙重輸入登入函數
      await signInWithPhoneOrEmail(
        credentials.identifier,
        credentials.password,
        credentials.inputType
      )
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

      // 主動載入 profile 資料以確保完整性
      // 避免時間競爭問題導致註冊後 phone 等資料不顯示
      if (userData.phone) {
        try {
          // 等待一點時間讓資料庫觸發器執行
          await new Promise(resolve => setTimeout(resolve, 1500))

          // 取得當前 session
          const {
            data: { session },
          } = await supabase.auth.getSession()

          if (session?.user) {
            // 主動從資料庫取得 profile 資料
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

              logger.info('註冊後 Profile 資料已載入', {
                metadata: { hasPhone: !!profile.phone, action: 'register_profile_loaded' },
              })
            }
          }
        } catch (profileError) {
          // 載入 profile 失敗不影響註冊流程，會由 onAuthStateChange 處理
          logger.warn('註冊後主動載入 profile 失敗', {
            metadata: { error: String(profileError), action: 'register_profile_load_failed' },
          })
        }
      }

      // 認證狀態變化也會由 onAuthStateChange 處理（雙重保險）
    } catch (error) {
      setIsLoading(false)
      throw error
    } finally {
      setIsLoading(false)
    }
  }

  const logout = async () => {
    try {
      // 立即清除使用者狀態，避免在登出過程中查詢 profile
      setUser(null)
      setIsLoading(false)

      // 清除瀏覽器儲存中的認證資料
      if (typeof window !== 'undefined') {
        // 清除所有 Supabase 相關的 localStorage 項目
        Object.keys(localStorage).forEach(key => {
          if (key.startsWith('sb-') || key.includes('supabase')) {
            localStorage.removeItem(key)
          }
        })
      }

      // 嘗試登出，但不依賴其成功
      await signOutUser()

      logger.info('登出完成', {
        metadata: { action: 'logout_success' },
      })
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
        logger.info('Session 已失效，登出目標已達成', {
          metadata: {
            action: 'logout_session_expired',
            errorMessage: err.message,
          },
        })
      } else {
        logger.error('登出時發生未預期錯誤', error as Error, {
          metadata: { action: 'logout_unexpected_error' },
        })
        // 即使有錯誤，也不要重新拋出，因為本地狀態已清除
      }

      // 確保狀態已清除（防護措施）
      setUser(null)
      setIsLoading(false)

      // 強制清除瀏覽器儲存（防護措施）
      if (typeof window !== 'undefined') {
        Object.keys(localStorage).forEach(key => {
          if (key.startsWith('sb-') || key.includes('supabase')) {
            localStorage.removeItem(key)
          }
        })
      }
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
    signInWithProvider,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
