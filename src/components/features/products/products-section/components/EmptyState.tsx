/**
 * 空狀態元件
 */

import React from 'react'
import { ShoppingBag } from 'lucide-react'

export const EmptyState = React.memo(function EmptyState() {
  return (
    <div className="text-center text-gray-600 py-12">
      <div className="bg-gray-50 rounded-2xl p-12 max-w-md mx-auto">
        <ShoppingBag className="w-16 h-16 text-gray-400 mx-auto mb-4" />
        <p className="text-lg mb-2">目前沒有上架的產品</p>
        <p className="text-sm text-gray-500">請稍後再來查看</p>
      </div>
    </div>
  )
})
