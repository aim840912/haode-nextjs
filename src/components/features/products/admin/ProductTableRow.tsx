'use client'

import { Product } from '@/types/product'
import { SafeImage } from '@/components/ui/image/OptimizedImage'
import ProductTableActions from './ProductTableActions'

interface ProductTableRowProps {
  product: Product
  onDelete: (id: string) => Promise<void>
  onToggleActive: (id: string, isActive: boolean) => Promise<void>
  isActionDisabled: boolean
  isAdmin: boolean
}

/**
 * 產品表格行元件
 * 負責顯示單一產品的所有資訊和操作
 */
export function ProductTableRow({
  product,
  onDelete,
  onToggleActive,
  isActionDisabled,
  isAdmin,
}: ProductTableRowProps) {
  return (
    <tr className="hover:bg-gray-50">
      {/* 產品資訊欄 */}
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="flex items-center">
          <div className="relative mr-3" style={{ width: '48px', height: '48px' }}>
            <SafeImage
              src={product.images?.[0] || '/images/placeholder.jpg'}
              alt={product.name || '產品圖片'}
              fill
              className="object-cover rounded"
              sizes="48px"
            />
          </div>
          <div>
            <div className="text-sm font-medium text-gray-900">{product.name}</div>
            <div className="text-sm text-gray-500 line-clamp-2 max-w-xs">{product.description}</div>
          </div>
        </div>
      </td>

      {/* 分類欄 */}
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
        {product.category || '-'}
      </td>

      {/* 價格欄 */}
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
        <div className="flex items-center space-x-2">
          <span className="font-medium">
            NT$ {product.price}
            {product.priceUnit ? ` / ${product.priceUnit}` : ''}
          </span>
          {product.isOnSale && product.originalPrice && product.originalPrice > product.price && (
            <>
              <span className="text-xs text-gray-500 line-through">
                NT$ {product.originalPrice}
                {product.priceUnit ? ` / ${product.priceUnit}` : ''}
              </span>
              <span className="bg-red-100 text-red-800 px-1.5 py-0.5 rounded text-xs font-medium">
                特價
              </span>
            </>
          )}
        </div>
      </td>

      {/* 庫存欄 */}
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
        <span
          className={`font-medium ${
            product.inventory <= 0
              ? 'text-red-600'
              : product.inventory <= 10
                ? 'text-yellow-600'
                : 'text-green-600'
          }`}
        >
          {product.inventory}
        </span>
      </td>

      {/* 上架狀態欄 */}
      <td className="lg:sticky lg:right-[140px] lg:z-10 px-6 py-4 whitespace-nowrap lg:border-l lg:border-gray-200 lg:shadow-[-4px_0_8px_-2px_rgba(0,0,0,0.1)] bg-white hover:bg-gray-50">
        {isAdmin ? (
          <button
            onClick={() => onToggleActive(product.id, product.isActive)}
            disabled={isActionDisabled}
            className={`inline-flex items-center px-2.5 py-1.5 rounded-full text-xs font-medium focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed ${
              product.isActive
                ? 'bg-green-100 text-green-800 hover:bg-green-200 focus:ring-green-500'
                : 'bg-red-100 text-red-800 hover:bg-red-200 focus:ring-red-500'
            }`}
          >
            {product.isActive ? '已上架' : '未上架'}
          </button>
        ) : (
          <span
            className={`inline-flex items-center px-2.5 py-1.5 rounded-full text-xs font-medium ${
              product.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
            }`}
          >
            {product.isActive ? '已上架' : '未上架'}
          </span>
        )}
      </td>

      {/* 操作欄 */}
      <td className="sticky right-0 z-10 bg-white hover:bg-gray-50 px-4 py-4 text-right text-sm font-medium border-l border-gray-200 shadow-[-4px_0_8px_-2px_rgba(0,0,0,0.1)] min-w-[140px]">
        {isAdmin && (
          <ProductTableActions
            product={product}
            onDelete={onDelete}
            onToggleActive={onToggleActive}
            isActionDisabled={isActionDisabled}
          />
        )}
      </td>
    </tr>
  )
}

export default ProductTableRow
