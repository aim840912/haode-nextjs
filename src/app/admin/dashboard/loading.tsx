import { ClockIcon } from '@heroicons/react/24/outline'

export default function DashboardLoading() {
  return (
    <div className="min-h-screen bg-gray-50 pt-24">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="text-center">
          <div className="flex justify-center mb-4">
            <ClockIcon className="h-12 w-12 text-gray-400 animate-pulse" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">載入管理控台...</h1>
          <p className="text-gray-600">請稍候，正在載入儀表板資料</p>
        </div>

        {/* 載入中的骨架畫面 */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map(i => (
            <div key={i} className="bg-white rounded-lg shadow-md p-6 animate-pulse">
              <div className="flex items-center space-x-4 mb-4">
                <div className="w-10 h-10 bg-gray-200 rounded-lg"></div>
                <div className="flex-1">
                  <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
