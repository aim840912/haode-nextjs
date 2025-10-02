import { LocationFormData } from '@/hooks/location/useLocationForm'
import { getFullImageUrl } from '@/lib/utils/image-url-utils'
import { SimpleImage } from '@/components/ui/image/OptimizedImage'

interface LocationPreviewProps {
  formData: LocationFormData
  uploadedImageUrl: string
}

// 驗證圖片 URL 是否有效（避免 emoji 或無效 URL 傳遞給 Image 組件）
const isValidImageUrl = (url: string | undefined): boolean => {
  if (!url) return false
  // 檢查是否包含 emoji 字符
  const emojiRegex =
    /[\u{1F000}-\u{1F9FF}]|[\u{1F300}-\u{1F5FF}]|[\u{1F600}-\u{1F64F}]|[\u{1F680}-\u{1F6FF}]|[\u{1F700}-\u{1F77F}]|[\u{1F780}-\u{1F7FF}]|[\u{1F800}-\u{1F8FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]/u
  if (emojiRegex.test(url)) return false
  // 檢查是否為有效的相對或絕對路徑
  return url.startsWith('/') || url.startsWith('http://') || url.startsWith('https://')
}

export const LocationPreview = ({ formData, uploadedImageUrl }: LocationPreviewProps) => {
  const displayImageUrl = uploadedImageUrl || formData.image

  return (
    <div className="lg:sticky lg:top-8">
      <h3 className="text-lg font-medium text-gray-900 mb-4">即時預覽</h3>
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        {/* Preview Card */}
        <div className="bg-gradient-to-br from-amber-100 to-orange-100 p-6 text-center relative">
          <div className="mb-3">
            {displayImageUrl && isValidImageUrl(displayImageUrl) ? (
              <SimpleImage
                src={getFullImageUrl(displayImageUrl)}
                alt="門市圖片"
                width={64}
                height={64}
                className="w-16 h-16 object-cover rounded-lg mx-auto border-2 border-white shadow-sm"
              />
            ) : (
              <div className="w-16 h-16 bg-gray-200 rounded-lg mx-auto flex items-center justify-center">
                <span className="text-gray-400 text-sm">無圖片</span>
              </div>
            )}
          </div>
          <h3 className="text-lg font-bold text-gray-800 mb-2">
            {formData.title || '門市標題預覽'}
          </h3>
          <div className="text-sm text-gray-600">{formData.name || '門市名稱'}</div>
          {formData.isMain && (
            <span className="absolute top-2 right-2 bg-red-500 text-white text-xs px-2 py-1 rounded-full">
              總店
            </span>
          )}
        </div>

        <div className="p-4">
          <div className="space-y-2 mb-4">
            <div className="flex items-start">
              <span className="mr-2 text-sm">📍</span>
              <span className="text-sm text-gray-700">{formData.address || '門市地址'}</span>
            </div>
            {formData.landmark && (
              <div className="text-xs text-gray-500 ml-5">{formData.landmark}</div>
            )}
            <div className="flex items-center">
              <span className="mr-2 text-sm">📞</span>
              <span className="text-sm text-gray-700">{formData.phone || '電話號碼'}</span>
            </div>
            {formData.lineId && (
              <div className="flex items-center">
                <span className="mr-2 text-sm">💬</span>
                <span className="text-sm text-gray-700">LINE: {formData.lineId}</span>
              </div>
            )}
            <div className="flex items-center">
              <span className="mr-2 text-sm">⏰</span>
              <span className="text-sm text-gray-700">{formData.hours || '營業時間'}</span>
            </div>
            {formData.closedDays && (
              <div className="text-xs text-gray-500 ml-5">{formData.closedDays}</div>
            )}
          </div>

          <div className="mb-4">
            <h4 className="font-semibold text-gray-800 mb-2 text-sm">特色服務</h4>
            <div className="space-y-1">
              {formData.features
                .filter(f => f.trim())
                .map((feature, index) => (
                  <div key={index} className="flex items-center text-xs text-gray-600">
                    <span className="mr-2 text-green-500">✓</span>
                    <span>{feature}</span>
                  </div>
                ))}
            </div>
          </div>

          <div className="mb-4">
            <h4 className="font-semibold text-gray-800 mb-2 text-sm">主打商品</h4>
            <div className="flex flex-wrap gap-1">
              {formData.specialties
                .filter(s => s.trim())
                .map((specialty, index) => (
                  <span
                    key={index}
                    className="bg-amber-100 text-amber-800 px-2 py-1 rounded text-xs"
                  >
                    {specialty}
                  </span>
                ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
