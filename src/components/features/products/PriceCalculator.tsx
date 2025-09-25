'use client'

import { useState, useCallback, memo } from 'react'
import { CalendarIcon } from '@heroicons/react/24/outline'

interface PriceCalculatorProps {
  price: number
  salePrice: number
  isOnSale: boolean
  saleEndDate: string
  priceUnit: string
  unitQuantity: number
  onPriceChange: (price: number) => void
  onSalePriceChange: (salePrice: number) => void
  onSaleToggle: (isOnSale: boolean) => void
  onSaleEndDateChange: (date: string) => void
  onPriceUnitChange: (unit: string) => void
  onUnitQuantityChange: (quantity: number) => void
  priceError?: string
  disabled?: boolean
  className?: string
}

function PriceCalculator({
  price,
  salePrice,
  isOnSale,
  saleEndDate,
  priceUnit,
  unitQuantity,
  onPriceChange,
  onSalePriceChange,
  onSaleToggle,
  onSaleEndDateChange,
  onPriceUnitChange,
  onUnitQuantityChange,
  priceError,
  disabled = false,
  className = '',
}: PriceCalculatorProps) {
  const [showAdvanced, setShowAdvanced] = useState(false)

  // 常用的價格單位
  const priceUnits = ['斤', '公斤', '台斤', '盒', '包', '袋', '瓶', '罐', '個', '組', '箱', '打']

  // 計算折扣百分比
  const getDiscountPercentage = useCallback(() => {
    if (!isOnSale || price <= 0 || salePrice <= 0) return 0
    return Math.round(((price - salePrice) / price) * 100)
  }, [price, salePrice, isOnSale])

  // 計算單位價格
  const getUnitPrice = useCallback(
    (currentPrice: number) => {
      if (unitQuantity <= 0) return currentPrice
      return currentPrice / unitQuantity
    },
    [unitQuantity]
  )

  // 格式化價格顯示
  const formatPrice = (amount: number) => {
    return new Intl.NumberFormat('zh-TW', {
      style: 'currency',
      currency: 'TWD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount)
  }

  return (
    <div className={className}>
      <div className="space-y-4">
        {/* 基本價格設定 */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* 原價 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              原價 <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">
                $
              </span>
              <input
                type="number"
                value={price || ''}
                onChange={e => onPriceChange(parseFloat(e.target.value) || 0)}
                disabled={disabled}
                min="0"
                step="1"
                className={`
                  w-full pl-8 pr-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent
                  ${priceError ? 'border-red-300' : 'border-gray-300'}
                  ${disabled ? 'bg-gray-50 cursor-not-allowed' : 'bg-white'}
                `}
                placeholder="請輸入價格"
              />
            </div>
            {priceError && <p className="mt-1 text-sm text-red-600">{priceError}</p>}
          </div>

          {/* 價格單位與數量 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">單位設定</label>
            <div className="flex space-x-2">
              <input
                type="number"
                value={unitQuantity}
                onChange={e => onUnitQuantityChange(parseInt(e.target.value) || 1)}
                disabled={disabled}
                min="1"
                className={`
                  w-20 px-2 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent
                  ${disabled ? 'bg-gray-50 cursor-not-allowed' : 'bg-white'}
                `}
              />
              <select
                value={priceUnit}
                onChange={e => onPriceUnitChange(e.target.value)}
                disabled={disabled}
                className={`
                  flex-1 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent
                  ${disabled ? 'bg-gray-50 cursor-not-allowed' : 'bg-white'}
                `}
              >
                {priceUnits.map(unit => (
                  <option key={unit} value={unit}>
                    {unit}
                  </option>
                ))}
              </select>
            </div>
            <p className="mt-1 text-xs text-gray-500">
              每{unitQuantity}
              {priceUnit} = {formatPrice(price)}
              {unitQuantity > 1 && (
                <span className="ml-2">
                  (單{priceUnit}約 {formatPrice(getUnitPrice(price))})
                </span>
              )}
            </p>
          </div>
        </div>

        {/* 特價設定 */}
        <div className="border border-gray-200 rounded-lg p-4">
          <div className="flex items-center justify-between mb-3">
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={isOnSale}
                onChange={e => onSaleToggle(e.target.checked)}
                disabled={disabled}
                className="rounded border-gray-300 text-amber-600 focus:ring-amber-500 disabled:cursor-not-allowed"
              />
              <span className="text-sm font-medium text-gray-700">設定特價</span>
            </label>

            {isOnSale && getDiscountPercentage() > 0 && (
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                省 {getDiscountPercentage()}%
              </span>
            )}
          </div>

          {isOnSale && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* 特價 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  特價 <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">
                    $
                  </span>
                  <input
                    type="number"
                    value={salePrice || ''}
                    onChange={e => onSalePriceChange(parseFloat(e.target.value) || 0)}
                    disabled={disabled}
                    min="0"
                    step="1"
                    className={`
                      w-full pl-8 pr-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent
                      ${disabled ? 'bg-gray-50 cursor-not-allowed' : 'bg-white'}
                    `}
                    placeholder="請輸入特價"
                  />
                </div>
                {salePrice > 0 && unitQuantity > 1 && (
                  <p className="mt-1 text-xs text-gray-500">
                    單{priceUnit}約 {formatPrice(getUnitPrice(salePrice))}
                  </p>
                )}
              </div>

              {/* 特價結束日期 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  特價結束日期 (可選)
                </label>
                <div className="relative">
                  <input
                    type="date"
                    value={saleEndDate}
                    onChange={e => onSaleEndDateChange(e.target.value)}
                    disabled={disabled}
                    min={new Date().toISOString().split('T')[0]} // 不能選擇過去的日期
                    className={`
                      w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent
                      ${disabled ? 'bg-gray-50 cursor-not-allowed' : 'bg-white'}
                    `}
                  />
                  <CalendarIcon className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* 價格預覽 */}
        {(price > 0 || salePrice > 0) && (
          <div className="bg-gray-50 rounded-lg p-4">
            <h4 className="text-sm font-medium text-gray-700 mb-2">價格預覽</h4>
            <div className="space-y-1">
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">原價：</span>
                <span
                  className={`text-sm ${isOnSale ? 'line-through text-gray-400' : 'font-medium'}`}
                >
                  {formatPrice(price)}
                </span>
              </div>

              {isOnSale && salePrice > 0 && (
                <>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">特價：</span>
                    <span className="text-sm font-medium text-red-600">
                      {formatPrice(salePrice)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">節省：</span>
                    <span className="text-sm font-medium text-green-600">
                      {formatPrice(price - salePrice)} ({getDiscountPercentage()}%)
                    </span>
                  </div>
                </>
              )}

              {unitQuantity > 1 && (
                <div className="flex justify-between pt-2 border-t border-gray-200">
                  <span className="text-xs text-gray-500">平均每{priceUnit}：</span>
                  <span className="text-xs text-gray-500">
                    {formatPrice(getUnitPrice(isOnSale && salePrice > 0 ? salePrice : price))}
                  </span>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

// 使用 memo 優化效能，避免價格計算元件不必要的重渲染
export default memo(PriceCalculator)
