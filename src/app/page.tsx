import Link from 'next/link'
import { FarmStructuredData } from '@/components/features/seo/StructuredData'
import ProductsSection from '@/components/features/products/ProductsSection'
import OptimizedImage from '@/components/ui/image/OptimizedImage'

export default function Home() {
  return (
    <>
      <FarmStructuredData />
      <div className="min-h-screen -mt-[var(--header-height)]">
        <section
          className="relative min-h-screen flex flex-col justify-center text-center pt-[var(--header-height)] overflow-hidden"
          style={{
            backgroundImage: 'url(/images/hero/scene1.jpg)',
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            backgroundColor: '#1f2937',
          }}
        >
          {/* 漸層遮罩確保文字可讀性 */}
          <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/30 to-black/60 z-10"></div>

          {/* Hero 內容 */}
          <div className="relative z-20 px-6">
            <h1 className="text-5xl md:text-7xl font-serif-display text-white mb-6 drop-shadow-lg">
              豪茶德李
            </h1>
            <p className="text-lg md:text-xl text-white/95 mb-8 max-w-2xl mx-auto drop-shadow-md">
              座落梅山群峰的豪德農場，以自然農法呈現四季最美的農產滋味
            </p>
            <div className="flex flex-col sm:flex-row justify-center gap-4 max-w-md mx-auto">
              <Link
                href="/products"
                prefetch={true}
                className="bg-amber-900/90 backdrop-blur-sm text-white px-8 py-4 rounded-full hover:bg-amber-800/90 transition-all duration-300 font-medium shadow-lg hover:shadow-xl"
              >
                探索農產品
              </Link>
              <Link
                href="/farm-tour"
                prefetch={true}
                className="bg-white/90 backdrop-blur-sm text-amber-900 border-2 border-white/50 px-8 py-4 rounded-full hover:bg-white/95 transition-all duration-300 font-medium shadow-lg hover:shadow-xl"
              >
                預約參觀
              </Link>
            </div>
          </div>
        </section>

        <section className="min-h-screen flex items-center py-16 px-6 bg-gradient-to-b from-white to-amber-50">
          <div className="max-w-6xl mx-auto">
            <h2 className="text-5xl md:text-6xl font-bold text-center text-amber-900 mb-16 tracking-wider">
              農場特色
            </h2>

            {/* 自然農法區塊 */}
            <div className="grid lg:grid-cols-2 gap-12 mb-20">
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
            <div className="grid lg:grid-cols-2 gap-12">
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
                <div className="text-center lg:text-left">
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
