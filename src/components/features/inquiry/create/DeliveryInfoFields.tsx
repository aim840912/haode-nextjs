/**
 * Delivery Info Fields Component
 *
 * 配送資訊欄位區塊
 * 包含配送地址和希望配送日期
 */

interface DeliveryInfoFieldsProps {
  deliveryAddress: string
  preferredDeliveryDate: string
  validation: {
    delivery_address?: string
    preferred_delivery_date?: string
  }
  onFieldChange: (
    field: 'delivery_address' | 'preferred_delivery_date',
    value: string,
    validateNow?: boolean
  ) => void
  onFieldBlur: (field: 'delivery_address' | 'preferred_delivery_date') => void
}

export function DeliveryInfoFields({
  deliveryAddress,
  preferredDeliveryDate,
  validation,
  onFieldChange,
  onFieldBlur,
}: DeliveryInfoFieldsProps) {
  return (
    <div>
      <h4 className="font-semibold text-gray-800 dark:text-gray-100 mb-4">
        配送資訊
        <span className="text-gray-400 dark:text-gray-500 text-xs font-normal ml-2">選填欄位</span>
      </h4>
      <div className="space-y-4">
        {/* 配送地址 */}
        <div>
          <label className="block text-gray-700 dark:text-gray-200 mb-1 font-medium">
            配送地址
          </label>
          <input
            type="text"
            value={deliveryAddress}
            onChange={e => onFieldChange('delivery_address', e.target.value)}
            className={`w-full border rounded-lg px-4 py-3 sm:px-3 sm:py-2 text-gray-900 dark:text-gray-100 dark:bg-slate-700 text-base focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-colors ${
              validation.delivery_address
                ? 'border-red-300 bg-red-50 dark:bg-red-900/20'
                : 'border-gray-300 dark:border-slate-600'
            }`}
            placeholder="請輸入配送地址(可選)"
            autoComplete="street-address"
            inputMode="text"
          />
          {validation.delivery_address && (
            <p className="mt-1 text-sm text-red-600 dark:text-red-400">
              {validation.delivery_address}
            </p>
          )}
        </div>

        {/* 希望配送日期 */}
        <div>
          <label className="block text-gray-700 dark:text-gray-200 mb-1 font-medium">
            希望配送日期
          </label>
          <input
            type="date"
            value={preferredDeliveryDate}
            onChange={e => onFieldChange('preferred_delivery_date', e.target.value)}
            onBlur={() => onFieldBlur('preferred_delivery_date')}
            className={`w-full border rounded-lg px-4 py-3 sm:px-3 sm:py-2 text-gray-900 dark:text-gray-100 dark:bg-slate-700 text-base focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-colors ${
              validation.preferred_delivery_date
                ? 'border-red-300 bg-red-50 dark:bg-red-900/20'
                : 'border-gray-300 dark:border-slate-600'
            }`}
            min={new Date().toISOString().split('T')[0]}
          />
          {validation.preferred_delivery_date && (
            <p className="mt-1 text-sm text-red-600 dark:text-red-400">
              {validation.preferred_delivery_date}
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
