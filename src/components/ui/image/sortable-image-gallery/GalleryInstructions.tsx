'use client'

export function GalleryInstructions() {
  return (
    <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
      <div className="flex items-start space-x-2">
        <svg
          className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
        <div className="text-sm text-blue-800">
          <p className="font-medium mb-1">圖片排序說明</p>
          <ul className="space-y-1 text-blue-700">
            <li>• 拖拽圖片左上角的排序圖示來調整順序</li>
            <li>• 第一張圖片會自動設為主要展示圖片</li>
            <li>• 排序會即時保存</li>
          </ul>
        </div>
      </div>
    </div>
  )
}
