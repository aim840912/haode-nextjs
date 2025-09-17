'use client'

import Link from 'next/link'
import { Product } from '@/types/product'

interface ProductTableActionsProps {
  product: Product
  onDelete: (id: string) => Promise<void>
  onToggleActive: (id: string, isActive: boolean) => Promise<void>
  isActionDisabled: boolean
}

/**
 * 產品表格操作按鈕元件
 * 負責顯示編輯、刪除、上架/下架等操作按鈕
 */
export function ProductTableActions({
  product,
  onDelete,
  onToggleActive,
  isActionDisabled,
}: ProductTableActionsProps) {
  return (
    <div className="flex items-center justify-end space-x-2">
      {/* 編輯按鈕 */}
      <Link
        href={`/admin/products/${product.id}/edit`}
        className="inline-flex items-center px-3 py-1.5 border border-gray-300 shadow-sm text-xs font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
      >
        編輯
      </Link>

      {/* 上架/下架按鈕 */}
      <button
        onClick={() => onToggleActive(product.id, product.isActive)}
        disabled={isActionDisabled}
        className={`inline-flex items-center px-3 py-1.5 border shadow-sm text-xs font-medium rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed ${
          product.isActive
            ? 'border-red-300 text-red-700 bg-white hover:bg-red-50 focus:ring-red-500'
            : 'border-green-300 text-green-700 bg-white hover:bg-green-50 focus:ring-green-500'
        }`}
      >
        {product.isActive ? '下架' : '上架'}
      </button>

      {/* 刪除按鈕 */}
      <button
        onClick={() => onDelete(product.id)}
        disabled={isActionDisabled}
        className="inline-flex items-center px-3 py-1.5 border border-red-300 shadow-sm text-xs font-medium rounded-md text-red-700 bg-white hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        刪除
      </button>
    </div>
  )
}

export default ProductTableActions
