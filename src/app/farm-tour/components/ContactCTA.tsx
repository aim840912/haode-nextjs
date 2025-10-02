/**
 * ContactCTA 元件
 *
 * 顯示聯絡 CTA 區塊，鼓勵訪客聯繫
 */

import { Phone, MessageCircle, MapPin } from 'lucide-react'

interface ContactCTAProps {
  /** 點擊「查看地圖」按鈕的處理函數 */
  onMapClick: () => void
}

export function ContactCTA({ onMapClick }: ContactCTAProps) {
  return (
    <div className="bg-gradient-to-r from-green-600 to-amber-600 text-white py-16">
      <div className="max-w-4xl mx-auto px-6 text-center">
        <h2 className="text-3xl font-bold mb-4">體驗山間農情，感受自然之美</h2>
        <p className="text-green-100 mb-8 text-lg">
          歡迎來到豪德觀光果園，在這裡您可以親近土地、體驗農作、品味自然
        </p>
        <div className="flex flex-col md:flex-row gap-4 justify-center items-center">
          <a
            href="tel:05-2561843"
            className="bg-white text-green-600 px-8 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-colors flex items-center gap-2"
          >
            <Phone className="w-5 h-5" />
            電話詢問
          </a>
          <a
            href="https://line.me/R/ti/p/@haudetea"
            target="_blank"
            rel="noopener noreferrer"
            className="bg-green-500 text-white px-8 py-3 rounded-lg font-semibold hover:bg-green-600 transition-colors flex items-center gap-2"
          >
            <MessageCircle className="w-5 h-5" />
            LINE 諮詢
          </a>
          <button
            onClick={onMapClick}
            className="border border-white text-white px-8 py-3 rounded-lg font-semibold hover:bg-white hover:text-green-600 transition-colors flex items-center gap-2"
          >
            <MapPin className="w-5 h-5" />
            查看地圖
          </button>
        </div>
      </div>
    </div>
  )
}
