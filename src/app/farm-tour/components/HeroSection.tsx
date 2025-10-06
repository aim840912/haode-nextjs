/**
 * HeroSection 元件
 *
 * 顯示農場果園的 Hero 區塊，包含：
 * - 背景圖片
 * - 標題與副標題
 * - 今日瀏覽統計
 * - CTA 按鈕
 * - 管理員操作按鈕
 */

import { Leaf, Sparkles } from 'lucide-react'

interface HeroSectionProps {
  /** 背景圖片 URL */
  heroBackground: string
  /** 點擊「季節體驗活動」按鈕的處理函數 */
  onActivityClick: () => void
  /** 是否為管理員 */
  isAdmin?: boolean
}

export function HeroSection({
  heroBackground,
  onActivityClick,
  isAdmin = false,
}: HeroSectionProps) {
  return (
    <section
      className="relative min-h-screen flex flex-col justify-center text-center pt-[var(--header-height)] overflow-hidden"
      style={{
        backgroundImage: `url(${heroBackground})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundColor: '#1f2937',
      }}
    >
      {/* 漸層遮罩確保文字可讀性 */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-black/40 to-black/70 z-10"></div>

      {/* 裝飾性浮動元素 */}
      <div className="absolute inset-0 z-10 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-32 h-32 bg-green-400/10 rounded-full blur-3xl animate-pulse"></div>
        <div
          className="absolute bottom-20 right-10 w-40 h-40 bg-amber-400/10 rounded-full blur-3xl animate-pulse"
          style={{ animationDelay: '1s' }}
        ></div>
      </div>

      {/* Hero 內容 */}
      <div className="relative z-20 px-6">
        <div className="text-center max-w-7xl mx-auto mb-8">
          <h1 className="text-6xl md:text-8xl font-light text-white mb-6 drop-shadow-2xl">
            豪德觀光果園
          </h1>
          <p className="text-xl md:text-3xl text-white/95 max-w-3xl mx-auto drop-shadow-lg mb-4 font-light flex items-center justify-center gap-3">
            <Leaf className="w-8 h-8" />
            走進山間果園，體驗四季農情
          </p>
          <p className="text-lg md:text-xl text-amber-300 font-medium drop-shadow-md flex items-center justify-center gap-2">
            <Sparkles className="w-5 h-5" />
            季節限定體驗・親子同樂首選・嘉義梅山秘境
          </p>
        </div>

        <div className="flex flex-col items-center gap-6">
          <div className="flex flex-col md:flex-row gap-4 justify-center">
            <button
              onClick={onActivityClick}
              className="bg-white/90 backdrop-blur-sm text-amber-900 border-2 border-white/50 px-8 py-4 rounded-full hover:bg-white/95 transition-all duration-300 font-medium shadow-lg hover:shadow-xl"
            >
              季節體驗活動
            </button>
          </div>

          {/* Management Buttons */}
          {isAdmin && (
            <div className="flex flex-col md:flex-row gap-3">
              <a
                href="/admin/farm-tour"
                className="px-6 py-3 bg-white/90 backdrop-blur-sm text-green-700 border-2 border-white/50 rounded-full text-sm hover:bg-white/95 transition-all duration-300 shadow-lg hover:shadow-xl font-medium"
              >
                果園管理
              </a>
              <a
                href="/admin/farm-tour/add"
                className="px-6 py-3 bg-white/90 backdrop-blur-sm text-amber-700 border-2 border-white/50 rounded-full text-sm hover:bg-white/95 transition-all duration-300 shadow-lg hover:shadow-xl font-medium"
              >
                新增體驗
              </a>
            </div>
          )}
        </div>
      </div>
    </section>
  )
}
