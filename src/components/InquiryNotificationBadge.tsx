/**
 * 庫存查詢通知徽章元件
 * 為管理員顯示未讀庫存查詢數量的通知徽章，支援點擊導航和動畫效果
 */

'use client';

import { useRouter } from 'next/navigation';
import { useInquiryStatsContext } from '@/contexts/InquiryStatsContext';
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

// 庫存查詢管理圖標元件
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
  const { stats, loading, error, isRetrying, retryCount } = useInquiryStatsContext();
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
      container: 'w-8 h-8',
      icon: 'w-5 h-5',
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

  // 判斷是否顯示錯誤狀態
  const shouldShowError = error && process.env.NODE_ENV === 'development' && !isRetrying;
  const hasData = stats !== null;
  
  // 載入或錯誤狀態顯示
  if ((loading && !hasData) || shouldShowError) {
    const iconColorClass = shouldShowError 
      ? 'text-red-400 hover:text-red-600' 
      : 'text-gray-400 hover:text-gray-600';
      
    const title = shouldShowError 
      ? `庫存查詢 (錯誤: ${error})` 
      : loading 
        ? '庫存查詢 (載入中...)' 
        : '庫存查詢';

    return showIcon ? (
      <div className={`relative ${currentSize.container} ${className}`}>
        <button
          onClick={handleClick}
          className={`w-full h-full flex items-center justify-center bg-amber-100 text-amber-900 rounded-full transition-all duration-300 hover:bg-amber-700 hover:text-white hover:scale-110 hover:shadow-lg group`}
          title={title}
          disabled={loading && !hasData}
        >
          <div className="group-hover:scale-110 transition-transform duration-200">
            <InquiryIcon className={currentSize.icon} />
          </div>
        </button>
        
        {/* 重試指示器 */}
        {isRetrying && (
          <div className="absolute -top-1 -right-1 w-3 h-3">
            <div className="w-full h-full bg-yellow-400 rounded-full animate-ping"></div>
          </div>
        )}
        
        {/* 開發模式錯誤指示器 */}
        {shouldShowError && (
          <div className="absolute -top-1 -right-1 w-3 h-3">
            <div className="w-full h-full bg-red-500 rounded-full"></div>
          </div>
        )}
      </div>
    ) : null;
  }

  return (
    <div className={`relative ${currentSize.container} ${className}`}>
      <button
        onClick={handleClick}
        className={`
          w-full h-full flex items-center justify-center rounded-full
          bg-amber-100 text-amber-900
          transition-all duration-300 group
          hover:bg-amber-700 hover:text-white hover:scale-110 hover:shadow-lg
          ${hasUnread ? 'animate-pulse' : ''}
        `}
        title={`庫存查詢${hasUnread ? ` (${unreadCount} 未讀)` : ''}`}
      >
        {showIcon && (
          <div className="group-hover:scale-110 transition-transform duration-200">
            <InquiryIcon className={currentSize.icon} />
          </div>
        )}
        
        {!showIcon && !hasUnread && (
          <span className="text-xs font-medium text-gray-600">查詢</span>
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
      {loading && hasData && (
        <div className="absolute top-0 right-0 w-2 h-2">
          <div className="w-full h-full bg-gray-400 rounded-full animate-ping"></div>
        </div>
      )}

      {/* 重試指示器 */}
      {isRetrying && (
        <div className="absolute top-0 right-0 w-2 h-2">
          <div className="w-full h-full bg-yellow-400 rounded-full animate-ping"></div>
        </div>
      )}

      {/* 開發模式錯誤指示器 */}
      {error && process.env.NODE_ENV === 'development' && !isRetrying && (
        <div className="absolute top-0 right-0 w-2 h-2">
          <div className="w-full h-full bg-red-500 rounded-full animate-pulse"></div>
        </div>
      )}
    </div>
  );
}