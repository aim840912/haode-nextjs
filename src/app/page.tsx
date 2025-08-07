
export default function Home() {

  return (
    <div className="min-h-screen bg-gradient-to-b from-amber-50 to-white">
      <header className="fixed top-0 w-full bg-white/95 backdrop-blur-lg shadow-sm z-50">
        <nav className="max-w-7xl mx-auto px-8 py-4 lg:py-5">
          <div className="hidden lg:grid lg:grid-cols-3 lg:items-center">
            {/* Desktop Layout */}
            <div className="justify-self-start">
              <div className="text-2xl font-bold text-amber-900 tracking-tight">
                豪德茶業
              </div>
              <div className="text-xs text-amber-700/70 font-medium tracking-wider">
                HAUDE TEA
              </div>
            </div>
            <div className="justify-self-center">
              <div className="flex items-center space-x-10">
                <a href="#exploration" className="group relative py-2">
                  <span className="text-gray-700 hover:text-amber-900 transition-colors duration-200 text-sm font-medium">
                    農產探索
                  </span>
                  <div className="absolute bottom-0 left-0 w-0 h-0.5 bg-amber-900 group-hover:w-full transition-all duration-300"></div>
                </a>
                <a href="#culture" className="group relative py-2">
                  <span className="text-gray-700 hover:text-amber-900 transition-colors duration-200 text-sm font-medium">
                    農業文化
                  </span>
                  <div className="absolute bottom-0 left-0 w-0 h-0.5 bg-amber-900 group-hover:w-full transition-all duration-300"></div>
                </a>
                <a href="#products" className="group relative py-2">
                  <span className="text-gray-700 hover:text-amber-900 transition-colors duration-200 text-sm font-medium">
                    產品介紹
                  </span>
                  <div className="absolute bottom-0 left-0 w-0 h-0.5 bg-amber-900 group-hover:w-full transition-all duration-300"></div>
                </a>
                <a href="#news" className="group relative py-2">
                  <span className="text-gray-700 hover:text-amber-900 transition-colors duration-200 text-sm font-medium">
                    農產新聞
                  </span>
                  <div className="absolute bottom-0 left-0 w-0 h-0.5 bg-amber-900 group-hover:w-full transition-all duration-300"></div>
                </a>
                <a href="#trace" className="group relative py-2">
                  <span className="text-gray-700 hover:text-amber-900 transition-colors duration-200 text-sm font-medium">
                    產品溯源
                  </span>
                  <div className="absolute bottom-0 left-0 w-0 h-0.5 bg-amber-900 group-hover:w-full transition-all duration-300"></div>
                </a>
                <a href="#videos" className="group relative py-2">
                  <span className="text-gray-700 hover:text-amber-900 transition-colors duration-200 text-sm font-medium">
                    農產影片
                  </span>
                  <div className="absolute bottom-0 left-0 w-0 h-0.5 bg-amber-900 group-hover:w-full transition-all duration-300"></div>
                </a>
              </div>
            </div>
            <div className="justify-self-end">
              <div className="flex items-center space-x-1 bg-gray-50 rounded-full p-1">
                <button className="px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-white hover:text-amber-900 rounded-full transition-all duration-200">
                  EN
                </button>
                <button className="px-3 py-1.5 text-xs font-medium bg-amber-100 text-amber-900 rounded-full">
                  中文
                </button>
                <button className="px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-white hover:text-amber-900 rounded-full transition-all duration-200">
                  日本語
                </button>
              </div>
            </div>
          </div>

          {/* Mobile/Tablet Layout */}
          <div className="lg:hidden">
            {/* Compact Header for smaller screens */}
            <div className="flex items-center justify-between">
              {/* Brand */}
              <div>
                <div className="text-xl font-bold text-amber-900 tracking-tight">
                  豪德茶業
                </div>
                <div className="text-xs text-amber-700/70 font-medium tracking-wider">
                  HAUDE TEA
                </div>
              </div>
              
              {/* Language Switcher - Compact */}
              <div className="flex items-center space-x-1 bg-gray-50 rounded-full p-1">
                <button className="px-2 py-1 text-xs font-medium text-gray-600 hover:bg-white rounded-full transition-all duration-200">
                  EN
                </button>
                <button className="px-2 py-1 text-xs font-medium bg-amber-100 text-amber-900 rounded-full">
                  中
                </button>
                <button className="px-2 py-1 text-xs font-medium text-gray-600 hover:bg-white rounded-full transition-all duration-200">
                  日
                </button>
              </div>
            </div>
            
            {/* Multi-row Navigation for smaller screens */}
            <div className="mt-3">
              <div className="flex flex-wrap gap-x-6 gap-y-2 justify-center">
                <a href="#exploration" className="group relative py-2">
                  <span className="text-gray-700 hover:text-amber-900 transition-colors duration-200 text-sm font-medium">
                    農產探索
                  </span>
                  <div className="absolute bottom-0 left-0 w-0 h-0.5 bg-amber-900 group-hover:w-full transition-all duration-300"></div>
                </a>
                <a href="#culture" className="group relative py-2">
                  <span className="text-gray-700 hover:text-amber-900 transition-colors duration-200 text-sm font-medium">
                    農業文化
                  </span>
                  <div className="absolute bottom-0 left-0 w-0 h-0.5 bg-amber-900 group-hover:w-full transition-all duration-300"></div>
                </a>
                <a href="#products" className="group relative py-2">
                  <span className="text-gray-700 hover:text-amber-900 transition-colors duration-200 text-sm font-medium">
                    產品介紹
                  </span>
                  <div className="absolute bottom-0 left-0 w-0 h-0.5 bg-amber-900 group-hover:w-full transition-all duration-300"></div>
                </a>
                <a href="#news" className="group relative py-2">
                  <span className="text-gray-700 hover:text-amber-900 transition-colors duration-200 text-sm font-medium">
                    農產新聞
                  </span>
                  <div className="absolute bottom-0 left-0 w-0 h-0.5 bg-amber-900 group-hover:w-full transition-all duration-300"></div>
                </a>
                <a href="#trace" className="group relative py-2">
                  <span className="text-gray-700 hover:text-amber-900 transition-colors duration-200 text-sm font-medium">
                    產品溯源
                  </span>
                  <div className="absolute bottom-0 left-0 w-0 h-0.5 bg-amber-900 group-hover:w-full transition-all duration-300"></div>
                </a>
                <a href="#videos" className="group relative py-2">
                  <span className="text-gray-700 hover:text-amber-900 transition-colors duration-200 text-sm font-medium">
                    農產影片
                  </span>
                  <div className="absolute bottom-0 left-0 w-0 h-0.5 bg-amber-900 group-hover:w-full transition-all duration-300"></div>
                </a>
              </div>
            </div>
          </div>
        </nav>

      </header>

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
            <div className="w-full h-full bg-gradient-to-br from-amber-200 via-orange-200 to-yellow-200"></div>
          </div>
        </section>

        <section id="exploration" className="py-20 px-6">
          <div className="max-w-7xl mx-auto">
            <h2 className="text-3xl md:text-4xl font-light text-center text-amber-900 mb-16">農產探索</h2>
            <div className="grid md:grid-cols-3 gap-12">
              <div className="text-center">
                <div className="w-24 h-24 bg-amber-200 rounded-full mx-auto mb-6 flex items-center justify-center">
                  <span className="text-2xl text-amber-900">🍃</span>
                </div>
                <h3 className="text-xl font-semibold mb-4 text-gray-800">精選農產</h3>
                <p className="text-gray-600">嚴選來自山區高地的優質紅肉李及各季節農產品</p>
              </div>
              <div className="text-center">
                <div className="w-24 h-24 bg-amber-200 rounded-full mx-auto mb-6 flex items-center justify-center">
                  <span className="text-2xl text-amber-900">🏮</span>
                </div>
                <h3 className="text-xl font-semibold mb-4 text-gray-800">傳統農法</h3>
                <p className="text-gray-600">傳承百年農業技術，結合現代科技，呈現最佳農品品質</p>
              </div>
              <div className="text-center">
                <div className="w-24 h-24 bg-amber-200 rounded-full mx-auto mb-6 flex items-center justify-center">
                  <span className="text-2xl text-amber-900">🎋</span>
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
                <div className="aspect-video bg-gradient-to-br from-amber-100 to-orange-100 rounded-lg mb-4 flex items-center justify-center">
                  <span className="text-4xl text-amber-900">📜</span>
                </div>
                <h4 className="font-semibold text-gray-800 mb-2">百年茶譜典藏</h4>
                <p className="text-sm text-gray-600">珍藏歷代茶譜與製茶秘方</p>
              </div>
            </div>
          </div>
        </section>

        <section id="products" className="py-20 px-6">
          <div className="max-w-7xl mx-auto">
            <h2 className="text-4xl font-light text-center text-amber-900 mb-16">經典產品</h2>
            <div className="grid md:grid-cols-4 gap-8">
              {['紅肉李果園', '精品咖啡', '季節水果', '有機蔬菜'].map((product, index) => (
                <div key={index} className="bg-white rounded-lg shadow-lg overflow-hidden hover:shadow-xl transition-shadow">
                  <div className="aspect-square bg-gradient-to-br from-amber-100 to-orange-100 flex items-center justify-center">
                    <span className="text-3xl text-amber-900">🍑</span>
                  </div>
                  <div className="p-6">
                    <h3 className="font-semibold text-gray-800 mb-2">{product}</h3>
                    <p className="text-sm text-gray-600">在地優質農產，自然健康栽培</p>
                  </div>
                </div>
              ))}
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
