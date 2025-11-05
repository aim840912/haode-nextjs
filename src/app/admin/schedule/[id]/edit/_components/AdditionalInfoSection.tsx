interface AdditionalInfoSectionProps {
  formData: {
    description: string
    contact: string
    specialOffer: string
    weatherNote: string
  }
  errors: Record<string, string>
  touched: Record<string, boolean>
  handleInputChange: (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => void
  handleBlur: (fieldName: string) => void
}

export function AdditionalInfoSection({
  formData,
  errors,
  touched,
  handleInputChange,
  handleBlur,
}: AdditionalInfoSectionProps) {
  return (
    <>
      {/* 描述 */}
      <div>
        <label className="block text-sm font-semibold text-gray-800 mb-2">地點描述</label>
        <textarea
          name="description"
          value={formData.description}
          onChange={handleInputChange}
          rows={2}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 text-gray-900"
          placeholder="攤位位置、交通資訊等補充說明"
        />
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
