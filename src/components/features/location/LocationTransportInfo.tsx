import { LocationFormData } from '@/hooks/location/useLocationForm'

interface LocationTransportInfoProps {
  formData: LocationFormData
  onInputChange: (e: React.ChangeEvent<HTMLInputElement>) => void
}

export const LocationTransportInfo = ({ formData, onInputChange }: LocationTransportInfoProps) => {
  return (
    <div>
      <h3 className="text-lg font-semibold text-gray-800 mb-4">交通資訊</h3>

      <div className="mb-4">
        <label className="block text-sm font-semibold text-gray-800 mb-2">停車資訊</label>
        <input
          type="text"
          name="parking"
          value={formData.parking}
          onChange={onInputChange}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500 text-gray-900"
          placeholder="例：店前免費停車場（30個車位）"
        />
      </div>

      <div className="mb-4">
        <label className="block text-sm font-semibold text-gray-800 mb-2">大眾運輸</label>
        <input
          type="text"
          name="publicTransport"
          value={formData.publicTransport}
          onChange={onInputChange}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500 text-gray-900"
          placeholder="例：埔里轉運站步行5分鐘"
        />
      </div>
    </div>
  )
}
