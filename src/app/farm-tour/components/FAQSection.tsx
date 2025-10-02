/**
 * FAQSection 元件
 *
 * 顯示常見問題與解答
 */

import { Clock, Car, Users2, Banknote } from 'lucide-react'

export function FAQSection() {
  return (
    <div className="bg-gray-50 py-16">
      <div className="max-w-4xl mx-auto px-6">
        <h2 className="text-3xl font-bold text-center text-gray-800 mb-12">常見問題</h2>
        <div className="space-y-4">
          <details className="bg-white rounded-lg shadow-sm overflow-hidden group">
            <summary className="px-6 py-4 cursor-pointer font-semibold text-gray-800 hover:bg-gray-50 transition-colors list-none flex justify-between items-center">
              <span className="flex items-center gap-2">
                <Clock className="w-5 h-5 text-amber-600" />
                農場的開放時間是？
              </span>
              <span className="text-amber-600 group-open:rotate-180 transition-transform">▼</span>
            </summary>
            <div className="px-6 pb-4 text-gray-600">
              <p>週二至週日：09:00 - 17:00</p>
              <p>週一公休（國定假日正常開放）</p>
              <p className="mt-2 text-sm text-amber-600">※ 體驗活動請提前電話預約</p>
            </div>
          </details>

          <details className="bg-white rounded-lg shadow-sm overflow-hidden group">
            <summary className="px-6 py-4 cursor-pointer font-semibold text-gray-800 hover:bg-gray-50 transition-colors list-none flex justify-between items-center">
              <span className="flex items-center gap-2">
                <Car className="w-5 h-5 text-amber-600" />
                如何前往農場？
              </span>
              <span className="text-amber-600 group-open:rotate-180 transition-transform">▼</span>
            </summary>
            <div className="px-6 pb-4 text-gray-600">
              <p className="mb-2">
                <strong>自行開車：</strong>國道4號 → 台3線 → 東關路
              </p>
              <p className="mb-2">
                <strong>大眾運輸：</strong>台中客運 → 和平區 → 農場接駁
              </p>
              <p>
                <strong>團體包車：</strong>可協助安排遊覽車接駁
              </p>
            </div>
          </details>

          <details className="bg-white rounded-lg shadow-sm overflow-hidden group">
            <summary className="px-6 py-4 cursor-pointer font-semibold text-gray-800 hover:bg-gray-50 transition-colors list-none flex justify-between items-center">
              <span className="flex items-center gap-2">
                <Users2 className="w-5 h-5 text-amber-600" />
                適合帶小孩嗎？
              </span>
              <span className="text-amber-600 group-open:rotate-180 transition-transform">▼</span>
            </summary>
            <div className="px-6 pb-4 text-gray-600">
              <p>非常適合！我們的體驗活動專為親子設計，提供：</p>
              <ul className="mt-2 space-y-1 list-disc list-inside">
                <li>安全的採果環境</li>
                <li>適合兒童的活動設計</li>
                <li>休息區和洗手設施</li>
                <li>專業導覽解說</li>
              </ul>
            </div>
          </details>

          <details className="bg-white rounded-lg shadow-sm overflow-hidden group">
            <summary className="px-6 py-4 cursor-pointer font-semibold text-gray-800 hover:bg-gray-50 transition-colors list-none flex justify-between items-center">
              <span className="flex items-center gap-2">
                <Banknote className="w-5 h-5 text-amber-600" />
                費用包含哪些內容？
              </span>
              <span className="text-amber-600 group-open:rotate-180 transition-transform">▼</span>
            </summary>
            <div className="px-6 pb-4 text-gray-600">
              <p>體驗費用包含：</p>
              <ul className="mt-2 space-y-1 list-disc list-inside">
                <li>專業導覽解說</li>
                <li>採果體驗（可帶走一定數量）</li>
                <li>農場茶飲品嚐</li>
                <li>免費停車</li>
              </ul>
            </div>
          </details>
        </div>
      </div>
    </div>
  )
}
