import dynamic from 'next/dynamic'

const ImageUploader = dynamic(() => import('@/components/features/products/ImageUploader'), {
  loading: () => (
    <div className="h-32 bg-gray-100 dark:bg-slate-700 rounded-lg flex items-center justify-center text-gray-900 dark:text-gray-100">
      載入圖片上傳器...
    </div>
  ),
  ssr: false,
})

interface ImageUploadSectionProps {
  locationId: string
  existingImages: string[]
  onUploadSuccess: (
    images: {
      id: string
      url?: string
      path?: string
      size?: 'thumbnail' | 'medium' | 'large'
      file?: File
      preview?: string
      position?: number
      alt?: string
    }[]
  ) => void
  onUploadError: (error: string) => void
}

export function ImageUploadSection({
  locationId,
  existingImages,
  onUploadSuccess,
  onUploadError,
}: ImageUploadSectionProps) {
  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">門市圖片</h2>
      <ImageUploader
        productId={locationId}
        initialImages={existingImages}
        maxFiles={1}
        onUploadSuccess={onUploadSuccess}
        onUploadError={onUploadError}
        module="locations"
      />
    </div>
  )
}
