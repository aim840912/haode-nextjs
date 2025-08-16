'use client';

import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';
import { useState, useRef, useEffect } from 'react';

interface AuthButtonProps {
  isMobile?: boolean;
}

export default function AuthButton({ isMobile = false }: AuthButtonProps) {
  const { user, logout, isLoading } = useAuth();
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // 點擊外部關閉下拉選單
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleLogout = async () => {
    if (isLoggingOut) return;
    
    setIsLoggingOut(true);
    setIsDropdownOpen(false);
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
    if (isMobile) {
      // 行動版保持原本簡單的登出按鈕
      return (
        <button
          onClick={handleLogout}
          disabled={isLoggingOut}
          className={`${baseClasses} ${logoutClasses} ${
            isLoggingOut ? 'opacity-50 cursor-not-allowed' : ''
          }`}
        >
          {isLoggingOut ? "👤 登出中..." : "👤 登出"}
        </button>
      );
    }

    // 桌面版使用下拉選單
    return (
      <div className="relative" ref={dropdownRef}>
        <button
          onClick={() => setIsDropdownOpen(!isDropdownOpen)}
          className={`${baseClasses} text-amber-900 bg-amber-50 hover:bg-amber-100 ${
            isDropdownOpen ? 'bg-amber-100' : ''
          }`}
        >
          <span>👤</span>
          <span>{user.name}</span>
          <svg
            className={`w-4 h-4 transition-transform ${
              isDropdownOpen ? 'rotate-180' : ''
            }`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        {/* 下拉選單 */}
        {isDropdownOpen && (
          <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50">
            <div className="px-4 py-2 text-sm text-gray-600 border-b border-gray-100">
              {user.email}
            </div>
            
            <Link
              href="/profile"
              className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-amber-50 transition-colors"
              onClick={() => setIsDropdownOpen(false)}
            >
              <span className="mr-2">👤</span>
              個人資料
            </Link>
            
            <Link
              href="/cart"
              className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-amber-50 transition-colors"
              onClick={() => setIsDropdownOpen(false)}
            >
              <span className="mr-2">🛒</span>
              購物車
            </Link>

            {/* 管理員選項 */}
            {user && (
              <>
                <div className="border-t border-gray-100 my-1"></div>
                <div className="px-3 py-1">
                  <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">管理功能</p>
                </div>
                
                <Link
                  href="/admin/products"
                  className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-amber-50 transition-colors"
                  onClick={() => setIsDropdownOpen(false)}
                >
                  <span className="mr-2">📦</span>
                  產品管理
                </Link>
                
                <Link
                  href="/admin/news"
                  className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-amber-50 transition-colors"
                  onClick={() => setIsDropdownOpen(false)}
                >
                  <span className="mr-2">📰</span>
                  新聞管理
                </Link>
                
                <Link
                  href="/admin/culture"
                  className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-amber-50 transition-colors"
                  onClick={() => setIsDropdownOpen(false)}
                >
                  <span className="mr-2">🖼️</span>
                  歲月留影管理
                </Link>
                
                <Link
                  href="/admin/farm-tour"
                  className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-amber-50 transition-colors"
                  onClick={() => setIsDropdownOpen(false)}
                >
                  <span className="mr-2">🚜</span>
                  果園活動管理
                </Link>
                
                <Link
                  href="/admin/locations"
                  className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-amber-50 transition-colors"
                  onClick={() => setIsDropdownOpen(false)}
                >
                  <span className="mr-2">📍</span>
                  門市據點管理
                </Link>
              </>
            )}
            
            <div className="border-t border-gray-100 mt-1 pt-1">
              <button
                onClick={handleLogout}
                disabled={isLoggingOut}
                className="w-full flex items-center px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors disabled:opacity-50"
              >
                <span className="mr-2">🚪</span>
                {isLoggingOut ? '登出中...' : '登出'}
              </button>
            </div>
          </div>
        )}
      </div>
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