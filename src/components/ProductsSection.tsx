'use client'

import { useState, useEffect } from 'react'
import { Product } from '@/types/product'
import { useAuth } from '@/lib/auth-context'
import { ComponentErrorBoundary } from '@/components/ErrorBoundary'
import { ProductCardSkeleton } from '@/components/LoadingSkeleton'
import SafeImage from './SafeImage'

function ProductsSection() {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { user } = useAuth()

  useEffect(() => {
    fetchProducts()
  }, [])

  const fetchProducts = async () => {
    try {
      setError(null)
      const response = await fetch('/api/products')
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      
      const data = await response.json()
      
      // 只顯示活躍的產品，最多3個
      const activeProducts = data.filter((p: Product) => p.isActive).slice(0, 3)
      setProducts(activeProducts)
    } catch (error) {
      console.error('Error fetching products:', error)
      setError(error instanceof Error ? error.message : '載入產品失敗')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <section id="products" className="py-20 px-6">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-4xl font-light text-center text-amber-900 mb-16">經典產品</h2>
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
      <section id="products" className="py-20 px-6">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-4xl font-light text-center text-amber-900 mb-16">經典產品</h2>
          <div className="text-center">
            <div className="bg-red-50 border border-red-200 rounded-lg p-6 max-w-md mx-auto">
              <div className="text-red-600 mb-4">載入產品時發生錯誤</div>
              <p className="text-sm text-red-700 mb-4">{error}</p>
              <button 
                onClick={() => {
                  setLoading(true)
                  fetchProducts()
                }}
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
    <section id="products" className="py-20 px-6 bg-gradient-to-b from-white to-amber-50/30">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-light text-amber-900 mb-2">經典產品</h2>
          <p className="text-gray-600">精選來自梅山的優質農產品</p>
        </div>
        
        {products.length > 0 ? (
          <div className="grid md:grid-cols-3 gap-6">
            {products.map((product, index) => (
              <div key={product.id} className="group bg-white rounded-xl shadow-md hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1">
                {/* 圖片區域 */}
                <div className="relative overflow-hidden rounded-t-xl">
                  <div style={{ paddingBottom: '75%' }} className="relative">
                    <SafeImage 
                      src={product.images?.[0] || "/images/placeholder.jpg"} 
                      alt={product.name || '產品圖片'} 
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-300"
                      sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 25vw"
                    />
                  </div>
                  
                  {/* 產品標籤 */}
                  {index === 0 && (
                    <div className="absolute top-3 left-3 bg-amber-500 text-white px-2 py-1 rounded-full text-xs font-medium shadow-md">
                      熱銷
                    </div>
                  )}
                </div>
                
                {/* 內容區域 */}
                <div className="p-4">
                  <h3 className="text-lg font-semibold text-gray-800 mb-6 text-center group-hover:text-amber-900 transition-colors">{product.name}</h3>
                  
                  {/* 按鈕 */}
                  <a 
                    href="/products"
                    className="flex items-center justify-center bg-amber-900 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-amber-800 transition-colors"
                  >
                    <span className="mr-1">查看詳情</span>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                    </svg>
                  </a>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center text-gray-600">
            <p className="mb-4">目前沒有上架的產品</p>
            {user && user.role === 'admin' && (
              <a 
                href="/admin/products"
                className="inline-block bg-amber-900 text-white px-6 py-3 rounded-full hover:bg-amber-800 transition-colors"
              >
                前往管理產品
              </a>
            )}
          </div>
        )}
        
        {/* View All Products Button */}
        <div className="text-center mt-12">
          <a 
            href="/products"
            className="inline-block bg-amber-900 text-white px-8 py-4 rounded-full text-lg font-semibold hover:bg-amber-800 transition-colors"
          >
            瀏覽所有商品
          </a>
        </div>
        
        {/* Admin Controls - 移到底部較不顯眼位置 */}
        {user && user.role === 'admin' && (
          <div className="flex justify-center space-x-3 mt-6">
            <a 
              href="/admin/products"
              className="px-3 py-1 bg-gray-100 text-gray-600 rounded-full text-xs hover:bg-gray-200 transition-colors flex items-center space-x-1"
            >
              <span>📊</span>
              <span>管理</span>
            </a>
            <a 
              href="/admin/products/add"
              className="px-3 py-1 bg-green-100 text-green-600 rounded-full text-xs hover:bg-green-200 transition-colors flex items-center space-x-1"
            >
              <span>➕</span>
              <span>新增</span>
            </a>
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