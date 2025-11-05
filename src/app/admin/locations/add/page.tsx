'use client'

import { useState } from 'react'
import Link from 'next/link'
import dynamic from 'next/dynamic'
import { v4 as uuidv4 } from 'uuid'
import { useAuth } from '@/contexts/AuthContext'
import { AdminPageLoader } from '@/components/ui/loading/PageLoader'
import AdminProtection from '@/components/features/admin/AdminProtection'
import { useLocationForm } from '@/hooks/location/useLocationForm'
import { LocationBasicInfo } from '@/components/features/location/LocationBasicInfo'
import { LocationContactInfo } from '@/components/features/location/LocationContactInfo'
import { LocationTransportInfo } from '@/components/features/location/LocationTransportInfo'
import { LocationFeatures } from '@/components/features/location/LocationFeatures'
import { LocationSpecialties } from '@/components/features/location/LocationSpecialties'
import { LocationPreview } from '@/components/features/location/LocationPreview'
import { FormMessage } from '@/components/features/location/FormMessage'
import { ProductImage } from '@/types/product'

// 動態載入圖片管理器，減少初始 bundle 大小
const ProductImageManager = dynamic(
  () => import('@/components/features/products/ProductImageManager'),
  {
    loading: () => (
      <div className="h-32 bg-gray-100 dark:bg-slate-700 rounded-lg flex items-center justify-center text-gray-900 dark:text-gray-100">
        載入圖片管理器...
      </div>
    ),
    ssr: false,
  }
)

export default function AddLocation() {
  const [locationId] = useState(() => uuidv4())
  const { user, isLoading } = useAuth()
  const [images, setImages] = useState<ProductImage[]>([])

  // 使用 custom hooks
  const {
    formData,
    fieldErrors,
    submitError,
    submitSuccess,
    loading,
    handleInputChange,
    handleFieldBlur,
    handleSubmit,
    addFeatureField,
    removeFeatureField,
    updateFeatureField,
    addSpecialtyField,
    removeSpecialtyField,
    updateSpecialtyField,
  } = useLocationForm(locationId)

  // 處理圖片變更
  const handleImagesChange = (newImages: ProductImage[]) => {
    setImages(newImages)
  }

  // 載入中狀態
  if (isLoading) {
    return (
      <AdminProtection>
        <AdminPageLoader message="載入門市管理介面中..." />
      </AdminProtection>
    )
  }

  // 未登入檢查
  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-slate-900 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto px-6">
          <div className="text-6xl mb-8">🔒</div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-4">需要登入</h1>
          <p className="text-gray-600 dark:text-gray-300 mb-8">此頁面需要管理員權限才能存取</p>
          <div className="space-x-4">
            <Link
              href="/login"
              className="inline-block bg-amber-900 dark:bg-amber-800 text-white px-6 py-3 rounded-lg hover:bg-amber-800 dark:hover:bg-amber-700 transition-colors"
            >
              立即登入
            </Link>
            <Link
              href="/"
              className="inline-block border border-gray-300 dark:border-slate-600 text-gray-700 dark:text-gray-300 px-6 py-3 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors"
            >
              回到首頁
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-900 pt-24">
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="mb-8">
          <div className="flex items-center space-x-4 mb-4">
            <Link
              href="/admin/locations"
              className="text-amber-600 dark:text-amber-400 hover:text-amber-800 dark:hover:text-amber-300"
            >
              ← 回到門市管理
            </Link>
          </div>
          <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-100">新增門市</h1>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Form */}
          <form
            onSubmit={e => handleSubmit(e, images)}
            noValidate
            className="bg-white dark:bg-slate-800 rounded-lg shadow-md p-6 space-y-6"
          >
            {/* 錯誤訊息顯示 */}
            <FormMessage message={submitError} type="error" />

            {/* 成功訊息顯示 */}
            <FormMessage message={submitSuccess} type="success" />

            {/* 基本資訊 */}
            <LocationBasicInfo
              formData={formData}
              fieldErrors={fieldErrors}
              onInputChange={handleInputChange}
              onFieldBlur={handleFieldBlur}
            />

            {/* 聯絡資訊 */}
            <LocationContactInfo
              formData={formData}
              fieldErrors={fieldErrors}
              onInputChange={handleInputChange}
              onFieldBlur={handleFieldBlur}
            />

            {/* 交通資訊 */}
            <LocationTransportInfo formData={formData} onInputChange={handleInputChange} />

            {/* 特色服務 */}
            <LocationFeatures
              features={formData.features}
              onAdd={addFeatureField}
              onRemove={removeFeatureField}
              onUpdate={updateFeatureField}
            />

            {/* 主打商品 */}
            <LocationSpecialties
              specialties={formData.specialties}
              onAdd={addSpecialtyField}
              onRemove={removeSpecialtyField}
              onUpdate={updateSpecialtyField}
            />

            {/* 其他設定 */}
            <div>
              <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-4">
                其他設定
              </h3>

              {/* 圖片上傳 */}
              <div className="mb-4">
                <label className="block text-sm font-semibold text-gray-800 dark:text-gray-100 mb-3">
                  門市圖片 (選填)
                </label>
                <ProductImageManager
                  productId={locationId}
                  onImagesChange={handleImagesChange}
                  maxImages={1}
                  mode="memory"
                  className="mb-4"
                />
                {images.length > 0 && (
                  <div className="mt-2 text-sm text-green-600 dark:text-green-400">
                    ✓ 已選擇 {images.length} 張圖片
                  </div>
                )}
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  name="isMain"
                  checked={formData.isMain}
                  onChange={handleInputChange}
                  className="h-4 w-4 text-amber-600 focus:ring-amber-500 border-gray-300 dark:border-slate-600 rounded bg-white dark:bg-slate-700"
                />
                <label className="ml-2 block text-sm font-medium text-gray-800 dark:text-gray-100">
                  設為總店
                </label>
              </div>
            </div>

            {/* 提交按鈕 */}
            <div className="flex justify-end space-x-4 pt-6">
              <Link
                href="/admin/locations"
                className="px-6 py-2 border border-gray-300 dark:border-slate-600 rounded-md text-gray-800 dark:text-gray-100 font-medium hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors"
              >
                取消
              </Link>
              <button
                type="submit"
                disabled={loading}
                className="px-6 py-2 bg-amber-900 dark:bg-amber-800 text-white rounded-md hover:bg-amber-800 dark:hover:bg-amber-700 transition-colors disabled:opacity-50"
              >
                {loading ? '新增中...' : '新增門市'}
              </button>
            </div>
          </form>

          {/* Preview */}
          <LocationPreview
            formData={formData}
            uploadedImageUrl={images.length > 0 ? images[0].storage_url : ''}
          />
        </div>
      </div>
    </div>
  )
}
