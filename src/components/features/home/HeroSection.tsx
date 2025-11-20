'use client'

import { useEffect, useState } from 'react'

interface HeroSectionProps {
  images: string[]
  scrollY: number
  currentSlide: number
  onSlideChange: (index: number) => void
}

export function HeroSection({ images, scrollY, currentSlide, onSlideChange }: HeroSectionProps) {
  const [progress, setProgress] = useState(0)

  // 進度條動畫 - 每 5 秒切換一張
  useEffect(() => {
    const interval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) {
          return 0
        }
        return prev + 2
      })
    }, 100)

    return () => clearInterval(interval)
  }, [currentSlide])

  // 當進度達到 100% 時自動切換
  useEffect(() => {
    if (progress >= 100) {
      const nextSlide = (currentSlide + 1) % images.length
      onSlideChange(nextSlide)
      setProgress(0)
    }
  }, [progress, currentSlide, images.length, onSlideChange])

  return (
    <section className="relative min-h-screen flex flex-col justify-center text-center pt-[var(--header-height)] overflow-hidden">
      {/* 背景圖輪播 */}
      {images.map((image, index) => (
        <div
          key={image}
          className="absolute inset-0 transition-opacity duration-1000"
          style={{
            backgroundImage: `url(${image})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            backgroundColor: '#3e2723',
            opacity: currentSlide === index ? 1 : 0,
            transform: `translateY(${scrollY * 0.3}px)`,
          }}
        />
      ))}

      {/* 遮罩確保文字可讀性 */}
      <div className="absolute inset-0 bg-black/40 z-10"></div>

      {/* Hero 內容 */}
      <div
        className="relative z-20 px-6"
        style={{
          transform: `translateY(${scrollY * 0.2}px)`,
          opacity: Math.max(0, 1 - scrollY / 600),
        }}
      >
        {/* 品牌副標 */}
        <p className="text-sm md:text-base text-white/80 mb-4 tracking-[0.3em] uppercase animate-fade-in">
          高山茶專賣店
        </p>

        {/* 主標題 */}
        <h1 className="text-5xl md:text-7xl lg:text-8xl font-serif-display text-white mb-6 drop-shadow-lg animate-fade-in">
          豪德製茶
        </h1>

        {/* Slogan */}
        <p className="text-lg md:text-2xl text-white/95 mb-10 max-w-3xl mx-auto drop-shadow-md animate-fade-in animation-delay-300 leading-relaxed">
          簡單一杯茶，不簡單的百年傳承
          <br />
          <span className="text-base md:text-lg text-white/80">
            座落梅山群峰，以自然農法呈現四季最美的農產滋味
          </span>
        </p>

        {/* CTA 按鈕 */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center animate-fade-in animation-delay-450">
          <a
            href="/products"
            className="inline-block bg-[#d35400] hover:bg-[#e67e22] text-white px-8 py-4 rounded-full text-lg font-medium transition-all duration-300 shadow-lg hover:shadow-xl hover:-translate-y-1"
          >
            探索產品
          </a>
          <a
            href="/farm-tour"
            className="inline-block bg-white/20 hover:bg-white/30 backdrop-blur-sm text-white px-8 py-4 rounded-full text-lg font-medium transition-all duration-300 border border-white/50"
          >
            預約參觀
          </a>
        </div>
      </div>

      {/* 輪播控制區 - 底部進度條 */}
      <div className="absolute bottom-0 left-0 right-0 z-20">
        {/* 進度條 */}
        <div className="flex">
          {images.map((_, index) => (
            <button
              key={index}
              onClick={() => {
                onSlideChange(index)
                setProgress(0)
              }}
              className="flex-1 h-1 bg-white/30 relative overflow-hidden"
              aria-label={`切換到第 ${index + 1} 張圖片`}
            >
              <div
                className="absolute inset-y-0 left-0 bg-[#d35400] transition-all duration-100"
                style={{
                  width: currentSlide === index ? `${progress}%` : '0%',
                }}
              />
            </button>
          ))}
        </div>

        {/* 左右箭頭導航 */}
        <div className="absolute bottom-8 right-8 flex gap-2">
          <button
            onClick={() => {
              const prevSlide = (currentSlide - 1 + images.length) % images.length
              onSlideChange(prevSlide)
              setProgress(0)
            }}
            className="w-10 h-10 flex items-center justify-center bg-white/20 hover:bg-white/30 backdrop-blur-sm rounded-full text-white transition-colors"
            aria-label="上一張"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 19l-7-7 7-7"
              />
            </svg>
          </button>
          <button
            onClick={() => {
              const nextSlide = (currentSlide + 1) % images.length
              onSlideChange(nextSlide)
              setProgress(0)
            }}
            className="w-10 h-10 flex items-center justify-center bg-white/20 hover:bg-white/30 backdrop-blur-sm rounded-full text-white transition-colors"
            aria-label="下一張"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      </div>
    </section>
  )
}
