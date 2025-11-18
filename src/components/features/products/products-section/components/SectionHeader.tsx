/**
 * 區段標題元件
 */

import React from 'react'
import { Leaf } from 'lucide-react'
import { cn } from '@/lib/utils/cn'

interface SectionHeaderProps {
  isVisible: boolean
}

export const SectionHeader = React.memo(function SectionHeader({ isVisible }: SectionHeaderProps) {
  return (
    <div className={cn('text-center mb-16', isVisible ? 'animate-fade-in' : 'opacity-0')}>
      <h2 className="text-5xl md:text-6xl font-bold text-gray-900 mb-4 tracking-wider">經典產品</h2>
      <p className="text-gray-600 text-lg mb-2">精選來自梅山的優質農產品</p>
      <div className="flex items-center justify-center gap-2 text-sm text-gray-500">
        <Leaf className="w-4 h-4 text-green-600" />
        <span>100% 有機無毒栽培</span>
      </div>
    </div>
  )
})
