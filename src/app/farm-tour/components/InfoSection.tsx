/**
 * InfoSection 元件
 *
 * 顯示參觀資訊與參觀須知
 */

import type { VisitInfoData, VisitNotesData } from '@/types/siteSettings'

interface InfoSectionProps {
  visitInfo: VisitInfoData
  visitNotes: VisitNotesData
}

export function InfoSection({ visitInfo, visitNotes }: InfoSectionProps) {
  return (
    <div className="grid md:grid-cols-2 gap-12">
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg p-8">
        <h3 className="text-2xl font-semibold text-amber-900 dark:text-amber-300 mb-6">參觀資訊</h3>

        <div className="space-y-6">
          <div>
            <h4 className="font-semibold text-gray-800 dark:text-gray-200 mb-2">農場地址</h4>
            <p className="text-gray-600 dark:text-gray-300">{visitInfo.address}</p>
          </div>

          <div>
            <h4 className="font-semibold text-gray-800 dark:text-gray-200 mb-2">開放時間</h4>
            <div className="space-y-1 text-gray-600 dark:text-gray-300">
              <p>{visitInfo.opening_hours.weekdays}</p>
              <p>{visitInfo.opening_hours.closed}</p>
              <p className="text-sm text-amber-600 dark:text-amber-400">
                {visitInfo.opening_hours.note}
              </p>
            </div>
          </div>

          <div>
            <h4 className="font-semibold text-gray-800 dark:text-gray-200 mb-2">交通方式</h4>
            <div className="space-y-2 text-gray-600 dark:text-gray-300 text-sm">
              {visitInfo.transportation.map((item, index) => (
                <p key={index}>
                  <strong>{item.type}：</strong>
                  {item.route}
                </p>
              ))}
            </div>
          </div>

          <div>
            <h4 className="font-semibold text-gray-800 dark:text-gray-200 mb-2">聯絡資訊</h4>
            <div className="space-y-1 text-gray-600 dark:text-gray-300">
              <p>詢問專線：{visitInfo.contact.phone}</p>
              <p>LINE ID：{visitInfo.contact.line}</p>
              <p>信箱：{visitInfo.contact.email}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg p-8">
        <h3 className="text-2xl font-semibold text-amber-900 dark:text-amber-300 mb-6">參觀須知</h3>

        <div className="space-y-4">
          <div className="p-4 bg-yellow-50 dark:bg-yellow-900/30 border-l-4 border-yellow-400 dark:border-yellow-500 rounded-r-lg">
            <h4 className="font-medium text-yellow-800 dark:text-yellow-300 mb-2">重要提醒</h4>
            <ul className="text-sm text-yellow-700 dark:text-yellow-400 space-y-1">
              {visitNotes.important.map((item, index) => (
                <li key={index}>• {item}</li>
              ))}
            </ul>
          </div>

          <div className="p-4 bg-green-50 dark:bg-green-900/30 border-l-4 border-green-400 dark:border-green-500 rounded-r-lg">
            <h4 className="font-medium text-green-800 dark:text-green-300 mb-2">建議攜帶</h4>
            <ul className="text-sm text-green-700 dark:text-green-400 space-y-1">
              {visitNotes.recommended_items.map((item, index) => (
                <li key={index}>• {item}</li>
              ))}
            </ul>
          </div>

          <div className="p-4 bg-blue-50 dark:bg-blue-900/30 border-l-4 border-blue-400 dark:border-blue-500 rounded-r-lg">
            <h4 className="font-medium text-blue-800 dark:text-blue-300 mb-2">特別服務</h4>
            <ul className="text-sm text-blue-700 dark:text-blue-400 space-y-1">
              {visitNotes.special_services.map((item, index) => (
                <li key={index}>• {item}</li>
              ))}
            </ul>
          </div>
        </div>

        <div className="mt-8 text-center">
          <button className="bg-green-600 text-white px-8 py-3 rounded-lg hover:bg-green-700 dark:hover:bg-green-600 transition-colors font-semibold">
            電話詢問
          </button>
        </div>
      </div>
    </div>
  )
}
