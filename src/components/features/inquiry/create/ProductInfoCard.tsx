/**
 * Product Info Card Component
 *
 * 產品資訊卡片元件
 * 顯示詢價產品名稱和數量選擇器
 */

interface ProductInfoCardProps {
  productName: string
  quantity: number
  onQuantityChange: (newQuantity: number) => void
}

export function ProductInfoCard({ productName, quantity, onQuantityChange }: ProductInfoCardProps) {
  return (
    <div className="bg-white rounded-xl shadow-lg p-4 sm:p-6 mb-6 sm:mb-8">
      <h3 className="text-xl font-semibold text-amber-900 mb-4">詢價產品</h3>
      <div className="bg-amber-50 rounded-lg p-4">
        <div className="flex justify-between items-start mb-3">
          <h4 className="font-medium text-gray-800">{productName}</h4>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-600">數量</span>
          <div className="flex items-center space-x-3">
            <button
              onClick={() => onQuantityChange(quantity - 1)}
              className="w-10 h-10 sm:w-8 sm:h-8 rounded-full bg-amber-100 text-amber-700 hover:bg-amber-200 active:bg-amber-300 flex items-center justify-center text-lg sm:text-base font-semibold transition-colors touch-manipulation"
              type="button"
              disabled={quantity <= 1}
            >
              -
            </button>
            <span className="font-medium min-w-[4ch] text-center text-lg sm:text-base">
              {quantity}
            </span>
            <button
              onClick={() => onQuantityChange(quantity + 1)}
              className="w-10 h-10 sm:w-8 sm:h-8 rounded-full bg-amber-100 text-amber-700 hover:bg-amber-200 active:bg-amber-300 flex items-center justify-center text-lg sm:text-base font-semibold transition-colors touch-manipulation"
              type="button"
            >
              +
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
