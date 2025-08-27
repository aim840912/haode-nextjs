/**
 * 詢價通知徽章元件
 * 為管理員顯示未讀詢價數量的通知徽章，支援點擊導航和動畫效果
 */

'use client';

import { useRouter } from 'next/navigation';
import { useInquiryStats } from '@/hooks/useInquiryStats';
import { useAuth } from '@/lib/auth-context';

interface InquiryNotificationBadgeProps {
  /** 徽章大小 */
  size?: 'sm' | 'md' | 'lg';
  /** 是否顯示圖標 */
  showIcon?: boolean;
  /** 自訂 CSS 類別 */
  className?: string;
  /** 點擊事件回調 */
  onClick?: () => void;
}

// 詢價管理圖標元件
function InquiryIcon({ className = "w-5 h-5" }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
      />
    </svg>
  );
}

export default function InquiryNotificationBadge({
  size = 'sm',
  showIcon = true,
  className = '',
  onClick
}: InquiryNotificationBadgeProps) {
  const { user } = useAuth();
  const { stats, loading, error } = useInquiryStats(30000); // 每30秒重新整理
  const router = useRouter();

  // 只有管理員才顯示
  const isAdmin = user?.role === 'admin';
  if (!isAdmin) return null;

  // 取得未讀數量
  const unreadCount = stats?.unread_count || 0;
  const hasUnread = unreadCount > 0;

  // 處理點擊事件
  const handleClick = () => {
    if (onClick) {
      onClick();
    } else {
      router.push('/admin/inquiries');
    }
  };

  // 格式化顯示數量
  const displayCount = unreadCount > 99 ? '99+' : unreadCount.toString();

  // 大小相關的樣式
  const sizeClasses = {
    sm: {
      container: 'w-6 h-6',
      icon: 'w-4 h-4',
      badge: 'w-4 h-4 text-[10px]',
      badgePosition: '-top-1 -right-1'
    },
    md: {
      container: 'w-8 h-8',
      icon: 'w-5 h-5',
      badge: 'w-5 h-5 text-xs',
      badgePosition: '-top-2 -right-2'
    },
    lg: {
      container: 'w-10 h-10',
      icon: 'w-6 h-6',
      badge: 'w-6 h-6 text-sm',
      badgePosition: '-top-2 -right-2'
    }
  };

  const currentSize = sizeClasses[size];

  // 載入或錯誤狀態顯示
  if (loading || error) {
    return showIcon ? (
      <div className={`relative ${currentSize.container} ${className}`}>
        <button
          onClick={handleClick}
          className="w-full h-full flex items-center justify-center text-gray-400 hover:text-gray-600 transition-colors rounded-full hover:bg-gray-100"
          title="詢價管理"
          disabled={loading}
        >
          <InquiryIcon className={currentSize.icon} />
        </button>
      </div>
    ) : null;
  }

  return (
    <div className={`relative ${currentSize.container} ${className}`}>
      <button
        onClick={handleClick}
        className={`
          w-full h-full flex items-center justify-center rounded-full
          transition-all duration-200 group
          ${hasUnread 
            ? 'text-amber-700 hover:text-amber-900 hover:bg-amber-50' 
            : 'text-gray-600 hover:text-gray-800 hover:bg-gray-100'
          }
          ${hasUnread ? 'animate-pulse' : ''}
        `}
        title={`詢價管理${hasUnread ? ` (${unreadCount} 未讀)` : ''}`}
      >
        {showIcon && <InquiryIcon className={currentSize.icon} />}
        
        {!showIcon && !hasUnread && (
          <span className="text-xs font-medium text-gray-600">詢價</span>
        )}
        
        {/* 未讀數量徽章 */}
        {hasUnread && (
          <span
            className={`
              absolute ${currentSize.badgePosition} ${currentSize.badge}
              bg-red-500 text-white font-bold
              flex items-center justify-center
              rounded-full border-2 border-white
              group-hover:bg-red-600
              transition-colors duration-200
              shadow-sm
              ${hasUnread ? 'animate-bounce' : ''}
            `}
            style={{
              animationDuration: hasUnread ? '2s' : undefined,
              animationIterationCount: hasUnread ? 'infinite' : undefined
            }}
          >
            {displayCount}
          </span>
        )}
      </button>

      {/* 載入指示器 */}
      {loading && (
        <div className={`absolute inset-0 flex items-center justify-center`}>
          <div className="w-2 h-2 bg-gray-400 rounded-full animate-ping"></div>
        </div>
      )}
    </div>
  );
}