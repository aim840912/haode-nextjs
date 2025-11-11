/**
 * PromoBar 元件
 *
 * 顯示限時優惠橫幅，固定在頁面頂部
 */

import { PartyPopper } from 'lucide-react'

interface PromoBarProps {
  /** 是否顯示橫幅 */
  show: boolean
  /** 關閉橫幅的處理函數 */
  onClose: () => void
}

export function PromoBar({ show, onClose }: PromoBarProps) {
  if (!show) return null

  return (
    <div className="fixed top-[var(--header-height)] left-0 right-0 z-40 bg-gradient-to-r from-amber-500 via-orange-500 to-red-500 text-white py-3 px-4 shadow-lg">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-lg font-bold flex items-center gap-2">
            <PartyPopper className="w-5 h-5" />
            季節限定
          </span>
          <span className="text-sm md:text-base">紅肉李採果體驗 7 折優惠中！</span>
        </div>
        <button onClick={onClose} className="text-white hover:text-gray-200 text-xl">
          ×
        </button>
      </div>
    </div>
  )
}
