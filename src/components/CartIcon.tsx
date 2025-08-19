'use client';

import Link from 'next/link';
import { useCart } from '@/lib/cart-context';

// 購物車 SVG 圖示
const CartIcon = ({ className }: { className?: string }) => (
  <svg 
    className={className} 
    viewBox="0 0 24 24" 
    fill="currentColor"
  >
    <path d="M7 18c-1.1 0-2 0.9-2 2s0.9 2 2 2 2-0.9 2-2-0.9-2-2-2zM1 2v2h2l3.6 7.59-1.35 2.45c-0.16 0.28-0.25 0.61-0.25 0.96 0 1.1 0.9 2 2 2h12v-2H7.42c-0.14 0-0.25-0.11-0.25-0.25l0.03-0.12L8.1 13h7.45c0.75 0 1.41-0.41 1.75-1.03L21.7 4H5.21l-0.94-2H1zm16 16c-1.1 0-2 0.9-2 2s0.9 2 2 2 2-0.9 2-2-0.9-2-2-2z"/>
  </svg>
);

interface CartIconComponentProps {
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
  className?: string;
}

export default function CartIconComponent({ size = 'md', showLabel = false, className = '' }: CartIconComponentProps) {
  const { totalItems } = useCart();

  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-10 h-10',
    lg: 'w-12 h-12'
  };

  const badgeSizeClasses = {
    sm: 'w-4 h-4 text-xs',
    md: 'w-5 h-5 text-xs',
    lg: 'w-6 h-6 text-sm'
  };

  return (
    <Link 
      href="/cart" 
      className={`relative flex items-center space-x-2 ${className}`}
      title="購物車"
    >
      <div className="relative">
        {/* 購物車圖示 */}
        <div className={`
          ${sizeClasses[size]} 
          bg-amber-100 text-amber-900 
          rounded-full flex items-center justify-center 
          transition-all duration-300 
          hover:bg-amber-900 hover:text-white 
          hover:scale-110 hover:shadow-lg
          group
        `}>
          <div className="group-hover:scale-110 transition-transform duration-200">
            <CartIcon className="w-5 h-5" />
          </div>
        </div>
        
        {/* 商品數量徽章 */}
        {totalItems > 0 && (
          <div className={`absolute -top-1 -right-1 ${badgeSizeClasses[size]} bg-red-500 text-white rounded-full flex items-center justify-center font-bold min-w-fit px-1`}>
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