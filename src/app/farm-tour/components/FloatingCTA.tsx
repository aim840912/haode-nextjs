/**
 * FloatingCTA 元件
 *
 * 顯示浮動聯絡按鈕，固定在頁面右下角
 */

import { Phone, MessageCircle } from 'lucide-react'

export function FloatingCTA() {
  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-3">
      <a
        href="tel:05-2561843"
        className="bg-green-600 hover:bg-green-700 text-white rounded-full p-4 shadow-2xl transition-all hover:scale-110 flex items-center justify-center group"
        title="電話詢問"
      >
        <Phone className="w-6 h-6" />
        <span className="max-w-0 overflow-hidden group-hover:max-w-xs transition-all duration-300 group-hover:ml-2 whitespace-nowrap">
          立即撥打
        </span>
      </a>
      <a
        href="https://line.me/R/ti/p/@haudetea"
        target="_blank"
        rel="noopener noreferrer"
        className="bg-[#06C755] hover:bg-[#05b34c] text-white rounded-full p-4 shadow-2xl transition-all hover:scale-110 flex items-center justify-center group"
        title="LINE 諮詢"
      >
        <MessageCircle className="w-6 h-6" />
        <span className="max-w-0 overflow-hidden group-hover:max-w-xs transition-all duration-300 group-hover:ml-2 whitespace-nowrap">
          LINE 諮詢
        </span>
      </a>
    </div>
  )
}
