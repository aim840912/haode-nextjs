/**
 * 產品徽章生成工具
 */

import { Award, Sparkles, TrendingUp } from 'lucide-react'
import type { Product } from '@/types/product'
import type { ProductBadge } from '../types'

export function getProductBadge(index: number, product: Product): ProductBadge | null {
  if (index === 0) {
    return {
      icon: <Award className="w-3.5 h-3.5" />,
      text: '熱銷推薦',
      bgColor: 'bg-amber-500',
      animation: 'animate-badge-bounce',
    }
  }
  if (product.isOnSale) {
    return {
      icon: <Sparkles className="w-3.5 h-3.5" />,
      text: '限時優惠',
      bgColor: 'bg-red-500',
      animation: 'animate-badge-pulse',
    }
  }
  if (index === 1) {
    return {
      icon: <TrendingUp className="w-3.5 h-3.5" />,
      text: '人氣商品',
      bgColor: 'bg-green-500',
      animation: '',
    }
  }
  return null
}
