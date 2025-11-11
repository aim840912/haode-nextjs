import Link from 'next/link'
import { Heart } from 'lucide-react'
import { OptimizedImage } from '@/components/ui/image/OptimizedImage'
import { LoadingSpinner } from '@/components/ui/loading/LoadingSpinner'
import type { Product } from '@/types/product'

interface InterestsTabProps {
  products: Product[]
  loading: boolean
  onRemove: (productId: string, productName: string) => void
}

/**
 * 收藏分頁元件
 * 顯示使用者收藏的產品列表
 */
export function InterestsTab({ products, loading, onRemove }: InterestsTabProps) {
  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex justify-center py-12">
          <LoadingSpinner size="lg" />
        </div>
      </div>
    )
  }

  if (products.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="text-center py-12">
          <Heart
            className="w-16 h-16 mx-auto mb-4 text-green-500 fill-green-500"
            strokeWidth={1.5}
          />
          <h3 className="text-xl font-medium text-gray-900 mb-2">尚無收藏的產品</h3>
          <p className="text-gray-600 mb-4">探索產品頁面，收藏您喜愛的商品吧！</p>
          <Link
            href="/products"
            className="inline-block px-6 py-2 bg-amber-900 text-white rounded-lg hover:bg-amber-800 transition-colors"
          >
            瀏覽產品
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">收藏清單</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {products.map(product => (
          <div
            key={product.id}
            className="border rounded-lg overflow-hidden hover:shadow-lg transition-shadow"
          >
            <Link href={`/products/${product.id}`}>
              <div className="relative aspect-square">
                <OptimizedImage
                  src={product.productImages?.[0]?.storage_url || '/placeholder.png'}
                  alt={product.name}
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                />
              </div>
            </Link>
            <div className="p-4">
              <Link href={`/products/${product.id}`}>
                <h3 className="text-lg font-semibold text-gray-900 mb-2 hover:text-amber-900 transition-colors">
                  {product.name}
                </h3>
              </Link>
              <p className="text-gray-600 text-sm mb-3 line-clamp-2">{product.description}</p>
              <div className="flex items-center justify-between">
                <p className="text-xl font-bold text-amber-900">
                  NT$ {product.price.toLocaleString()}
                  <span className="text-sm text-gray-600 ml-1">/ {product.priceUnit}</span>
                </p>
                <button
                  onClick={() => onRemove(product.id, product.name)}
                  className="text-red-600 hover:text-red-700 text-sm font-medium"
                >
                  移除
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
