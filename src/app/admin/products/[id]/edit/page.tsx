'use client'

import { useEffect, useState } from 'react'
import dynamic from 'next/dynamic'
import Link from 'next/link'
import { AdminProtection } from '@/components/features/admin/AdminProtection'
import { AdminPageLoader } from '@/components/ui/loading/PageLoader'
import { useAuth } from '@/contexts/AuthContext'
import { BasicInfoSection } from './components/BasicInfoSection'
import { PriceInventorySection } from './components/PriceInventorySection'
import { useProductForm } from './hooks/useProductForm'

const ProductImageManager = dynamic(
  () =>
    import('@/components/features/products/ProductImageManager').then(
      mod => mod.ProductImageManager
    ),
  {
    loading: () => (
      <div className="h-32 bg-gray-100 rounded-lg flex items-center justify-center">
        載入圖片管理器...
      </div>
    ),
    ssr: false,
  }
)

export default function EditProduct({ params }: { params: Promise<{ id: string }> }) {
  const [productId, setProductId] = useState<string>('')
  const { user, isLoading: authLoading } = useAuth()

  const {
    formData,
    loading,
    initialLoading,
    categories,
    hasPendingImageChanges,
    submitStatus,
    submitError,
    submitSuccess,
    setHasPendingImageChanges,
    fetchCategories,
    fetchProduct,
    handleInputChange,
    handleSubmit,
  } = useProductForm(productId)

  useEffect(() => {
    params.then(({ id }) => {
      setProductId(id)
      fetchProduct(id)
      fetchCategories()
    })
  }, [params, fetchProduct, fetchCategories])

  if (authLoading || initialLoading) {
    return <AdminPageLoader />
  }

  if (!user) {
    return null
  }

  return (
    <AdminProtection>
      <div className="min-h-screen bg-gray-50 pt-24">
        <div className="max-w-4xl mx-auto px-4 py-8">
          <div className="mb-8">
            <Link href="/admin/products" className="text-purple-600 hover:text-purple-800">
              ← 回到產品管理
            </Link>
            <h1 className="text-3xl font-bold text-gray-800 mt-4">編輯產品</h1>
          </div>

          {/* 錯誤訊息 */}
          {submitError && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-md">
              <p className="text-red-800">{submitError}</p>
            </div>
          )}

          {/* 成功訊息 */}
          {submitSuccess && (
            <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-md">
              <p className="text-green-800">{submitSuccess}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-md p-8 space-y-8">
            {/* 基本資訊 */}
            <BasicInfoSection
              formData={formData}
              categories={categories}
              handleInputChange={handleInputChange}
            />

            {/* 價格與庫存 */}
            <PriceInventorySection formData={formData} handleInputChange={handleInputChange} />

            {/* 產品圖片 */}
            <div className="space-y-6">
              <h2 className="text-xl font-semibold text-gray-900">產品圖片</h2>
              <ProductImageManager
                productId={productId}
                onPendingChanges={hasPending => {
                  setHasPendingImageChanges(hasPending)
                }}
              />
              {hasPendingImageChanges && (
                <div className="text-sm text-amber-600 bg-amber-50 p-3 rounded-md">
                  ⚠️ 您有未儲存的圖片變更，點擊「更新產品」按鈕後會一併儲存
                </div>
              )}
            </div>

            {/* 提交按鈕 */}
            <div className="flex justify-end space-x-4 pt-6">
              <Link
                href="/admin/products"
                className="px-6 py-2 border border-gray-300 rounded-md text-gray-800 hover:bg-gray-50 transition-colors"
              >
                取消
              </Link>
              <button
                type="submit"
                disabled={loading || submitStatus === 'submitting'}
                className="px-6 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submitStatus === 'submitting' ? '更新中...' : '更新產品'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </AdminProtection>
  )
}
