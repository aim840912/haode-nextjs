import React from 'react'

interface ImageErrorStateProps {
  error: string | null
  showErrorDetails?: boolean
  isBase64?: boolean
  hasError?: boolean
  enableMultiLevelFallback?: boolean
}

/**
 * 圖片錯誤狀態顯示元件
 */
export const ImageErrorState = React.memo(function ImageErrorState({
  error,
  showErrorDetails = false,
  isBase64 = false,
  hasError = false,
  enableMultiLevelFallback = false,
}: ImageErrorStateProps) {
  if (!error) return null

  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-500 text-xs p-2 text-center bg-gray-100">
      <div className="text-2xl mb-2">❌</div>
      <div className="font-semibold">圖片載入失敗</div>
      {showErrorDetails && <div className="mt-1 opacity-80 text-xs">{error}</div>}
      {isBase64 && <div className="mt-1 text-xs text-blue-600">📷 Base64 → Blob 轉換</div>}
      {enableMultiLevelFallback && hasError && (
        <div className="mt-1 text-xs text-orange-600">🔄 多層 Fallback 啟用</div>
      )}
    </div>
  )
})
