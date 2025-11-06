'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import dynamic from 'next/dynamic'
import AdminProtection from '@/components/features/admin/AdminProtection'
import TimeRangePicker from '@/components/ui/form/TimeRangePicker'
import WeekdaySelector from '@/components/ui/form/WeekdaySelector'
import { formatClosedDays } from '@/hooks/location/useLocationForm'
import { extractStoragePathFromUrl } from '@/lib/utils/image-url-utils'
import { logger } from '@/lib/logger'
import { useLocationForm } from './hooks/useLocationForm'
import { BasicInfoSection } from './components/BasicInfoSection'

const ImageUploader = dynamic(() => import('@/components/features/products/ImageUploader'), {
  loading: () => (
    <div className="h-32 bg-gray-100 dark:bg-slate-700 rounded-lg flex items-center justify-center text-gray-900 dark:text-gray-100">
      載入圖片上傳器...
    </div>
  ),
  ssr: false,
})

export default function EditLocation({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter()
  const [locationId, setLocationId] = useState<string>('')

  const {
    formData,
    loading,
    initialLoading,
    uploadedImages,
    existingImages,
    imagePaths,
    setLoading,
    fetchLocation,
    handleInputChange,
    updateFeatureField,
    addFeatureField,
    removeFeatureField,
    updateSpecialtyField,
    addSpecialtyField,
    removeSpecialtyField,
    handleImageUploadSuccess,
    handleImageUploadError,
  } = useLocationForm()

  useEffect(() => {
    params.then(({ id }) => {
      setLocationId(id)
      fetchLocation(id)
    })
  }, [params, fetchLocation])

  if (initialLoading) {
    return (
      <AdminProtection>
        <div className="min-h-screen bg-gray-50 dark:bg-slate-900 flex items-center justify-center">
          <div className="text-center text-gray-900 dark:text-gray-100">載入中...</div>
        </div>
      </AdminProtection>
    )
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      let imageUrl = ''
      if (uploadedImages.length > 0) {
        imageUrl = uploadedImages[0]
      } else if (existingImages.length > 0) {
        imageUrl = existingImages[0]
      }

      const response = await fetch(`/api/locations/${locationId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          image: imageUrl,
          features: formData.features.filter(feature => feature.trim() !== ''),
          specialties: formData.specialties.filter(specialty => specialty.trim() !== ''),
          coordinates:
            formData.coordinates.lat || formData.coordinates.lng
              ? formData.coordinates
              : { lat: 23.5519, lng: 120.5564 },
        }),
      })
      const result = await response.json()

      if (result.success) {
        router.push('/admin/locations')
      } else {
        alert(result.error || '更新失敗')
      }
    } catch (error) {
      logger.error(
        'Error updating location:',
        error instanceof Error ? error : new Error('Unknown error')
      )
      alert('更新失敗')
    } finally {
      setLoading(false)
    }
  }

  const handleImageDelete = async () => {
    if (!locationId || !formData.image) {
      alert('沒有圖片可以刪除')
      return
    }

    if (!confirm('確定要刪除這張圖片嗎？')) {
      return
    }

    let actualPath = imagePaths.get(formData.image)
    if (!actualPath) {
      actualPath = extractStoragePathFromUrl(formData.image)
    }

    if (!actualPath) {
      alert('無法確定檔案路徑，刪除失敗')
      return
    }

    // 實作圖片刪除邏輯（簡化版）
    alert('圖片刪除功能需要完整實作')
  }

  return (
    <AdminProtection>
      <div className="min-h-screen bg-gray-50 dark:bg-slate-900 pt-24">
        <div className="max-w-4xl mx-auto px-4 py-8">
          <div className="mb-8">
            <Link
              href="/admin/locations"
              className="text-purple-600 dark:text-purple-400 hover:text-purple-800 dark:hover:text-purple-300"
            >
              ← 回到門市管理
            </Link>
            <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-100 mt-4">編輯門市</h1>
          </div>

          <form
            onSubmit={handleSubmit}
            className="bg-white dark:bg-slate-800 rounded-lg shadow-md p-8 space-y-8"
          >
            {/* 基本資訊 */}
            <BasicInfoSection formData={formData} handleInputChange={handleInputChange} />

            {/* 營業時間 */}
            <div className="space-y-6">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">營業時間</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-800 dark:text-gray-100 mb-2">
                    營業時間
                  </label>
                  <TimeRangePicker
                    value={formData.hours}
                    onChange={value =>
                      handleInputChange({ target: { name: 'hours', value } } as any)
                    }
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-800 dark:text-gray-100 mb-2">
                    公休日
                  </label>
                  <WeekdaySelector
                    value={formData.closedDays}
                    onChange={value =>
                      handleInputChange({
                        target: { name: 'closedDays', value, type: 'array' },
                      } as any)
                    }
                  />
                </div>
              </div>
            </div>

            {/* 交通資訊 */}
            <div className="space-y-6">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">交通資訊</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-800 dark:text-gray-100 mb-2">
                    停車資訊
                  </label>
                  <textarea
                    name="parking"
                    value={formData.parking}
                    onChange={handleInputChange}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 text-gray-900 dark:text-gray-100 bg-white dark:bg-slate-700"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-800 dark:text-gray-100 mb-2">
                    大眾運輸
                  </label>
                  <textarea
                    name="publicTransport"
                    value={formData.publicTransport}
                    onChange={handleInputChange}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 text-gray-900 dark:text-gray-100 bg-white dark:bg-slate-700"
                  />
                </div>
              </div>
            </div>

            {/* 門市特色 */}
            <div className="space-y-6">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">門市特色</h2>
              <div className="space-y-3">
                {formData.features.map((feature, index) => (
                  <div key={index} className="flex gap-2">
                    <input
                      type="text"
                      value={feature}
                      onChange={e => updateFeatureField(index, e.target.value)}
                      className="flex-1 px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 text-gray-900 dark:text-gray-100 bg-white dark:bg-slate-700"
                      placeholder="例如：提供試吃服務"
                    />
                    {formData.features.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeFeatureField(index)}
                        className="px-4 py-2 text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300"
                      >
                        刪除
                      </button>
                    )}
                  </div>
                ))}
                <button
                  type="button"
                  onClick={addFeatureField}
                  className="text-purple-600 dark:text-purple-400 hover:text-purple-800 dark:hover:text-purple-300 text-sm"
                >
                  + 新增特色
                </button>
              </div>
            </div>

            {/* 特色產品 */}
            <div className="space-y-6">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">特色產品</h2>
              <div className="space-y-3">
                {formData.specialties.map((specialty, index) => (
                  <div key={index} className="flex gap-2">
                    <input
                      type="text"
                      value={specialty}
                      onChange={e => updateSpecialtyField(index, e.target.value)}
                      className="flex-1 px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 text-gray-900 dark:text-gray-100 bg-white dark:bg-slate-700"
                      placeholder="例如：梅山紅肉李"
                    />
                    {formData.specialties.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeSpecialtyField(index)}
                        className="px-4 py-2 text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300"
                      >
                        刪除
                      </button>
                    )}
                  </div>
                ))}
                <button
                  type="button"
                  onClick={addSpecialtyField}
                  className="text-purple-600 dark:text-purple-400 hover:text-purple-800 dark:hover:text-purple-300 text-sm"
                >
                  + 新增產品
                </button>
              </div>
            </div>

            {/* 圖片上傳 */}
            <div className="space-y-6">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">門市圖片</h2>
              <ImageUploader
                productId={locationId}
                initialImages={existingImages}
                maxFiles={1}
                onUploadSuccess={handleImageUploadSuccess}
                onUploadError={handleImageUploadError}
                module="locations"
              />
            </div>

            {/* 提交按鈕 */}
            <div className="flex justify-end space-x-4 pt-6">
              <Link
                href="/admin/locations"
                className="px-6 py-2 border border-gray-300 dark:border-slate-600 rounded-md text-gray-800 dark:text-gray-100 hover:bg-gray-50 dark:hover:bg-slate-700"
              >
                取消
              </Link>
              <button
                type="submit"
                disabled={loading}
                className="px-6 py-2 bg-purple-600 dark:bg-purple-700 text-white rounded-md hover:bg-purple-700 dark:hover:bg-purple-600 disabled:opacity-50"
              >
                {loading ? '更新中...' : '更新門市'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </AdminProtection>
  )
}
