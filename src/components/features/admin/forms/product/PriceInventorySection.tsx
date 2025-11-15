interface PriceInventorySectionProps {
  formData: {
    price: number
    priceUnit: string
    unitQuantity: number
    inventory: number
    isOnSale: boolean
    salePrice: number
    saleEndDate: string
  }
  handleInputChange: (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => void
}

export function PriceInventorySection({ formData, handleInputChange }: PriceInventorySectionProps) {
  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold text-gray-900">價格與庫存</h2>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div>
          <label className="block text-sm font-semibold text-gray-800 mb-2">售價 *</label>
          <input
            type="number"
            name="price"
            value={formData.price}
            onChange={handleInputChange}
            required
            min="0"
            step="0.01"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 text-gray-900"
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-800 mb-2">單位</label>
          <select
            name="priceUnit"
            value={formData.priceUnit}
            onChange={handleInputChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 text-gray-900"
          >
            <option value="斤">斤</option>
            <option value="台斤">台斤</option>
            <option value="公斤">公斤</option>
            <option value="包">包</option>
            <option value="盒">盒</option>
            <option value="袋">袋</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-800 mb-2">單位數量</label>
          <input
            type="number"
            name="unitQuantity"
            value={formData.unitQuantity}
            onChange={handleInputChange}
            min="1"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 text-gray-900"
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-800 mb-2">庫存數量 *</label>
          <input
            type="number"
            name="inventory"
            value={formData.inventory}
            onChange={handleInputChange}
            required
            min="0"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 text-gray-900"
          />
        </div>

        <div className="md:col-span-2">
          <label className="flex items-center space-x-2 mb-4">
            <input
              type="checkbox"
              name="isOnSale"
              checked={formData.isOnSale}
              onChange={handleInputChange}
              className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
            />
            <span className="text-sm font-medium text-gray-700">特價優惠</span>
          </label>

          {formData.isOnSale && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-800 mb-2">特價</label>
                <input
                  type="number"
                  name="salePrice"
                  value={formData.salePrice}
                  onChange={handleInputChange}
                  min="0"
                  step="0.01"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 text-gray-900"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-800 mb-2">結束日期</label>
                <input
                  type="date"
                  name="saleEndDate"
                  value={formData.saleEndDate}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 text-gray-900"
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
