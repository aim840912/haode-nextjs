/**
 * 產品特色生成工具
 */

import { Leaf, ShoppingBag } from 'lucide-react'
import type { ProductFeature } from '../types'

export function getProductFeatures(index: number): ProductFeature[] {
  const features: ProductFeature[][] = [
    [
      {
        icon: <Leaf className="w-3 h-3" />,
        text: '有機認證',
        color: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300',
      },
      {
        icon: <ShoppingBag className="w-3 h-3" />,
        text: '新鮮直送',
        color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
      },
    ],
    [
      {
        icon: <Leaf className="w-3 h-3" />,
        text: '當季精選',
        color: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300',
      },
    ],
    [
      {
        icon: <Leaf className="w-3 h-3" />,
        text: '產地直送',
        color: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300',
      },
    ],
  ]
  return features[index] || []
}
