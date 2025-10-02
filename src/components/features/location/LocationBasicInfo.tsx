import { LocationFormData, FieldErrors } from '@/hooks/location/useLocationForm'

interface LocationBasicInfoProps {
  formData: LocationFormData
  fieldErrors: FieldErrors
  onInputChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void
  onFieldBlur: (field: keyof FieldErrors) => void
}

export const LocationBasicInfo = ({
  formData,
  fieldErrors,
  onInputChange,
  onFieldBlur,
}: LocationBasicInfoProps) => {
  return (
    <div>
      <h3 className="text-lg font-semibold text-gray-800 mb-4">基本資訊</h3>

      <div className="grid grid-cols-2 gap-4 mb-4">
        <div>
          <label className="block text-sm font-semibold text-gray-800 mb-2">門市名稱 *</label>
          <input
            type="text"
            name="name"
            value={formData.name}
            onChange={onInputChange}
            onBlur={() => onFieldBlur('name')}
            required
            className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 text-gray-900 ${
              fieldErrors.name
                ? 'border-red-500 focus:ring-red-500'
                : 'border-gray-300 focus:ring-amber-500'
            }`}
            placeholder="例：總店"
          />
          {fieldErrors.name && <p className="mt-1 text-sm text-red-600">{fieldErrors.name}</p>}
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-800 mb-2">完整標題 *</label>
          <input
            type="text"
            name="title"
            value={formData.title}
            onChange={onInputChange}
            onBlur={() => onFieldBlur('title')}
            required
            className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 text-gray-900 ${
              fieldErrors.title
                ? 'border-red-500 focus:ring-red-500'
                : 'border-gray-300 focus:ring-amber-500'
            }`}
            placeholder="例：豪德製茶所總店"
          />
          {fieldErrors.title && <p className="mt-1 text-sm text-red-600">{fieldErrors.title}</p>}
        </div>
      </div>

      <div className="mb-4">
        <label className="block text-sm font-semibold text-gray-800 mb-2">門市地址 *</label>
        <input
          type="text"
          name="address"
          value={formData.address}
          onChange={onInputChange}
          onBlur={() => onFieldBlur('address')}
          required
          className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 text-gray-900 ${
            fieldErrors.address
              ? 'border-red-500 focus:ring-red-500'
              : 'border-gray-300 focus:ring-amber-500'
          }`}
          placeholder="完整地址"
        />
        {fieldErrors.address && <p className="mt-1 text-sm text-red-600">{fieldErrors.address}</p>}
      </div>

      <div className="mb-4">
        <label className="block text-sm font-semibold text-gray-800 mb-2">地標說明</label>
        <input
          type="text"
          name="landmark"
          value={formData.landmark}
          onChange={onInputChange}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500 text-gray-900"
          placeholder="例：埔里酒廠對面"
        />
      </div>
    </div>
  )
}
