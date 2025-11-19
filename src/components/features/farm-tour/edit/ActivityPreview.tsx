/**
 * Activity Preview Component
 *
 * 活動即時預覽元件
 * 顯示農場體驗活動的即時預覽卡片
 */

import Image from 'next/image'

interface ActivityPreviewProps {
  title: string
  startMonth: number
  endMonth: number
  price: number
  activities: string[]
  note: string
  available: boolean
  imageUrl?: string
}

export function ActivityPreview({
  title,
  startMonth,
  endMonth,
  price,
  activities,
  note,
  available,
  imageUrl,
}: ActivityPreviewProps) {
  return (
    <div className="lg:sticky lg:top-8">
      <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-4">即時預覽</h3>
      <div className="bg-white dark:bg-slate-800 rounded-lg shadow-md overflow-hidden">
        {/* Preview Card */}
        <div className="bg-gradient-to-br from-green-100 to-amber-100 dark:from-green-900/30 dark:to-amber-900/30 p-6 text-center">
          <div className="mb-3">
            {imageUrl ? (
              <Image
                src={imageUrl}
                alt="活動圖片"
                width={64}
                height={64}
                unoptimized
                priority
                className="w-16 h-16 object-cover rounded-lg mx-auto border-2 border-white shadow-sm"
              />
            ) : (
              <div className="w-16 h-16 bg-gray-200 dark:bg-slate-600 rounded-lg mx-auto flex items-center justify-center">
                <span className="text-gray-500 dark:text-gray-400 text-xs">無圖片</span>
              </div>
            )}
          </div>
          <h3 className="text-lg font-bold text-gray-800 dark:text-gray-100 mb-2">
            {title || '活動標題預覽'}
          </h3>
          <div className="flex justify-center items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
            <span className="bg-white dark:bg-slate-700 px-2 py-1 rounded-full">
              {startMonth}月 - {endMonth}月
            </span>
            <span className="bg-white dark:bg-slate-700 px-2 py-1 rounded-full">
              NT$ {price || 0}
            </span>
          </div>
        </div>

        <div className="p-4">
          <div className="mb-4">
            <h4 className="font-semibold text-gray-800 dark:text-gray-100 mb-2 text-sm">
              活動內容
            </h4>
            <div className="space-y-1">
              {activities
                .filter(a => a.trim())
                .map((activity, index) => (
                  <div
                    key={index}
                    className="flex items-center text-xs text-gray-600 dark:text-gray-300"
                  >
                    <span className="mr-2 text-green-500 dark:text-green-400">•</span>
                    <span>{activity}</span>
                  </div>
                ))}
            </div>
          </div>

          <div className="mb-4 text-sm">
            <div className="flex items-center justify-center">
              <span className="mr-2 text-amber-600 dark:text-amber-400 font-medium">$</span>
              <span className="font-bold text-amber-900 dark:text-amber-300">NT$ {price || 0}</span>
            </div>
          </div>

          {note && (
            <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-900/30 rounded-lg">
              <p className="text-blue-700 dark:text-blue-300 text-xs">{note}</p>
            </div>
          )}

          <div
            className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
              available
                ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300'
                : 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300'
            }`}
          >
            {available ? '開放預約' : '暫停開放'}
          </div>
        </div>
      </div>
    </div>
  )
}
