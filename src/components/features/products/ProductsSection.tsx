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
      <section
        id="products"
        ref={sectionRef}
        className="py-20 px-6 bg-gradient-to-b from-white via-amber-50/30 to-white dark:from-slate-900 dark:via-amber-900/10 dark:to-slate-900 relative overflow-hidden"
      >
        <div className="absolute top-20 right-10 w-72 h-72 bg-amber-200/20 rounded-full blur-3xl animate-float"></div>
        <div
          className="absolute bottom-20 left-10 w-96 h-96 bg-green-200/20 rounded-full blur-3xl animate-float"
          style={{ animationDelay: '1.5s' }}
        ></div>
        <div className="max-w-7xl mx-auto relative z-10">
          <h2 className="text-5xl md:text-6xl font-bold text-center text-amber-900 dark:text-amber-300 mb-4 tracking-wider">
            經典產品
          </h2>
          <p className="text-center text-gray-600 dark:text-gray-300 text-lg mb-16">
            精選來自梅山的優質農產品
          </p>
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
        className="py-20 px-6 bg-gradient-to-b from-white via-amber-50/30 to-white dark:from-slate-900 dark:via-amber-900/10 dark:to-slate-900"
      >
        <div className="max-w-7xl mx-auto">
          <h2 className="text-5xl md:text-6xl font-bold text-center text-amber-900 dark:text-amber-300 mb-16 tracking-wider">
            經典產品
          </h2>
          <div className="text-center">
            <div className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-700 rounded-lg p-6 max-w-md mx-auto">
              <div className="text-red-600 dark:text-red-400 mb-4">載入產品時發生錯誤</div>
              <p className="text-sm text-red-700 dark:text-red-300 mb-4">{error}</p>
              <button
                onClick={handleRetry}
                className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 dark:hover:bg-red-600 transition-colors"
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
      className="py-24 px-6 bg-gradient-to-b from-white via-amber-50/30 to-white dark:from-slate-900 dark:via-amber-900/10 dark:to-slate-900 relative overflow-hidden"
    >
      <div className="absolute top-20 right-10 w-72 h-72 bg-amber-200/20 rounded-full blur-3xl animate-float"></div>
      <div
        className="absolute bottom-20 left-10 w-96 h-96 bg-green-200/20 rounded-full blur-3xl animate-float"
        style={{ animationDelay: '1.5s' }}
      ></div>

      <div className="max-w-7xl mx-auto relative z-10">
        <div className={cn('text-center mb-16', isVisible ? 'animate-fade-in' : 'opacity-0')}>
          <h2 className="text-5xl md:text-6xl font-bold text-amber-900 dark:text-amber-300 mb-4 tracking-wider">
            經典產品
          </h2>
          <p className="text-gray-600 dark:text-gray-300 text-lg mb-2">精選來自梅山的優質農產品</p>
          <div className="flex items-center justify-center gap-2 text-sm text-gray-500 dark:text-gray-400">
            <Leaf className="w-4 h-4 text-green-600 dark:text-green-400" />
            <span>100% 有機無毒栽培</span>
          </div>
        </div>

        {products.length > 0 ? (
          <>
            <div
              className={cn(
                'grid md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12',
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
                      'group bg-white dark:bg-slate-800 rounded-2xl overflow-hidden product-card-enhanced gradient-border shadow-lg hover:shadow-2xl dark:shadow-slate-700/50 flex flex-col cursor-pointer',
                      animationClass,
                      index === 0 && 'md:col-span-2 lg:col-span-1'
                    )}
                  >
                    <div className="relative product-image-wrapper">
                      <div className={cn(index === 0 ? 'h-[320px]' : 'h-[280px]', 'relative')}>
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
                          className={cn(
                            'absolute top-4 left-4 text-white px-3 py-1.5 rounded-full text-xs font-semibold shadow-lg flex items-center gap-1.5',
                            badge.bgColor,
                            badge.animation
                          )}
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
                        <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-2 group-hover:text-amber-900 dark:group-hover:text-amber-300 transition-colors line-clamp-2">
                          {product.name}
                        </h3>
                        {product.description && (
                          <p className="text-sm text-gray-600 dark:text-gray-300 line-clamp-2 mb-3 description-fade">
                            {product.description}
                          </p>
                        )}
                        <div className="flex flex-wrap gap-2">
                          {features.map((feature, idx) => (
                            <span key={idx} className={cn('feature-icon-badge', feature.color)}>
                              {feature.icon}
                              <span>{feature.text}</span>
                            </span>
                          ))}
                        </div>
                      </div>

                      <div className="mt-auto">
                        <div className="flex items-baseline gap-2 mb-4">
                          <span className="text-3xl font-bold text-amber-900 dark:text-amber-300 price-emphasis">
                            NT$ {product.price}
                          </span>
                          {product.priceUnit && (
                            <span className="text-sm text-gray-500 dark:text-gray-400">
                              / {product.priceUnit}
                            </span>
                          )}
                          {product.originalPrice && product.originalPrice > product.price && (
                            <span className="text-sm text-gray-400 dark:text-gray-500 line-through ml-2">
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
              className={cn(
                'text-center',
                isVisible ? 'animate-scale-in animation-delay-450' : 'opacity-0'
              )}
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
          <div className="text-center text-gray-600 dark:text-gray-300 py-12">
            <div className="bg-gray-50 dark:bg-slate-800 rounded-2xl p-12 max-w-md mx-auto">
              <ShoppingBag className="w-16 h-16 text-gray-400 dark:text-gray-500 mx-auto mb-4" />
              <p className="text-lg mb-2">目前沒有上架的產品</p>
              <p className="text-sm text-gray-500 dark:text-gray-400">請稍後再來查看</p>
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
