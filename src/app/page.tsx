'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import ProductsSection from '@/components/ProductsSection'
import CustomerReviews from '@/components/CustomerReviews'
import SocialLinks from '@/components/SocialLinks'
import VisitorCounter from '@/components/VisitorCounter'
import OptimizedImage from '@/components/OptimizedImage'
import { FarmStructuredData } from '@/components/StructuredData'

export default function Home() {
  // 可用的圖片池
  const farmImages = [
    '/images/culture/fruit.jpg',
    '/images/culture/tea.jpg',
    '/images/culture/mountain.jpg',
    '/images/culture/red_plum_1.jpg',
    '/images/culture/red_plum_2.jpg',
    '/images/culture/scene1.jpg',
    '/images/culture/scene2.jpg',
    '/images/culture/intro.jpg'
  ]

  const [featureImages, setFeatureImages] = useState<string[]>([])

  // 隨機選擇三張不同的圖片
  useEffect(() => {
    const getRandomImages = () => {
      const shuffled = [...farmImages].sort(() => 0.5 - Math.random())
      return shuffled.slice(0, 3)
    }
    setFeatureImages(getRandomImages())
  }, [])
  return (
    <>
      <FarmStructuredData />
      <div className="min-h-screen bg-gradient-to-b from-amber-50 to-white">

      <main className="pt-36 lg:pt-24">
        <section className="relative h-screen flex items-center justify-center bg-gradient-to-r from-amber-100 via-orange-50 to-yellow-50">
          <div className="text-center relative z-1">
            <h1 className="text-6xl md:text-8xl font-serif-display text-amber-900 mb-6">
              果香四季
            </h1>
            <p className="text-xl md:text-2xl font-body text-gray-700 mb-8 max-w-3xl mx-auto">
              春花夏果秋實冬茶，座落梅山群峰的豪德農場，以自然農法呈現四季最美的農產滋味
            </p>
          </div>
          <div className="absolute inset-0 opacity-30">
            <img 
              src="/images/backgrounds/hero-overlay.svg" 
              alt="Background overlay" 
              className="w-full h-full object-cover"
            />
          </div>
        </section>

        <section id="exploration" className="py-20 px-6">
          <div className="max-w-7xl mx-auto">
            <h2 className="text-3xl md:text-4xl font-heading text-center text-amber-900 mb-16">農場特色</h2>
            <div className="grid md:grid-cols-3 gap-12">
              <div className="text-center">
                <div className="w-32 h-32 rounded-full mx-auto mb-6 overflow-hidden relative shadow-lg">
                  {featureImages[0] && (
                    <OptimizedImage 
                      src={featureImages[0]} 
                      alt="精選農產"
                      width={128}
                      height={128}
                      className="object-cover hover:scale-110 transition-transform duration-300"
                      sizes="128px"
                    />
                  )}
                  {!featureImages[0] && (
                    <div className="w-full h-full bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center">
                      <span className="text-3xl text-white">🍃</span>
                    </div>
                  )}
                </div>
                <h3 className="text-xl font-heading mb-4 text-gray-800">精選農產</h3>
                <p className="font-body text-gray-600">嚴選來自山區高地的優質紅肉李及各季節農產品</p>
              </div>
              <div className="text-center">
                <div className="w-32 h-32 rounded-full mx-auto mb-6 overflow-hidden relative shadow-lg">
                  {featureImages[1] && (
                    <OptimizedImage 
                      src={featureImages[1]} 
                      alt="傳統農法"
                      width={128}
                      height={128}
                      className="object-cover hover:scale-110 transition-transform duration-300"
                      sizes="128px"
                    />
                  )}
                  {!featureImages[1] && (
                    <div className="w-full h-full bg-gradient-to-br from-green-400 to-green-600 flex items-center justify-center">
                      <span className="text-3xl text-white">🏮</span>
                    </div>
                  )}
                </div>
                <h3 className="text-xl font-heading mb-4 text-gray-800">傳統農法</h3>
                <p className="text-gray-600">傳承百年農業技術，結合現代科技，呈現最佳農品品質</p>
              </div>
              <div className="text-center">
                <div className="w-32 h-32 rounded-full mx-auto mb-6 overflow-hidden relative shadow-lg">
                  {featureImages[2] && (
                    <OptimizedImage 
                      src={featureImages[2]} 
                      alt="農業文化"
                      width={128}
                      height={128}
                      className="object-cover hover:scale-110 transition-transform duration-300"
                      sizes="128px"
                    />
                  )}
                  {!featureImages[2] && (
                    <div className="w-full h-full bg-gradient-to-br from-teal-400 to-teal-600 flex items-center justify-center">
                      <span className="text-3xl text-white">🎋</span>
                    </div>
                  )}
                </div>
                <h3 className="text-xl font-heading mb-4 text-gray-800">農業文化</h3>
                <p className="text-gray-600">不僅是農品銷售，更致力於推廣台灣農業文化的深度內涵</p>
              </div>
            </div>

          </div>
        </section>

        <ProductsSection />

        <CustomerReviews />

        {/* 近期擺攤行程 */}
        <section className="py-20 px-6 bg-gradient-to-r from-amber-50 to-orange-50">
          <div className="max-w-7xl mx-auto">
            <h2 className="text-4xl font-light text-center text-amber-900 mb-16">近期擺攤行程</h2>
            <div className="grid md:grid-cols-3 gap-8">
              <div className="bg-white rounded-lg shadow-lg p-6 hover:shadow-xl transition-shadow">
                <div className="text-center mb-4">
                  <div className="text-3xl mb-2">🏪</div>
                  <h3 className="text-lg font-heading text-gray-800">台中逢甲夜市</h3>
                </div>
                <div className="space-y-2 text-sm text-gray-600 mb-4">
                  <div className="flex items-center">
                    <span className="mr-2">📅</span>
                    <span>8月10日 (六)</span>
                  </div>
                  <div className="flex items-center">
                    <span className="mr-2">⏰</span>
                    <span>17:00 - 23:00</span>
                  </div>
                  <div className="flex items-center">
                    <span className="mr-2">📍</span>
                    <span>文華路入口處</span>
                  </div>
                </div>
                <div className="text-center">
                  <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm">
                    買二送一優惠
                  </span>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow-lg p-6 hover:shadow-xl transition-shadow">
                <div className="text-center mb-4">
                  <div className="text-3xl mb-2">🌅</div>
                  <h3 className="text-lg font-heading text-gray-800">彰化員林假日市集</h3>
                </div>
                <div className="space-y-2 text-sm text-gray-600 mb-4">
                  <div className="flex items-center">
                    <span className="mr-2">📅</span>
                    <span>8月12日 (一)</span>
                  </div>
                  <div className="flex items-center">
                    <span className="mr-2">⏰</span>
                    <span>08:00 - 14:00</span>
                  </div>
                  <div className="flex items-center">
                    <span className="mr-2">📍</span>
                    <span>中山路廣場</span>
                  </div>
                </div>
                <div className="text-center">
                  <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm">
                    現場試吃
                  </span>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow-lg p-6 hover:shadow-xl transition-shadow">
                <div className="text-center mb-4">
                  <div className="text-3xl mb-2">🌃</div>
                  <h3 className="text-lg font-heading text-gray-800">高雄六合夜市</h3>
                </div>
                <div className="space-y-2 text-sm text-gray-600 mb-4">
                  <div className="flex items-center">
                    <span className="mr-2">📅</span>
                    <span>8月15日 (四)</span>
                  </div>
                  <div className="flex items-center">
                    <span className="mr-2">⏰</span>
                    <span>17:30 - 23:30</span>
                  </div>
                  <div className="flex items-center">
                    <span className="mr-2">📍</span>
                    <span>六合二路</span>
                  </div>
                </div>
                <div className="text-center">
                  <span className="bg-amber-100 text-amber-800 px-3 py-1 rounded-full text-sm">
                    預訂9折
                  </span>
                </div>
              </div>
            </div>
            
            <div className="text-center mt-12">
              <a 
                href="/schedule"
                className="inline-block bg-amber-900 text-white px-8 py-4 rounded-full text-lg font-heading hover:bg-amber-800 transition-colors"
              >
                查看完整行程
              </a>
            </div>
          </div>
        </section>

        {/* 觀光果園體驗 */}
        <section className="py-20 px-6">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-4xl font-light text-amber-900 mb-4">豪德觀光果園</h2>
              <p className="text-xl text-gray-700">親近土地，體驗四季農情，感受自然之美</p>
            </div>
            
            <div className="grid md:grid-cols-4 gap-8">
              <div className="text-center group">
                <div className="w-20 h-20 rounded-full mx-auto mb-4 flex items-center justify-center group-hover:scale-110 transition-transform relative">
                  <img 
                    src="/images/icons/spring-bg.svg" 
                    alt="Spring background" 
                    className="absolute inset-0 w-full h-full rounded-full"
                  />
                  <span className="text-3xl relative z-10">🌸</span>
                </div>
                <h3 className="text-lg font-heading text-gray-800 mb-2">春季賞花</h3>
                <p className="text-sm text-gray-600">梅花盛開，春季蔬菜採摘</p>
              </div>
              
              <div className="text-center group">
                <div className="w-20 h-20 rounded-full mx-auto mb-4 flex items-center justify-center group-hover:scale-110 transition-transform relative">
                  <img 
                    src="/images/icons/summer-bg.svg" 
                    alt="Summer background" 
                    className="absolute inset-0 w-full h-full rounded-full"
                  />
                  <span className="text-3xl relative z-10">🍑</span>
                </div>
                <h3 className="text-lg font-heading text-gray-800 mb-2">夏日採果</h3>
                <p className="text-sm text-gray-600">紅肉李盛產期，果香四溢</p>
              </div>
              
              <div className="text-center group">
                <div className="w-20 h-20 rounded-full mx-auto mb-4 flex items-center justify-center group-hover:scale-110 transition-transform relative">
                  <img 
                    src="/images/icons/autumn-bg.svg" 
                    alt="Autumn background" 
                    className="absolute inset-0 w-full h-full rounded-full"
                  />
                  <span className="text-3xl relative z-10">🍎</span>
                </div>
                <h3 className="text-lg font-heading text-gray-800 mb-2">秋收體驗</h3>
                <p className="text-sm text-gray-600">豐收季節，多樣農產品嚐</p>
              </div>
              
              <div className="text-center group">
                <div className="w-20 h-20 rounded-full mx-auto mb-4 flex items-center justify-center group-hover:scale-110 transition-transform relative">
                  <img 
                    src="/images/icons/winter-bg.svg" 
                    alt="Winter background" 
                    className="absolute inset-0 w-full h-full rounded-full"
                  />
                  <span className="text-3xl relative z-10">🫖</span>
                </div>
                <h3 className="text-lg font-heading text-gray-800 mb-2">冬日品茶</h3>
                <p className="text-sm text-gray-600">溫室體驗，品茶話農情</p>
              </div>
            </div>

            <div className="mt-16 bg-gradient-to-r from-green-50 to-amber-50 rounded-xl p-8">
              <div className="grid md:grid-cols-2 gap-8 items-center">
                <div>
                  <h3 className="text-2xl font-bold text-amber-900 mb-4">沉浸式農場體驗</h3>
                  <ul className="space-y-3">
                    <li className="flex items-center text-gray-700">
                      <span className="mr-3 text-green-500">✓</span>
                      <span>專業導覽解說，了解有機農法</span>
                    </li>
                    <li className="flex items-center text-gray-700">
                      <span className="mr-3 text-green-500">✓</span>
                      <span>親手採摘當季新鮮水果蔬菜</span>
                    </li>
                    <li className="flex items-center text-gray-700">
                      <span className="mr-3 text-green-500">✓</span>
                      <span>DIY農產品加工體驗活動</span>
                    </li>
                    <li className="flex items-center text-gray-700">
                      <span className="mr-3 text-green-500">✓</span>
                      <span>品嚐農場風味餐與農產伴手禮</span>
                    </li>
                  </ul>
                </div>
                <div className="text-center">
                  <div className="bg-white rounded-lg shadow-lg p-6 mb-4">
                    <div className="text-5xl mb-3">🚶‍♂️</div>
                    <h4 className="text-lg font-heading text-gray-800 mb-2">2公里環山步道</h4>
                    <p className="text-sm text-gray-600">欣賞山景與果園風光</p>
                  </div>
                  <div className="text-sm text-gray-600 mb-4">
                    <p>📞 預約專線：05-2561843</p>
                    <p>⏰ 開放時間：09:00-17:00（週一公休）</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="text-center mt-12">
              <a 
                href="/farm-tour"
                className="inline-block bg-green-600 text-white px-8 py-4 rounded-full text-lg font-heading hover:bg-green-700 transition-colors"
              >
                🌱 預約農場體驗
              </a>
            </div>
          </div>
        </section>
      </main>

      <footer className="bg-amber-900 text-white py-16 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-5 gap-8">
            <div>
              <h3 className="text-xl font-display mb-4">豪德茶業</h3>
              <p className="font-body text-amber-100 mb-4">傳承百年茶文化，品味東方茶韻</p>
            </div>
            <div>
              <h4 className="font-heading mb-4">農產系列</h4>
              <ul className="space-y-2 text-amber-100">
                <li>紅肉李</li>
                <li>精品咖啡</li>
                <li>季節水果</li>
                <li>有機蔬菜</li>
              </ul>
            </div>
            <div>
              <h4 className="font-heading mb-4">門市據點</h4>
              <ul className="space-y-2 text-amber-100">
                <li>台北旗艦店</li>
                <li>台中分店</li>
                <li>高雄分店</li>
                <li>線上商城</li>
              </ul>
            </div>
            <div>
              <h4 className="font-heading mb-4">聯絡我們</h4>
              <ul className="space-y-2 text-amber-100">
                <li>電話: 05-2561843</li>
                <li>信箱: info@dechuantea.com</li>
                <li>地址: 嘉義縣梅山鄉太和村一鄰八號</li>
              </ul>
            </div>
            <div>
              <h4 className="font-heading mb-4">關注我們</h4>
              <div className="flex items-center">
                <SocialLinks size="md" showLabels={false} className="text-amber-100" />
                <div className="ml-3">
                  <p className="text-amber-100 text-sm">追蹤最新農產資訊</p>
                </div>
              </div>
            </div>
          </div>
          <div className="border-t border-amber-800 mt-12 pt-8">
            <div className="flex flex-col md:flex-row justify-between items-center">
              <p className="text-amber-100">&copy; 2024 豪德茶業 Haude Tea Company. 版權所有</p>
              <div className="mt-4 md:mt-0">
                <VisitorCounter className="text-amber-100" />
              </div>
            </div>
          </div>
        </div>
      </footer>
      </div>
    </>
  );
}