'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import Link from 'next/link'
import { Award, Sparkles, TrendingUp, Leaf, ShoppingBag } from 'lucide-react'
import { ComponentErrorBoundary } from '@/components/ui/error/ErrorBoundary'
import { SafeImage } from '@/components/ui/image/OptimizedImage'
import { ProductCardSkeleton } from '@/components/ui/loading/LoadingSkeleton'
import { fetchProducts as fetchProductsAPI } from '@/lib/api/products-api'
import { logger } from '@/lib/logger'
import { cn } from '@/lib/utils/cn'
import { Product } from '@/types/product'

function ProductsSection() {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isVisible, setIsVisible] = useState(false)
  const sectionRef = useRef<HTMLElement>(null)

  const fetchProducts = useCallback(async () => {
    try {
      setError(null)
      const data = await fetchProductsAPI({ isActive: true })
      const activeProducts = data.slice(0, 3)
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
        bgColor: 'bg-amber-500 dark:bg-amber-600',
        animation: 'animate-badge-bounce',
      }
    }
    if (product.isOnSale) {
      return {
        icon: <Sparkles className="w-3.5 h-3.5" />,
        text: '限時優惠',
        bgColor: 'bg-red-500 dark:bg-red-600',
        animation: 'animate-badge-pulse',
      }
    }
    if (index === 1) {
      return {
        icon: <TrendingUp className="w-3.5 h-3.5" />,
        text: '人氣商品',
        bgColor: 'bg-green-500 dark:bg-green-600',
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
          color: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300',
        },
        {
          icon: <ShoppingBag className="w-3 h-3" />,
          text: '新鮮直送',
          color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
        },
      ],
      [
        {
          icon: <Leaf className="w-3 h-3" />,
          text: '當季精選',
          color: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300',
        },
      ],
      [
        {
          icon: <Leaf className="w-3 h-3" />,
          text: '產地直送',
          color: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300',
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
      <section id="products" ref={sectionRef} className="py-20 px-6 bg-white">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-5xl md:text-6xl font-bold text-center text-gray-900 mb-4 tracking-wider">
            經典產品
          </h2>
          <p className="text-center text-gray-600 text-lg mb-16">精選來自梅山的優質農產品</p>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8">
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
      <section id="products" ref={sectionRef} className="py-20 px-6 bg-white">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-5xl md:text-6xl font-bold text-center text-gray-900 mb-16 tracking-wider">
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
    <section id="products" ref={sectionRef} className="py-24 px-6 bg-white">
      <div className="max-w-7xl mx-auto">
        <div className={cn('text-center mb-16', isVisible ? 'animate-fade-in' : 'opacity-0')}>
          <h2 className="text-5xl md:text-6xl font-bold text-gray-900 mb-4 tracking-wider">
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
              className={cn(
                'grid sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8 mb-12',
                isVisible ? 'animate-slide-up animation-delay-300' : 'opacity-0'
              )}
            >
              {products.map((product, index) => {
                const badge = getProductBadge(index, product)
                const features = getProductFeatures(index)
                const animationClass = `stagger-animation-${index + 1}`

                return (
                  <Link
                    key={product.id}
                    href={`/products?productId=${product.id}`}
                    className={cn(
                      'group bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-lg hover:shadow-xl flex flex-col cursor-pointer transition-all duration-200 hover:-translate-y-1 hover:scale-[1.01]',
                      animationClass
                    )}
                  >
                    <div className="relative">
                      <div className="relative aspect-square">
                        <SafeImage
                          src={product.productImages?.[0]?.storage_url || '/images/placeholder.jpg'}
                          alt={product.name || '產品圖片'}
                          fill
                          className="object-cover"
                          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                          priority={index < 3}
                        />
                        <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity duration-200"></div>
                      </div>

                      {product.isOnSale && product.originalPrice && (
                        <div className="absolute top-4 right-4 bg-red-500 text-white px-2 py-1 rounded-full text-xs font-bold shadow-md flex items-center gap-1">
                          <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                          </svg>
                          -
                          {Math.round(
                            ((product.originalPrice - product.price) / product.originalPrice) * 100
                          )}
                          %
                        </div>
                      )}
                    </div>

                    <div className="p-4 flex flex-col flex-grow">
                      <div className="mb-2">
                        <h3 className="text-sm font-semibold text-gray-900 mb-1.5 line-clamp-2">
                          {product.name}
                        </h3>
                      </div>

                      <div className="mt-auto">
                        <div className="flex items-baseline gap-2 mb-3">
                          <span className="text-lg font-bold text-gray-900">
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

                        <button className="w-full flex items-center justify-center gap-2 border border-gray-300 text-gray-700 px-3 py-2 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors duration-200">
                          <span>查看詳情</span>
                          <svg
                            className="w-4 h-4"
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
                        </button>
                      </div>
                    </div>
                  </Link>
                )
              })}
            </div>

            <div
              className={cn(
                'text-center',
                isVisible ? 'animate-scale-in animation-delay-450' : 'opacity-0'
              )}
            >
              <Link
                href="/products"
                className="inline-flex items-center gap-3 bg-gray-900 text-white px-10 py-4 rounded-lg text-lg font-semibold hover:bg-gray-800 transition-all duration-200 shadow-lg hover:shadow-xl group"
              >
                <ShoppingBag className="w-6 h-6" />
                <span>瀏覽所有商品</span>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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

export function ProductsSectionWithErrorBoundary() {
  return (
    <ComponentErrorBoundary>
      <ProductsSection />
    </ComponentErrorBoundary>
  )
}
