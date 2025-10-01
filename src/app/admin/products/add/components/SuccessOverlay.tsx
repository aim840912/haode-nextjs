import { CheckCircleIcon } from '@heroicons/react/24/outline'

interface SuccessOverlayProps {
  show: boolean
}

/**
 * 成功覆蓋層元件
 * 在產品建立成功後顯示的全螢幕覆蓋層
 */
export function SuccessOverlay({ show }: SuccessOverlayProps) {
  if (!show) return null

  return (
    <div className="absolute inset-0 bg-white/95 backdrop-blur-sm z-50 flex items-center justify-center rounded-lg">
      <div className="text-center p-8">
        <CheckCircleIcon className="w-16 h-16 text-green-500 mx-auto mb-4 animate-bounce" />
        <h3 className="text-2xl font-bold text-gray-900 mb-2">產品建立成功！</h3>
        <p className="text-lg text-gray-600 mb-4">即將跳轉到產品列表...</p>
        <div className="w-32 h-2 bg-gray-200 rounded-full mx-auto overflow-hidden">
          <div className="h-full bg-gradient-to-r from-green-400 to-green-600 rounded-full animate-pulse"></div>
        </div>
      </div>
    </div>
  )
}
