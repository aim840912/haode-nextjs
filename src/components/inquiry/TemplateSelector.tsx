/**
 * 詢價範本選擇器元件
 * 在詢價表單中快速選擇並套用範本
 */

'use client'

import { useState, useEffect } from 'react'
import { useInquiryTemplates } from '@/hooks/useInquiryTemplates'
import { InquiryTemplate, InquiryFormDataFromTemplate } from '@/types/inquiry-template'

interface TemplateSelectorProps {
  inquiryType?: 'product' | 'farm_tour'
  onTemplateSelected: (formData: InquiryFormDataFromTemplate) => void
  className?: string
}

export function TemplateSelector({
  inquiryType,
  onTemplateSelected,
  className = '',
}: TemplateSelectorProps) {
  const [isOpen, setIsOpen] = useState(false)
  const { templates, loading, fetchTemplates, useTemplate } = useInquiryTemplates({
    is_active: true,
    is_favorite: true, // 優先顯示常用範本
    sort_by: 'usage_count',
    sort_order: 'desc',
  })

  // 篩選符合類型的範本
  const filteredTemplates = inquiryType
    ? templates.filter(t => t.inquiry_type === inquiryType)
    : templates

  // 載入範本
  useEffect(() => {
    if (isOpen && templates.length === 0) {
      fetchTemplates({
        is_active: true,
        sort_by: 'usage_count',
        sort_order: 'desc',
      })
    }
  }, [isOpen, templates.length, fetchTemplates])

  // 處理選擇範本
  const handleSelectTemplate = async (template: InquiryTemplate) => {
    const formData = await useTemplate(template.id)
    if (formData) {
      onTemplateSelected(formData)
      setIsOpen(false)
    }
  }

  if (filteredTemplates.length === 0 && !loading) {
    return null // 沒有範本時不顯示
  }

  return (
    <div className={`relative ${className}`}>
      {/* 觸發按鈕 */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="inline-flex items-center px-4 py-2 bg-purple-50 dark:bg-purple-900/20 hover:bg-purple-100 dark:hover:bg-purple-900/30 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800 rounded-lg text-sm font-medium transition-colors"
      >
        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
          />
        </svg>
        使用範本快速填入
        {filteredTemplates.length > 0 && (
          <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-purple-100 dark:bg-purple-800 text-purple-800 dark:text-purple-200">
            {filteredTemplates.length}
          </span>
        )}
      </button>

      {/* 下拉選單 */}
      {isOpen && (
        <>
          {/* 遮罩 */}
          <div className="fixed inset-0 z-10" onClick={() => setIsOpen(false)} />

          {/* 選單內容 */}
          <div className="absolute left-0 mt-2 w-96 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 z-20 max-h-96 overflow-y-auto">
            {/* 標題 */}
            <div className="p-4 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white">選擇範本</h3>
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">點擊範本自動填入資料</p>
            </div>

            {/* 載入中 */}
            {loading && (
              <div className="p-8 flex justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
              </div>
            )}

            {/* 範本列表 */}
            {!loading && filteredTemplates.length === 0 && (
              <div className="p-8 text-center">
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
                <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">目前沒有可用的範本</p>
              </div>
            )}

            {!loading && filteredTemplates.length > 0 && (
              <div className="divide-y divide-gray-200 dark:divide-gray-700">
                {filteredTemplates.map(template => (
                  <button
                    key={template.id}
                    type="button"
                    onClick={() => handleSelectTemplate(template)}
                    className="w-full p-4 text-left hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <h4 className="text-sm font-medium text-gray-900 dark:text-white truncate">
                            {template.name}
                          </h4>
                          {template.is_favorite && (
                            <svg
                              className="w-4 h-4 text-yellow-500 fill-current flex-shrink-0"
                              viewBox="0 0 24 24"
                            >
                              <path d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                            </svg>
                          )}
                        </div>
                        {template.description && (
                          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400 line-clamp-1">
                            {template.description}
                          </p>
                        )}
                        <div className="mt-2 flex items-center gap-3 text-xs text-gray-500 dark:text-gray-400">
                          <span>使用 {template.usage_count} 次</span>
                          {template.items && template.items.length > 0 && (
                            <span>{template.items.length} 項產品</span>
                          )}
                        </div>
                      </div>
                      <svg
                        className="w-5 h-5 text-gray-400 flex-shrink-0 ml-2"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9 5l7 7-7 7"
                        />
                      </svg>
                    </div>
                  </button>
                ))}
              </div>
            )}

            {/* 底部操作 */}
            <div className="p-3 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-750">
              <button
                type="button"
                onClick={() => {
                  setIsOpen(false)
                  window.open('/inquiry-templates', '_blank')
                }}
                className="w-full px-3 py-2 text-sm text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300 font-medium"
              >
                管理所有範本
                <svg
                  className="w-4 h-4 inline ml-1"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                  />
                </svg>
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
