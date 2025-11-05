interface BasicInfoSectionProps {
  formData: {
    title: string
    status: 'upcoming' | 'ongoing' | 'completed'
    location: string
  }
  errors: Record<string, string>
  touched: Record<string, boolean>
  marketSuggestions: string[]
  handleInputChange: (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => void
  handleBlur: (fieldName: string) => void
}

export function BasicInfoSection({
  formData,
  errors,
  touched,
  marketSuggestions,
  handleInputChange,
  handleBlur,
}: BasicInfoSectionProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div>
        <label className="block text-sm font-semibold text-gray-800 mb-2">市集/夜市名稱 *</label>
        <input
          type="text"
          name="title"
          value={formData.title}
          onChange={handleInputChange}
          onBlur={() => handleBlur('title')}
          required
          list="market-suggestions"
          className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 text-gray-900 ${
            touched.title && errors.title ? 'border-red-500' : 'border-gray-300'
          }`}
          placeholder="輸入市集或夜市名稱"
        />
        {touched.title && errors.title && (
          <p className="mt-1 text-sm text-red-600">{errors.title}</p>
        )}
        <datalist id="market-suggestions">
          {marketSuggestions.map(market => (
            <option key={market} value={market} />
          ))}
        </datalist>
      </div>

      <div>
        <label className="block text-sm font-semibold text-gray-800 mb-2">狀態</label>
        <select
          name="status"
          value={formData.status}
          onChange={handleInputChange}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 text-gray-900"
        >
          <option value="upcoming">即將到來</option>
          <option value="ongoing">進行中</option>
          <option value="completed">已結束</option>
        </select>
      </div>

      <div className="md:col-span-2">
        <label className="block text-sm font-semibold text-gray-800 mb-2">詳細地址 *</label>
        <input
          type="text"
          name="location"
          value={formData.location}
          onChange={handleInputChange}
          onBlur={() => handleBlur('location')}
          required
          className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 text-gray-900 ${
            touched.location && errors.location ? 'border-red-500' : 'border-gray-300'
          }`}
          placeholder="完整地址，包含縣市區域"
        />
        {touched.location && errors.location && (
          <p className="mt-1 text-sm text-red-600">{errors.location}</p>
        )}
      </div>
    </div>
  )
}
