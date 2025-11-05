interface ProductsSectionProps {
  formData: {
    products: string[]
  }
  newProduct: string
  errors: Record<string, string>
  touched: Record<string, boolean>
  setNewProduct: (value: string) => void
  handleAddProduct: () => string[]
  handleRemoveProduct: (product: string) => string[]
  handleBlur: (fieldName: string) => void
  handleProductKeyPress: (e: React.KeyboardEvent) => void
}

export function ProductsSection({
  formData,
  newProduct,
  errors,
  touched,
  setNewProduct,
  handleAddProduct,
  handleRemoveProduct,
  handleBlur,
  handleProductKeyPress,
}: ProductsSectionProps) {
  return (
    <div>
      <label className="block text-sm font-semibold text-gray-800 dark:text-gray-100 mb-3">
        販售商品 *
      </label>

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
            className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 text-gray-900 dark:text-gray-100 bg-white dark:bg-slate-700 placeholder-gray-500 dark:placeholder-gray-400"
            placeholder="輸入商品名稱"
          />
          <datalist id="product-suggestions">
            <option value="有機蔬菜" />
            <option value="梅山紅肉李" />
            <option value="手工茶包組合" />
            <option value="梅山咖啡豆" />
            <option value="當季蔬菜箱" />
            <option value="蜜餞禮盒" />
          </datalist>
        </div>
        <button
          type="button"
          onClick={handleAddProduct}
          disabled={!newProduct.trim()}
          className="px-4 py-2 bg-purple-600 dark:bg-purple-700 text-white rounded-md hover:bg-purple-700 dark:hover:bg-purple-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
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
                className="inline-flex items-center gap-1 bg-amber-100 dark:bg-amber-900/30 text-amber-800 dark:text-amber-300 px-3 py-1 rounded-full text-sm border border-amber-200 dark:border-amber-700"
              >
                {product}
                <button
                  type="button"
                  onClick={() => handleRemoveProduct(product)}
                  className="ml-1 text-amber-600 dark:text-amber-400 hover:text-amber-800 dark:hover:text-amber-200 transition-colors"
                >
                  ×
                </button>
              </span>
            ))}
          </div>
        </div>
      )}

      <div className="text-sm text-gray-600 dark:text-gray-300">
        已新增 {formData.products.length} 項商品{' '}
        {formData.products.length === 0 && '（至少需要一項商品）'}
      </div>

      {/* 驗證錯誤訊息 */}
      {touched.products && errors.products && (
        <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.products}</p>
      )}
    </div>
  )
}
