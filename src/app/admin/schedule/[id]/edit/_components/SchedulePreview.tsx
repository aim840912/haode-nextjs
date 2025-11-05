interface SchedulePreviewProps {
  formData: {
    title: string
    location: string
    date: string
    contact: string
    status: 'upcoming' | 'ongoing' | 'completed'
    products: string[]
    description: string
    specialOffer: string
    weatherNote: string
  }
  formatTimeRange: (start: string, end: string) => string
  timeRange: {
    startTime: string
    endTime: string
  }
}

export function SchedulePreview({ formData, formatTimeRange, timeRange }: SchedulePreviewProps) {
  return (
    <div className="border-t border-gray-200 dark:border-slate-600 pt-6">
      <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-4">即時預覽</h3>
      <div className="bg-gray-50 dark:bg-slate-700 rounded-lg p-6">
        <div className="flex justify-between items-start mb-3">
          <h4 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            {formData.title || '市集名稱'}
          </h4>
          <span
            className={`px-2 py-1 rounded-full text-xs font-medium ${
              formData.status === 'upcoming'
                ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300'
                : formData.status === 'ongoing'
                  ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300'
            }`}
          >
            {formData.status === 'upcoming'
              ? '即將到來'
              : formData.status === 'ongoing'
                ? '進行中'
                : '已結束'}
          </span>
        </div>

        <div className="space-y-2 text-sm text-gray-600 dark:text-gray-300 mb-3">
          <div>
            📅{' '}
            {formData.date
              ? new Date(formData.date).toLocaleDateString('zh-TW', {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })
              : '請選擇日期'}
          </div>
          <div>⏰ {formatTimeRange(timeRange.startTime, timeRange.endTime) || '請選擇時間'}</div>
          <div>📍 {formData.location || '請輸入地址'}</div>
          <div>📞 {formData.contact || '請輸入聯絡電話'}</div>
        </div>

        {formData.description && (
          <div className="text-sm text-gray-600 dark:text-gray-300 mb-3">
            <div className="font-medium">描述：</div>
            <div>{formData.description}</div>
          </div>
        )}

        {formData.products.length > 0 && (
          <div className="mb-3">
            <div className="text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">
              販售商品：
            </div>
            <div className="flex flex-wrap gap-1">
              {formData.products.map((product, index) => (
                <span
                  key={index}
                  className="bg-amber-100 dark:bg-amber-900/30 text-amber-800 dark:text-amber-300 px-2 py-1 rounded-full text-xs border border-amber-200 dark:border-amber-700"
                >
                  {product}
                </span>
              ))}
            </div>
          </div>
        )}

        {formData.specialOffer && (
          <div className="bg-orange-50 dark:bg-orange-900/30 border-l-4 border-orange-400 dark:border-orange-600 p-2 rounded-r text-sm mb-3">
            <div className="text-orange-700 dark:text-orange-300 font-medium">🎁 特別優惠</div>
            <div className="text-orange-600 dark:text-orange-400">{formData.specialOffer}</div>
          </div>
        )}

        {formData.weatherNote && (
          <div className="bg-blue-50 dark:bg-blue-900/30 border-l-4 border-blue-400 dark:border-blue-600 p-2 rounded-r text-sm">
            <div className="text-blue-700 dark:text-blue-300 font-medium">🌤️ 天氣備註</div>
            <div className="text-blue-600 dark:text-blue-400">{formData.weatherNote}</div>
          </div>
        )}

        <div className="text-xs text-gray-500 dark:text-gray-400 mt-3">
          更新時間：{new Date().toLocaleDateString('zh-TW')}
        </div>
      </div>
    </div>
  )
}
