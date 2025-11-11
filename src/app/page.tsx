'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import {
  Sprout,
  ShieldCheck,
  Users,
  Recycle,
  Flower2,
  Apple,
  Wheat,
  Coffee,
  CalendarDays,
  Phone,
  PartyPopper,
  Check,
  Leaf,
  Sparkles,
  Calendar,
} from 'lucide-react'
import { ProductsSectionWithErrorBoundary as ProductsSection } from '@/components/features/products/ProductsSection'
import { FarmStructuredData } from '@/components/features/seo/StructuredData'
import { NextMarketScheduleCard } from '@/components/features/home/NextMarketScheduleCard'
import { useSiteSetting } from '@/hooks/useSiteSettings'
import { SETTING_KEYS } from '@/types/siteSettings'

export default function Home() {
  const [scrollY, setScrollY] = useState(0)
  const [currentSlide, setCurrentSlide] = useState(0)
  const [visibleSections, setVisibleSections] = useState<Set<string>>(new Set())
  const [activeFeature, setActiveFeature] = useState(0)
  const [activeSeason, setActiveSeason] = useState(0)

  const { setting: heroImagesSetting, loading: heroImagesLoading } = useSiteSetting(
    SETTING_KEYS.HOME_HERO_IMAGES
  )
  const { setting: featureCard1Setting } = useSiteSetting(SETTING_KEYS.HOME_FEATURE_CARD_1_IMAGE)
  const { setting: featureCard2Setting } = useSiteSetting(SETTING_KEYS.HOME_FEATURE_CARD_2_IMAGE)
  const { setting: featureCard3Setting } = useSiteSetting(SETTING_KEYS.HOME_FEATURE_CARD_3_IMAGE)
  const { setting: featureCard4Setting } = useSiteSetting(SETTING_KEYS.HOME_FEATURE_CARD_4_IMAGE)
  const { setting: seasonSpringSetting } = useSiteSetting(SETTING_KEYS.HOME_SEASON_SPRING_IMAGE)
  const { setting: seasonSummerSetting } = useSiteSetting(SETTING_KEYS.HOME_SEASON_SUMMER_IMAGE)
  const { setting: seasonAutumnSetting } = useSiteSetting(SETTING_KEYS.HOME_SEASON_AUTUMN_IMAGE)
  const { setting: seasonWinterSetting } = useSiteSetting(SETTING_KEYS.HOME_SEASON_WINTER_IMAGE)

  // 最新消息 - 當季推薦卡片設定
  const { setting: seasonalRecommendationEnabled } = useSiteSetting(
    SETTING_KEYS.HOME_NEWS_SEASONAL_RECOMMENDATION_ENABLED
  )
  const { setting: seasonalRecommendationTitle } = useSiteSetting(
    SETTING_KEYS.HOME_NEWS_SEASONAL_RECOMMENDATION_TITLE
  )
  const { setting: seasonalRecommendationIcon } = useSiteSetting(
    SETTING_KEYS.HOME_NEWS_SEASONAL_RECOMMENDATION_ICON
  )
  const { setting: seasonalRecommendationDescription } = useSiteSetting(
    SETTING_KEYS.HOME_NEWS_SEASONAL_RECOMMENDATION_DESCRIPTION
  )
  const { setting: seasonalRecommendationLinkUrl } = useSiteSetting(
    SETTING_KEYS.HOME_NEWS_SEASONAL_RECOMMENDATION_LINK_URL
  )
  const { setting: seasonalRecommendationLinkText } = useSiteSetting(
    SETTING_KEYS.HOME_NEWS_SEASONAL_RECOMMENDATION_LINK_TEXT
  )

  // 最新消息 - 農場活動卡片設定
  const { setting: farmActivityEnabled } = useSiteSetting(
    SETTING_KEYS.HOME_NEWS_FARM_ACTIVITY_ENABLED
  )
  const { setting: farmActivityTitle } = useSiteSetting(SETTING_KEYS.HOME_NEWS_FARM_ACTIVITY_TITLE)
  const { setting: farmActivityIcon } = useSiteSetting(SETTING_KEYS.HOME_NEWS_FARM_ACTIVITY_ICON)
  const { setting: farmActivityDescription } = useSiteSetting(
    SETTING_KEYS.HOME_NEWS_FARM_ACTIVITY_DESCRIPTION
  )
  const { setting: farmActivityLinkUrl } = useSiteSetting(
    SETTING_KEYS.HOME_NEWS_FARM_ACTIVITY_LINK_URL
  )
  const { setting: farmActivityLinkText } = useSiteSetting(
    SETTING_KEYS.HOME_NEWS_FARM_ACTIVITY_LINK_TEXT
  )

  const defaultHeroImages = [
    '/images/hero/scene1.jpg',
    '/images/locations/mountain.jpg',
    '/images/farm-tour/many_people_1.jpg',
  ]

  const heroImages = (() => {
    if (heroImagesLoading || !heroImagesSetting) {
      return defaultHeroImages
    }
    try {
      const parsedImages = JSON.parse(heroImagesSetting.value)
      return Array.isArray(parsedImages) && parsedImages.length > 0
        ? parsedImages
        : defaultHeroImages
    } catch {
      return defaultHeroImages
    }
  })()

  // 翻轉卡片背景圖片
  const featureCardImages = [
    featureCard1Setting?.value || '',
    featureCard2Setting?.value || '',
    featureCard3Setting?.value || '',
    featureCard4Setting?.value || '',
  ]

  // 四季體驗圖片（提供 fallback 預設值）
  const defaultSeasonImages = [
    '/images/locations/mountain.jpg', // 春季預設
    '/images/farm-tour/many_people_1.jpg', // 夏季預設
    '/images/locations/mountain.jpg', // 秋季預設
    '/images/farm-tour/many_people_1.jpg', // 冬季預設
  ]

  const seasonImages = [
    seasonSpringSetting?.value || defaultSeasonImages[0],
    seasonSummerSetting?.value || defaultSeasonImages[1],
    seasonAutumnSetting?.value || defaultSeasonImages[2],
    seasonWinterSetting?.value || defaultSeasonImages[3],
  ]

  // 圖示映射函數
  const getIcon = (iconName: string) => {
    const iconMap: Record<string, React.ComponentType<any>> = {
      sprout: Sprout,
      apple: Apple,
      wheat: Wheat,
      leaf: Leaf,
      'party-popper': PartyPopper,
      calendar: Calendar,
      users: Users,
      sparkles: Sparkles,
    }
    return iconMap[iconName.toLowerCase()] || Sprout
  }

  // 最新消息卡片資料
  const newsCards = {
    seasonalRecommendation: {
      enabled: seasonalRecommendationEnabled?.value === 'true',
      title: seasonalRecommendationTitle?.value || '當季推薦',
      icon: seasonalRecommendationIcon?.value || 'sprout',
      description:
        seasonalRecommendationDescription?.value ||
        '春季特選紅肉李正在盛產中！果肉飽滿、甜度高，限量供應中',
      linkUrl: seasonalRecommendationLinkUrl?.value || '/products',
      linkText: seasonalRecommendationLinkText?.value || '查看產品 →',
    },
    farmActivity: {
      enabled: farmActivityEnabled?.value === 'true',
      title: farmActivityTitle?.value || '農場活動',
      icon: farmActivityIcon?.value || 'party-popper',
      description:
        farmActivityDescription?.value || '週末採果體驗活動熱烈報名中！帶孩子來體驗親手採摘的樂趣',
      linkUrl: farmActivityLinkUrl?.value || '/farm-tour',
      linkText: farmActivityLinkText?.value || '立即預約 →',
    },
  }

  // 視差滾動效果
  useEffect(() => {
    const handleScroll = () => {
      setScrollY(window.scrollY)
    }
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  // 背景圖輪播
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentSlide(prev => (prev + 1) % heroImages.length)
    }, 5000)
    return () => clearInterval(interval)
  }, [heroImages.length])

  // 滾動觸發動畫
  useEffect(() => {
    const observer = new IntersectionObserver(
      entries => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            setVisibleSections(prev => new Set(prev).add(entry.target.id))
          }
        })
      },
      { threshold: 0.1, rootMargin: '0px 0px -100px 0px' }
    )

    const sections = document.querySelectorAll('[data-animate]')
    sections.forEach(section => observer.observe(section))

    return () => observer.disconnect()
  }, [])

  return (
    <>
      <FarmStructuredData />
      <div className="min-h-screen -mt-[var(--header-height)]">
        {/* Hero Section with Parallax */}
        <section className="relative min-h-screen flex flex-col justify-center text-center pt-[var(--header-height)] overflow-hidden">
          {/* 背景圖輪播 */}
          {heroImages.map((image, index) => (
            <div
              key={image}
              className="absolute inset-0 transition-opacity duration-1000"
              style={{
                backgroundImage: `url(${image})`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                backgroundColor: '#1f2937',
                opacity: currentSlide === index ? 1 : 0,
                transform: `translateY(${scrollY * 0.5}px)`, // 視差效果
              }}
            />
          ))}

          {/* 遮罩確保文字可讀性 */}
          <div className="absolute inset-0 bg-black/40 z-10"></div>

          {/* Hero 內容 */}
          <div
            className="relative z-20 px-6"
            style={{
              transform: `translateY(${scrollY * 0.3}px)`, // 文字視差效果較慢
              opacity: Math.max(0, 1 - scrollY / 500), // 滾動時淡出
            }}
          >
            <h1 className="text-5xl md:text-7xl font-serif-display text-white mb-6 drop-shadow-lg animate-fade-in">
              豪茶德李
            </h1>
            <p className="text-lg md:text-xl text-white/95 mb-8 max-w-2xl mx-auto drop-shadow-md animate-fade-in animation-delay-300">
              座落梅山群峰的豪德農場，以自然農法呈現四季最美的農產滋味
            </p>

            {/* 滾動提示 */}
            <div className="absolute bottom-10 left-1/2 -translate-x-1/2 animate-bounce">
              <svg
                className="w-6 h-6 text-white/80"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 14l-7 7m0 0l-7-7m7 7V3"
                />
              </svg>
            </div>
          </div>

          {/* 輪播指示器 */}
          <div className="absolute bottom-20 left-1/2 -translate-x-1/2 z-20 flex gap-2">
            {heroImages.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentSlide(index)}
                className={`w-2 h-2 rounded-full transition-all duration-300 ${
                  currentSlide === index ? 'bg-white w-8' : 'bg-white/50 hover:bg-white/80'
                }`}
                aria-label={`切換到第 ${index + 1} 張圖片`}
              />
            ))}
          </div>
        </section>

        <section
          id="features"
          data-animate
          className="min-h-screen flex items-center py-20 px-6 bg-white dark:bg-slate-900"
        >
          <div className="max-w-7xl mx-auto">
            <h2
              className={`text-5xl md:text-6xl font-bold text-center text-green-900 dark:text-green-300 mb-6 tracking-wider ${
                visibleSections.has('features') ? 'animate-fade-in' : 'opacity-0'
              }`}
            >
              農場特色
            </h2>
            <p
              className={`text-center text-gray-600 dark:text-gray-300 text-lg mb-16 max-w-2xl mx-auto ${
                visibleSections.has('features')
                  ? 'animate-fade-in animation-delay-150'
                  : 'opacity-0'
              }`}
            >
              以自然農法為本，結合現代技術與傳統智慧，打造永續經營的生態農場
            </p>

            {/* 核心特色卡片 */}
            <div
              className={`grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-20 ${
                visibleSections.has('features')
                  ? 'animate-slide-up animation-delay-300'
                  : 'opacity-0'
              }`}
            >
              {[
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
              ].map((feature, index) => (
                <div
                  key={index}
                  className={`flip-card cursor-pointer ${activeFeature === index ? 'flipped' : ''}`}
                  onClick={() => setActiveFeature(activeFeature === index ? -1 : index)}
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  <div className="flip-card-inner">
                    {/* 正面 */}
                    <div
                      className={`flip-card-front ${feature.bgColor} rounded-2xl p-6 shadow-xl flex flex-col items-center justify-center text-center gradient-glow`}
                    >
                      <div className="mb-4">
                        <feature.Icon
                          className={`w-16 h-16 ${feature.iconColor}`}
                          strokeWidth={1.5}
                        />
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
                        featureCardImages[index]
                          ? {
                              backgroundImage: `url(${featureCardImages[index]})`,
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

            {/* 互動式季節體驗展示 */}
            <div
              className={`${
                visibleSections.has('features')
                  ? 'animate-slide-up animation-delay-450'
                  : 'opacity-0'
              }`}
            >
              <h3 className="text-3xl font-bold text-center text-green-900 dark:text-green-300 mb-8">
                四季體驗
              </h3>

              {/* 季節切換按鈕 */}
              <div className="flex justify-center gap-4 mb-10 flex-wrap">
                {[
                  { name: '春季賞花', Icon: Flower2, color: 'green' },
                  { name: '夏日採果', Icon: Apple, color: 'red' },
                  { name: '秋收體驗', Icon: Wheat, color: 'orange' },
                  { name: '冬日品茶', Icon: Coffee, color: 'green' },
                ].map((season, index) => (
                  <button
                    key={index}
                    onClick={() => setActiveSeason(index)}
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
                        {activeSeason === 0 && (
                          <Flower2 className="w-12 h-12 text-white" strokeWidth={1.5} />
                        )}
                        {activeSeason === 1 && (
                          <Apple className="w-12 h-12 text-white" strokeWidth={1.5} />
                        )}
                        {activeSeason === 2 && (
                          <Wheat className="w-12 h-12 text-white" strokeWidth={1.5} />
                        )}
                        {activeSeason === 3 && (
                          <Coffee className="w-12 h-12 text-white" strokeWidth={1.5} />
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-6">
                  <div className="glass-card rounded-2xl p-8 dark:bg-slate-800/50 dark:backdrop-blur-md">
                    <h4 className="text-2xl font-bold text-green-900 dark:text-green-300 mb-4">
                      {activeSeason === 0 && '春季賞花'}
                      {activeSeason === 1 && '夏日採果'}
                      {activeSeason === 2 && '秋收體驗'}
                      {activeSeason === 3 && '冬日品茶'}
                    </h4>
                    <p className="text-gray-700 dark:text-gray-300 mb-6 leading-relaxed">
                      {activeSeason === 0 &&
                        '春暖花開時節，農場百花齊放。漫步在花海之中，感受大自然的生命力。最佳賞花期：3-4月'}
                      {activeSeason === 1 &&
                        '盛夏時分，紅肉李、水蜜桃進入採收期。親手採摘新鮮水果，體驗豐收的喜悅。採果期：6-8月'}
                      {activeSeason === 2 &&
                        '秋高氣爽，是收穫的季節。參與採收活動，了解農作物從種植到收成的完整過程。體驗期：9-11月'}
                      {activeSeason === 3 &&
                        '冬季是品茶的最佳時節。在溫暖的茶室中，品味自家種植的高山茶，感受農場的寧靜之美。品茶期：12-2月'}
                    </p>
                    <ul className="space-y-3">
                      {activeSeason === 0 && (
                        <>
                          <li className="flex items-start gap-2">
                            <Check
                              className="w-5 h-5 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5"
                              strokeWidth={2.5}
                            />
                            <span className="text-gray-600 dark:text-gray-300">賞花導覽解說</span>
                          </li>
                          <li className="flex items-start gap-2">
                            <Check
                              className="w-5 h-5 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5"
                              strokeWidth={2.5}
                            />
                            <span className="text-gray-600 dark:text-gray-300">攝影景點推薦</span>
                          </li>
                          <li className="flex items-start gap-2">
                            <Check
                              className="w-5 h-5 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5"
                              strokeWidth={2.5}
                            />
                            <span className="text-gray-600 dark:text-gray-300">花卉知識介紹</span>
                          </li>
                        </>
                      )}
                      {activeSeason === 1 && (
                        <>
                          <li className="flex items-start gap-2">
                            <Check
                              className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5"
                              strokeWidth={2.5}
                            />
                            <span className="text-gray-600 dark:text-gray-300">專人採果教學</span>
                          </li>
                          <li className="flex items-start gap-2">
                            <Check
                              className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5"
                              strokeWidth={2.5}
                            />
                            <span className="text-gray-600 dark:text-gray-300">現場試吃品嚐</span>
                          </li>
                          <li className="flex items-start gap-2">
                            <Check
                              className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5"
                              strokeWidth={2.5}
                            />
                            <span className="text-gray-600 dark:text-gray-300">採果籃免費提供</span>
                          </li>
                        </>
                      )}
                      {activeSeason === 2 && (
                        <>
                          <li className="flex items-start gap-2">
                            <Check
                              className="w-5 h-5 text-orange-600 dark:text-orange-400 flex-shrink-0 mt-0.5"
                              strokeWidth={2.5}
                            />
                            <span className="text-gray-600 dark:text-gray-300">收成體驗活動</span>
                          </li>
                          <li className="flex items-start gap-2">
                            <Check
                              className="w-5 h-5 text-orange-600 dark:text-orange-400 flex-shrink-0 mt-0.5"
                              strokeWidth={2.5}
                            />
                            <span className="text-gray-600 dark:text-gray-300">農業知識講座</span>
                          </li>
                          <li className="flex items-start gap-2">
                            <Check
                              className="w-5 h-5 text-orange-600 dark:text-orange-400 flex-shrink-0 mt-0.5"
                              strokeWidth={2.5}
                            />
                            <span className="text-gray-600 dark:text-gray-300">
                              農產品 DIY 製作
                            </span>
                          </li>
                        </>
                      )}
                      {activeSeason === 3 && (
                        <>
                          <li className="flex items-start gap-2">
                            <Check
                              className="w-5 h-5 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5"
                              strokeWidth={2.5}
                            />
                            <span className="text-gray-600 dark:text-gray-300">茶道文化體驗</span>
                          </li>
                          <li className="flex items-start gap-2">
                            <Check
                              className="w-5 h-5 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5"
                              strokeWidth={2.5}
                            />
                            <span className="text-gray-600 dark:text-gray-300">品茶技巧教學</span>
                          </li>
                          <li className="flex items-start gap-2">
                            <Check
                              className="w-5 h-5 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5"
                              strokeWidth={2.5}
                            />
                            <span className="text-gray-600 dark:text-gray-300">茶葉製程介紹</span>
                          </li>
                        </>
                      )}
                    </ul>
                  </div>

                  <div className="text-center">
                    <Link
                      href="/farm-tour"
                      prefetch={true}
                      className="inline-flex items-center gap-2 bg-green-600 dark:bg-green-700 text-white px-10 py-4 rounded-full text-lg font-medium hover:bg-green-700 dark:hover:bg-green-800 transition-colors duration-300 shadow-lg hover:shadow-xl"
                    >
                      <span>預約參觀</span>
                      <svg
                        className="w-5 h-5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
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
          </div>
        </section>

        <ProductsSection />

        {/* 最新消息與季節活動 */}
        <section id="news" data-animate className="py-20 px-6 bg-gray-50 dark:bg-slate-800">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-12">
              <h2
                className={`text-4xl md:text-5xl font-bold text-green-900 dark:text-green-300 mb-4 ${
                  visibleSections.has('news') ? 'animate-fade-in' : 'opacity-0'
                }`}
              >
                最新消息
              </h2>
              <p
                className={`text-gray-600 dark:text-gray-300 text-lg ${
                  visibleSections.has('news') ? 'animate-fade-in animation-delay-150' : 'opacity-0'
                }`}
              >
                掌握農場最新動態與季節限定活動
              </p>
            </div>

            <div
              className={`grid md:grid-cols-2 gap-8 ${
                visibleSections.has('news') ? 'animate-slide-up animation-delay-300' : 'opacity-0'
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
                <h3 className="text-2xl font-bold text-blue-900 dark:text-blue-300 mb-4">
                  聯絡我們
                </h3>
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
      </div>
    </>
  )
}
