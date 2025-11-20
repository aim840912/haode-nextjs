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
    <section id="news" data-animate className="py-20 px-6 bg-[#f8f5f0]">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <h2
            className={`text-4xl md:text-5xl font-serif-display text-[#3e2723] mb-4 ${
              isVisible ? 'animate-fade-in' : ''
            }`}
          >
            最新消息
          </h2>
          <p
            className={`text-[#5d4037] text-lg ${
              isVisible ? 'animate-fade-in animation-delay-150' : ''
            }`}
          >
            掌握農場最新動態與季節限定活動
          </p>
        </div>

        <div
          className={`grid md:grid-cols-2 gap-8 ${
            isVisible ? 'animate-slide-up animation-delay-300' : ''
          }`}
        >
          {/* 當季推薦 */}
          {newsCards.seasonalRecommendation.enabled &&
            (() => {
              const IconComponent = getIcon(newsCards.seasonalRecommendation.icon)
              return (
                <div className="bg-white rounded-2xl p-8 shadow-lg hover:shadow-xl transition-all duration-300">
                  <div className="flex items-center mb-4">
                    <IconComponent className="w-10 h-10 mr-3 text-[#2e7d32]" strokeWidth={2} />
                    <h3 className="text-2xl font-bold text-[#3e2723]">
                      {newsCards.seasonalRecommendation.title}
                    </h3>
                  </div>
                  <p className="text-gray-600 mb-6 text-lg">
                    {newsCards.seasonalRecommendation.description}
                  </p>
                  <Link
                    href={newsCards.seasonalRecommendation.linkUrl}
                    className="inline-flex items-center text-[#d35400] hover:text-[#e67e22] font-medium"
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
                <div className="bg-white rounded-2xl p-8 shadow-lg hover:shadow-xl transition-all duration-300">
                  <div className="flex items-center mb-4">
                    <IconComponent className="w-10 h-10 mr-3 text-[#d35400]" strokeWidth={2} />
                    <h3 className="text-2xl font-bold text-[#3e2723]">
                      {newsCards.farmActivity.title}
                    </h3>
                  </div>
                  <p className="text-gray-600 mb-6 text-lg">{newsCards.farmActivity.description}</p>
                  <Link
                    href={newsCards.farmActivity.linkUrl}
                    className="inline-flex items-center text-[#d35400] hover:text-[#e67e22] font-medium"
                  >
                    {newsCards.farmActivity.linkText}
                  </Link>
                </div>
              )
            })()}

          {/* 擺攤行程預告 - 動態顯示 */}
          <NextMarketScheduleCard />

          {/* 聯絡我們 */}
          <div className="bg-white rounded-2xl p-8 text-center shadow-lg hover:shadow-xl transition-all duration-300">
            <div className="flex justify-center mb-4">
              <Phone className="w-12 h-12 text-[#d35400]" strokeWidth={2} />
            </div>
            <h3 className="text-2xl font-bold text-[#3e2723] mb-4">聯絡我們</h3>
            <p className="text-gray-600 mb-6 text-lg">有任何問題或需求，歡迎隨時與我們聯繫</p>
            <Link
              href="/contact"
              prefetch={true}
              className="inline-block bg-[#d35400] hover:bg-[#e67e22] text-white px-8 py-3 rounded-full font-semibold transition-colors shadow-md hover:shadow-lg"
            >
              立即聯絡
            </Link>
          </div>
        </div>
      </div>
    </section>
  )
}
