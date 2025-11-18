'use client'

export function DragOverlay() {
  return (
    <div className="fixed inset-0 bg-black/20 flex items-center justify-center z-50 pointer-events-none">
      <div className="bg-white rounded-lg shadow-lg p-4 max-w-xs text-center">
        <div className="text-amber-600 mb-2">
          <svg
            className="w-8 h-8 mx-auto animate-bounce"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4"
            />
          </svg>
        </div>
        <p className="text-sm text-gray-700">正在調整圖片順序...</p>
      </div>
    </div>
  )
}
