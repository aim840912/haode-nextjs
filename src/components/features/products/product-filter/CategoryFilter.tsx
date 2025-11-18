'use client'

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
      <h3 className="font-semibold text-gray-800 mb-3">產品類別</h3>
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
