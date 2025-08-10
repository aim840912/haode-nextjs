import ProductsSection from '@/components/ProductsSection'

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-amber-50 to-white">

      <main className="pt-36 lg:pt-24">
        <section className="relative h-screen flex items-center justify-center bg-gradient-to-r from-amber-100 via-orange-50 to-yellow-50">
          <div className="text-center relative z-1">
            <h1 className="text-6xl md:text-8xl font-light text-amber-900 mb-6">
              傳承百年
            </h1>
            <p className="text-xl md:text-2xl text-gray-700 mb-8 max-w-2xl mx-auto">
              自1862年創立以來，豪德茶業致力於傳承中華茶文化的精髓
            </p>
            <button className="bg-amber-900 text-white px-8 py-4 rounded-full hover:bg-amber-800 transition-colors text-lg touch-manipulation">
              探索農產世界
            </button>
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
            <h2 className="text-3xl md:text-4xl font-light text-center text-amber-900 mb-16">農產探索</h2>
            <div className="grid md:grid-cols-3 gap-12">
              <div className="text-center">
                <div className="w-24 h-24 rounded-full mx-auto mb-6 flex items-center justify-center relative">
                  <img 
                    src="/images/icons/leaf-bg.svg" 
                    alt="Leaf background" 
                    className="absolute inset-0 w-full h-full rounded-full"
                  />
                  <span className="text-2xl text-amber-900 relative z-10">🍃</span>
                </div>
                <h3 className="text-xl font-semibold mb-4 text-gray-800">精選農產</h3>
                <p className="text-gray-600">嚴選來自山區高地的優質紅肉李及各季節農產品</p>
              </div>
              <div className="text-center">
                <div className="w-24 h-24 rounded-full mx-auto mb-6 flex items-center justify-center relative">
                  <img 
                    src="/images/icons/lantern-bg.svg" 
                    alt="Lantern background" 
                    className="absolute inset-0 w-full h-full rounded-full"
                  />
                  <span className="text-2xl text-amber-900 relative z-10">🏮</span>
                </div>
                <h3 className="text-xl font-semibold mb-4 text-gray-800">傳統農法</h3>
                <p className="text-gray-600">傳承百年農業技術，結合現代科技，呈現最佳農品品質</p>
              </div>
              <div className="text-center">
                <div className="w-24 h-24 rounded-full mx-auto mb-6 flex items-center justify-center relative">
                  <img 
                    src="/images/icons/bamboo-bg.svg" 
                    alt="Bamboo background" 
                    className="absolute inset-0 w-full h-full rounded-full"
                  />
                  <span className="text-2xl text-amber-900 relative z-10">🎋</span>
                </div>
                <h3 className="text-xl font-semibold mb-4 text-gray-800">農業文化</h3>
                <p className="text-gray-600">不僅是農品銷售，更致力於推廣台灣農業文化的深度內涵</p>
              </div>
            </div>

          </div>
        </section>

        <section id="culture" className="py-20 px-6 bg-amber-50">
          <div className="max-w-7xl mx-auto">
            <h2 className="text-4xl font-light text-center text-amber-900 mb-16">茶文化典藏</h2>
            <div className="grid md:grid-cols-2 gap-16 items-center">
              <div>
                <h3 className="text-2xl font-semibold mb-6 text-gray-800">歷史傳承</h3>
                <p className="text-gray-600 mb-6 leading-relaxed">
                  豪德茶業創立於1862年，見證了中華茶文化的發展歷程。我們不僅保存了傳統的製茶工藝，
                  更致力於將茶文化的精神內涵傳承給下一代。
                </p>
                <p className="text-gray-600 leading-relaxed">
                  從台灣到中國大陸，從傳統茶莊到現代茶藝館，豪德茶業始終堅持品質與文化並重的經營理念。
                </p>
              </div>
              <div className="bg-white p-8 rounded-lg shadow-lg">
                <div className="aspect-video rounded-lg mb-4 flex items-center justify-center relative">
                  <img 
                    src="/images/backgrounds/culture-card.svg" 
                    alt="Culture card background" 
                    className="absolute inset-0 w-full h-full object-cover rounded-lg"
                  />
                  <span className="text-4xl text-amber-900 relative z-10">📜</span>
                </div>
                <h4 className="font-semibold text-gray-800 mb-2">百年茶譜典藏</h4>
                <p className="text-sm text-gray-600">珍藏歷代茶譜與製茶秘方</p>
              </div>
            </div>
          </div>
        </section>

        <ProductsSection />

        {/* 近期擺攤行程 */}
        <section className="py-20 px-6 bg-gradient-to-r from-amber-50 to-orange-50">
          <div className="max-w-7xl mx-auto">
            <h2 className="text-4xl font-light text-center text-amber-900 mb-16">近期擺攤行程</h2>
            <div className="grid md:grid-cols-3 gap-8">
              <div className="bg-white rounded-lg shadow-lg p-6 hover:shadow-xl transition-shadow">
                <div className="text-center mb-4">
                  <div className="text-3xl mb-2">🏪</div>
                  <h3 className="text-lg font-semibold text-gray-800">台中逢甲夜市</h3>
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
                  <h3 className="text-lg font-semibold text-gray-800">彰化員林假日市集</h3>
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
                  <h3 className="text-lg font-semibold text-gray-800">高雄六合夜市</h3>
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
                className="inline-block bg-amber-900 text-white px-8 py-4 rounded-full text-lg font-semibold hover:bg-amber-800 transition-colors"
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
                <h3 className="text-lg font-semibold text-gray-800 mb-2">春季賞花</h3>
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
                <h3 className="text-lg font-semibold text-gray-800 mb-2">夏日採果</h3>
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
                <h3 className="text-lg font-semibold text-gray-800 mb-2">秋收體驗</h3>
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
                <h3 className="text-lg font-semibold text-gray-800 mb-2">冬日品茶</h3>
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
                    <h4 className="text-lg font-semibold text-gray-800 mb-2">2公里環山步道</h4>
                    <p className="text-sm text-gray-600">欣賞山景與果園風光</p>
                  </div>
                  <div className="text-sm text-gray-600 mb-4">
                    <p>📞 預約專線：04-2123-4567</p>
                    <p>⏰ 開放時間：09:00-17:00（週一公休）</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="text-center mt-12">
              <a 
                href="/farm-tour"
                className="inline-block bg-green-600 text-white px-8 py-4 rounded-full text-lg font-semibold hover:bg-green-700 transition-colors"
              >
                🌱 預約農場體驗
              </a>
            </div>
          </div>
        </section>
      </main>

      <footer className="bg-amber-900 text-white py-16 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <h3 className="text-xl font-semibold mb-4">豪德茶業</h3>
              <p className="text-amber-100 mb-4">傳承百年茶文化，品味東方茶韻</p>
            </div>
            <div>
              <h4 className="font-semibold mb-4">農產系列</h4>
              <ul className="space-y-2 text-amber-100">
                <li>紅肉李</li>
                <li>精品咖啡</li>
                <li>季節水果</li>
                <li>有機蔬菜</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">門市據點</h4>
              <ul className="space-y-2 text-amber-100">
                <li>台北旗艦店</li>
                <li>台中分店</li>
                <li>高雄分店</li>
                <li>線上商城</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">聯絡我們</h4>
              <ul className="space-y-2 text-amber-100">
                <li>電話: 02-1234-5678</li>
                <li>信箱: info@dechuantea.com</li>
                <li>地址: 台北市中正區</li>
              </ul>
            </div>
          </div>
          <div className="border-t border-amber-800 mt-12 pt-8 text-center text-amber-100">
            <p>&copy; 2024 豪德茶業 Haude Tea Company. 版權所有</p>
          </div>
        </div>
      </footer>
    </div>
  );
}