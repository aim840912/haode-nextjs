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
      color: 'from-green-400 to-emerald-500',
      bgColor: 'bg-green-50 dark:bg-green-900/30',
      iconColor: 'text-green-600 dark:text-green-400',
    },
    {
      Icon: ShieldCheck,
      title: '品質認證',
      desc: '嚴格品質把關',
      color: 'from-blue-400 to-cyan-500',
      bgColor: 'bg-blue-50 dark:bg-blue-900/30',
      iconColor: 'text-blue-600 dark:text-blue-400',
    },
    {
      Icon: Users,
      title: '農場體驗',
      desc: '四季活動豐富',
      color: 'from-green-400 to-emerald-500',
      bgColor: 'bg-green-50 dark:bg-green-900/30',
      iconColor: 'text-green-600 dark:text-green-400',
    },
    {
      Icon: Recycle,
      title: '永續經營',
      desc: '生態平衡共生',
      color: 'from-purple-400 to-pink-500',
      bgColor: 'bg-purple-50 dark:bg-purple-900/30',
      iconColor: 'text-purple-600 dark:text-purple-400',
    },
  ]

  return (
    <div
      className={`grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-20 ${
        isVisible ? 'animate-slide-up animation-delay-300' : 'opacity-0'
      }`}
    >
      {features.map((feature, index) => (
        <div
          key={index}
          className={`flip-card cursor-pointer ${activeFeature === index ? 'flipped' : ''}`}
          onClick={() => onFeatureClick(activeFeature === index ? -1 : index)}
          style={{ animationDelay: `${index * 100}ms` }}
        >
          <div className="flip-card-inner">
            {/* 正面 */}
            <div
              className={`flip-card-front ${feature.bgColor} rounded-2xl p-6 shadow-xl flex flex-col items-center justify-center text-center gradient-glow`}
            >
              <div className="mb-4">
                <feature.Icon className={`w-16 h-16 ${feature.iconColor}`} strokeWidth={1.5} />
              </div>
              <h3 className="text-2xl font-bold text-gray-800 dark:text-gray-100 mb-2">
                {feature.title}
              </h3>
              <p className="text-gray-600 dark:text-gray-300">{feature.desc}</p>
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
