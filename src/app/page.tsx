'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { FarmStructuredData } from '@/components/features/seo/StructuredData'
import ProductsSection from '@/components/features/products/ProductsSection'
import OptimizedImage from '@/components/ui/image/OptimizedImage'

export default function Home() {
  const [scrollY, setScrollY] = useState(0)
  const [currentSlide, setCurrentSlide] = useState(0)
  const [visibleSections, setVisibleSections] = useState<Set<string>>(new Set())

  // Hero 背景圖輪播
  const heroImages = [
    '/images/hero/scene1.jpg',
    '/images/locations/mountain.jpg',
    '/images/farm-tour/many_people_1.jpg',
  ]

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
    }, 5000) // 每 5 秒切換
    return () => clearInterval(interval)
  }, [])

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
          className="min-h-screen flex items-center py-16 px-6 bg-gradient-to-b from-white to-amber-50"
        >
          <div className="max-w-6xl mx-auto">
            <h2
              className={`text-5xl md:text-6xl font-bold text-center text-amber-900 mb-16 tracking-wider ${
                visibleSections.has('features') ? 'animate-fade-in' : 'opacity-0'
              }`}
            >
              農場特色
            </h2>

            {/* 自然農法區塊 */}
            <div
              className={`grid lg:grid-cols-2 gap-12 mb-20 ${
                visibleSections.has('features')
                  ? 'animate-slide-up animation-delay-300'
                  : 'opacity-0'
              }`}
            >
              <div className="order-2 lg:order-1">
                <h3 className="text-2xl font-semibold text-amber-800 mb-6">自然農法</h3>
                <p className="text-gray-700 mb-6 text-lg leading-relaxed">
                  傳承百年農業技術，以有機無毒的方式種植優質紅肉李、四季水果及精品茶葉。
                </p>
                <ul className="space-y-3 text-gray-600">
                  <li className="flex items-center">
                    <span className="w-2 h-2 bg-green-500 rounded-full mr-3"></span>
                    不使用化學農藥及化學肥料
                  </li>
                  <li className="flex items-center">
                    <span className="w-2 h-2 bg-green-500 rounded-full mr-3"></span>
                    采用天然堆肥及生物防治
                  </li>
                  <li className="flex items-center">
                    <span className="w-2 h-2 bg-green-500 rounded-full mr-3"></span>
                    嚴格品質監控與檢驗
                  </li>
                </ul>
              </div>
              <div className="order-1 lg:order-2 relative">
                <div
                  className="relative aspect-[4/3] rounded-2xl overflow-hidden shadow-2xl hover:scale-105 transition-transform duration-500"
                  style={{
                    backgroundImage: 'url(/images/locations/mountain.jpg)',
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                  }}
                >
                  <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent"></div>
                </div>
              </div>
            </div>

            {/* 觀光體驗區塊 */}
            <div
              className={`grid lg:grid-cols-2 gap-12 ${
                visibleSections.has('features')
                  ? 'animate-slide-up animation-delay-450'
                  : 'opacity-0'
              }`}
            >
              <div className="relative">
                <div
                  className="relative aspect-[4/3] rounded-2xl overflow-hidden shadow-2xl hover:scale-105 transition-transform duration-500"
                  style={{
                    backgroundImage: 'url(/images/farm-tour/many_people_1.jpg)',
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                  }}
                >
                  <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent"></div>
                </div>
              </div>
              <div>
                <h3 className="text-2xl font-semibold text-amber-800 mb-6">觀光體驗</h3>
                <p className="text-gray-700 mb-6 text-lg leading-relaxed">
                  提供四季不同的農場體驗活動，讓您親身感受農業之美。
                </p>
                <div className="grid grid-cols-2 gap-4 text-sm mb-6">
                  {/* 春季賞花 */}
                  <div className="relative overflow-hidden rounded-xl border border-green-200 hover:shadow-lg transition-all duration-300 group">
                    <div className="absolute inset-0">
                      <OptimizedImage
                        src="/images/icons/spring-bg.svg"
                        alt="春季賞花背景"
                        fill
                        lazy
                        sizes="(max-width: 768px) 50vw, 25vw"
                        className="object-cover opacity-20 group-hover:opacity-30 transition-opacity"
                      />
                    </div>
                    <div className="relative z-10 text-center p-4 bg-gradient-to-br from-green-50/80 to-green-100/80 backdrop-blur-sm">
                      <div className="text-3xl mb-2">🌸</div>
                      <div className="font-medium text-gray-800">春季賞花</div>
                    </div>
                  </div>

                  {/* 夏日採果 */}
                  <div className="relative overflow-hidden rounded-xl border border-red-200 hover:shadow-lg transition-all duration-300 group">
                    <div className="absolute inset-0">
                      <OptimizedImage
                        src="/images/icons/summer-bg.svg"
                        alt="夏日採果背景"
                        fill
                        lazy
                        sizes="(max-width: 768px) 50vw, 25vw"
                        className="object-cover opacity-20 group-hover:opacity-30 transition-opacity"
                      />
                    </div>
                    <div className="relative z-10 text-center p-4 bg-gradient-to-br from-red-50/80 to-red-100/80 backdrop-blur-sm">
                      <div className="text-3xl mb-2">🍑</div>
                      <div className="font-medium text-gray-800">夏日採果</div>
                    </div>
                  </div>

                  {/* 秋收體驗 */}
                  <div className="relative overflow-hidden rounded-xl border border-orange-200 hover:shadow-lg transition-all duration-300 group">
                    <div className="absolute inset-0">
                      <OptimizedImage
                        src="/images/icons/autumn-bg.svg"
                        alt="秋收體驗背景"
                        fill
                        lazy
                        sizes="(max-width: 768px) 50vw, 25vw"
                        className="object-cover opacity-20 group-hover:opacity-30 transition-opacity"
                      />
                    </div>
                    <div className="relative z-10 text-center p-4 bg-gradient-to-br from-orange-50/80 to-orange-100/80 backdrop-blur-sm">
                      <div className="text-3xl mb-2">🍎</div>
                      <div className="font-medium text-gray-800">秋收體驗</div>
                    </div>
                  </div>

                  {/* 冬日品茶 */}
                  <div className="relative overflow-hidden rounded-xl border border-amber-200 hover:shadow-lg transition-all duration-300 group">
                    <div className="absolute inset-0">
                      <OptimizedImage
                        src="/images/icons/winter-bg.svg"
                        alt="冬日品茶背景"
                        fill
                        lazy
                        sizes="(max-width: 768px) 50vw, 25vw"
                        className="object-cover opacity-20 group-hover:opacity-30 transition-opacity"
                      />
                    </div>
                    <div className="relative z-10 text-center p-4 bg-gradient-to-br from-amber-50/80 to-amber-100/80 backdrop-blur-sm">
                      <div className="text-3xl mb-2">🍵</div>
                      <div className="font-medium text-gray-800">冬日品茶</div>
                    </div>
                  </div>
                </div>
                <div className="text-center">
                  <Link
                    href="/farm-tour"
                    prefetch={true}
                    className="inline-block bg-gradient-to-r from-green-600 to-green-700 text-white px-8 py-3 rounded-full text-base font-medium hover:from-green-700 hover:to-green-800 transition-all duration-300 shadow-lg hover:shadow-xl"
                  >
                    預約參觀
                  </Link>
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
              className={`grid md:grid-cols-2 gap-8 mb-12 ${
                visibleSections.has('news') ? 'animate-slide-up animation-delay-300' : 'opacity-0'
              }`}
            >
              {/* 當季推薦 */}
              <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-2xl p-8 hover:shadow-xl transition-all duration-300">
                <div className="flex items-center mb-4">
                  <span className="text-3xl mr-3">🌱</span>
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
                  <span className="text-3xl mr-3">🎉</span>
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
            </div>

            {/* 擺攤行程預告 */}
            <div
              className={`bg-gradient-to-r from-purple-600 to-pink-600 rounded-2xl p-8 text-white text-center ${
                visibleSections.has('news') ? 'animate-scale-in animation-delay-450' : 'opacity-0'
              }`}
            >
              <div className="text-4xl mb-4">📅</div>
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
          </div>
        </section>

        {/* 快速連結區 */}
        <section className="py-12 px-6 bg-amber-50">
          <div className="max-w-4xl mx-auto">
            <div className="grid md:grid-cols-2 gap-6 text-center">
              <div className="bg-white rounded-lg p-6 shadow-md">
                <h3 className="text-lg font-semibold text-amber-900 mb-3">擺攤行程</h3>
                <p className="text-gray-600 text-sm mb-4">查看我們的市集攤位時間表</p>
                <Link
                  href="/schedule"
                  prefetch={true}
                  className="text-amber-900 hover:underline text-sm"
                >
                  查看行程 →
                </Link>
              </div>
              <div className="bg-white rounded-lg p-6 shadow-md">
                <h3 className="text-lg font-semibold text-amber-900 mb-3">聯絡我們</h3>
                <p className="text-gray-600 text-sm mb-4">有任何問題歡迎與我們聯繫</p>
                <Link
                  href="/contact"
                  prefetch={true}
                  className="text-amber-900 hover:underline text-sm"
                >
                  立即聯絡 →
                </Link>
              </div>
            </div>
          </div>
        </section>
      </div>
    </>
  )
}
