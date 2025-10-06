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

interface ScheduleBasicInfoProps {
  formData: FormData
  errors: Record<string, string>
  touched: Record<string, boolean>
  handleInputChange: (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => void
  handleBlur: (fieldName: string) => void
}

const marketSuggestions = [
  '台中逢甲夜市',
  '台北士林夜市',
  '高雄六合夜市',
  '彰化員林市集',
  '台南花園夜市',
  '桃園中壢夜市',
]

export default function ScheduleBasicInfo({
  formData,
  errors,
  touched,
  handleInputChange,
  handleBlur,
}: ScheduleBasicInfoProps) {
  return (
    <>
      {/* 基本資訊 */}
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
      </div>

      {/* 地點 */}
      <div>
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
    </>
  )
}
