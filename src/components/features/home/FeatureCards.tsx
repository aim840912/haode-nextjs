'use client'

import { Sprout, ShieldCheck, Users, Recycle } from 'lucide-react'

interface FeatureCardsProps {
  activeFeature: number
  onFeatureClick: (index: number) => void
  featureImages: string[]
  isVisible: boolean
}

export function FeatureCards({
  activeFeature,
  onFeatureClick,
  featureImages,
  isVisible,
}: FeatureCardsProps) {
  const features = [
    {
      Icon: Sprout,
      title: '自然農法',
      desc: '有機無毒栽培',
      iconColor: 'text-[#2e7d32]',
    },
    {
      Icon: ShieldCheck,
      title: '品質認證',
      desc: '嚴格品質把關',
      iconColor: 'text-[#d35400]',
    },
    {
      Icon: Users,
      title: '農場體驗',
      desc: '四季活動豐富',
      iconColor: 'text-[#5d4037]',
    },
    {
      Icon: Recycle,
      title: '永續經營',
      desc: '生態平衡共生',
      iconColor: 'text-[#2e7d32]',
    },
  ]

  return (
    <div
      className={`grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-20 ${
        isVisible ? 'animate-slide-up animation-delay-300' : ''
      }`}
    >
      {features.map((feature, index) => (
        <div
          key={index}
          className={`flip-card cursor-pointer ${activeFeature === index ? 'flipped' : ''}`}
          onClick={() => onFeatureClick(activeFeature === index ? -1 : index)}
          onKeyDown={e => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault()
              onFeatureClick(activeFeature === index ? -1 : index)
            }
          }}
          style={{ animationDelay: `${index * 100}ms` }}
          tabIndex={0}
          role="button"
          aria-pressed={activeFeature === index}
          aria-label={`${feature.title}: ${feature.desc}。${activeFeature === index ? '按下以返回正面' : '按下以查看更多'}`}
        >
          <div className="flip-card-inner">
            {/* 正面 */}
            <div className="flip-card-front bg-white rounded-2xl p-6 shadow-lg hover:shadow-xl flex flex-col items-center justify-center text-center transition-shadow duration-300">
              <div className="mb-4">
                <feature.Icon className={`w-16 h-16 ${feature.iconColor}`} strokeWidth={1.5} />
              </div>
              <h3 className="text-2xl font-bold text-[#3e2723] mb-2">{feature.title}</h3>
              <p className="text-gray-600">{feature.desc}</p>
            </div>
            {/* 背面 */}
            <div
              className="flip-card-back rounded-2xl shadow-xl overflow-hidden"
              style={
                featureImages[index]
                  ? {
                      backgroundImage: `url(${featureImages[index]})`,
                      backgroundSize: 'cover',
                      backgroundPosition: 'center',
                    }
                  : {}
              }
            ></div>
          </div>
        </div>
      ))}
    </div>
  )
}
