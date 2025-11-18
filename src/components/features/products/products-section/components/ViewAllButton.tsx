/**
 * 查看所有商品按鈕元件
 */

import React from 'react'
import Link from 'next/link'
import { ShoppingBag } from 'lucide-react'
import { cn } from '@/lib/utils/cn'

interface ViewAllButtonProps {
  isVisible: boolean
}

export const ViewAllButton = React.memo(function ViewAllButton({ isVisible }: ViewAllButtonProps) {
  return (
    <div
      className={cn(
        'text-center',
        isVisible ? 'animate-scale-in animation-delay-450' : 'opacity-0'
      )}
    >
      <Link
        href="/products"
        className="inline-flex items-center gap-3 bg-gray-900 text-white px-10 py-4 rounded-lg text-lg font-semibold hover:bg-gray-800 transition-all duration-200 shadow-lg hover:shadow-xl group"
      >
        <ShoppingBag className="w-6 h-6" />
        <span>瀏覽所有商品</span>
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
        </svg>
      </Link>
    </div>
  )
})
