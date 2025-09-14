import Link from 'next/link'
import { FarmStructuredData } from '@/components/StructuredData'
import ProductsSection from '@/components/ProductsSection'

export default function Home() {
  return (
    <>
      <FarmStructuredData />
      <div className="min-h-screen bg-gradient-to-b from-amber-50 to-white -mt-[var(--header-height)]">
        <section className="relative min-h-screen flex flex-col justify-center text-center pt-[var(--header-height)]">
          <h1 className="text-5xl md:text-7xl font-serif-display text-amber-900 mb-6">豪茶德李</h1>
          <p className="text-lg md:text-xl text-gray-700 mb-8 max-w-2xl mx-auto">
            座落梅山群峰的豪德農場，以自然農法呈現四季最美的農產滋味
          </p>
          <div className="flex justify-center space-x-4">
            <Link
              href="/products"
              prefetch={true}
              className="bg-amber-900 text-white px-6 py-3 rounded-full hover:bg-amber-800 transition-colors"
            >
              探索農產品
            </Link>
            <Link
              href="/farm-tour"
              prefetch={true}
              className="bg-white text-amber-900 border-2 border-amber-900 px-6 py-3 rounded-full hover:bg-amber-50 transition-colors"
            >
              預約參觀
            </Link>
          </div>
        </section>

        <section className="min-h-screen flex items-center py-16 px-6">
          <div className="max-w-6xl mx-auto">
            <h2 className="text-5xl md:text-6xl font-bold text-center text-amber-900 mb-16 tracking-wider">
              農場特色
            </h2>
            <div className="grid md:grid-cols-2 gap-12">
              <div>
                <h3 className="text-xl font-semibold text-amber-800 mb-4">自然農法</h3>
                <p className="text-gray-600 mb-6">
                  傳承百年農業技術，以有機無毒的方式種植優質紅肉李、四季水果及精品茶葉。
                </p>
                <ul className="space-y-2 text-gray-600">
                  <li>• 不使用化學農藥及化學肥料</li>
                  <li>• 采用天然堆肥及生物防治</li>
                  <li>• 嚴格品質監控與檢驗</li>
                </ul>
              </div>
              <div>
                <h3 className="text-xl font-semibold text-amber-800 mb-4">觀光體驗</h3>
                <p className="text-gray-600 mb-6">
                  提供四季不同的農場體驗活動，讓您親身感受農業之美。
                </p>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="text-center p-3 bg-green-50 rounded-lg">
                    <div className="text-2xl mb-2">🌸</div>
                    <div className="font-medium text-gray-800">春季賞花</div>
                  </div>
                  <div className="text-center p-3 bg-red-50 rounded-lg">
                    <div className="text-2xl mb-2">🍑</div>
                    <div className="font-medium text-gray-800">夏日採果</div>
                  </div>
                  <div className="text-center p-3 bg-orange-50 rounded-lg">
                    <div className="text-2xl mb-2">🍎</div>
                    <div className="font-medium text-gray-800">秋收體驗</div>
                  </div>
                  <div className="text-center p-3 bg-brown-50 rounded-lg">
                    <div className="text-2xl mb-2">🍵</div>
                    <div className="font-medium text-gray-800">冬日品茶</div>
                  </div>
                </div>
                <div className="mt-6 text-center">
                  <Link
                    href="/farm-tour"
                    prefetch={true}
                    className="inline-block bg-green-600 text-white px-6 py-2 rounded-full text-sm hover:bg-green-700 transition-colors"
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
