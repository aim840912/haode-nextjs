interface TransportSectionProps {
  parking: string
  publicTransport: string
  onParkingChange: (value: string) => void
  onPublicTransportChange: (value: string) => void
  errors?: Record<string, string>
}

export function TransportSection({
  parking,
  publicTransport,
  onParkingChange,
  onPublicTransportChange,
  errors = {},
}: TransportSectionProps) {
  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">交通資訊</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* 停車資訊 */}
        <div>
          <label className="block text-sm font-semibold text-gray-800 dark:text-gray-100 mb-2">
            停車資訊
          </label>
          <textarea
            value={parking}
            onChange={e => onParkingChange(e.target.value)}
            rows={3}
            placeholder="例如：門市前方有路邊停車格"
            className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 text-gray-900 dark:text-gray-100 bg-white dark:bg-slate-700"
          />
          {errors.parking && (
            <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.parking}</p>
          )}
        </div>

        {/* 大眾運輸 */}
        <div>
          <label className="block text-sm font-semibold text-gray-800 dark:text-gray-100 mb-2">
            大眾運輸
          </label>
          <textarea
            value={publicTransport}
            onChange={e => onPublicTransportChange(e.target.value)}
            rows={3}
            placeholder="例如：搭乘公車 123 號至門市站下車"
            className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 text-gray-900 dark:text-gray-100 bg-white dark:bg-slate-700"
          />
          {errors.publicTransport && (
            <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.publicTransport}</p>
          )}
        </div>
      </div>
    </div>
  )
}
