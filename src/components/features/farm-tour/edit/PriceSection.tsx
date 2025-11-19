/**
 * Price Section Component
 *
 * 費用設定區塊元件
 * 用於輸入農場體驗活動的價格
 */

interface PriceSectionProps {
  price: number
  onPriceChange: (price: number) => void
}

export function PriceSection({ price, onPriceChange }: PriceSectionProps) {
  return (
    <div>
      <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-4">費用設定</h3>

      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-100 mb-2">
          價格 (NT$) *
        </label>
        <input
          type="number"
          name="price"
          value={price}
          onChange={e => onPriceChange(Number(e.target.value))}
          required
          min="0"
          className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 text-gray-900 dark:text-gray-100 bg-white dark:bg-slate-700"
          placeholder="0"
        />
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">設為 0 表示免費體驗</p>
      </div>
    </div>
  )
}
