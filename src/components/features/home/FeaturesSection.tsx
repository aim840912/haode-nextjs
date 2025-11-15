'use client'

import { FeatureCards } from './FeatureCards'
import { SeasonExperience } from './SeasonExperience'

interface FeaturesSectionProps {
  activeFeature: number
  onFeatureClick: (index: number) => void
  activeSeason: number
  onSeasonChange: (index: number) => void
  featureImages: string[]
  seasonImages: string[]
  isVisible: boolean
}

export function FeaturesSection({
  activeFeature,
  onFeatureClick,
  activeSeason,
  onSeasonChange,
  featureImages,
  seasonImages,
  isVisible,
}: FeaturesSectionProps) {
  return (
    <section
      id="features"
      data-animate
      className="min-h-screen flex items-center py-20 px-6 bg-white dark:bg-slate-900"
    >
      <div className="max-w-7xl mx-auto">
        <h2
          className={`text-5xl md:text-6xl font-bold text-center text-green-900 dark:text-green-300 mb-6 tracking-wider ${
            isVisible ? 'animate-fade-in' : 'opacity-0'
          }`}
        >
          農場特色
        </h2>
        <p
          className={`text-center text-gray-600 dark:text-gray-300 text-lg mb-16 max-w-2xl mx-auto ${
            isVisible ? 'animate-fade-in animation-delay-150' : 'opacity-0'
          }`}
        >
          以自然農法為本，結合現代技術與傳統智慧，打造永續經營的生態農場
        </p>

        {/* 核心特色卡片 */}
        <FeatureCards
          activeFeature={activeFeature}
          onFeatureClick={onFeatureClick}
          featureImages={featureImages}
          isVisible={isVisible}
        />

        {/* 互動式季節體驗展示 */}
        <SeasonExperience
          activeSeason={activeSeason}
          onSeasonChange={onSeasonChange}
          seasonImages={seasonImages}
          isVisible={isVisible}
        />
      </div>
    </section>
  )
}
