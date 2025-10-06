interface FormData {
  title: string
  location: string
  date: string
  time: string
  status: 'upcoming' | 'ongoing' | 'completed'
  products: string[]
  description: string
  contact: string
  specialOffer: string
  weatherNote: string
}

interface ScheduleProductListProps {
  formData: FormData
  newProduct: string
  setNewProduct: (value: string) => void
  errors: Record<string, string>
  touched: Record<string, boolean>
  handleInputChange: (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => void
  handleBlur: (fieldName: string) => void
  handleAddProduct: () => void
  handleRemoveProduct: (product: string) => void
  handleProductKeyPress: (e: React.KeyboardEvent) => void
}

const productSuggestions = [
  '有機蔬菜',
  '梅山紅肉李',
  '手工茶包組合',
  '梅山咖啡豆',
  '當季蔬菜箱',
  '蜜餞禮盒',
]

export default function ScheduleProductList({
  formData,
  newProduct,
  setNewProduct,
  errors,
  touched,
  handleInputChange,
  handleBlur,
  handleAddProduct,
  handleRemoveProduct,
  handleProductKeyPress,
}: ScheduleProductListProps) {
  return (
    <>
      {/* 販售商品 */}
      <div>
        <label className="block text-sm font-semibold text-gray-800 mb-3">販售商品 *</label>

        {/* 新增商品輸入框 */}
        <div className="flex gap-2 mb-4">
          <div className="flex-1">
            <input
              type="text"
              value={newProduct}
              onChange={e => setNewProduct(e.target.value)}
              onKeyPress={handleProductKeyPress}
              onBlur={() => handleBlur('products')}
              list="product-suggestions"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 text-gray-900"
              placeholder="輸入商品名稱"
            />
            <datalist id="product-suggestions">
              {productSuggestions.map(product => (
                <option key={product} value={product} />
              ))}
            </datalist>
          </div>
          <button
            type="button"
            onClick={handleAddProduct}
            disabled={!newProduct.trim()}
            className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            新增
          </button>
        </div>

        {/* 已新增的商品標籤 */}
        {formData.products.length > 0 && (
          <div className="mb-4">
            <div className="flex flex-wrap gap-2">
              {formData.products.map((product, index) => (
                <span
                  key={index}
                  className="inline-flex items-center gap-1 bg-amber-100 text-amber-800 px-3 py-1 rounded-full text-sm"
                >
                  {product}
                  <button
                    type="button"
                    onClick={() => handleRemoveProduct(product)}
                    className="ml-1 text-amber-600 hover:text-amber-800 transition-colors"
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
          </div>
        )}

        <div className="text-sm text-gray-600">
          已新增 {formData.products.length} 項商品{' '}
          {formData.products.length === 0 && '（至少需要一項商品）'}
        </div>

        {/* 驗證錯誤訊息 */}
        {touched.products && errors.products && (
          <p className="mt-1 text-sm text-red-600">{errors.products}</p>
        )}
      </div>

      {/* 聯絡資訊和優惠 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-semibold text-gray-800 mb-2">聯絡電話 *</label>
          <input
            type="tel"
            name="contact"
            value={formData.contact}
            onChange={handleInputChange}
            onBlur={() => handleBlur('contact')}
            required
            className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 text-gray-900 ${
              touched.contact && errors.contact ? 'border-red-500' : 'border-gray-300'
            }`}
            placeholder="聯絡電話"
          />
          {touched.contact && errors.contact && (
            <p className="mt-1 text-sm text-red-600">{errors.contact}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-800 mb-2">特別優惠</label>
          <input
            type="text"
            name="specialOffer"
            value={formData.specialOffer}
            onChange={handleInputChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 text-gray-900"
            placeholder="例如：買二送一、滿額折扣等"
          />
        </div>
      </div>

      {/* 天氣備註 */}
      <div>
        <label className="block text-sm font-semibold text-gray-800 mb-2">天氣備註</label>
        <input
          type="text"
          name="weatherNote"
          value={formData.weatherNote}
          onChange={handleInputChange}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 text-gray-900"
          placeholder="例如：如遇雨天取消、有遮陽棚等"
        />
      </div>
    </>
  )
}
