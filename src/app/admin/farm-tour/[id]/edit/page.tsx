'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { AdminProtection } from '@/components/features/admin/AdminProtection'
import { ActivityListManager } from '@/components/features/farm-tour/edit/ActivityListManager'
import { ActivityPreview } from '@/components/features/farm-tour/edit/ActivityPreview'
import { BasicInfoSection } from '@/components/features/farm-tour/edit/BasicInfoSection'
import { ImageManagementSection } from '@/components/features/farm-tour/edit/ImageManagementSection'
import { PriceSection } from '@/components/features/farm-tour/edit/PriceSection'
import { useFarmTourEditReducer } from '@/hooks/useFarmTourEditReducer'
import { logger } from '@/lib/logger'
import { FarmTourActivity } from '@/types/farmTour'

// Extracted Components

export default function EditFarmTourActivity({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter()
  const { state, actions } = useFarmTourEditReducer()

  const [formData, setFormData] = useState({
    start_month: 1,
    end_month: 12,
    title: '',
    activities: [''],
    price: 0,
    image: '',
    available: true,
    note: '',
  })

  const fetchActivity = useCallback(
    async (id: string) => {
      try {
        const response = await fetch(`/api/farm-tour/${id}`)
        const result = await response.json()

        if (response.ok && (result.success ? result.data : result)) {
          const activity: FarmTourActivity = result.success ? result.data : result
          setFormData({
            start_month: activity.start_month || 1,
            end_month: activity.end_month || 12,
            title: activity.title || '',
            activities: activity.activities || [''],
            price: activity.price || 0,
            image: activity.image || '',
            available: activity.available ?? true,
            note: activity.note || '',
          })

          // 使用 reducer action 載入活動資料
          actions.loadActivitySuccess(id, activity.image)
        } else {
          const errorMessage = result.error || '活動不存在'
          alert(errorMessage)
          router.push('/admin/farm-tour')
        }
      } catch (error) {
        logger.error(
          'Error fetching activity:',
          error instanceof Error ? error : new Error('Unknown error')
        )
        alert('載入失敗')
        actions.setInitialLoading(false)
      }
    },
    [router, actions]
  )

  useEffect(() => {
    params.then(({ id }) => {
      actions.setActivityId(id)
      fetchActivity(id)
    })
  }, [params, fetchActivity, actions])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    actions.setLoading(true)

    try {
      // 決定要使用的圖片 URL：優先使用新上傳的圖片，否則使用現有圖片（除非已刪除）
      let imageUrl = ''
      if (state.uploadedImages.length > 0) {
        imageUrl = state.uploadedImages[0]
        logger.info('使用新上傳的圖片', {
          metadata: { imageUrl, activityId: state.activityId },
        })
      } else if (state.existingImages.length > 0 && !state.imageDeleted) {
        imageUrl = state.existingImages[0]
        logger.info('保持現有圖片', {
          metadata: { imageUrl, activityId: state.activityId },
        })
      } else if (state.imageDeleted) {
        imageUrl = ''
        logger.info('圖片已刪除，將清空資料庫圖片欄位', {
          metadata: { activityId: state.activityId },
        })
      }

      const response = await fetch(`/api/farm-tour/${state.activityId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          image: imageUrl,
          activities: formData.activities.filter(activity => activity.trim() !== ''),
        }),
      })
      const result = await response.json()

      if (result.success) {
        router.push('/admin/farm-tour')
      } else {
        const errorMessage = result.error || '更新失敗'
        alert(errorMessage)
      }
    } catch (error) {
      logger.error(
        'Error updating farm tour activity:',
        error instanceof Error ? error : new Error('Unknown error')
      )
      alert(error instanceof Error ? error.message : '更新失敗')
    } finally {
      actions.setLoading(false)
    }
  }

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value, type } = e.target
    setFormData(prev => ({
      ...prev,
      [name]:
        type === 'number'
          ? Number(value)
          : type === 'checkbox'
            ? (e.target as HTMLInputElement).checked
            : value,
    }))
  }

  // 處理圖片上傳成功
  const handleImageUploadSuccess = (
    images: {
      id: string
      url?: string
      path: string
      size: 'thumbnail' | 'medium' | 'large'
      file?: File
      preview?: string
      position: number
      alt?: string
    }[]
  ) => {
    const urls = images.map(img => img.url || img.path).filter(Boolean)
    actions.setUploadedImages(urls)
    if (urls.length > 0) {
      setFormData(prev => ({ ...prev, image: urls[0] }))
      logger.info('圖片上傳成功', {
        metadata: { imageUrl: urls[0], activityId: state.activityId },
      })
    }
  }

  // 處理圖片上傳錯誤
  const handleImageUploadError = (error: string) => {
    logger.error('圖片上傳失敗', new Error(error), {
      metadata: { activityId: state.activityId },
    })
    alert(`圖片上傳失敗: ${error}`)
  }

  // 處理刪除現有圖片
  const handleDeleteExistingImage = () => {
    if (confirm('確定要刪除現有圖片嗎？刪除後可以上傳新圖片。')) {
      actions.deleteExistingImage()
      setFormData(prev => ({ ...prev, image: '' }))
      logger.info('現有圖片已標記為刪除', {
        metadata: { activityId: state.activityId, previousImage: state.existingImages[0] },
      })
    }
  }

  if (state.initialLoading) {
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
      <div className="min-h-screen bg-gray-50 dark:bg-slate-900 pt-24">
        <div className="max-w-6xl mx-auto px-4 py-8">
          <div className="mb-8">
            <div className="flex items-center space-x-4 mb-4">
              <Link
                href="/admin/farm-tour"
                className="text-green-600 dark:text-green-400 hover:text-green-800 dark:hover:text-green-300"
              >
                ← 回到果園管理
              </Link>
            </div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">編輯體驗活動</h1>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Form */}
            <form
              onSubmit={handleSubmit}
              className="bg-white dark:bg-slate-800 rounded-lg shadow-md p-6 space-y-6"
            >
              {/* 基本資訊 */}
              <BasicInfoSection
                startMonth={formData.start_month}
                endMonth={formData.end_month}
                title={formData.title}
                onStartMonthChange={month => setFormData(prev => ({ ...prev, start_month: month }))}
                onEndMonthChange={month => setFormData(prev => ({ ...prev, end_month: month }))}
                onTitleChange={title => setFormData(prev => ({ ...prev, title }))}
              />

              {/* 活動內容 */}
              <ActivityListManager
                activities={formData.activities}
                onActivitiesChange={activities => setFormData(prev => ({ ...prev, activities }))}
              />

              {/* 費用設定 */}
              <PriceSection
                price={formData.price}
                onPriceChange={price => setFormData(prev => ({ ...prev, price }))}
              />

              {/* 其他設定 */}
              <div>
                <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-4">
                  其他設定
                </h3>

                {/* 活動圖片 */}
                <ImageManagementSection
                  activityId={state.activityId}
                  existingImages={state.existingImages}
                  uploadedImages={state.uploadedImages}
                  imageDeleted={state.imageDeleted}
                  onDeleteExistingImage={handleDeleteExistingImage}
                  onImageUploadSuccess={handleImageUploadSuccess}
                  onImageUploadError={handleImageUploadError}
                />

                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-100 mb-2">
                    注意事項
                  </label>
                  <textarea
                    name="note"
                    value={formData.note}
                    onChange={handleInputChange}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 text-gray-900 dark:text-gray-100 bg-white dark:bg-slate-700"
                    placeholder="輸入參加注意事項"
                  />
                </div>

                <div>
                  <label className="flex items-center text-gray-700 dark:text-gray-200">
                    <input
                      type="checkbox"
                      name="available"
                      checked={formData.available}
                      onChange={handleInputChange}
                      className="mr-2"
                    />
                    開放預約
                  </label>
                </div>
              </div>

              {/* 提交按鈕 */}
              <div className="flex justify-end space-x-4 pt-6">
                <Link
                  href="/admin/farm-tour"
                  className="px-6 py-2 border border-gray-300 dark:border-slate-600 rounded-md text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors"
                >
                  取消
                </Link>
                <button
                  type="submit"
                  disabled={state.loading}
                  className="px-6 py-2 bg-green-600 dark:bg-green-700 text-white rounded-md hover:bg-green-700 dark:hover:bg-green-600 transition-colors disabled:opacity-50"
                >
                  {state.loading ? '更新中...' : '更新活動'}
                </button>
              </div>
            </form>

            {/* Preview */}
            <ActivityPreview
              title={formData.title}
              startMonth={formData.start_month}
              endMonth={formData.end_month}
              price={formData.price}
              activities={formData.activities}
              note={formData.note}
              available={formData.available}
              imageUrl={state.uploadedImages[0] || state.existingImages[0]}
            />
          </div>
        </div>
      </div>
    </AdminProtection>
  )
}
