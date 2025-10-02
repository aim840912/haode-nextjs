'use client'

import { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import Link from 'next/link'
import { Product } from '@/types/product'
import { ComponentErrorBoundary } from '@/components/ui/error/ErrorBoundary'
import { ProductCardSkeleton } from '@/components/ui/loading/LoadingSkeleton'
import { SafeImage } from '@/components/ui/image/OptimizedImage'
import { logger } from '@/lib/logger'
import { Award, Sparkles, TrendingUp, Leaf, ShoppingBag } from 'lucide-react'

function ProductsSection() {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isVisible, setIsVisible] = useState(false)
  const sectionRef = useRef<HTMLElement>(null)

  const fetchProducts = useCallback(async () => {
    try {
      setError(null)
      const response = await fetch('/api/products')

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const result = await response.json()
      const data = result.data || result

      if (!Array.isArray(data)) {
        throw new Error('API 回應格式錯誤：data 不是陣列')
      }

      const activeProducts = data.filter((p: Product) => p.isActive).slice(0, 3)
      setProducts(activeProducts)
    } catch (error) {
      logger.error('Error fetching products', error as Error, {
        metadata: { component: 'ProductsSection' },
      })
      setError(error instanceof Error ? error.message : '載入產品失敗')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchProducts()
  }, [fetchProducts])

  useEffect(() => {
    const observer = new IntersectionObserver(
      entries => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            setIsVisible(true)
          }
        })
      },
      { threshold: 0.1, rootMargin: '0px 0px -100px 0px' }
    )

    if (sectionRef.current) {
      observer.observe(sectionRef.current)
    }

    return () => observer.disconnect()
  }, [])

  const getProductBadge = useCallback((index: number, product: Product) => {
    if (index === 0) {
      return {
        icon: <Award className="w-3.5 h-3.5" />,
        text: '熱銷推薦',
        bgColor: 'bg-gradient-to-r from-amber-500 to-orange-600',
        animation: 'animate-badge-bounce',
      }
    }
    if (product.isOnSale) {
      return {
        icon: <Sparkles className="w-3.5 h-3.5" />,
        text: '限時優惠',
        bgColor: 'bg-gradient-to-r from-red-500 to-pink-600',
        animation: 'animate-badge-pulse',
      }
    }
    if (index === 1) {
      return {
        icon: <TrendingUp className="w-3.5 h-3.5" />,
        text: '人氣商品',
        bgColor: 'bg-gradient-to-r from-green-500 to-emerald-600',
        animation: '',
      }
    }
    return null
  }, [])

  const getProductFeatures = useCallback((index: number) => {
    const features = [
      [
        {
          icon: <Leaf className="w-3 h-3" />,
          text: '有機認證',
          color: 'bg-green-100 text-green-700',
        },
        {
          icon: <ShoppingBag className="w-3 h-3" />,
          text: '新鮮直送',
          color: 'bg-blue-100 text-blue-700',
        },
      ],
      [
        {
          icon: <Leaf className="w-3 h-3" />,
          text: '當季精選',
          color: 'bg-amber-100 text-amber-700',
        },
      ],
      [
        {
          icon: <Leaf className="w-3 h-3" />,
          text: '產地直送',
          color: 'bg-purple-100 text-purple-700',
        },
      ],
    ]
    return features[index] || []
  }, [])

  const handleRetry = useCallback(() => {
    setLoading(true)
    fetchProducts()
  }, [fetchProducts])

  if (loading) {
    return (
      <section
        id="products"
        ref={sectionRef}
        className="py-20 px-6 bg-gradient-to-b from-white via-amber-50/30 to-white relative overflow-hidden"
      >
        <div className="absolute top-20 right-10 w-72 h-72 bg-amber-200/20 rounded-full blur-3xl animate-float"></div>
        <div
          className="absolute bottom-20 left-10 w-96 h-96 bg-green-200/20 rounded-full blur-3xl animate-float"
          style={{ animationDelay: '1.5s' }}
        ></div>
        <div className="max-w-7xl mx-auto relative z-10">
          <h2 className="text-5xl md:text-6xl font-bold text-center text-amber-900 mb-4 tracking-wider">
            經典產品
          </h2>
          <p className="text-center text-gray-600 text-lg mb-16">精選來自梅山的優質農產品</p>
          <div className="grid md:grid-cols-3 gap-8">
            {Array.from({ length: 3 }).map((_, i) => (
              <ProductCardSkeleton key={i} />
            ))}
          </div>
        </div>
      </section>
    )
  }

  if (error) {
    return (
      <section
        id="products"
        ref={sectionRef}
        className="py-20 px-6 bg-gradient-to-b from-white via-amber-50/30 to-white"
      >
        <div className="max-w-7xl mx-auto">
          <h2 className="text-5xl md:text-6xl font-bold text-center text-amber-900 mb-16 tracking-wider">
            經典產品
          </h2>
          <div className="text-center">
            <div className="bg-red-50 border border-red-200 rounded-lg p-6 max-w-md mx-auto">
              <div className="text-red-600 mb-4">載入產品時發生錯誤</div>
              <p className="text-sm text-red-700 mb-4">{error}</p>
              <button
                onClick={handleRetry}
                className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 transition-colors"
              >
                重新載入
              </button>
            </div>
          </div>
        </div>
      </section>
    )
  }

  return (
    <section
      id="products"
      ref={sectionRef}
      className="py-24 px-6 bg-gradient-to-b from-white via-amber-50/30 to-white relative overflow-hidden"
    >
      <div className="absolute top-20 right-10 w-72 h-72 bg-amber-200/20 rounded-full blur-3xl animate-float"></div>
      <div
        className="absolute bottom-20 left-10 w-96 h-96 bg-green-200/20 rounded-full blur-3xl animate-float"
        style={{ animationDelay: '1.5s' }}
      ></div>

      <div className="max-w-7xl mx-auto relative z-10">
        <div className={`text-center mb-16 ${isVisible ? 'animate-fade-in' : 'opacity-0'}`}>
          <h2 className="text-5xl md:text-6xl font-bold text-amber-900 mb-4 tracking-wider">
            經典產品
          </h2>
          <p className="text-gray-600 text-lg mb-2">精選來自梅山的優質農產品</p>
          <div className="flex items-center justify-center gap-2 text-sm text-gray-500">
            <Leaf className="w-4 h-4 text-green-600" />
            <span>100% 有機無毒栽培</span>
          </div>
        </div>

        {products.length > 0 ? (
          <>
            <div
              className={`grid md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12 ${
                isVisible ? 'animate-slide-up animation-delay-300' : 'opacity-0'
              }`}
            >
              {products.map((product, index) => {
                const badge = getProductBadge(index, product)
                const features = getProductFeatures(index)
                const animationClass = `stagger-animation-${index + 1}`

                return (
                  <Link
                    key={product.id}
                    href={`/products?productId=${product.id}`}
                    className={`group bg-white rounded-2xl overflow-hidden product-card-enhanced gradient-border shadow-lg hover:shadow-2xl flex flex-col cursor-pointer ${animationClass} ${
                      index === 0 ? 'md:col-span-2 lg:col-span-1' : ''
                    }`}
                  >
                    <div className="relative product-image-wrapper">
                      <div className={`${index === 0 ? 'h-[320px]' : 'h-[280px]'} relative`}>
                        <SafeImage
                          src={product.productImages?.[0]?.storage_url || '/images/placeholder.jpg'}
                          alt={product.name || '產品圖片'}
                          fill
                          className="object-cover"
                          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                          priority={index < 3}
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                      </div>

                      {badge && (
                        <div
                          className={`absolute top-4 left-4 ${badge.bgColor} text-white px-3 py-1.5 rounded-full text-xs font-semibold shadow-lg flex items-center gap-1.5 ${badge.animation}`}
                        >
                          {badge.icon}
                          <span>{badge.text}</span>
                        </div>
                      )}

                      {product.isOnSale && product.originalPrice && (
                        <div className="absolute top-4 right-4 bg-red-500 text-white px-3 py-1 rounded-full text-xs font-bold shadow-md">
                          省 ${product.originalPrice - product.price}
                        </div>
                      )}
                    </div>

                    <div className="p-6 flex flex-col flex-grow">
                      <div className="mb-3">
                        <h3 className="text-xl font-bold text-gray-900 mb-2 group-hover:text-amber-900 transition-colors line-clamp-2">
                          {product.name}
                        </h3>
                        {product.description && (
                          <p className="text-sm text-gray-600 line-clamp-2 mb-3 description-fade">
                            {product.description}
                          </p>
                        )}
                        <div className="flex flex-wrap gap-2">
                          {features.map((feature, idx) => (
                            <span key={idx} className={`feature-icon-badge ${feature.color}`}>
                              {feature.icon}
                              <span>{feature.text}</span>
                            </span>
                          ))}
                        </div>
                      </div>

                      <div className="mt-auto">
                        <div className="flex items-baseline gap-2 mb-4">
                          <span className="text-3xl font-bold text-amber-900 price-emphasis">
                            NT$ {product.price}
                          </span>
                          {product.priceUnit && (
                            <span className="text-sm text-gray-500">/ {product.priceUnit}</span>
                          )}
                          {product.originalPrice && product.originalPrice > product.price && (
                            <span className="text-sm text-gray-400 line-through ml-2">
                              NT$ {product.originalPrice}
                            </span>
                          )}
                        </div>

                        <div className="flex items-center justify-between bg-gradient-to-r from-amber-900 to-amber-800 text-white px-5 py-3 rounded-xl font-medium group-hover:from-amber-800 group-hover:to-amber-700 transition-all duration-300 shadow-md group-hover:shadow-lg">
                          <span>查看詳情</span>
                          <svg
                            className="w-5 h-5 group-hover:animate-slide-arrow"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth="2"
                              d="M9 5l7 7-7 7"
                            />
                          </svg>
                        </div>
                      </div>
                    </div>
                  </Link>
                )
              })}
            </div>

            <div
              className={`text-center ${isVisible ? 'animate-scale-in animation-delay-450' : 'opacity-0'}`}
            >
              <Link
                href="/products"
                className="inline-flex items-center gap-3 bg-gradient-to-r from-amber-900 via-amber-800 to-amber-900 text-white px-10 py-4 rounded-full text-lg font-semibold hover:from-amber-800 hover:via-amber-700 hover:to-amber-800 transition-all duration-300 shadow-xl hover:shadow-2xl hover:scale-105 group"
              >
                <ShoppingBag className="w-6 h-6" />
                <span>瀏覽所有商品</span>
                <svg
                  className="w-5 h-5 group-hover:animate-slide-arrow"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M9 5l7 7-7 7"
                  />
                </svg>
              </Link>
            </div>
          </>
        ) : (
          <div className="text-center text-gray-600 py-12">
            <div className="bg-gray-50 rounded-2xl p-12 max-w-md mx-auto">
              <ShoppingBag className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <p className="text-lg mb-2">目前沒有上架的產品</p>
              <p className="text-sm text-gray-500">請稍後再來查看</p>
            </div>
          </div>
        )}
      </div>
    </section>
  )
}

export default function ProductsSectionWithErrorBoundary() {
  return (
    <ComponentErrorBoundary>
      <ProductsSection />
    </ComponentErrorBoundary>
  )
}
