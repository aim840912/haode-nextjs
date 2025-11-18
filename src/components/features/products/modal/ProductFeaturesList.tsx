import React from 'react'
import { cn } from '@/lib/utils'

interface ProductFeaturesListProps {
  /** 產品特色列表 */
  features: string[]
}

/**
 * 產品特色列表元件
 *
 * 以標籤形式展示產品的特色，支援動畫效果
 */
export const ProductFeaturesList = React.memo<ProductFeaturesListProps>(({ features }) => {
  if (!features || features.length === 0) {
    return null
  }

  return (
    <div className="mb-6">
      <h4 className="font-semibold text-gray-800 mb-3 text-sm md:text-base">✨ 產品特色</h4>
      <div className="flex flex-wrap gap-2">
        {features.map((feature, index) => (
          <span
            key={index}
            className={cn(
              'bg-gray-100 text-gray-700',
              'px-3 py-1.5 rounded-full text-xs md:text-sm font-medium',
              'shadow-sm hover:shadow-md',
              'transition-all duration-300 hover:scale-105 hover:-translate-y-0.5',
              'border border-gray-200 hover:border-gray-300',
              'animate-fade-in opacity-0'
            )}
            style={{
              animationDelay: `${index * 150 + 200}ms`,
              animationFillMode: 'forwards',
            }}
          >
            {feature}
          </span>
        ))}
      </div>
    </div>
  )
})

ProductFeaturesList.displayName = 'ProductFeaturesList'
