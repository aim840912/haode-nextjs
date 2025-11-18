import React from 'react'

interface ProductSpecificationsListProps {
  /** 產品規格列表 */
  specifications: { label: string; value: string }[]
}

/**
 * 產品規格列表元件
 *
 * 以表格形式展示產品的詳細規格
 */
export const ProductSpecificationsList = React.memo<ProductSpecificationsListProps>(
  ({ specifications }) => {
    if (!specifications || specifications.length === 0) {
      return null
    }

    return (
      <div className="mb-6">
        <h4 className="font-semibold text-gray-800 mb-3 text-sm md:text-base">📋 商品規格</h4>
        <div className="bg-gray-50/80 rounded-lg p-4 space-y-3">
          {specifications.map((spec, index) => (
            <div
              key={index}
              className="flex justify-between items-center py-2 border-b border-gray-200/50 last:border-b-0"
            >
              <span className="text-gray-600 text-sm">{spec.label}</span>
              <span className="font-medium text-gray-900 text-sm">{spec.value}</span>
            </div>
          ))}
        </div>
      </div>
    )
  }
)

ProductSpecificationsList.displayName = 'ProductSpecificationsList'
