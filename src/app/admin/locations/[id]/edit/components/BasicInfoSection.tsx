interface BasicInfoSectionProps {
  formData: {
    name: string
    title: string
    address: string
    landmark: string
    phone: string
    lineId: string
    isMain: boolean
  }
  handleInputChange: (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => void
}

export function BasicInfoSection({ formData, handleInputChange }: BasicInfoSectionProps) {
  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold text-gray-900">基本資訊</h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-semibold text-gray-800 mb-2">門市名稱 *</label>
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
          <label className="block text-sm font-semibold text-gray-800 mb-2">門市標題</label>
          <input
            type="text"
            name="title"
            value={formData.title}
            onChange={handleInputChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 text-gray-900"
          />
        </div>

        <div className="md:col-span-2">
          <label className="block text-sm font-semibold text-gray-800 mb-2">地址 *</label>
          <input
            type="text"
            name="address"
            value={formData.address}
            onChange={handleInputChange}
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 text-gray-900"
          />
        </div>

        <div className="md:col-span-2">
          <label className="block text-sm font-semibold text-gray-800 mb-2">地標說明</label>
          <input
            type="text"
            name="landmark"
            value={formData.landmark}
            onChange={handleInputChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 text-gray-900"
            placeholder="例如：靠近7-11便利商店"
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-800 mb-2">電話 *</label>
          <input
            type="tel"
            name="phone"
            value={formData.phone}
            onChange={handleInputChange}
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 text-gray-900"
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-800 mb-2">Line ID</label>
          <input
            type="text"
            name="lineId"
            value={formData.lineId}
            onChange={handleInputChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 text-gray-900"
          />
        </div>

        <div className="md:col-span-2">
          <label className="flex items-center space-x-2">
            <input
              type="checkbox"
              name="isMain"
              checked={formData.isMain}
              onChange={handleInputChange}
              className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
            />
            <span className="text-sm font-medium text-gray-700">設為主要門市</span>
          </label>
        </div>
      </div>
    </div>
  )
}
