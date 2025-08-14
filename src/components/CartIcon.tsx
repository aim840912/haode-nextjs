'use client';

import Link from 'next/link';
import { useCart } from '@/lib/cart-context';

interface CartIconProps {
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
  className?: string;
}

export default function CartIcon({ size = 'md', showLabel = false, className = '' }: CartIconProps) {
  const { totalItems } = useCart();

  const sizeClasses = {
    sm: 'w-6 h-6 text-base',
    md: 'w-8 h-8 text-lg',
    lg: 'w-10 h-10 text-xl'
  };

  const badgeSizeClasses = {
    sm: 'w-4 h-4 text-xs',
    md: 'w-5 h-5 text-xs',
    lg: 'w-6 h-6 text-sm'
  };

  return (
    <Link 
      href="/cart" 
      className={`relative flex items-center space-x-2 p-2 rounded-lg hover:bg-gray-100 transition-colors ${className}`}
      title="購物車"
    >
      <div className="relative">
        {/* 購物車圖示 */}
        <div className={`${sizeClasses[size]} flex items-center justify-center text-gray-700 hover:text-amber-900 transition-colors`}>
          🛒
        </div>
        
        {/* 商品數量徽章 */}
        {totalItems > 0 && (
          <div className={`absolute -top-1 -right-1 ${badgeSizeClasses[size]} bg-amber-900 text-white rounded-full flex items-center justify-center font-bold min-w-fit px-1`}>
            {totalItems > 99 ? '99+' : totalItems}
          </div>
        )}
      </div>

      {/* 標籤 */}
      {showLabel && (
        <span className="text-sm font-medium text-gray-700 hover:text-amber-900 transition-colors">
          購物車
        </span>
      )}
    </Link>
  );
}