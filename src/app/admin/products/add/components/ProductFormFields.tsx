import type { ProductFormData, ProductFormErrors } from '@/hooks/forms/useProductAddForm'

interface ProductFormFieldsProps {
  formData: ProductFormData
  fieldErrors: ProductFormErrors
  categories: string[]
  onFieldChange: (field: keyof ProductFormData, value: unknown) => void
}

const PRICE_UNITS = ['斤', '台斤', '公斤', '包', '盒', '箱', '顆', '瓶', '罐', '袋', '束', '件']

/**
 * 產品表單欄位元件
 * 負責渲染所有產品基本資訊的輸入欄位
 */
export function ProductFormFields({
  formData,
  fieldErrors,
  categories,
  onFieldChange,
}: ProductFormFieldsProps) {
  return (
    <div className="space-y-6">
      {/* 產品名稱 */}
      <div>
        <label
          htmlFor="name"
          className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
        >
          產品名稱 *
        </label>
        <input
          type="text"
          id="name"
          value={formData.name}
          onChange={e => onFieldChange('name', e.target.value)}
          className={`w-full px-3 py-2 border rounded-lg text-gray-900 dark:text-gray-100 bg-white dark:bg-gray-800 focus:ring-2 focus:ring-green-500 focus:border-transparent placeholder:text-gray-500 dark:placeholder:text-gray-400 ${
            fieldErrors.name ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
          }`}
          placeholder="請輸入產品名稱"
        />
        {fieldErrors.name && <p className="mt-1 text-sm text-red-600">{fieldErrors.name}</p>}
      </div>

      {/* 產品描述 */}
      <div>
        <label
          htmlFor="description"
          className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
        >
          產品描述 *
        </label>
        <textarea
          id="description"
          value={formData.description}
          onChange={e => onFieldChange('description', e.target.value)}
          rows={4}
          className={`w-full px-3 py-2 border rounded-lg text-gray-900 dark:text-gray-100 bg-white dark:bg-gray-800 focus:ring-2 focus:ring-green-500 focus:border-transparent placeholder:text-gray-500 dark:placeholder:text-gray-400 ${
            fieldErrors.description ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
          }`}
          placeholder="請輸入產品描述"
        />
        {fieldErrors.description && (
          <p className="mt-1 text-sm text-red-600">{fieldErrors.description}</p>
        )}
      </div>

      {/* 分類和價格 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* 產品分類 */}
        <div>
          <label
            htmlFor="category"
            className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
          >
            產品分類 *
          </label>
          <div className="relative">
            <input
              type="text"
              id="category"
              list="category-options"
              value={formData.category}
              onChange={e => onFieldChange('category', e.target.value)}
              className={`w-full px-3 py-2 border rounded-lg text-gray-900 dark:text-gray-100 bg-white dark:bg-gray-800 focus:ring-2 focus:ring-green-500 focus:border-transparent placeholder:text-gray-500 dark:placeholder:text-gray-400 ${
                fieldErrors.category ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
              }`}
              placeholder="選擇現有分類或輸入新分類"
            />
            <datalist id="category-options">
              {categories.map(category => (
                <option key={category} value={category} />
              ))}
            </datalist>
            {/* 新分類提示 */}
            {formData.category && !categories.includes(formData.category) && (
              <div className="absolute z-10 w-full mt-1 p-2 bg-blue-50 border border-blue-200 rounded-lg shadow-sm">
                <p className="text-xs text-blue-700">💡 將建立新分類：「{formData.category}」</p>
              </div>
            )}
          </div>
          {fieldErrors.category && (
            <p className="mt-1 text-sm text-red-600">{fieldErrors.category}</p>
          )}
          <p className="mt-1 text-xs text-gray-500">
            可從下拉選單選擇現有分類，或直接輸入新的分類名稱
          </p>
        </div>

        {/* 價格 */}
        <div>
          <label
            htmlFor="price"
            className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
          >
            價格 *
          </label>
          <div className="flex">
            <input
              type="number"
              id="price"
              value={formData.price}
              onChange={e => onFieldChange('price', parseInt(e.target.value) || 0)}
              min="0"
              className={`flex-1 px-3 py-2 border rounded-l-lg text-gray-900 dark:text-gray-100 bg-white dark:bg-gray-800 focus:ring-2 focus:ring-green-500 focus:border-transparent placeholder:text-gray-500 dark:placeholder:text-gray-400 ${
                fieldErrors.price ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
              }`}
              placeholder="0"
            />
            <select
              value={formData.priceUnit}
              onChange={e => onFieldChange('priceUnit', e.target.value)}
              className="px-3 py-2 border-t border-r border-b border-gray-300 dark:border-gray-600 rounded-r-lg text-gray-900 dark:text-gray-100 bg-white dark:bg-gray-800 focus:ring-2 focus:ring-green-500 focus:border-transparent"
            >
              {PRICE_UNITS.map(unit => (
                <option key={unit} value={unit}>
                  {unit}
                </option>
              ))}
            </select>
          </div>
          {fieldErrors.price && <p className="mt-1 text-sm text-red-600">{fieldErrors.price}</p>}
        </div>
      </div>

      {/* 庫存 */}
      <div>
        <label
          htmlFor="inventory"
          className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
        >
          庫存數量 *
        </label>
        <input
          type="number"
          id="inventory"
          value={formData.inventory}
          onChange={e => onFieldChange('inventory', parseInt(e.target.value) || 0)}
          min="0"
          className={`w-full px-3 py-2 border rounded-lg text-gray-900 dark:text-gray-100 bg-white dark:bg-gray-800 focus:ring-2 focus:ring-green-500 focus:border-transparent placeholder:text-gray-500 dark:placeholder:text-gray-400 ${
            fieldErrors.inventory ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
          }`}
          placeholder="請輸入庫存數量"
        />
        {fieldErrors.inventory && (
          <p className="mt-1 text-sm text-red-600">{fieldErrors.inventory}</p>
        )}
      </div>

      {/* 上架設定 */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-center">
          <input
            type="checkbox"
            id="isActive"
            checked={formData.isActive}
            onChange={e => onFieldChange('isActive', e.target.checked)}
            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded mr-3"
          />
          <div>
            <label htmlFor="isActive" className="text-sm font-medium text-gray-800">
              立即上架販售
            </label>
            <p className="text-xs text-gray-600 mt-1">取消勾選將儲存為草稿，不會在前台顯示</p>
          </div>
        </div>
      </div>
    </div>
  )
}
