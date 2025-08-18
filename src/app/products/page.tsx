'use client';

import { useState, useEffect, useMemo, useCallback, Suspense } from 'react';
import { useCart } from '@/lib/cart-context';
import { useAuth } from '@/lib/auth-context';
import { Product } from '@/types/product';
import { ComponentErrorBoundary } from '@/components/ErrorBoundary';
import { ProductCardSkeleton } from '@/components/LoadingSkeleton';
import ProductFilter, { FilterState } from '@/components/ProductFilter';
import { LoadingManager, LoadingWrapper } from '@/components/LoadingManager';
import { ErrorHandler, useAsyncWithError } from '@/components/ErrorHandler';
import ProductImageGallery, { ProductCardImage } from '@/components/ProductImageGallery';
import SafeImage from '@/components/SafeImage';

// 用於模擬產品的擴展類型
interface ExtendedProduct extends Product {
  features?: string[];
  specifications?: { label: string; value: string }[];
  inStock?: boolean;
  rating?: number;
  reviews?: number;
  image?: string;
  originalPrice?: number;
}

// 模擬產品的預設值，用於 fallback
const getDefaultProductFeatures = (): string[] => ['產地直送', '新鮮採摘', '品質保證']
const getDefaultProductSpecifications = () => [
  { label: '產地', value: '台灣' },
  { label: '保存', value: '請參考包裝說明' }
]

function ProductsPage() {
  const [selectedProduct, setSelectedProduct] = useState<ExtendedProduct | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [apiProducts, setApiProducts] = useState<Product[]>([]);
  const [filters, setFilters] = useState<FilterState>({
    categories: [],
    priceRange: [0, 2000],
    availability: 'all',
    sortBy: 'name',
    search: ''
  });
  const { addItem } = useCart();
  const { user } = useAuth();
  const { executeWithErrorHandling } = useAsyncWithError();

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    await executeWithErrorHandling(
      async () => {
        const response = await fetch('/api/products');
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        setApiProducts(data.filter((p: Product) => p.isActive));
        return data;
      },
      {
        taskId: 'fetch-products',
        loadingMessage: '載入產品中...',
        errorMessage: '載入產品失敗',
        context: { page: 'products' }
      }
    );
  };

  // 只使用 API 產品資料，確保 SSR 和 CSR 一致
  const allProducts = useMemo(() => {
    // 過濾重複的產品 ID
    const uniqueProducts = apiProducts.filter((product, index, self) => 
      index === self.findIndex(p => p.id === product.id)
    );
    
    return uniqueProducts.map((product, index) => {
      const numericId = parseInt(product.id) || index + 1; // 如果解析失敗，使用索引
      return {
        id: product.id, // 保持字串格式
        name: product.name,
        category: product.category,
        price: product.price,
        originalPrice: product.originalPrice || product.price,
        image: product.images?.[0] || '/images/placeholder.jpg',
        description: product.description,
        features: getDefaultProductFeatures(),
        specifications: getDefaultProductSpecifications(),
        inStock: product.inventory > 0,
        rating: 4.5 + (numericId % 10) / 20, // 基於數字 ID 的固定評分
        reviews: 50 + (numericId * 7) % 200 // 基於數字 ID 的固定評論數
      };
    });
  }, [apiProducts]);

  // 篩選和排序邏輯
  const filteredAndSortedProducts = useMemo(() => {
    let filtered = [...allProducts];

    // 類別篩選
    if (filters.categories.length > 0) {
      filtered = filtered.filter(product => 
        filters.categories.includes(product.category)
      );
    }

    // 價格範圍篩選
    filtered = filtered.filter(product => 
      product.price >= filters.priceRange[0] && 
      product.price <= filters.priceRange[1]
    );

    // 庫存狀態篩選
    if (filters.availability === 'in_stock') {
      filtered = filtered.filter(product => product.inStock);
    } else if (filters.availability === 'out_of_stock') {
      filtered = filtered.filter(product => !product.inStock);
    }

    // 搜尋篩選
    if (filters.search && filters.search.trim()) {
      const searchTerm = filters.search.toLowerCase();
      filtered = filtered.filter(product =>
        product.name.toLowerCase().includes(searchTerm) ||
        product.description.toLowerCase().includes(searchTerm) ||
        product.category.toLowerCase().includes(searchTerm)
      );
    }

    // 排序
    filtered.sort((a, b) => {
      switch (filters.sortBy) {
        case 'price_low':
          return a.price - b.price;
        case 'price_high':
          return b.price - a.price;
        case 'name':
          return a.name.localeCompare(b.name);
        case 'rating':
          return (b.rating || 0) - (a.rating || 0);
        case 'newest':
          return parseInt(b.id) - parseInt(a.id); // 將字串 ID 轉為數字進行比較
        default:
          return 0;
      }
    });

    return filtered;
  }, [allProducts, filters]);

  // 獲取所有可用類別
  const availableCategories = useMemo(() => {
    const categories = [...new Set(allProducts.map(product => product.category))];
    return categories.sort();
  }, [allProducts]);

  // 篩選回調函數
  const handleFilterChange = useCallback((newFilters: FilterState) => {
    setFilters(newFilters);
  }, []);

  const handleProductClick = (product: ExtendedProduct) => {
    setSelectedProduct(product);
  };

  const closeModal = () => {
    setSelectedProduct(null);
    setQuantity(1);
  };

  const addToCart = (product: ExtendedProduct) => {
    if (!user) {
      window.location.href = '/login';
      return;
    }

    // 轉換產品資料格式以符合 Product 型別
    const productData = {
      id: product.id.toString(),
      name: product.name,
      description: product.description,
      category: product.category,
      price: product.price,
      images: product.image ? [product.image] : [],
      inventory: product.inStock ? 100 : 0, // 模擬庫存數量
      isActive: product.inStock ?? true,
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
      <div className="bg-gradient-to-r from-amber-100 to-orange-50 py-16">
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
        <LoadingWrapper 
          fallback={
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
              {Array.from({ length: 8 }).map((_, i) => (
                <ProductCardSkeleton key={i} />
              ))}
            </div>
          }
        >
          {/* Product Filter */}
          <ProductFilter
            onFilterChange={handleFilterChange}
            availableCategories={availableCategories}
            productCount={filteredAndSortedProducts.length}
            totalCount={allProducts.length}
          />
          
          {/* Products Grid */}
          {apiProducts.length === 0 ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-900 mx-auto mb-4"></div>
                <div className="text-gray-500 mb-4">載入產品中...</div>
                <p className="text-sm text-gray-400">請稍候片刻</p>
              </div>
            ) : filteredAndSortedProducts.length === 0 ? (
              <div className="text-center py-12">
                <div className="text-gray-500 mb-4">沒有找到符合條件的產品</div>
                <p className="text-sm text-gray-400">請嘗試調整篩選條件</p>
              </div>
            ) : (
              <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
                {filteredAndSortedProducts.map((product, index) => (
            <div
              key={`product-${product.id}-${index}`}
              className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-2xl transition-all duration-300 cursor-pointer transform hover:scale-105"
              onClick={() => handleProductClick(product as unknown as ExtendedProduct)}
            >
              {/* Product Image */}
              <ProductCardImage
                product={{
                  ...product,
                  id: product.id,
                  name: product.name,
                  images: product.image ? [product.image] : ['/images/placeholder.jpg'],
                  thumbnailUrl: product.image,
                  primaryImageUrl: product.image,
                  inventory: product.inStock ? 100 : 0,
                  isOnSale: (product.originalPrice || 0) > product.price,
                  category: product.category,
                  price: product.price,
                  description: product.description,
                  isActive: true,
                  createdAt: new Date().toISOString(),
                  updatedAt: new Date().toISOString()
                }}
              />

              {/* Product Info */}
              <div className="p-6">
                <div className="text-sm text-amber-600 mb-2">{product.category}</div>
                <h3 className="text-xl font-semibold text-gray-800 mb-3">{product.name}</h3>
                <p className="text-gray-600 text-sm mb-4">{product.description}</p>
                
                {/* Rating */}
                <div className="flex items-center mb-4">
                  <div className="flex text-yellow-400">
                    {[...Array(5)].map((_, i: number) => (
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
                        handleProductClick(product as unknown as ExtendedProduct);
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
            )}
        </LoadingWrapper>
      </div>

      {/* Product Modal */}
      {selectedProduct && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="grid md:grid-cols-2 gap-8 p-8">
              {/* Product Image Gallery */}
              <ProductImageGallery
                product={{
                  ...selectedProduct,
                  id: selectedProduct.id.toString(),
                  name: selectedProduct.name,
                  images: selectedProduct.image ? [selectedProduct.image] : ['/images/placeholder.jpg'],
                  galleryImages: selectedProduct.image ? [selectedProduct.image] : undefined,
                  thumbnailUrl: selectedProduct.image,
                  primaryImageUrl: selectedProduct.image,
                  inventory: selectedProduct.inStock ? 100 : 0,
                  isOnSale: (selectedProduct.originalPrice || 0) > selectedProduct.price,
                  category: selectedProduct.category,
                  price: selectedProduct.price,
                  description: selectedProduct.description,
                  isActive: true,
                  createdAt: new Date().toISOString(),
                  updatedAt: new Date().toISOString()
                }}
                showThumbnails={true}
                autoSlide={false}
              />

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
                    {[...Array(5)].map((_, i: number) => (
                      <span key={i} className={i < Math.floor(selectedProduct.rating || 0) ? 'text-yellow-400' : 'text-gray-300'}>
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
                    {selectedProduct.features?.map((feature: string, index: number) => (
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
                    {selectedProduct.specifications?.map((spec: { label: string; value: string }, index: number) => (
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
                      {selectedProduct.originalPrice && selectedProduct.originalPrice > selectedProduct.price && (
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

export default function ProductsPageWithErrorBoundary() {
  return (
    <ErrorHandler>
      <LoadingManager defaultTimeout={30000} showOverlay={false}>
        <ComponentErrorBoundary>
          <Suspense fallback={
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 p-6">
              {Array.from({ length: 8 }).map((_, i) => (
                <ProductCardSkeleton key={i} />
              ))}
            </div>
          }>
            <ProductsPage />
          </Suspense>
        </ComponentErrorBoundary>
      </LoadingManager>
    </ErrorHandler>
  );
}