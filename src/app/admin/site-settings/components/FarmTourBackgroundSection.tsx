import { Leaf } from 'lucide-react'
import { SingleImageUploader } from '@/components/features/products/ImageUploader'
import { SectionProps, UploadedImage } from './types'

export function FarmTourBackgroundSection({ state, actions }: SectionProps) {
  const handleFarmTourBgUpload = (image: UploadedImage) => {
    const imageUrl = image.url || image.preview || image.storage_url
    if (imageUrl) {
      actions.setFarmTourHeroBg(imageUrl)
    }
  }

  const handleFarmTourBgDelete = () => {
    actions.setFarmTourHeroBg('')
  }

  return (
    <section className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-200 dark:border-slate-600 p-6">
      <div className="flex items-center space-x-3 mb-6">
        <Leaf className="w-6 h-6 text-green-600" />
        <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">農場體驗頁面背景圖片</h2>
      </div>

      <SingleImageUploader
        productId="farm-tour-hero-bg"
        module="site-settings"
        initialImage={state.farmTourHeroBg}
        onUploadSuccess={handleFarmTourBgUpload}
        onUploadError={error => actions.showMessage('error', error)}
        onDelete={handleFarmTourBgDelete}
        enableDelete={true}
      />

      {state.farmTourHeroBg && (
        <div className="mt-4 p-4 bg-gray-50 rounded-lg">
          <p className="text-sm text-gray-600 dark:text-gray-300">當前圖片路徑：</p>
          <p className="text-sm text-gray-800 break-all mt-1">{state.farmTourHeroBg}</p>
        </div>
      )}
    </section>
  )
}
