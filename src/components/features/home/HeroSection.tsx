'use client'

interface HeroSectionProps {
  images: string[]
  scrollY: number
  currentSlide: number
  onSlideChange: (index: number) => void
}

export function HeroSection({ images, scrollY, currentSlide, onSlideChange }: HeroSectionProps) {
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
          座落梅山群峰的豪德農場,以自然農法呈現四季最美的農產滋味
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
        {images.map((_, index) => (
          <button
            key={index}
            onClick={() => onSlideChange(index)}
            className={`w-2 h-2 rounded-full transition-all duration-300 ${
              currentSlide === index ? 'bg-white w-8' : 'bg-white/50 hover:bg-white/80'
            }`}
            aria-label={`切換到第 ${index + 1} 張圖片`}
          />
        ))}
      </div>
    </section>
  )
}
