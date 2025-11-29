import { Info } from 'lucide-react'

export function GalleryInstructions() {
  return (
    <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
      <div className="flex items-start space-x-2">
        <Info className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
        <div className="text-sm text-blue-800">
          <p className="font-medium mb-1">圖片排序說明</p>
          <ul className="space-y-1 text-blue-700">
            <li>使用上下箭頭按鈕來調整圖片順序</li>
            <li>第一張圖片會自動設為主要展示圖片</li>
            <li>排序會即時保存</li>
          </ul>
        </div>
      </div>
    </div>
  )
}
