/**
 * 詢價範本管理頁面
 * 允許使用者查看、建立、編輯、刪除詢價範本
 */

'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useInquiryTemplates } from '@/hooks/useInquiryTemplates'
import { InquiryTemplate } from '@/types/inquiry-template'

export default function InquiryTemplatesPage() {
  const router = useRouter()
  const {
    templates,
    loading,
    error,
    fetchTemplates,
    deleteTemplate,
    toggleFavorite,
    toggleActive,
  } = useInquiryTemplates({ is_active: true, sort_by: 'updated_at', sort_order: 'desc' })

  const [filter, setFilter] = useState<'all' | 'product' | 'farm_tour'>('all')
  const [showFavoriteOnly, setShowFavoriteOnly] = useState(false)

  // 篩選範本
  const filteredTemplates = templates.filter(template => {
    if (filter !== 'all' && template.inquiry_type !== filter) return false
    if (showFavoriteOnly && !template.is_favorite) return false
    return true
  })

  // 處理使用範本
  const handleUseTemplate = (template: InquiryTemplate) => {
    // 跳轉到詢價頁面，帶上範本 ID
    router.push(`/inquiries/create?template=${template.id}`)
  }

  // 處理刪除範本
  const handleDeleteTemplate = async (id: string) => {
    if (!confirm('確定要刪除此範本？')) return
    await deleteTemplate(id)
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* 標題區 */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">詢價範本管理</h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">儲存常用詢價內容，快速建立詢價單</p>
        </div>

        {/* 操作列 */}
        <div className="mb-6 flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
          {/* 篩選器 */}
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setFilter('all')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                filter === 'all'
                  ? 'bg-blue-600 text-white'
                  : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
              }`}
            >
              全部 ({templates.length})
            </button>
            <button
              onClick={() => setFilter('product')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                filter === 'product'
                  ? 'bg-blue-600 text-white'
                  : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
              }`}
            >
              產品詢價 ({templates.filter(t => t.inquiry_type === 'product').length})
            </button>
            <button
              onClick={() => setFilter('farm_tour')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                filter === 'farm_tour'
                  ? 'bg-blue-600 text-white'
                  : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
              }`}
            >
              農場參觀 ({templates.filter(t => t.inquiry_type === 'farm_tour').length})
            </button>

            <button
              onClick={() => setShowFavoriteOnly(!showFavoriteOnly)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                showFavoriteOnly
                  ? 'bg-yellow-500 text-white'
                  : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
              }`}
            >
              <svg
                className="w-4 h-4 inline mr-1"
                fill={showFavoriteOnly ? 'currentColor' : 'none'}
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"
                />
              </svg>
              常用
            </button>
          </div>

          {/* 新增按鈕 */}
          <button
            onClick={() => router.push('/inquiries/create?save_template=1')}
            className="px-6 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm font-medium transition-colors"
          >
            <svg
              className="w-4 h-4 inline mr-1"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 4v16m8-8H4"
              />
            </svg>
            建立新範本
          </button>
        </div>

        {/* 錯誤訊息 */}
        {error && (
          <div className="mb-6 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
            <p className="text-red-800 dark:text-red-300 text-sm">{error}</p>
          </div>
        )}

        {/* 載入中 */}
        {loading && (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        )}

        {/* 範本列表 */}
        {!loading && filteredTemplates.length === 0 && (
          <div className="text-center py-12">
            <svg
              className="mx-auto h-12 w-12 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
            <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">沒有範本</h3>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              建立第一個範本，加速詢價流程
            </p>
          </div>
        )}

        {!loading && filteredTemplates.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredTemplates.map(template => (
              <div
                key={template.id}
                className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow"
              >
                {/* 卡片頭部 */}
                <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white truncate">
                        {template.name}
                      </h3>
                      {template.description && (
                        <p className="mt-1 text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
                          {template.description}
                        </p>
                      )}
                    </div>
                    <button
                      onClick={() => toggleFavorite(template.id)}
                      className="ml-2 flex-shrink-0"
                      title={template.is_favorite ? '取消常用' : '設為常用'}
                    >
                      <svg
                        className={`w-5 h-5 ${
                          template.is_favorite
                            ? 'text-yellow-500 fill-current'
                            : 'text-gray-400 hover:text-yellow-500'
                        }`}
                        fill={template.is_favorite ? 'currentColor' : 'none'}
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"
                        />
                      </svg>
                    </button>
                  </div>

                  {/* 標籤 */}
                  <div className="mt-3 flex flex-wrap gap-2">
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        template.inquiry_type === 'product'
                          ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300'
                          : 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300'
                      }`}
                    >
                      {template.inquiry_type === 'product' ? '產品詢價' : '農場參觀'}
                    </span>
                    {template.items && template.items.length > 0 && (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-300">
                        {template.items.length} 項產品
                      </span>
                    )}
                  </div>
                </div>

                {/* 卡片內容 */}
                <div className="p-4 space-y-2 text-sm">
                  <div className="flex items-center text-gray-600 dark:text-gray-400">
                    <svg
                      className="w-4 h-4 mr-2"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                    使用 {template.usage_count} 次
                  </div>
                  {template.last_used_at && (
                    <div className="flex items-center text-gray-600 dark:text-gray-400">
                      <svg
                        className="w-4 h-4 mr-2"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                        />
                      </svg>
                      最後使用：{new Date(template.last_used_at).toLocaleDateString('zh-TW')}
                    </div>
                  )}
                </div>

                {/* 卡片操作 */}
                <div className="p-4 border-t border-gray-200 dark:border-gray-700 flex gap-2">
                  <button
                    onClick={() => handleUseTemplate(template)}
                    className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors"
                  >
                    使用範本
                  </button>
                  <button
                    onClick={() => handleDeleteTemplate(template.id)}
                    className="px-4 py-2 bg-red-50 dark:bg-red-900/20 hover:bg-red-100 dark:hover:bg-red-900/30 text-red-600 dark:text-red-400 rounded-lg text-sm font-medium transition-colors"
                    title="刪除"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                      />
                    </svg>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
