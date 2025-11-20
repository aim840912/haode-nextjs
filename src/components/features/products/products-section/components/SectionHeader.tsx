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
    <div className={cn('text-center mb-16', isVisible && 'animate-fade-in')}>
      <h2 className="text-5xl md:text-6xl font-serif-display text-[#3e2723] mb-4 tracking-wider">
        經典產品
      </h2>
      <p className="text-[#5d4037] text-lg mb-2">精選來自梅山的優質農產品</p>
      <div className="flex items-center justify-center gap-2 text-sm text-[#8d6e63]">
        <Leaf className="w-4 h-4 text-[#2e7d32]" />
        <span>100% 有機無毒栽培</span>
      </div>
    </div>
  )
})
