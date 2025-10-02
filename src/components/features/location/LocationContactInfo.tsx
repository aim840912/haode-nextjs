import { LocationFormData, FieldErrors } from '@/hooks/location/useLocationForm'

interface LocationContactInfoProps {
  formData: LocationFormData
  fieldErrors: FieldErrors
  onInputChange: (e: React.ChangeEvent<HTMLInputElement>) => void
  onFieldBlur: (field: keyof FieldErrors) => void
}

export const LocationContactInfo = ({
  formData,
  fieldErrors,
  onInputChange,
  onFieldBlur,
}: LocationContactInfoProps) => {
  return (
    <div>
      <h3 className="text-lg font-semibold text-gray-800 mb-4">聯絡資訊</h3>

      <div className="grid grid-cols-2 gap-4 mb-4">
        <div>
          <label className="block text-sm font-semibold text-gray-800 mb-2">電話號碼 *</label>
          <input
            type="tel"
            name="phone"
            value={formData.phone}
            onChange={onInputChange}
            onBlur={() => onFieldBlur('phone')}
            required
            className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 text-gray-900 ${
              fieldErrors.phone
                ? 'border-red-500 focus:ring-red-500'
                : 'border-gray-300 focus:ring-amber-500'
            }`}
            placeholder="例：049-291-5678"
          />
          {fieldErrors.phone && <p className="mt-1 text-sm text-red-600">{fieldErrors.phone}</p>}
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-800 mb-2">LINE ID</label>
          <input
            type="text"
            name="lineId"
            value={formData.lineId}
            onChange={onInputChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500 text-gray-900"
            placeholder="例：@haudetea"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-4">
        <div>
          <label className="block text-sm font-semibold text-gray-800 mb-2">營業時間 *</label>
          <input
            type="text"
            name="hours"
            value={formData.hours}
            onChange={onInputChange}
            onBlur={() => onFieldBlur('hours')}
            required
            className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 text-gray-900 ${
              fieldErrors.hours
                ? 'border-red-500 focus:ring-red-500'
                : 'border-gray-300 focus:ring-amber-500'
            }`}
            placeholder="例：09:00-19:00"
          />
          {fieldErrors.hours && <p className="mt-1 text-sm text-red-600">{fieldErrors.hours}</p>}
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-800 mb-2">公休日</label>
          <input
            type="text"
            name="closedDays"
            value={formData.closedDays}
            onChange={onInputChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500 text-gray-900"
            placeholder="例：週一公休"
          />
        </div>
      </div>
    </div>
  )
}
