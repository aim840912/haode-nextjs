'use client';

import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';
import { useToast } from '@/components/Toast';
import { UserInterestsService } from '@/services/userInterestsService';
import { useState, useRef, useEffect } from 'react';

// SVG 圖示元件
const UserIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
  </svg>
);

const CartIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M7 18c-1.1 0-2 0.9-2 2s0.9 2 2 2 2-0.9 2-2-0.9-2-2-2zM1 2v2h2l3.6 7.59-1.35 2.45c-0.16 0.28-0.25 0.61-0.25 0.96 0 1.1 0.9 2 2 2h12v-2H7.42c-0.14 0-0.25-0.11-0.25-0.25l0.03-0.12L8.1 13h7.45c0.75 0 1.41-0.41 1.75-1.03L21.7 4H5.21l-0.94-2H1zm16 16c-1.1 0-2 0.9-2 2s0.9 2 2 2 2-0.9 2-2-0.9-2-2-2z"/>
  </svg>
);

const PackageIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M20 6h-4V4c0-1.11-.89-2-2-2h-4c-1.11 0-2 .89-2 2v2H4c-1.11 0-1.99.89-1.99 2L2 19c0 1.11.89 2 2 2h16c1.11 0 2-.89 2-2V8c0-1.11-.89-2-2-2zm-6 0h-4V4h4v2z"/>
  </svg>
);

const NewsIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-5 14H7v-2h7v2zm3-4H7v-2h10v2zm0-4H7V7h10v2z"/>
  </svg>
);

const GalleryIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z"/>
  </svg>
);

const FarmIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M12,3L6,7.58V6H4V9.11L1,11.4L1.58,12.25L2,12L2,21H10C10,19.9 10.9,19 12,19C13.1,19 14,19.9 14,21H22V12L22.42,12.25L23,11.4L12,3M12,8.75A2.25,2.25 0 0,1 14.25,11A2.25,2.25 0 0,1 12,13.25A2.25,2.25 0 0,1 9.75,11A2.25,2.25 0 0,1 12,8.75Z"/>
  </svg>
);

const LocationIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
  </svg>
);

const AuditIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M12,1L3,5V11C3,16.55 6.84,21.74 12,23C17.16,21.74 21,16.55 21,11V5L12,1M12,7C13.4,7 14.8,8.6 14.8,10.5V11C15.4,11 16,11.4 16,12V16C16,16.6 15.6,17 15,17H9C8.4,17 8,16.6 8,16V12C8,11.4 8.4,11 9,11V10.5C9,8.6 10.6,7 12,7M12,8.2C11.2,8.2 10.2,8.7 10.2,10.5V11H13.8V10.5C13.8,8.7 12.8,8.2 12,8.2Z"/>
  </svg>
);

const LogoutIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M17 7l-1.41 1.41L18.17 11H8v2h10.17l-2.58 2.58L17 17l5-5zM4 5h8V3H4c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h8v-2H4V5z"/>
  </svg>
);

const HeartIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
  </svg>
);

const InquiryIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-2 10h-4v4h-2v-4H7v-2h4V7h2v4h4v2z"/>
  </svg>
);

interface AuthButtonProps {
  isMobile?: boolean;
}

export default function AuthButton({ isMobile = false }: AuthButtonProps) {
  const { user, logout, isLoading } = useAuth();
  const { success, error: showError } = useToast();
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [interestedCount, setInterestedCount] = useState(0);
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

  // 載入興趣產品數量
  useEffect(() => {
    updateInterestedCount();
    
    // 監聽自定義事件（同頁面更新）
    const handleCustomUpdate = () => {
      updateInterestedCount();
    };

    window.addEventListener('interestedProductsUpdated', handleCustomUpdate);

    return () => {
      window.removeEventListener('interestedProductsUpdated', handleCustomUpdate);
    };
  }, [user]);

  const updateInterestedCount = async () => {
    if (user) {
      // 已登入：從資料庫取得數量
      try {
        const interests = await UserInterestsService.getUserInterests(user.id);
        setInterestedCount(interests.length);
      } catch (error) {
        console.error('Error fetching interests count:', error);
        setInterestedCount(0);
      }
    } else {
      // 未登入：從 localStorage 取得數量
      const savedInterests = localStorage.getItem('interestedProducts');
      if (savedInterests) {
        const productIds = JSON.parse(savedInterests);
        setInterestedCount(productIds.length);
      } else {
        setInterestedCount(0);
      }
    }
  };

  const handleLogout = async () => {
    if (isLoggingOut) return;
    
    setIsLoggingOut(true);
    setIsDropdownOpen(false);
    try {
      await logout();
      // 顯示成功提示
      success('登出成功', '您已成功登出帳號');
      setIsLoggingOut(false);
    } catch (error) {
      console.error('登出失敗:', error);
      const errorMessage = error instanceof Error ? error.message : '登出失敗，請稍後再試';
      
      // 顯示錯誤提示
      showError('登出失敗', errorMessage);
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
          <>
            <UserIcon className="w-4 h-4 inline mr-1" />
            載入中...
          </>
        ) : (
          <>
            <UserIcon className="w-4 h-4" />
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
          {isLoggingOut ? (
            <>
              <UserIcon className="w-4 h-4 inline mr-1" />
              登出中...
            </>
          ) : (
            <>
              <UserIcon className="w-4 h-4 inline mr-1" />
              登出
            </>
          )}
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
          <UserIcon className="w-4 h-4" />
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
              <UserIcon className="w-4 h-4 mr-2" />
              個人資料
            </Link>
            
            <Link
              href="/cart"
              className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-amber-50 transition-colors"
              onClick={() => setIsDropdownOpen(false)}
            >
              <CartIcon className="w-4 h-4 mr-2" />
              購物車
            </Link>
            
            <Link
              href="/inquiry"
              className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-amber-50 transition-colors"
              onClick={() => setIsDropdownOpen(false)}
            >
              <InquiryIcon className="w-4 h-4 mr-2" />
              庫存查詢記錄
            </Link>
            
            <Link
              href="/profile?tab=interests"
              className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-amber-50 transition-colors"
              onClick={() => setIsDropdownOpen(false)}
            >
              <HeartIcon className="w-4 h-4 mr-2" />
              <span className="flex items-center justify-between w-full">
                有興趣的產品
                {interestedCount > 0 && (
                  <span className="ml-1 px-1.5 py-0.5 bg-red-100 text-red-600 text-xs rounded-full font-medium">
                    {interestedCount}
                  </span>
                )}
              </span>
            </Link>

            {/* 管理員選項 */}
            {user && user.role === 'admin' && (
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
                  <PackageIcon className="w-4 h-4 mr-2" />
                  產品管理
                </Link>
                
                <Link
                  href="/admin/news"
                  className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-amber-50 transition-colors"
                  onClick={() => setIsDropdownOpen(false)}
                >
                  <NewsIcon className="w-4 h-4 mr-2" />
                  新聞管理
                </Link>
                
                <Link
                  href="/admin/culture"
                  className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-amber-50 transition-colors"
                  onClick={() => setIsDropdownOpen(false)}
                >
                  <GalleryIcon className="w-4 h-4 mr-2" />
                  歲月留影管理
                </Link>
                
                <Link
                  href="/admin/farm-tour"
                  className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-amber-50 transition-colors"
                  onClick={() => setIsDropdownOpen(false)}
                >
                  <FarmIcon className="w-4 h-4 mr-2" />
                  果園活動管理
                </Link>
                
                <Link
                  href="/admin/locations"
                  className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-amber-50 transition-colors"
                  onClick={() => setIsDropdownOpen(false)}
                >
                  <LocationIcon className="w-4 h-4 mr-2" />
                  門市據點管理
                </Link>
                
                <Link
                  href="/admin/audit-logs"
                  className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-red-50 transition-colors"
                  onClick={() => setIsDropdownOpen(false)}
                >
                  <AuditIcon className="w-4 h-4 mr-2" />
                  審計日誌
                </Link>
              </>
            )}
            
            <div className="border-t border-gray-100 mt-1 pt-1">
              <button
                onClick={handleLogout}
                disabled={isLoggingOut}
                className="w-full flex items-center px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors disabled:opacity-50"
              >
                <LogoutIcon className="w-4 h-4 mr-2" />
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
        <>
          <UserIcon className="w-4 h-4 inline mr-1" />
          登入
        </>
      ) : (
        <>
          <UserIcon className="w-4 h-4" />
          <span>登入</span>
        </>
      )}
    </Link>
  );
}