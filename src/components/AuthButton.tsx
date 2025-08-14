'use client';

import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';
import { useState } from 'react';

interface AuthButtonProps {
  isMobile?: boolean;
}

export default function AuthButton({ isMobile = false }: AuthButtonProps) {
  const { user, logout, isLoading } = useAuth();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleLogout = async () => {
    if (isLoggingOut) return;
    
    setIsLoggingOut(true);
    try {
      logout();
      // 強制重新載入頁面以確保狀態完全重置
      window.location.href = '/';
    } catch (error) {
      console.error('登出失敗:', error);
      setIsLoggingOut(false);
    }
  };

  // 共用樣式
  const baseClasses = isMobile 
    ? "px-2 py-1 text-xs font-medium rounded-full transition-all duration-200 border border-amber-200"
    : "px-3 py-1.5 text-xs font-medium rounded-full transition-all duration-200 flex items-center space-x-1 border border-amber-200";

  const loginClasses = "text-amber-900 bg-amber-50 hover:bg-amber-100";
  const logoutClasses = "text-white bg-red-600 hover:bg-red-700 border-red-600";

  if (isLoading) {
    return (
      <div className={`${baseClasses} ${loginClasses}`}>
        {isMobile ? (
          "👤 載入中..."
        ) : (
          <>
            <span>👤</span>
            <span>載入中...</span>
          </>
        )}
      </div>
    );
  }

  if (user) {
    return (
      <button
        onClick={handleLogout}
        disabled={isLoggingOut}
        className={`${baseClasses} ${logoutClasses} ${
          isLoggingOut ? 'opacity-50 cursor-not-allowed' : ''
        }`}
      >
        {isMobile ? (
          isLoggingOut ? "👤 登出中..." : "👤 登出"
        ) : (
          <>
            <span>👤</span>
            <span>{isLoggingOut ? '登出中...' : '登出'}</span>
          </>
        )}
      </button>
    );
  }

  return (
    <Link href="/login" className={`${baseClasses} ${loginClasses}`}>
      {isMobile ? (
        "👤 登入"
      ) : (
        <>
          <span>👤</span>
          <span>登入</span>
        </>
      )}
    </Link>
  );
}