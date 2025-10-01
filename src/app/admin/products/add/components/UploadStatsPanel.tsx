interface UploadStats {
  totalImages: number
  uploadedImages: number
  queuedImages: number
  failedImages: number
  savedSpace: number // bytes
  savedTime: number // ms
}

interface UploadStatsPanelProps {
  stats: UploadStats
}

/**
 * 上傳統計面板元件
 * 顯示圖片上傳的即時統計資訊
 */
export function UploadStatsPanel({ stats }: UploadStatsPanelProps) {
  // 只在有數據時顯示
  if (stats.totalImages === 0 && stats.savedSpace === 0) {
    return null
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border mb-8 p-6">
      <h3 className="text-lg font-medium text-gray-900 mb-4">智慧上傳統計</h3>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="text-center">
          <div className="text-2xl font-bold text-green-600">{stats.uploadedImages}</div>
          <div className="text-sm text-gray-600">已上傳</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-blue-600">{stats.queuedImages}</div>
          <div className="text-sm text-gray-600">佇列中</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-purple-600">
            {stats.savedSpace > 0 ? `${(stats.savedSpace / 1024 / 1024).toFixed(1)}MB` : '0MB'}
          </div>
          <div className="text-sm text-gray-600">節省空間</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-orange-600">
            {stats.savedTime > 0 ? `${(stats.savedTime / 1000).toFixed(1)}s` : '0s'}
          </div>
          <div className="text-sm text-gray-600">節省時間</div>
        </div>
      </div>
    </div>
  )
}
