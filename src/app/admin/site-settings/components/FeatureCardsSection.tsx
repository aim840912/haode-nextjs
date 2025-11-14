import { Leaf } from 'lucide-react'
import { SingleImageUploader } from '@/components/features/products/ImageUploader'
import { SectionProps, UploadedImage } from './types'

export function FeatureCardsSection({ state, actions }: SectionProps) {
  const cards = [
    { id: 1 as const, title: '1. 自然農法', stateKey: state.featureCard1Image },
    { id: 2 as const, title: '2. 品質認證', stateKey: state.featureCard2Image },
    { id: 3 as const, title: '3. 農場體驗', stateKey: state.featureCard3Image },
    { id: 4 as const, title: '4. 永續經營', stateKey: state.featureCard4Image },
  ] as const

  return (
    <section className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-200 dark:border-slate-600 p-6">
      <div className="flex items-center space-x-3 mb-6">
        <Leaf className="w-6 h-6 text-blue-600" />
        <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">農場特色卡片背面圖片</h2>
      </div>
      <p className="text-sm text-gray-600 dark:text-gray-300 mb-6">
        管理首頁「農場特色」區域翻轉卡片背面的圖片
      </p>

      <div className="grid md:grid-cols-2 gap-6">
        {cards.map(card => (
          <div key={card.id}>
            <h3 className="text-lg font-semibold text-gray-800 mb-3">{card.title}</h3>
            <SingleImageUploader
              productId={`feature-card-${card.id}`}
              module="site-settings"
              initialImage={card.stateKey}
              onUploadSuccess={(image: UploadedImage) => {
                const imageUrl = image.url || image.preview || image.storage_url
                if (imageUrl) actions.setFeatureCardImage(card.id, imageUrl)
              }}
              onUploadError={error => actions.showMessage('error', error)}
              onDelete={() => actions.setFeatureCardImage(card.id, '')}
              enableDelete={true}
            />
          </div>
        ))}
      </div>
    </section>
  )
}
