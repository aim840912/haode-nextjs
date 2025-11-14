import { Leaf } from 'lucide-react'
import { SingleImageUploader } from '@/components/features/products/ImageUploader'
import { SectionProps, UploadedImage } from './types'

export function SeasonImagesSection({ state, actions }: SectionProps) {
  const seasons = [
    { id: 'spring', title: '1. 春季賞花', stateKey: state.seasonSpringImage },
    { id: 'summer', title: '2. 夏日採果', stateKey: state.seasonSummerImage },
    { id: 'autumn', title: '3. 秋收體驗', stateKey: state.seasonAutumnImage },
    { id: 'winter', title: '4. 冬日品茶', stateKey: state.seasonWinterImage },
  ]

  return (
    <section className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-200 dark:border-slate-600 p-6">
      <div className="flex items-center space-x-3 mb-6">
        <Leaf className="w-6 h-6 text-purple-600" />
        <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">四季體驗圖片</h2>
      </div>
      <p className="text-sm text-gray-600 dark:text-gray-300 mb-6">
        管理首頁「四季體驗」區域的季節圖片
      </p>

      <div className="grid md:grid-cols-2 gap-6">
        {seasons.map(season => (
          <div key={season.id}>
            <h3 className="text-lg font-semibold text-gray-800 mb-3">{season.title}</h3>
            <SingleImageUploader
              productId={`season-${season.id}`}
              module="site-settings"
              initialImage={season.stateKey}
              onUploadSuccess={(image: UploadedImage) => {
                const imageUrl = image.url || image.preview || image.storage_url
                if (imageUrl)
                  actions.setSeasonImage(
                    season.id as 'spring' | 'summer' | 'autumn' | 'winter',
                    imageUrl
                  )
              }}
              onUploadError={error => actions.showMessage('error', error)}
              onDelete={() =>
                actions.setSeasonImage(season.id as 'spring' | 'summer' | 'autumn' | 'winter', '')
              }
              enableDelete={true}
            />
          </div>
        ))}
      </div>
    </section>
  )
}
