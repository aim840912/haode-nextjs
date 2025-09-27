'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { FarmStructuredData } from '@/components/features/seo/StructuredData'
import ProductsSection from '@/components/features/products/ProductsSection'
import OptimizedImage from '@/components/ui/image/OptimizedImage'
import {
  Sprout,
  ShieldCheck,
  Users,
  Recycle,
  Flower2,
  Apple,
  Wheat,
  Coffee,
  Calendar,
  CalendarDays,
  Phone,
  PartyPopper,
} from 'lucide-react'
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

          {/* 漸層遮罩確保文字可讀性 */}
          <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/30 to-black/60 z-10"></div>

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
          className="min-h-screen flex items-center py-20 px-6 bg-gradient-to-b from-white via-amber-50/50 to-white relative overflow-hidden"
        >
          {/* 背景裝飾元素 */}
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute top-20 left-10 w-64 h-64 bg-amber-200/20 rounded-full blur-3xl animate-float"></div>
            <div
              className="absolute bottom-20 right-10 w-96 h-96 bg-green-200/20 rounded-full blur-3xl animate-float"
              style={{ animationDelay: '1s' }}
            ></div>
          </div>

          <div className="max-w-7xl mx-auto relative z-10">
            <h2
              className={`text-5xl md:text-6xl font-bold text-center text-amber-900 mb-6 tracking-wider ${
                visibleSections.has('features') ? 'animate-fade-in' : 'opacity-0'
              }`}
            >
              農場特色
            </h2>
            <p
              className={`text-center text-gray-600 text-lg mb-16 max-w-2xl mx-auto ${
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
                  bgColor: 'bg-green-50',
                  iconColor: 'text-green-600',
                },
                {
                  Icon: ShieldCheck,
                  title: '品質認證',
                  desc: '嚴格品質把關',
                  color: 'from-blue-400 to-cyan-500',
                  bgColor: 'bg-blue-50',
                  iconColor: 'text-blue-600',
                },
                {
                  Icon: Users,
                  title: '農場體驗',
                  desc: '四季活動豐富',
                  color: 'from-amber-400 to-orange-500',
                  bgColor: 'bg-amber-50',
                  iconColor: 'text-amber-600',
                },
                {
                  Icon: Recycle,
                  title: '永續經營',
                  desc: '生態平衡共生',
                  color: 'from-purple-400 to-pink-500',
                  bgColor: 'bg-purple-50',
                  iconColor: 'text-purple-600',
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
                      <div
                        className="mb-4 animate-float"
                        style={{ animationDelay: `${index * 0.5}s` }}
                      >
                        <feature.Icon
                          className={`w-16 h-16 ${feature.iconColor}`}
                          strokeWidth={1.5}
                        />
                      </div>
                      <h3 className="text-2xl font-bold text-gray-800 mb-2">{feature.title}</h3>
                      <p className="text-gray-600">{feature.desc}</p>
                    </div>
                    {/* 背面 */}
                    <div
                      className={`flip-card-back glass-card rounded-2xl p-6 shadow-xl flex flex-col justify-center text-center bg-gradient-to-br ${feature.color}`}
                    >
                      <h3 className="text-xl font-bold text-white mb-3">{feature.title}</h3>
                      <p className="text-white/90 text-sm leading-relaxed">
                        {index === 0 &&
                          '傳承百年農業技術，不使用化學肥料與農藥，採用天然堆肥與生物防治'}
                        {index === 1 && '通過有機認證標準，每批產品都經過嚴格檢驗，確保安全無虞'}
                        {index === 2 && '春賞花、夏採果、秋收成、冬品茶，全年都有精彩活動等您參與'}
                        {index === 3 && '注重生態平衡，與自然和諧共存，為下一代保留美好環境'}
                      </p>
                    </div>
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
              <h3 className="text-3xl font-bold text-center text-amber-900 mb-8">四季體驗</h3>

              {/* 季節切換按鈕 */}
              <div className="flex justify-center gap-4 mb-10 flex-wrap">
                {[
                  { name: '春季賞花', Icon: Flower2, color: 'green' },
                  { name: '夏日採果', Icon: Apple, color: 'red' },
                  { name: '秋收體驗', Icon: Wheat, color: 'orange' },
                  { name: '冬日品茶', Icon: Coffee, color: 'amber' },
                ].map((season, index) => (
                  <button
                    key={index}
                    onClick={() => setActiveSeason(index)}
                    className={`flex items-center gap-2 px-6 py-3 rounded-full font-medium transition-all duration-300 ${
                      activeSeason === index
                        ? `bg-${season.color}-600 text-white shadow-lg scale-110 animate-pulse-glow`
                        : `bg-white text-gray-700 hover:bg-${season.color}-50 border border-${season.color}-200`
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
                      backgroundImage: `url(${
                        activeSeason === 0
                          ? '/images/locations/mountain.jpg'
                          : activeSeason === 1
                            ? '/images/farm-tour/many_people_1.jpg'
                            : activeSeason === 2
                              ? '/images/locations/mountain.jpg'
                              : '/images/farm-tour/many_people_1.jpg'
                      })`,
                      backgroundSize: 'cover',
                      backgroundPosition: 'center',
                    }}
                  >
                    <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent"></div>
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
                  <div className="glass-card rounded-2xl p-8">
                    <h4 className="text-2xl font-bold text-amber-900 mb-4">
                      {activeSeason === 0 && '春季賞花'}
                      {activeSeason === 1 && '夏日採果'}
                      {activeSeason === 2 && '秋收體驗'}
                      {activeSeason === 3 && '冬日品茶'}
                    </h4>
                    <p className="text-gray-700 mb-6 leading-relaxed">
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
                          <li className="flex items-start">
                            <span className="text-green-500 mr-2">✓</span>
                            <span className="text-gray-600">賞花導覽解說</span>
                          </li>
                          <li className="flex items-start">
                            <span className="text-green-500 mr-2">✓</span>
                            <span className="text-gray-600">攝影景點推薦</span>
                          </li>
                          <li className="flex items-start">
                            <span className="text-green-500 mr-2">✓</span>
                            <span className="text-gray-600">花卉知識介紹</span>
                          </li>
                        </>
                      )}
                      {activeSeason === 1 && (
                        <>
                          <li className="flex items-start">
                            <span className="text-red-500 mr-2">✓</span>
                            <span className="text-gray-600">專人採果教學</span>
                          </li>
                          <li className="flex items-start">
                            <span className="text-red-500 mr-2">✓</span>
                            <span className="text-gray-600">現場試吃品嚐</span>
                          </li>
                          <li className="flex items-start">
                            <span className="text-red-500 mr-2">✓</span>
                            <span className="text-gray-600">採果籃免費提供</span>
                          </li>
                        </>
                      )}
                      {activeSeason === 2 && (
                        <>
                          <li className="flex items-start">
                            <span className="text-orange-500 mr-2">✓</span>
                            <span className="text-gray-600">收成體驗活動</span>
                          </li>
                          <li className="flex items-start">
                            <span className="text-orange-500 mr-2">✓</span>
                            <span className="text-gray-600">農業知識講座</span>
                          </li>
                          <li className="flex items-start">
                            <span className="text-orange-500 mr-2">✓</span>
                            <span className="text-gray-600">農產品 DIY 製作</span>
                          </li>
                        </>
                      )}
                      {activeSeason === 3 && (
                        <>
                          <li className="flex items-start">
                            <span className="text-amber-500 mr-2">✓</span>
                            <span className="text-gray-600">茶道文化體驗</span>
                          </li>
                          <li className="flex items-start">
                            <span className="text-amber-500 mr-2">✓</span>
                            <span className="text-gray-600">品茶技巧教學</span>
                          </li>
                          <li className="flex items-start">
                            <span className="text-amber-500 mr-2">✓</span>
                            <span className="text-gray-600">茶葉製程介紹</span>
                          </li>
                        </>
                      )}
                    </ul>
                  </div>

                  <div className="text-center">
                    <Link
                      href="/farm-tour"
                      prefetch={true}
                      className="inline-flex items-center gap-2 bg-gradient-to-r from-green-600 to-green-700 text-white px-10 py-4 rounded-full text-lg font-medium hover:from-green-700 hover:to-green-800 transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-105"
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
        <section
          id="news"
          data-animate
          className="py-20 px-6 bg-gradient-to-b from-gray-50 to-white"
        >
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-12">
              <h2
                className={`text-4xl md:text-5xl font-bold text-amber-900 mb-4 ${
                  visibleSections.has('news') ? 'animate-fade-in' : 'opacity-0'
                }`}
              >
                最新消息
              </h2>
              <p
                className={`text-gray-600 text-lg ${
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
              <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-2xl p-8 hover:shadow-xl transition-all duration-300">
                <div className="flex items-center mb-4">
                  <Sprout className="w-10 h-10 mr-3 text-green-600" strokeWidth={2} />
                  <h3 className="text-2xl font-bold text-green-900">當季推薦</h3>
                </div>
                <p className="text-green-800 mb-6 text-lg">
                  春季特選紅肉李正在盛產中！果肉飽滿、甜度高，限量供應中
                </p>
                <Link
                  href="/products"
                  className="inline-flex items-center text-green-700 hover:text-green-900 font-medium"
                >
                  查看產品 →
                </Link>
              </div>

              {/* 農場活動 */}
              <div className="bg-gradient-to-br from-amber-50 to-amber-100 rounded-2xl p-8 hover:shadow-xl transition-all duration-300">
                <div className="flex items-center mb-4">
                  <PartyPopper className="w-10 h-10 mr-3 text-amber-600" strokeWidth={2} />
                  <h3 className="text-2xl font-bold text-amber-900">農場活動</h3>
                </div>
                <p className="text-amber-800 mb-6 text-lg">
                  週末採果體驗活動熱烈報名中！帶孩子來體驗親手採摘的樂趣
                </p>
                <Link
                  href="/farm-tour"
                  className="inline-flex items-center text-amber-700 hover:text-amber-900 font-medium"
                >
                  立即預約 →
                </Link>
              </div>

              {/* 擺攤行程預告 */}
              <div className="bg-gradient-to-r from-purple-600 to-pink-600 rounded-2xl p-8 text-white text-center hover:shadow-xl transition-all duration-300">
                <div className="flex justify-center mb-4">
                  <CalendarDays className="w-12 h-12 text-white" strokeWidth={2} />
                </div>
                <h3 className="text-2xl font-bold mb-4">下次市集擺攤</h3>
                <div className="text-3xl font-bold mb-2">本週六 08:00-12:00</div>
                <p className="text-white/90 mb-6">台中勤美誠品綠園道</p>
                <Link
                  href="/schedule"
                  className="inline-block bg-white text-purple-600 px-8 py-3 rounded-full font-semibold hover:bg-purple-50 transition-colors"
                >
                  查看完整行程
                </Link>
              </div>

              {/* 聯絡我們 */}
              <div className="bg-gradient-to-br from-blue-50 to-cyan-100 rounded-2xl p-8 text-center hover:shadow-xl transition-all duration-300">
                <div className="flex justify-center mb-4">
                  <Phone className="w-12 h-12 text-blue-600" strokeWidth={2} />
                </div>
                <h3 className="text-2xl font-bold text-blue-900 mb-4">聯絡我們</h3>
                <p className="text-blue-800 mb-6 text-lg">有任何問題或需求，歡迎隨時與我們聯繫</p>
                <Link
                  href="/contact"
                  prefetch={true}
                  className="inline-block bg-gradient-to-r from-blue-600 to-cyan-600 text-white px-8 py-3 rounded-full font-semibold hover:from-blue-700 hover:to-cyan-700 transition-colors shadow-md hover:shadow-lg"
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
