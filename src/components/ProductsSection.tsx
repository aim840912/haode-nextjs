'use client'

import { useState, useEffect } from 'react'
import { Product } from '@/types/product'
import { useAuth } from '@/lib/auth-context'
import { ComponentErrorBoundary } from '@/components/ErrorBoundary'
import { ProductCardSkeleton } from '@/components/LoadingSkeleton'

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
      
      // 只顯示活躍的產品，最多4個
      const activeProducts = data.filter((p: Product) => p.isActive).slice(0, 4)
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
          <div className="grid md:grid-cols-4 gap-8">
            {Array.from({ length: 4 }).map((_, i) => (
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
    <section id="products" className="py-20 px-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-center mb-16">
          <h2 className="text-4xl font-light text-amber-900 mb-4 md:mb-0">經典產品</h2>
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
        
        {products.length > 0 ? (
          <div className="grid md:grid-cols-4 gap-8">
            {products.map((product) => (
              <div key={product.id} className="bg-white rounded-lg shadow-lg overflow-hidden hover:shadow-xl transition-all duration-300 transform hover:scale-105">
                <div className="aspect-square relative overflow-hidden rounded-lg">
                  <img 
                    src={product.images[0] || "/images/placeholder.jpg"} 
                    alt={product.name} 
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="p-6">
                  <h3 className="font-semibold text-gray-800 mb-2">{product.name}</h3>
                  <p className="text-sm text-gray-600 mb-3">{product.description}</p>
                  <div className="flex justify-between items-center mb-4">
                    <span className="text-lg font-bold text-amber-900">NT$ {product.price}</span>
                    <span className="text-sm text-gray-500">庫存 {product.inventory}</span>
                  </div>
                  <a 
                    href="/products"
                    className="inline-block bg-amber-900 text-white px-4 py-2 rounded-full text-sm hover:bg-amber-800 transition-colors w-full text-center"
                  >
                    查看商品
                  </a>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center text-gray-600">
            <p className="mb-4">目前沒有上架的產品</p>
            {user && (
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