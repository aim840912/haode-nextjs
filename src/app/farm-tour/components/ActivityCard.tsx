import type { FarmTourActivity } from '@/types/farmTour'
import { Calendar, Banknote, Users2, Check, Flame, Zap } from 'lucide-react'

interface ActivityCardProps {
  activity: FarmTourActivity
  index: number
  onBookingClick: (activity: FarmTourActivity) => void
}

/**
 * 農場導覽活動卡片元件
 * 顯示單一季節性活動的資訊和預約按鈕
 */
export function ActivityCard({ activity, index, onBookingClick }: ActivityCardProps) {
  return (
    <div
      className={`bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-2xl hover:-translate-y-2 transition-all duration-300 flex flex-col h-full ${!activity.available ? 'opacity-75' : ''} group`}
    >
      {/* Activity Header with Image */}
      <div className="relative h-56 bg-gradient-to-r from-amber-100 to-orange-100 overflow-hidden">
        {/* 熱門標籤 */}
        {index === 0 && (
          <div className="absolute top-4 left-4 z-20 bg-red-500 text-white px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1 shadow-lg">
            <Flame className="w-4 h-4" />
            熱門體驗
          </div>
        )}

        {/* 剩餘名額提示 */}
        {activity.available && (
          <div className="absolute top-4 right-4 z-20 bg-orange-500 text-white px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1 shadow-lg animate-bounce">
            <Zap className="w-4 h-4" />
            僅剩 {Math.floor(Math.random() * 20) + 5} 個名額
          </div>
        )}

        {/* 圖片層 */}
        {activity.image && (
          <img
            src={activity.image}
            alt={activity.title}
            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
          />
        )}

        {/* 漸層遮罩層 */}
        {activity.image && (
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent" />
        )}

        {/* 文字內容層 */}
        <div className="absolute bottom-0 left-0 right-0 p-6">
          <h3 className="text-2xl font-bold text-white mb-3 drop-shadow-lg group-hover:text-amber-300 transition-colors">
            {activity.title}
          </h3>
          <div className="flex justify-center gap-3 flex-wrap">
            <span className="bg-white/90 text-gray-800 px-3 py-1 rounded-full text-sm font-medium backdrop-blur-sm flex items-center gap-1">
              <Calendar className="w-4 h-4" />
              {activity.start_month}月 - {activity.end_month}月
            </span>
            {Number(activity.price) > 0 && (
              <span className="bg-gradient-to-r from-amber-500 to-orange-500 text-white px-3 py-1 rounded-full text-sm font-bold backdrop-blur-sm flex items-center gap-1">
                <Banknote className="w-4 h-4" />
                NT$ {activity.price}
              </span>
            )}
            <span className="bg-green-500 text-white px-3 py-1 rounded-full text-xs font-medium backdrop-blur-sm flex items-center gap-1">
              <Users2 className="w-4 h-4" />
              親子同樂
            </span>
          </div>
        </div>
      </div>

      <div className="p-6 flex flex-col flex-grow">
        <div className="flex-grow">
          {/* Note */}
          {activity.note && (
            <div className="bg-amber-50 border-l-4 border-amber-400 p-4 mb-6 rounded-r-lg">
              <p className="text-amber-800 font-medium">{activity.note}</p>
            </div>
          )}

          {/* Activities List */}
          <div className="mb-6">
            <h4 className="font-semibold text-gray-800 mb-3">活動內容</h4>
            <div className="space-y-2">
              {activity.activities.map((act, idx) => (
                <div key={idx} className="flex items-center text-sm text-gray-600">
                  <Check className="w-4 h-4 mr-2 text-green-500" />
                  <span>{act}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Additional Info */}
          {Number(activity.price) > 0 && (
            <div className="mb-6 p-3 bg-green-50 rounded-lg">
              <p className="text-green-700 text-sm font-medium">體驗費用：NT$ {activity.price}</p>
            </div>
          )}
        </div>

        {/* Booking Button */}
        <button
          onClick={() => onBookingClick(activity)}
          disabled={!activity.available}
          className={`w-full py-3 rounded-lg font-semibold transition-colors mt-auto ${
            activity.available
              ? 'bg-amber-900 text-white hover:bg-amber-800'
              : 'bg-gray-300 text-gray-500 cursor-not-allowed'
          }`}
        >
          {activity.available ? '了解詳情' : '暫停開放'}
        </button>
      </div>
    </div>
  )
}
