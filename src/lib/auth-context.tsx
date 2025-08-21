'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User, LoginRequest, RegisterRequest } from '@/types/auth';
import { supabase, getUserProfile, signInUser, signOutUser, signUpUser } from '@/lib/supabase-auth';
import { UserInterestsService } from '@/services/userInterestsService';
import { Session } from '@supabase/supabase-js';

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (credentials: LoginRequest) => Promise<void>;
  register: (userData: RegisterRequest) => Promise<void>;
  logout: () => Promise<void>;
  updateProfile: (updates: Partial<User>) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // 監聽 Supabase 認證狀態變化
  useEffect(() => {
    // 取得初始 session
    supabase.auth.getSession().then(({ data: { session } }) => {
      handleAuthStateChange(session);
    });

    // 監聽認證狀態變化
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      handleAuthStateChange(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  // 處理認證狀態變化
  const handleAuthStateChange = async (session: Session | null) => {
    if (session?.user) {
      try {
        // 從 profiles 表取得使用者詳細資訊
        const profile = await getUserProfile(session.user.id);
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
          };
          setUser(userData);

          // 同步興趣清單（登入成功後）
          await syncUserInterests(userData.id);
        } else {
          // 如果找不到 profile，建立基本使用者資訊
          console.warn('Profile not found, creating basic user info');
          const basicUser: User = {
            id: session.user.id,
            email: session.user.email!,
            name: session.user.user_metadata?.name || session.user.email!.split('@')[0],
            role: 'customer',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          };
          setUser(basicUser);

          // 同步興趣清單（登入成功後）
          await syncUserInterests(basicUser.id);
        }
      } catch (error) {
        console.error('Error fetching profile:', error);
        // 即使取得 profile 失敗，仍然設定基本使用者資訊
        const basicUser: User = {
          id: session.user.id,
          email: session.user.email!,
          name: session.user.user_metadata?.name || session.user.email!.split('@')[0],
          role: 'customer',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        setUser(basicUser);

        // 同步興趣清單（登入成功後）
        await syncUserInterests(basicUser.id);
      }
    } else {
      setUser(null);
    }
    setIsLoading(false);
  };

  // 同步使用者興趣清單
  const syncUserInterests = async (userId: string) => {
    try {
      // 取得本地興趣清單
      const localInterests = UserInterestsService.getLocalInterests();

      // 同步到雲端並取得合併後的清單
      const mergedInterests = await UserInterestsService.syncLocalInterests(userId, localInterests);

      // 清除本地儲存，改用雲端資料
      UserInterestsService.clearLocalInterests();

      console.log('User interests synced:', mergedInterests.length, 'products');
    } catch (error) {
      console.error('Error syncing user interests:', error);
    }
  };

  const login = async (credentials: LoginRequest): Promise<void> => {
    setIsLoading(true);

    try {
      await signInUser(credentials.email, credentials.password);
      // 認證狀態變化會由 onAuthStateChange 處理
    } catch (error) {
      setIsLoading(false);
      throw error;
    }
  };

  const register = async (userData: RegisterRequest): Promise<void> => {
    setIsLoading(true);

    try {
      await signUpUser(userData.email, userData.password, userData.name, userData.phone);
      // 認證狀態變化會由 onAuthStateChange 處理
    } catch (error) {
      setIsLoading(false);
      throw error;
    }
  };

  const logout = async () => {
    try {
      // 立即清除使用者狀態，避免在登出過程中查詢 profile
      setUser(null);
      setIsLoading(false);
      await signOutUser();
    } catch (error) {
      console.error('Logout error:', error);
      // 確保狀態已清除
      setUser(null);
      setIsLoading(false);
    }
  };

  const updateProfile = async (updates: Partial<User>): Promise<void> => {
    if (!user) {
      throw new Error('未登入');
    }

    setIsLoading(true);

    try {
      const { updateProfile } = await import('@/lib/supabase-auth');
      const updatedProfile = await updateProfile(user.id, {
        name: updates.name,
        phone: updates.phone,
        address: updates.address,
        role: updates.role,
      });

      if (updatedProfile) {
        const updatedUser: User = {
          ...user,
          name: updatedProfile.name,
          phone: updatedProfile.phone || undefined,
          address: updatedProfile.address || undefined,
          role: updatedProfile.role,
          updatedAt: updatedProfile.updated_at,
        };
        setUser(updatedUser);
      }
    } catch (error) {
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const value: AuthContextType = {
    user,
    isLoading,
    login,
    register,
    logout,
    updateProfile,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}