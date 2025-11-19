/**
 * 產品類別篩選元件
 *
 * 提供類別多選勾選功能
 */

interface CategoryFilterProps {
  availableCategories: string[]
  selectedCategories: string[]
  onCategoryChange: (category: string) => void
}

export function CategoryFilter({
  availableCategories,
  selectedCategories,
  onCategoryChange,
}: CategoryFilterProps) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-3">產品類別</label>
      <div className="flex flex-wrap gap-2">
        {availableCategories.map(category => (
          <label
            key={category}
            className="flex items-center bg-gray-50 px-3 py-2 rounded-lg hover:bg-gray-100 cursor-pointer"
          >
            <input
              type="checkbox"
              checked={selectedCategories.includes(category)}
              onChange={() => onCategoryChange(category)}
              className="rounded border-gray-300 text-amber-600 focus:ring-amber-500 mr-2"
            />
            <span className="text-sm text-gray-700">{category}</span>
          </label>
        ))}
      </div>
    </div>
  )
}
