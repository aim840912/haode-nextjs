'use client'

import { createContext, useContext } from 'react'
import { signInWithProvider } from '@/lib/database/supabase-auth'
import { useAuthInterests } from './useAuthInterests'
import { useAuthOperations } from './useAuthOperations'
import { useAuthSession } from './useAuthSession'
import type { AuthContextType, AuthProviderProps } from './types'

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

export function AuthProvider({ children }: AuthProviderProps) {
  // 興趣清單同步
  const { syncUserInterests } = useAuthInterests()

  // Session 管理
  const { user, isLoading, setUser, setIsLoading } = useAuthSession({
    onInterestsSync: syncUserInterests,
  })

  // 認證操作
  const { login, register, logout, updateProfile } = useAuthOperations({
    user,
    setUser,
    setIsLoading,
  })

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
