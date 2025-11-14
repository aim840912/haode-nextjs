import { ReactNode } from 'react'
import { signInWithProvider } from '@/lib/database/supabase-auth'
import { User, LoginRequest, RegisterRequest } from '@/types/auth'

export interface AuthContextType {
  user: User | null
  isLoading: boolean
  login: (credentials: LoginRequest) => Promise<void>
  register: (userData: RegisterRequest) => Promise<void>
  logout: () => Promise<void>
  updateProfile: (updates: Partial<User>) => Promise<void>
  signInWithProvider: typeof signInWithProvider
}

export interface AuthProviderProps {
  children: ReactNode
}
