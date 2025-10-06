'use client'

import { useToast, ToastPosition } from '@/components/ui/feedback/Toast'

/**
 * Toast 位置測試頁面
 * 用於測試 Toast 在不同位置的顯示效果
 */
export default function TestToastPage() {
  const toast = useToast()

  const testPosition = (
    position: ToastPosition,
    type: 'success' | 'error' | 'warning' | 'info'
  ) => {
    toast.showToast({
      type,
      title: `${position} 測試`,
      message: `這是顯示在 ${position} 位置的 Toast 通知`,
      position,
    })
  }

  const positions: ToastPosition[] = [
    'top-left',
    'top-center',
    'top-right',
    'bottom-left',
    'bottom-center',
    'bottom-right',
  ]

  const types: Array<'success' | 'error' | 'warning' | 'info'> = [
    'success',
    'error',
    'warning',
    'info',
  ]

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Toast 位置測試</h1>
        <p className="text-gray-600 mb-8">點擊下方按鈕測試 Toast 在不同位置的顯示效果</p>

        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">測試所有位置</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {positions.map((position, index) => (
              <button
                key={position}
                onClick={() => testPosition(position, types[index % types.length])}
                className="px-4 py-3 bg-amber-900 text-white rounded-lg hover:bg-amber-800 transition-colors font-medium"
              >
                測試 {position}
              </button>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">測試相同位置堆疊</h2>
          <p className="text-sm text-gray-600 mb-4">點擊按鈕會在同一位置連續顯示 3 個 Toast</p>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {positions.map(position => (
              <button
                key={`stack-${position}`}
                onClick={() => {
                  testPosition(position, 'info')
                  setTimeout(() => testPosition(position, 'success'), 200)
                  setTimeout(() => testPosition(position, 'warning'), 400)
                }}
                className="px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
              >
                堆疊 {position}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h3 className="text-sm font-semibold text-blue-900 mb-2">使用說明</h3>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>• 上方按鈕：測試單個 Toast 在各位置的顯示</li>
            <li>• 下方按鈕：測試多個 Toast 在同一位置的堆疊效果</li>
            <li>• Toast 會自動在 5 秒後消失</li>
            <li>• 最多同時顯示 5 個 Toast</li>
          </ul>
        </div>
      </div>
    </div>
  )
}
