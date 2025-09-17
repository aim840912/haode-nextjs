'use client'

/**
 * 產品表格表頭元件
 * 只包含表格標題列，不包含篩選器
 */
export function ProductTableHead() {
  return (
    <thead className="bg-gray-50">
      <tr>
        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
          產品
        </th>
        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
          分類
        </th>
        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
          價格
        </th>
        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
          庫存
        </th>
        <th className="lg:sticky lg:right-[140px] lg:z-10 bg-gray-50 px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider lg:border-l lg:border-gray-200 lg:shadow-[-4px_0_8px_-2px_rgba(0,0,0,0.1)]">
          上架狀態
        </th>
        <th className="sticky right-0 z-10 bg-gray-50 px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider border-l border-gray-200 shadow-[-4px_0_8px_-2px_rgba(0,0,0,0.1)] min-w-[140px]">
          操作
        </th>
      </tr>
    </thead>
  )
}

export default ProductTableHead
