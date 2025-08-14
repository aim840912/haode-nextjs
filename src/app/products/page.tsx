'use client';

import { useState } from 'react';
import { useCart } from '@/lib/cart-context';
import { useAuth } from '@/lib/auth-context';

// 模擬產品資料
const products = [
  {
    id: 1,
    name: '高山紅肉李',
    category: '紅肉李果園',
    price: 680,
    originalPrice: 800,
    image: '/products/red_plum_2.jpg',
    description: '來自海拔1000公尺以上的高山紅肉李，果肉飽滿、甜度極高',
    features: ['有機栽培', '產地直送', '新鮮採摘', '冷鏈保存'],
    specifications: [
      { label: '重量', value: '2公斤裝' },
      { label: '產地', value: '台中和平區' },
      { label: '保存期限', value: '冷藏7天' },
      { label: '甜度', value: '12-14度' }
    ],
    inStock: true,
    rating: 4.8,
    reviews: 127
  },
  {
    id: 2,
    name: '精品濾掛咖啡',
    category: '精品咖啡',
    price: 450,
    originalPrice: 520,
    image: '/api/placeholder/400/400',
    description: '精選阿里山咖啡豆，中度烘焙，香氣濃郁回甘甜美',
    features: ['中度烘焙', '單品咖啡', '濾掛式', '新鮮烘焙'],
    specifications: [
      { label: '包裝', value: '12包入' },
      { label: '產地', value: '阿里山' },
      { label: '烘焙度', value: '中度烘焙' },
      { label: '風味', value: '花香果酸' }
    ],
    inStock: true,
    rating: 4.6,
    reviews: 89
  },
  {
    id: 3,
    name: '當季水果組合',
    category: '季節水果',
    price: 850,
    originalPrice: 950,
    image: '/products/fruit.jpg',
    description: '精選當季最優質水果，營養豐富、口感絕佳',
    features: ['當季新鮮', '產地直送', '精美包裝', '營養豐富'],
    specifications: [
      { label: '內容', value: '5種水果' },
      { label: '重量', value: '約3公斤' },
      { label: '保存', value: '常溫3天' },
      { label: '包裝', value: '禮盒裝' }
    ],
    inStock: true,
    rating: 4.9,
    reviews: 203
  },
  {
    id: 4,
    name: '有機蔬菜箱',
    category: '有機蔬菜',
    price: 520,
    originalPrice: 580,
    image: '/api/placeholder/400/400',
    description: '嚴選有機認證蔬菜，無農藥殘留，健康安心',
    features: ['有機認證', '無農藥', '新鮮採收', '營養滿分'],
    specifications: [
      { label: '內容', value: '8種蔬菜' },
      { label: '重量', value: '約2.5公斤' },
      { label: '認證', value: '有機認證' },
      { label: '保存', value: '冷藏5天' }
    ],
    inStock: false,
    rating: 4.7,
    reviews: 156
  }
];

export default function ProductsPage() {
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [quantity, setQuantity] = useState(1);
  const { addItem } = useCart();
  const { user } = useAuth();

  const handleProductClick = (product: any) => {
    setSelectedProduct(product);
  };

  const closeModal = () => {
    setSelectedProduct(null);
    setQuantity(1);
  };

  const addToCart = (product: any) => {
    if (!user) {
      window.location.href = '/login';
      return;
    }

    // 轉換產品資料格式以符合 Product 型別
    const productData = {
      id: product.id.toString(),
      name: product.name,
      emoji: product.category === '紅肉李果園' ? '🍑' : product.category === '精品咖啡' ? '☕' : product.category === '季節水果' ? '🍓' : '🥬',
      description: product.description,
      category: 'fruits' as const, // 暫時固定為 fruits，實際應該根據產品分類映射
      price: product.price,
      images: [product.image],
      inventory: product.inStock ? 100 : 0, // 模擬庫存數量
      isActive: product.inStock,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    addItem(productData, quantity);
    
    // 顯示成功訊息
    alert(`已將 ${quantity} 個 ${product.name} 加入購物車！`);
    closeModal();
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-amber-100 to-orange-50 py-16 mt-20 lg:mt-16">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="text-center md:text-left mb-6 md:mb-0">
              <h1 className="text-4xl font-light text-amber-900 mb-4">精選農產品</h1>
              <p className="text-xl text-gray-700">來自台灣各地的優質農產，新鮮直送到你家</p>
            </div>
            {user && (
              <div className="flex space-x-3">
                <a 
                  href="/admin/products"
                  className="px-4 py-2 bg-gray-600 text-white rounded-full text-sm hover:bg-gray-700 transition-colors flex items-center space-x-2"
                >
                  <span>📊</span>
                  <span>產品管理</span>
                </a>
                <a 
                  href="/admin/products/add"
                  className="px-4 py-2 bg-green-600 text-white rounded-full text-sm hover:bg-green-700 transition-colors flex items-center space-x-2"
                >
                  <span>➕</span>
                  <span>新增產品</span>
                </a>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Products Grid */}
      <div className="max-w-7xl mx-auto px-6 py-16">
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          {products.map((product) => (
            <div
              key={product.id}
              className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-2xl transition-all duration-300 cursor-pointer transform hover:scale-105"
              onClick={() => handleProductClick(product)}
            >
              {/* Product Image */}
              <div className="relative aspect-square bg-gradient-to-br from-amber-100 to-orange-100">
                {product.category === '紅肉李果園' || product.category === '季節水果' ? (
                  <img 
                    src={product.image} 
                    alt={product.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-6xl">
                      {product.category === '精品咖啡' && '☕'}
                      {product.category === '有機蔬菜' && '🥬'}
                    </span>
                  </div>
                )}
                {!product.inStock && (
                  <div className="absolute top-4 right-4 bg-red-500 text-white px-3 py-1 rounded-full text-sm">
                    缺貨
                  </div>
                )}
                {product.originalPrice > product.price && (
                  <div className="absolute top-4 left-4 bg-red-500 text-white px-3 py-1 rounded-full text-sm">
                    特價
                  </div>
                )}
              </div>

              {/* Product Info */}
              <div className="p-6">
                <div className="text-sm text-amber-600 mb-2">{product.category}</div>
                <h3 className="text-xl font-semibold text-gray-800 mb-3">{product.name}</h3>
                <p className="text-gray-600 text-sm mb-4">{product.description}</p>
                
                {/* Rating */}
                <div className="flex items-center mb-4">
                  <div className="flex text-yellow-400">
                    {[...Array(5)].map((_: any, i: number) => (
                      <span key={i} className={i < Math.floor(product.rating) ? 'text-yellow-400' : 'text-gray-300'}>
                        ⭐
                      </span>
                    ))}
                  </div>
                  <span className="ml-2 text-sm text-gray-700">
                    {product.rating} ({product.reviews})
                  </span>
                </div>

                {/* Price */}
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-2xl font-bold text-amber-900">NT$ {product.price}</span>
                    {product.originalPrice > product.price && (
                      <span className="ml-2 text-sm text-gray-500 line-through">
                        NT$ {product.originalPrice}
                      </span>
                    )}
                  </div>
                  <button
                    className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                      product.inStock
                        ? 'bg-amber-900 text-white hover:bg-amber-800'
                        : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    }`}
                    disabled={!product.inStock}
                    onClick={(e) => {
                      e.stopPropagation();
                      if (product.inStock) {
                        handleProductClick(product);
                      }
                    }}
                  >
                    {product.inStock ? '查看詳情' : '暫時缺貨'}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Product Modal */}
      {selectedProduct && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="grid md:grid-cols-2 gap-8 p-8">
              {/* Product Image */}
              <div className="aspect-square bg-gradient-to-br from-amber-100 to-orange-100 rounded-lg flex items-center justify-center">
                {selectedProduct.category === '紅肉李果園' || selectedProduct.category === '季節水果' ? (
                  <img 
                    src={selectedProduct.image} 
                    alt={selectedProduct.name}
                    className="w-full h-full object-cover rounded-lg"
                  />
                ) : (
                  <span className="text-8xl">
                    {selectedProduct.category === '精品咖啡' && '☕'}
                    {selectedProduct.category === '有機蔬菜' && '🥬'}
                  </span>
                )}
              </div>

              {/* Product Details */}
              <div>
                <button
                  onClick={closeModal}
                  className="float-right text-gray-400 hover:text-gray-600 text-2xl"
                >
                  ×
                </button>
                
                <div className="text-sm text-amber-600 mb-2">{selectedProduct.category}</div>
                <h2 className="text-3xl font-bold text-gray-800 mb-4">{selectedProduct.name}</h2>
                
                {/* Rating */}
                <div className="flex items-center mb-4">
                  <div className="flex text-yellow-400">
                    {[...Array(5)].map((_: any, i: number) => (
                      <span key={i} className={i < Math.floor(selectedProduct.rating) ? 'text-yellow-400' : 'text-gray-300'}>
                        ⭐
                      </span>
                    ))}
                  </div>
                  <span className="ml-2 text-gray-700">
                    {selectedProduct.rating} ({selectedProduct.reviews} 則評價)
                  </span>
                </div>

                <p className="text-gray-800 mb-6 leading-relaxed">{selectedProduct.description}</p>

                {/* Features */}
                <div className="mb-6">
                  <h4 className="font-semibold text-gray-800 mb-3">產品特色</h4>
                  <div className="flex flex-wrap gap-2">
                    {selectedProduct.features.map((feature: any, index: number) => (
                      <span key={index} className="bg-amber-100 text-amber-800 px-3 py-1 rounded-full text-sm">
                        {feature}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Specifications */}
                <div className="mb-6">
                  <h4 className="font-semibold text-gray-800 mb-3">商品規格</h4>
                  <div className="space-y-2">
                    {selectedProduct.specifications.map((spec: any, index: number) => (
                      <div key={index} className="flex justify-between py-2 border-b border-gray-100">
                        <span className="text-gray-800">{spec.label}</span>
                        <span className="font-medium text-gray-900">{spec.value}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Price and Add to Cart */}
                <div className="border-t pt-6">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <span className="text-3xl font-bold text-amber-900">NT$ {selectedProduct.price}</span>
                      {selectedProduct.originalPrice > selectedProduct.price && (
                        <span className="ml-2 text-lg text-gray-500 line-through">
                          NT$ {selectedProduct.originalPrice}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-4 mb-6">
                    <span className="text-gray-800 font-medium">數量：</span>
                    <div className="flex items-center border rounded-lg">
                      <button
                        onClick={() => setQuantity(Math.max(1, quantity - 1))}
                        className="px-3 py-1 hover:bg-gray-100 text-gray-800"
                      >
                        -
                      </button>
                      <span className="px-4 py-1 border-x text-gray-900 font-medium">{quantity}</span>
                      <button
                        onClick={() => setQuantity(quantity + 1)}
                        className="px-3 py-1 hover:bg-gray-100 text-gray-800"
                      >
                        +
                      </button>
                    </div>
                  </div>

                  <button
                    onClick={() => addToCart(selectedProduct)}
                    className="w-full bg-amber-900 text-white py-4 rounded-lg font-semibold text-lg hover:bg-amber-800 transition-colors"
                    disabled={!selectedProduct.inStock}
                  >
                    {!selectedProduct.inStock 
                      ? '暫時缺貨' 
                      : !user 
                        ? '請先登入' 
                        : `加入購物車 - NT$ ${selectedProduct.price * quantity}`
                    }
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}