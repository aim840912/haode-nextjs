interface BasicInfoSectionProps {
  formData: {
    name: string
    description: string
    category: string
    isActive: boolean
  }
  categories: string[]
  handleInputChange: (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => void
}

export function BasicInfoSection({
  formData,
  categories,
  handleInputChange,
}: BasicInfoSectionProps) {
  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold text-gray-900">基本資訊</h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="md:col-span-2">
          <label className="block text-sm font-semibold text-gray-800 mb-2">產品名稱 *</label>
          <input
            type="text"
            name="name"
            value={formData.name}
            onChange={handleInputChange}
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 text-gray-900"
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-800 mb-2">分類 *</label>
          <select
            name="category"
            value={formData.category}
            onChange={handleInputChange}
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 text-gray-900"
          >
            {categories.map(cat => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="flex items-center space-x-2">
            <input
              type="checkbox"
              name="isActive"
              checked={formData.isActive}
              onChange={handleInputChange}
              className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
            />
            <span className="text-sm font-medium text-gray-700">上架販售</span>
          </label>
        </div>

        <div className="md:col-span-2">
          <label className="block text-sm font-semibold text-gray-800 mb-2">產品描述</label>
          <textarea
            name="description"
            value={formData.description}
            onChange={handleInputChange}
            rows={4}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 text-gray-900"
          />
        </div>
      </div>
    </div>
  )
}
