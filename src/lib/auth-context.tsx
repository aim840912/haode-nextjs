'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User, LoginRequest, RegisterRequest, AuthResponse } from '@/types/auth';

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (credentials: LoginRequest) => Promise<AuthResponse>;
  register: (userData: RegisterRequest) => Promise<AuthResponse>;
  logout: () => void;
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

  // 從 localStorage 或 sessionStorage 恢復登入狀態
  useEffect(() => {
    let token = localStorage.getItem('auth_token');
    let userData = localStorage.getItem('auth_user');
    let storage: Storage = localStorage;
    
    // 如果 localStorage 中沒有，檢查 sessionStorage
    if (!token || !userData) {
      token = sessionStorage.getItem('auth_token');
      userData = sessionStorage.getItem('auth_user');
      storage = sessionStorage;
    }
    
    if (token && userData) {
      try {
        const parsedUser = JSON.parse(userData);
        setUser(parsedUser);
      } catch (error) {
        // 如果資料無效，清除存儲
        storage.removeItem('auth_token');
        storage.removeItem('auth_user');
      }
    }
    
    setIsLoading(false);
  }, []);

  const login = async (credentials: LoginRequest): Promise<AuthResponse> => {
    setIsLoading(true);
    
    try {
      console.log('AuthContext: 發送登入請求', { email: credentials.email });
      
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(credentials),
      });

      console.log('AuthContext: 收到 API 回應', { 
        status: response.status, 
        ok: response.ok 
      });

      if (!response.ok) {
        const error = await response.json();
        console.error('AuthContext: 登入 API 錯誤', error);
        throw new Error(error.error || '登入失敗');
      }

      const data: AuthResponse = await response.json();
      console.log('AuthContext: 登入成功，設定使用者狀態');
      
      // 確保有效的回應資料
      if (!data.user || !data.token) {
        throw new Error('伺服器回應格式錯誤');
      }
      
      // 根據 rememberMe 決定使用哪種存儲
      const storage = credentials.rememberMe ? localStorage : sessionStorage;
      
      // 清除其他存儲中的舊資料
      const otherStorage = credentials.rememberMe ? sessionStorage : localStorage;
      otherStorage.removeItem('auth_token');
      otherStorage.removeItem('auth_user');
      
      // 儲存到選定的存儲
      try {
        storage.setItem('auth_token', data.token);
        storage.setItem('auth_user', JSON.stringify(data.user));
      } catch (storageError) {
        console.error('AuthContext: 儲存錯誤', storageError);
        throw new Error('無法儲存登入資訊');
      }
      
      // 使用 setTimeout 確保狀態更新在下一個事件循環中執行
      setTimeout(() => {
        setUser(data.user);
      }, 0);
      
      return data;
    } catch (error) {
      console.error('AuthContext: 登入流程錯誤', error);
      
      // 清理可能的部分狀態
      setUser(null);
      
      // 重新拋出錯誤給上層處理
      if (error instanceof Error) {
        throw error;
      } else {
        throw new Error('登入過程中發生未知錯誤');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (userData: RegisterRequest): Promise<AuthResponse> => {
    setIsLoading(true);
    
    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(userData),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || '註冊失敗');
      }

      const data: AuthResponse = await response.json();
      
      // 儲存到 localStorage
      localStorage.setItem('auth_token', data.token);
      localStorage.setItem('auth_user', JSON.stringify(data.user));
      
      setUser(data.user);
      return data;
    } catch (error) {
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    // 清除兩種存儲中的資料
    localStorage.removeItem('auth_token');
    localStorage.removeItem('auth_user');
    sessionStorage.removeItem('auth_token');
    sessionStorage.removeItem('auth_user');
    setUser(null);
  };

  const updateProfile = async (updates: Partial<User>): Promise<void> => {
    if (!user) {
      throw new Error('未登入');
    }

    setIsLoading(true);
    
    try {
      const response = await fetch('/api/auth/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
        },
        body: JSON.stringify(updates),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || '更新失敗');
      }

      const updatedUser: User = await response.json();
      
      // 更新 localStorage
      localStorage.setItem('auth_user', JSON.stringify(updatedUser));
      setUser(updatedUser);
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