import { Home } from 'lucide-react'
import { ImageUploader } from '@/components/features/products/ImageUploader'
import { SectionProps, UploadedImage } from './types'

export function HomeHeroSection({ state, actions }: SectionProps) {
  const handleAddHomeHeroImage = (images: UploadedImage[]) => {
    const newUrls = images
      .map(img => img.url || img.preview || img.storage_url)
      .filter(Boolean) as string[]

    newUrls.forEach(url => actions.addHomeHeroImage(url))
  }

  const handleRemoveHomeHeroImage = (index: number) => {
    actions.removeHomeHeroImage(index)
  }

  return (
    <section className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-200 dark:border-slate-600 p-6">
      <div className="flex items-center space-x-3 mb-6">
        <Home className="w-6 h-6 text-blue-600" />
        <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">首頁輪播圖片</h2>
      </div>

      <div className="space-y-6">
        <ImageUploader
          productId="home-hero"
          module="site-settings"
          onUploadSuccess={handleAddHomeHeroImage}
          onUploadError={error => actions.showMessage('error', error)}
          maxFiles={10}
          allowMultiple={true}
          generateMultipleSizes={false}
          enableCompression={true}
          initialImages={state.homeHeroImages}
          onDeleteInitialImage={url => {
            const index = state.homeHeroImages.indexOf(url)
            if (index > -1) {
              handleRemoveHomeHeroImage(index)
            }
          }}
        />

        {state.homeHeroImages.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            <p>尚未新增任何輪播圖片</p>
            <p className="text-sm mt-1">建議新增 3-5 張圖片，支援拖放上傳</p>
          </div>
        )}
      </div>
    </section>
  )
}
