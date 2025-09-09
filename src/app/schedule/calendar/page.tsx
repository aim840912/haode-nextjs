import { Metadata } from 'next'
import ScheduleCalendar from '@/components/calendar/ScheduleCalendar'

export const metadata: Metadata = {
  title: '擺攤行程 - 豪德農場行事曆',
  description: '查看豪德農場的擺攤行程安排，了解何時何地可以找到我們的攤位，把握特別優惠機會。',
  keywords: ['豪德農場', '擺攤行程', '市集', '農產品', '行事曆'],
  openGraph: {
    title: '豪德農場擺攤行程行事曆',
    description: '查看豪德農場的擺攤行程安排，了解何時何地可以找到我們的攤位',
    type: 'website',
    url: '/schedule/calendar',
    images: [
      {
        url: '/og-schedule-calendar.jpg',
        width: 1200,
        height: 630,
        alt: '豪德農場擺攤行程行事曆',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: '豪德農場擺攤行程行事曆',
    description: '查看豪德農場的擺攤行程安排，了解何時何地可以找到我們的攤位',
  },
}

export default function ScheduleCalendarPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* 頁面標題 */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="text-center md:text-left mb-6 md:mb-0">
              <h1 className="text-3xl font-bold text-gray-900 mb-4">豪德農場擺攤行程</h1>
              <p className="text-lg text-gray-600 max-w-3xl">
                歡迎查看我們的擺攤行程安排！在這裡您可以找到我們將在何時何地設攤，
                以及當天提供的新鮮農產品和特別優惠。規劃您的採購行程，把握最佳購買時機。
              </p>
            </div>
            <div className="flex space-x-3">
              <a
                href="/schedule"
                className="px-4 py-2 bg-amber-600 text-white rounded-full text-sm hover:bg-amber-700 transition-colors"
              >
                列表檢視
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* 主要內容 */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <ScheduleCalendar className="w-full" height="auto" />

        {/* 額外資訊 */}
        <div className="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* 購買指南 */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">購買指南</h2>
            <div className="space-y-3 text-gray-700">
              <div className="flex items-start">
                <span className="text-green-600 text-xl mr-2">•</span>
                <div>
                  <strong>提前規劃：</strong>查看行事曆安排您的採購時間
                </div>
              </div>
              <div className="flex items-start">
                <span className="text-green-600 text-xl mr-2">•</span>
                <div>
                  <strong>把握優惠：</strong>關注特別優惠資訊，享受最佳價格
                </div>
              </div>
              <div className="flex items-start">
                <span className="text-green-600 text-xl mr-2">•</span>
                <div>
                  <strong>新鮮保證：</strong>所有產品都是當日採收，確保新鮮品質
                </div>
              </div>
              <div className="flex items-start">
                <span className="text-green-600 text-xl mr-2">•</span>
                <div>
                  <strong>雨天營業：</strong>除非特殊天候，一般都會照常營業
                </div>
              </div>
            </div>
          </div>

          {/* 聯絡資訊 */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">聯絡我們</h2>
            <div className="space-y-4 text-gray-700">
              <div>
                <strong className="text-gray-900">電話諮詢：</strong>
                <div className="mt-1">如有任何疑問，歡迎致電詢問當日供應情況</div>
              </div>
              <div>
                <strong className="text-gray-900">預約服務：</strong>
                <div className="mt-1">大量採購或特殊需求可提前預約</div>
              </div>
              <div>
                <strong className="text-gray-900">即時更新：</strong>
                <div className="mt-1">天候或其他因素可能影響擺攤，請隨時關注最新資訊</div>
              </div>
              <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                <div className="text-sm text-blue-800">
                  <strong>小提示：</strong>建議出發前致電確認擺攤狀況，避免白跑一趟
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
