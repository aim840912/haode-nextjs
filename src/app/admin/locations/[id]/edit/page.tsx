'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { AdminProtection } from '@/components/features/admin/AdminProtection'
import { BasicInfoSection } from './components/BasicInfoSection'
import { BusinessHoursSection } from './components/BusinessHoursSection'
import { FeaturesSection } from './components/FeaturesSection'
import { ImageUploadSection } from './components/ImageUploadSection'
import { SpecialtiesSection } from './components/SpecialtiesSection'
import { TransportSection } from './components/TransportSection'
import { useLocationForm } from '@/hooks/forms/useLocationForm'
import { useLocationFormSubmit } from '@/hooks/forms/useLocationFormSubmit'
import { useLocationFormValidation } from '@/hooks/forms/useLocationFormValidation'

export default function EditLocation({ params }: { params: Promise<{ id: string }> }) {
  const [locationId, setLocationId] = useState<string>('')
  const [errors, setErrors] = useState<Record<string, string>>({})

  // Custom hooks
  const {
    formData,
    initialLoading,
    uploadedImages,
    existingImages,
    imagePaths,
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

  const { handleSubmit, isSubmitting } = useLocationFormSubmit({
    locationId,
    uploadedImages,
    existingImages,
    imagePaths,
  })

  const { validate, hasErrors } = useLocationFormValidation()

  // 獲取門市 ID 並載入資料
  useEffect(() => {
    params.then(({ id }) => {
      setLocationId(id)
      fetchLocation(id)
    })
  }, [params, fetchLocation])

  // 表單提交處理
  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // 驗證表單
    const validationErrors = validate(formData)
    if (hasErrors(validationErrors)) {
      setErrors(validationErrors)
      return
    }

    // 清除錯誤
    setErrors({})

    // 提交表單
    const result = await handleSubmit(formData)
    if (!result.success) {
      alert(result.error || '更新失敗，請稍後再試')
    }
  }

  // 載入中狀態
  if (initialLoading) {
    return (
      <AdminProtection>
        <div className="min-h-screen bg-gray-50 dark:bg-slate-900 flex items-center justify-center">
          <div className="text-center text-gray-900 dark:text-gray-100">載入中...</div>
        </div>
      </AdminProtection>
    )
  }

  return (
    <AdminProtection>
      <div className="min-h-screen bg-gray-50 dark:bg-slate-900 py-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* 頁面標題 */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">編輯門市</h1>
            <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
              更新門市資訊，包括基本資料、營業時間、交通資訊等
            </p>
          </div>

          {/* 表單 */}
          <form
            onSubmit={onSubmit}
            className="bg-white dark:bg-slate-800 rounded-lg shadow-md p-8 space-y-8"
          >
            {/* 基本資訊 */}
            <BasicInfoSection
              formData={formData}
              handleInputChange={handleInputChange}
              errors={errors}
            />

            {/* 營業時間 */}
            <BusinessHoursSection
              hours={formData.hours}
              closedDays={formData.closedDays}
              onHoursChange={value =>
                handleInputChange({ target: { name: 'hours', value } } as any)
              }
              onClosedDaysChange={value =>
                handleInputChange({ target: { name: 'closedDays', value, type: 'array' } } as any)
              }
              errors={errors}
            />

            {/* 交通資訊 */}
            <TransportSection
              parking={formData.parking}
              publicTransport={formData.publicTransport}
              onParkingChange={value =>
                handleInputChange({ target: { name: 'parking', value } } as any)
              }
              onPublicTransportChange={value =>
                handleInputChange({ target: { name: 'publicTransport', value } } as any)
              }
              errors={errors}
            />

            {/* 門市特色 */}
            <FeaturesSection
              features={formData.features}
              onFeatureUpdate={updateFeatureField}
              onFeatureAdd={addFeatureField}
              onFeatureRemove={removeFeatureField}
              errors={errors}
            />

            {/* 特色產品 */}
            <SpecialtiesSection
              specialties={formData.specialties}
              onSpecialtyUpdate={updateSpecialtyField}
              onSpecialtyAdd={addSpecialtyField}
              onSpecialtyRemove={removeSpecialtyField}
              errors={errors}
            />

            {/* 圖片上傳 */}
            <ImageUploadSection
              locationId={locationId}
              existingImages={existingImages}
              onUploadSuccess={handleImageUploadSuccess}
              onUploadError={handleImageUploadError}
            />

            {/* 提交按鈕 */}
            <div className="flex justify-end space-x-4 pt-6">
              <Link
                href="/admin/locations"
                className="px-6 py-2 border border-gray-300 dark:border-slate-600 rounded-md text-gray-800 dark:text-gray-100 hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors"
              >
                取消
              </Link>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-6 py-2 bg-purple-600 dark:bg-purple-700 text-white rounded-md hover:bg-purple-700 dark:hover:bg-purple-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isSubmitting ? '更新中...' : '更新門市'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </AdminProtection>
  )
}
