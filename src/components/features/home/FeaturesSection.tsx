'use client'

import { FeatureCards } from './FeatureCards'

interface FeaturesSectionProps {
  activeFeature: number
  onFeatureClick: (index: number) => void
  featureImages: string[]
  isVisible: boolean
}

export function FeaturesSection({
  activeFeature,
  onFeatureClick,
  featureImages,
  isVisible,
}: FeaturesSectionProps) {
  return (
    <section id="features" data-animate className="py-24 px-6 bg-[#f8f5f0]">
      <div className="max-w-7xl mx-auto">
        <h2
          className={`text-5xl md:text-6xl font-serif-display text-center text-[#3e2723] mb-6 tracking-wider ${
            isVisible ? 'animate-fade-in' : ''
          }`}
        >
          農場特色
        </h2>
        <p
          className={`text-center text-[#5d4037] text-lg mb-16 max-w-2xl mx-auto ${
            isVisible ? 'animate-fade-in animation-delay-150' : ''
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
      </div>
    </section>
  )
}
