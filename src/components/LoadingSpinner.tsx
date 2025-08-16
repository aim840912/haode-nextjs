'use client';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  color?: 'primary' | 'secondary' | 'white' | 'gray';
  className?: string;
}

export default function LoadingSpinner({ 
  size = 'md', 
  color = 'primary',
  className = '' 
}: LoadingSpinnerProps) {
  const getSizeClass = () => {
    switch (size) {
      case 'sm': return 'w-4 h-4';
      case 'md': return 'w-8 h-8';
      case 'lg': return 'w-12 h-12';
      case 'xl': return 'w-16 h-16';
    }
  };

  const getColorClass = () => {
    switch (color) {
      case 'primary': return 'border-amber-600';
      case 'secondary': return 'border-gray-600';
      case 'white': return 'border-white';
      case 'gray': return 'border-gray-400';
    }
  };

  return (
    <div 
      className={`
        ${getSizeClass()} 
        border-2 border-t-transparent rounded-full animate-spin
        ${getColorClass()}
        ${className}
      `}
      role="status"
      aria-label="載入中"
    >
      <span className="sr-only">載入中...</span>
    </div>
  );
}

// 全頁載入覆蓋層
export function LoadingOverlay({ show, message = '載入中...' }: { show: boolean; message?: string }) {
  if (!show) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
      <div className="bg-white rounded-lg p-6 flex flex-col items-center space-y-4">
        <LoadingSpinner size="lg" />
        <p className="text-gray-700 font-medium">{message}</p>
      </div>
    </div>
  );
}

// 按鈕內的載入狀態
export function LoadingButton({ 
  loading, 
  children, 
  onClick,
  className = '',
  disabled = false,
  ...props 
}: {
  loading: boolean;
  children: React.ReactNode;
  onClick?: () => void;
  className?: string;
  disabled?: boolean;
} & React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      {...props}
      onClick={loading ? undefined : onClick}
      disabled={disabled || loading}
      className={`
        relative flex items-center justify-center space-x-2 transition-opacity
        ${loading ? 'cursor-not-allowed opacity-75' : ''}
        ${className}
      `}
    >
      {loading && (
        <LoadingSpinner size="sm" color="white" className="mr-2" />
      )}
      <span className={loading ? 'opacity-75' : ''}>{children}</span>
    </button>
  );
}

// 卡片載入狀態
export function LoadingCard({ className = '' }: { className?: string }) {
  return (
    <div className={`animate-pulse ${className}`}>
      <div className="bg-gray-200 rounded-lg p-6">
        <div className="h-4 bg-gray-300 rounded mb-4"></div>
        <div className="h-4 bg-gray-300 rounded mb-2 w-3/4"></div>
        <div className="h-4 bg-gray-300 rounded w-1/2"></div>
      </div>
    </div>
  );
}

// 列表載入狀態
export function LoadingList({ items = 3, className = '' }: { items?: number; className?: string }) {
  return (
    <div className={`space-y-4 ${className}`}>
      {Array.from({ length: items }).map((_, index) => (
        <div key={index} className="animate-pulse">
          <div className="flex space-x-4">
            <div className="w-12 h-12 bg-gray-200 rounded-full"></div>
            <div className="flex-1 space-y-2">
              <div className="h-4 bg-gray-200 rounded w-3/4"></div>
              <div className="h-4 bg-gray-200 rounded w-1/2"></div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}