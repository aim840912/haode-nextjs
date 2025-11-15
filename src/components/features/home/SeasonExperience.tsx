'use client'

import Link from 'next/link'
import { Flower2, Apple, Wheat, Coffee, Check } from 'lucide-react'

interface SeasonExperienceProps {
  activeSeason: number
  onSeasonChange: (index: number) => void
  seasonImages: string[]
  isVisible: boolean
}

export function SeasonExperience({
  activeSeason,
  onSeasonChange,
  seasonImages,
  isVisible,
}: SeasonExperienceProps) {
  const seasons = [
    { name: '春季賞花', Icon: Flower2, color: 'green' },
    { name: '夏日採果', Icon: Apple, color: 'red' },
    { name: '秋收體驗', Icon: Wheat, color: 'orange' },
    { name: '冬日品茶', Icon: Coffee, color: 'green' },
  ]

  const seasonContent = [
    {
      title: '春季賞花',
      description:
        '春暖花開時節，農場百花齊放。漫步在花海之中，感受大自然的生命力。最佳賞花期：3-4月',
      color: 'green',
      items: ['賞花導覽解說', '攝影景點推薦', '花卉知識介紹'],
    },
    {
      title: '夏日採果',
      description:
        '盛夏時分，紅肉李、水蜜桃進入採收期。親手採摘新鮮水果，體驗豐收的喜悅。採果期：6-8月',
      color: 'red',
      items: ['專人採果教學', '現場試吃品嚐', '採果籃免費提供'],
    },
    {
      title: '秋收體驗',
      description:
        '秋高氣爽，是收穫的季節。參與採收活動，了解農作物從種植到收成的完整過程。體驗期：9-11月',
      color: 'orange',
      items: ['收成體驗活動', '農業知識講座', '農產品 DIY 製作'],
    },
    {
      title: '冬日品茶',
      description:
        '冬季是品茶的最佳時節。在溫暖的茶室中，品味自家種植的高山茶，感受農場的寧靜之美。品茶期：12-2月',
      color: 'green',
      items: ['茶道文化體驗', '品茶技巧教學', '茶葉製程介紹'],
    },
  ]

  const SeasonIcon = [Flower2, Apple, Wheat, Coffee][activeSeason]
  const currentContent = seasonContent[activeSeason]

  return (
    <div className={`${isVisible ? 'animate-slide-up animation-delay-450' : 'opacity-0'}`}>
      <h3 className="text-3xl font-bold text-center text-green-900 dark:text-green-300 mb-8">
        四季體驗
      </h3>

      {/* 季節切換按鈕 */}
      <div className="flex justify-center gap-4 mb-10 flex-wrap">
        {seasons.map((season, index) => (
          <button
            key={index}
            onClick={() => onSeasonChange(index)}
            className={`flex items-center gap-2 px-6 py-3 rounded-full font-medium transition-all duration-300 ${
              activeSeason === index
                ? `bg-${season.color}-600 text-white shadow-lg scale-110 animate-pulse-glow`
                : `bg-white dark:bg-slate-800 text-gray-700 dark:text-gray-200 hover:bg-${season.color}-50 dark:hover:bg-${season.color}-900/30 border border-${season.color}-200 dark:border-${season.color}-700`
            }`}
          >
            <season.Icon className="w-5 h-5" strokeWidth={2} />
            {season.name}
          </button>
        ))}
      </div>

      {/* 季節內容展示 */}
      <div className="grid lg:grid-cols-2 gap-12 items-center">
        <div className="relative">
          <div
            className="relative aspect-[4/3] rounded-3xl overflow-hidden shadow-2xl"
            style={{
              backgroundImage: `url(${seasonImages[activeSeason]})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
            }}
          >
            <div className="absolute inset-0 bg-black/20"></div>
            <div className="absolute bottom-6 left-6">
              <div className="bg-white/20 backdrop-blur-md rounded-xl p-3 inline-block">
                <SeasonIcon className="w-12 h-12 text-white" strokeWidth={1.5} />
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="glass-card rounded-2xl p-8 dark:bg-slate-800/50 dark:backdrop-blur-md">
            <h4 className="text-2xl font-bold text-green-900 dark:text-green-300 mb-4">
              {currentContent.title}
            </h4>
            <p className="text-gray-700 dark:text-gray-300 mb-6 leading-relaxed">
              {currentContent.description}
            </p>
            <ul className="space-y-3">
              {currentContent.items.map((item, index) => (
                <li key={index} className="flex items-start gap-2">
                  <Check
                    className={`w-5 h-5 text-${currentContent.color}-600 dark:text-${currentContent.color}-400 flex-shrink-0 mt-0.5`}
                    strokeWidth={2.5}
                  />
                  <span className="text-gray-600 dark:text-gray-300">{item}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="text-center">
            <Link
              href="/farm-tour"
              prefetch={true}
              className="inline-flex items-center gap-2 bg-green-600 dark:bg-green-700 text-white px-10 py-4 rounded-full text-lg font-medium hover:bg-green-700 dark:hover:bg-green-800 transition-colors duration-300 shadow-lg hover:shadow-xl"
            >
              <span>預約參觀</span>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5l7 7-7 7"
                />
              </svg>
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
