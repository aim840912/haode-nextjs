import Link from 'next/link'
import { Phone } from 'lucide-react'
import { NextMarketScheduleCard } from './NextMarketScheduleCard'

interface NewsCard {
  enabled: boolean
  title: string
  icon: string
  description: string
  linkUrl: string
  linkText: string
}

interface NewsSectionProps {
  newsCards: {
    seasonalRecommendation: NewsCard
    farmActivity: NewsCard
  }
  getIcon: (iconName: string) => React.ComponentType<any>
  isVisible: boolean
}

export function NewsSection({ newsCards, getIcon, isVisible }: NewsSectionProps) {
  return (
    <section id="news" data-animate className="py-20 px-6 bg-gray-50 dark:bg-slate-800">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <h2
            className={`text-4xl md:text-5xl font-bold text-green-900 dark:text-green-300 mb-4 ${
              isVisible ? 'animate-fade-in' : 'opacity-0'
            }`}
          >
            最新消息
          </h2>
          <p
            className={`text-gray-600 dark:text-gray-300 text-lg ${
              isVisible ? 'animate-fade-in animation-delay-150' : 'opacity-0'
            }`}
          >
            掌握農場最新動態與季節限定活動
          </p>
        </div>

        <div
          className={`grid md:grid-cols-2 gap-8 ${
            isVisible ? 'animate-slide-up animation-delay-300' : 'opacity-0'
          }`}
        >
          {/* 當季推薦 */}
          {newsCards.seasonalRecommendation.enabled &&
            (() => {
              const IconComponent = getIcon(newsCards.seasonalRecommendation.icon)
              return (
                <div className="bg-green-50 dark:bg-green-900/30 rounded-2xl p-8 hover:shadow-lg transition-shadow duration-300 border border-green-100 dark:border-green-800">
                  <div className="flex items-center mb-4">
                    <IconComponent
                      className="w-10 h-10 mr-3 text-green-600 dark:text-green-400"
                      strokeWidth={2}
                    />
                    <h3 className="text-2xl font-bold text-green-900 dark:text-green-300">
                      {newsCards.seasonalRecommendation.title}
                    </h3>
                  </div>
                  <p className="text-green-800 dark:text-green-200 mb-6 text-lg">
                    {newsCards.seasonalRecommendation.description}
                  </p>
                  <Link
                    href={newsCards.seasonalRecommendation.linkUrl}
                    className="inline-flex items-center text-green-700 dark:text-green-300 hover:text-green-900 dark:hover:text-green-200 font-medium"
                  >
                    {newsCards.seasonalRecommendation.linkText}
                  </Link>
                </div>
              )
            })()}

          {/* 農場活動 */}
          {newsCards.farmActivity.enabled &&
            (() => {
              const IconComponent = getIcon(newsCards.farmActivity.icon)
              return (
                <div className="bg-green-50 dark:bg-green-900/30 rounded-2xl p-8 hover:shadow-lg transition-shadow duration-300 border border-green-100 dark:border-green-800">
                  <div className="flex items-center mb-4">
                    <IconComponent
                      className="w-10 h-10 mr-3 text-green-600 dark:text-green-400"
                      strokeWidth={2}
                    />
                    <h3 className="text-2xl font-bold text-green-900 dark:text-green-300">
                      {newsCards.farmActivity.title}
                    </h3>
                  </div>
                  <p className="text-green-800 dark:text-green-200 mb-6 text-lg">
                    {newsCards.farmActivity.description}
                  </p>
                  <Link
                    href={newsCards.farmActivity.linkUrl}
                    className="inline-flex items-center text-green-700 dark:text-green-300 hover:text-green-900 dark:hover:text-green-200 font-medium"
                  >
                    {newsCards.farmActivity.linkText}
                  </Link>
                </div>
              )
            })()}

          {/* 擺攤行程預告 - 動態顯示 */}
          <NextMarketScheduleCard />

          {/* 聯絡我們 */}
          <div className="bg-blue-50 dark:bg-blue-900/30 rounded-2xl p-8 text-center hover:shadow-lg transition-shadow duration-300 border border-blue-100 dark:border-blue-800">
            <div className="flex justify-center mb-4">
              <Phone className="w-12 h-12 text-blue-600 dark:text-blue-400" strokeWidth={2} />
            </div>
            <h3 className="text-2xl font-bold text-blue-900 dark:text-blue-300 mb-4">聯絡我們</h3>
            <p className="text-blue-800 dark:text-blue-200 mb-6 text-lg">
              有任何問題或需求，歡迎隨時與我們聯繫
            </p>
            <Link
              href="/contact"
              prefetch={true}
              className="inline-block bg-blue-600 dark:bg-blue-700 text-white px-8 py-3 rounded-full font-semibold hover:bg-blue-700 dark:hover:bg-blue-800 transition-colors shadow-md hover:shadow-lg"
            >
              立即聯絡
            </Link>
          </div>
        </div>
      </div>
    </section>
  )
}
