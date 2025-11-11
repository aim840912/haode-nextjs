'use client'

import { useState, useEffect, useCallback } from 'react'
import dynamic from 'next/dynamic'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { v4 as uuidv4 } from 'uuid'
import { AdminProtection } from '@/components/features/admin/AdminProtection'
import { useFarmTourEditReducer } from '@/hooks/useFarmTourEditReducer'
import { logger } from '@/lib/logger'
import { FarmTourActivity } from '@/types/farmTour'

// 動態載入圖片上傳器
const ImageUploader = dynamic(
  () => import('@/components/features/products/ImageUploader').then(mod => mod.ImageUploader),
  {
    loading: () => (
      <div className="h-32 bg-gray-100 dark:bg-slate-700 rounded-lg flex items-center justify-center text-gray-900 dark:text-gray-100">
        載入圖片上傳器...
      </div>
    ),
    ssr: false,
  }
)

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

  // 月份選項 (1-12)
  const monthOptions = Array.from({ length: 12 }, (_, i) => ({
    value: i + 1,
    label: `${i + 1}月`,
  }))

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
        imageUrl = state.uploadedImages[0] // 使用新上傳的圖片
        logger.info('使用新上傳的圖片', {
          metadata: { imageUrl, activityId: state.activityId },
        })
      } else if (state.existingImages.length > 0 && !state.imageDeleted) {
        imageUrl = state.existingImages[0] // 保持現有圖片（如果沒有被刪除）
        logger.info('保持現有圖片', {
          metadata: { imageUrl, activityId: state.activityId },
        })
      } else if (state.imageDeleted) {
        imageUrl = '' // 圖片已被刪除，設為空字串
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

  const addActivityField = () => {
    setFormData(prev => ({
      ...prev,
      activities: [...prev.activities, ''],
    }))
  }

  const removeActivityField = (index: number) => {
    setFormData(prev => ({
      ...prev,
      activities: prev.activities.filter((_, i) => i !== index),
    }))
  }

  const updateActivityField = (index: number, value: string) => {
    setFormData(prev => ({
      ...prev,
      activities: prev.activities.map((activity, i) => (i === index ? value : activity)),
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
              <div>
                <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-4">
                  基本資訊
                </h3>

                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-100 mb-2">
                      開始月份 *
                    </label>
                    <select
                      name="start_month"
                      value={formData.start_month}
                      onChange={handleInputChange}
                      required
                      className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 text-gray-900 dark:text-gray-100 bg-white dark:bg-slate-700"
                    >
                      {monthOptions.map(option => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-100 mb-2">
                      結束月份 *
                    </label>
                    <select
                      name="end_month"
                      value={formData.end_month}
                      onChange={handleInputChange}
                      required
                      className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 text-gray-900 dark:text-gray-100 bg-white dark:bg-slate-700"
                    >
                      {monthOptions.map(option => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-100 mb-2">
                    活動標題 *
                  </label>
                  <input
                    type="text"
                    name="title"
                    value={formData.title}
                    onChange={handleInputChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 text-gray-900 dark:text-gray-100 bg-white dark:bg-slate-700"
                    placeholder="輸入體驗活動標題"
                  />
                </div>
              </div>

              {/* 活動內容 */}
              <div>
                <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-4">
                  活動內容
                </h3>

                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-100 mb-2">
                    活動項目
                  </label>
                  {formData.activities.map((activity, index) => (
                    <div key={index} className="flex gap-2 mb-2">
                      <input
                        type="text"
                        value={activity}
                        onChange={e => updateActivityField(index, e.target.value)}
                        className="flex-1 px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 text-gray-900 dark:text-gray-100 bg-white dark:bg-slate-700"
                        placeholder="輸入活動項目"
                      />
                      {formData.activities.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeActivityField(index)}
                          className="px-3 py-2 bg-red-600 dark:bg-red-700 text-white rounded-md hover:bg-red-700 dark:hover:bg-red-600 transition-colors"
                        >
                          ×
                        </button>
                      )}
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={addActivityField}
                    className="mt-2 px-4 py-2 bg-green-600 dark:bg-green-700 text-white rounded-md hover:bg-green-700 dark:hover:bg-green-600 transition-colors text-sm"
                  >
                    + 新增項目
                  </button>
                </div>
              </div>

              {/* 費用設定 */}
              <div>
                <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-4">
                  費用設定
                </h3>

                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-100 mb-2">
                    價格 (NT$) *
                  </label>
                  <input
                    type="number"
                    name="price"
                    value={formData.price}
                    onChange={handleInputChange}
                    required
                    min="0"
                    className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 text-gray-900 dark:text-gray-100 bg-white dark:bg-slate-700"
                    placeholder="0"
                  />
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                    設為 0 表示免費體驗
                  </p>
                </div>
              </div>

              {/* 其他設定 */}
              <div>
                <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-4">
                  其他設定
                </h3>

                {/* 活動圖片 */}
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-100 mb-3">
                    活動圖片（限一張）
                  </label>

                  {state.existingImages.length > 0 && !state.imageDeleted ? (
                    // 顯示現有圖片
                    <div className="space-y-3">
                      <div className="relative inline-block">
                        <img
                          src={state.existingImages[0]}
                          alt="現有活動圖片"
                          className="w-48 h-48 object-cover rounded-lg border-2 border-gray-200 dark:border-slate-600"
                        />
                        <button
                          type="button"
                          onClick={handleDeleteExistingImage}
                          className="absolute top-2 right-2 bg-red-500 dark:bg-red-600 text-white p-1.5 rounded-full hover:bg-red-600 dark:hover:bg-red-500 transition-colors"
                          title="刪除圖片"
                        >
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
                              d="M6 18L18 6M6 6l12 12"
                            />
                          </svg>
                        </button>
                      </div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        如需更換圖片，請先刪除現有圖片
                      </p>
                    </div>
                  ) : (
                    // 顯示上傳區域
                    <div className="space-y-3">
                      <ImageUploader
                        productId={state.activityId || uuidv4()}
                        module="farm-tour"
                        onUploadSuccess={handleImageUploadSuccess}
                        onUploadError={handleImageUploadError}
                        maxFiles={1}
                        allowMultiple={false}
                        generateMultipleSizes={false}
                        enableCompression={true}
                        className="mb-4"
                      />
                      {state.uploadedImages.length > 0 ? (
                        <div className="text-sm text-green-600 dark:text-green-400">
                          ✓ 已上傳新圖片
                        </div>
                      ) : (
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          請上傳一張活動圖片
                        </p>
                      )}
                    </div>
                  )}
                </div>

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
            <div className="lg:sticky lg:top-8">
              <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-4">
                即時預覽
              </h3>
              <div className="bg-white dark:bg-slate-800 rounded-lg shadow-md overflow-hidden">
                {/* Preview Card */}
                <div className="bg-gradient-to-br from-green-100 to-amber-100 dark:from-green-900/30 dark:to-amber-900/30 p-6 text-center">
                  <div className="mb-3">
                    {state.uploadedImages.length > 0 || state.existingImages.length > 0 ? (
                      <Image
                        src={
                          state.uploadedImages[0] || state.existingImages[0] || '/placeholder.jpg'
                        }
                        alt="活動圖片"
                        width={64}
                        height={64}
                        unoptimized
                        priority
                        className="w-16 h-16 object-cover rounded-lg mx-auto border-2 border-white shadow-sm"
                      />
                    ) : (
                      <div className="w-16 h-16 bg-gray-200 dark:bg-slate-600 rounded-lg mx-auto flex items-center justify-center">
                        <span className="text-gray-500 dark:text-gray-400 text-xs">無圖片</span>
                      </div>
                    )}
                  </div>
                  <h3 className="text-lg font-bold text-gray-800 dark:text-gray-100 mb-2">
                    {formData.title || '活動標題預覽'}
                  </h3>
                  <div className="flex justify-center items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
                    <span className="bg-white dark:bg-slate-700 px-2 py-1 rounded-full">
                      {formData.start_month}月 - {formData.end_month}月
                    </span>
                    <span className="bg-white dark:bg-slate-700 px-2 py-1 rounded-full">
                      NT$ {formData.price || 0}
                    </span>
                  </div>
                </div>

                <div className="p-4">
                  <div className="mb-4">
                    <h4 className="font-semibold text-gray-800 dark:text-gray-100 mb-2 text-sm">
                      活動內容
                    </h4>
                    <div className="space-y-1">
                      {formData.activities
                        .filter(a => a.trim())
                        .map((activity, index) => (
                          <div
                            key={index}
                            className="flex items-center text-xs text-gray-600 dark:text-gray-300"
                          >
                            <span className="mr-2 text-green-500 dark:text-green-400">•</span>
                            <span>{activity}</span>
                          </div>
                        ))}
                    </div>
                  </div>

                  <div className="mb-4 text-sm">
                    <div className="flex items-center justify-center">
                      <span className="mr-2 text-amber-600 dark:text-amber-400 font-medium">$</span>
                      <span className="font-bold text-amber-900 dark:text-amber-300">
                        NT$ {formData.price || 0}
                      </span>
                    </div>
                  </div>

                  {formData.note && (
                    <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-900/30 rounded-lg">
                      <p className="text-blue-700 dark:text-blue-300 text-xs">{formData.note}</p>
                    </div>
                  )}

                  <div
                    className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                      formData.available
                        ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300'
                        : 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300'
                    }`}
                  >
                    {formData.available ? '開放預約' : '暫停開放'}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AdminProtection>
  )
}
