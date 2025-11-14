import { useCallback, Dispatch, SetStateAction } from 'react'
import {
  supabase,
  getUserProfile,
  signInWithPhoneOrEmail,
  signOutUser,
  signUpUser,
  updateProfile as updateUserProfile,
} from '@/lib/database/supabase-auth'
import { logger } from '@/lib/logger'
import { User, LoginRequest, RegisterRequest } from '@/types/auth'

interface UseAuthOperationsOptions {
  user: User | null
  setUser: Dispatch<SetStateAction<User | null>>
  setIsLoading: Dispatch<SetStateAction<boolean>>
}

export function useAuthOperations({ user, setUser, setIsLoading }: UseAuthOperationsOptions) {
  const login = useCallback(
    async (credentials: LoginRequest): Promise<void> => {
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
    },
    [setIsLoading]
  )

  const register = useCallback(
    async (userData: RegisterRequest): Promise<void> => {
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
                const newUserData: User = {
                  id: profile.id,
                  email: session.user.email!,
                  name: profile.name,
                  phone: profile.phone || undefined,
                  address: profile.address || undefined,
                  role: profile.role,
                  createdAt: profile.created_at,
                  updatedAt: profile.updated_at,
                }
                setUser(newUserData)

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
    },
    [setIsLoading, setUser]
  )

  const logout = useCallback(async () => {
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
  }, [setUser, setIsLoading])

  const updateProfile = useCallback(
    async (updates: Partial<User>): Promise<void> => {
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
    },
    [user, setUser, setIsLoading]
  )

  return {
    login,
    register,
    logout,
    updateProfile,
  }
}
