import { useState, useCallback } from 'react'
import LoadingSpinner from '@/components/ui/loading/LoadingSpinner'
import type { QuickReplyTemplate } from '@/hooks/useQuickReplyTemplates'
import type { InquiryWithItems } from '@/types/inquiry'
import { InquiryUtils } from '@/types/inquiry'

interface QuickReplySectionProps {
  inquiry: InquiryWithItems
  templates: QuickReplyTemplate[]
  isLoadingTemplates: boolean
  fillTemplate: (template: QuickReplyTemplate, variables: Record<string, string>) => string
  onSuccess: (message: string) => void
  onError: (message: string) => void
  onWarning: (message: string) => void
}

/**
 * 快速回覆模板區域元件
 * 處理模板選擇、變數填寫和回覆產生
 */
export function QuickReplySection({
  inquiry,
  templates,
  isLoadingTemplates,
  fillTemplate,
  onSuccess,
  onError,
  onWarning,
}: QuickReplySectionProps) {
  const [showTemplateSelector, setShowTemplateSelector] = useState(false)
  const [selectedTemplate, setSelectedTemplate] = useState<QuickReplyTemplate | null>(null)
  const [templateVariables, setTemplateVariables] = useState<Record<string, string>>({})
  const [generatedReply, setGeneratedReply] = useState<string>('')

  const handleTemplateSelect = useCallback(
    (template: QuickReplyTemplate) => {
      setSelectedTemplate(template)

      const defaultVariables: Record<string, string> = {
        customer_name: inquiry.customer_name,
        ...(inquiry.inquiry_type === 'product' &&
          inquiry.inquiry_items.length > 0 && {
            product_name: inquiry.inquiry_items[0].product_name,
            quantity: inquiry.inquiry_items
              .reduce((sum, item) => sum + item.quantity, 0)
              .toString(),
            total_price: InquiryUtils.calculateTotalAmount(inquiry).toLocaleString(),
          }),
        ...(inquiry.inquiry_type === 'farm_tour' && {
          activity_title: inquiry.activity_title || '農場導覽',
          visit_date: inquiry.visit_date || '',
          visitor_count: (inquiry.visitor_count || 1).toString(),
        }),
      }
      setTemplateVariables(defaultVariables)
    },
    [inquiry]
  )

  const handleGeneratePreview = useCallback(() => {
    if (selectedTemplate) {
      const preview = fillTemplate(selectedTemplate, templateVariables)
      setGeneratedReply(preview)
    }
  }, [selectedTemplate, templateVariables, fillTemplate])

  const handleCopyToClipboard = useCallback(() => {
    if (generatedReply) {
      navigator.clipboard
        .writeText(generatedReply)
        .then(() => {
          onSuccess('已複製到剪貼板')
        })
        .catch(() => {
          onError('無法複製到剪貼板，請手動複製')
        })
    }
  }, [generatedReply, onSuccess, onError])

  const handleToggleTemplateSelector = useCallback(() => {
    setShowTemplateSelector(!showTemplateSelector)
    if (!showTemplateSelector) {
      setSelectedTemplate(null)
      setTemplateVariables({})
      setGeneratedReply('')
    }
  }, [showTemplateSelector])

  return (
    <div className="mt-8 pt-6 border-t border-gray-200 dark:border-slate-600">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-gray-900 dark:text-gray-100">快速回覆模板</h3>
        <button
          onClick={handleToggleTemplateSelector}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            showTemplateSelector
              ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-800 dark:text-amber-300 hover:bg-amber-200 dark:hover:bg-amber-900/50'
              : 'bg-amber-900 dark:bg-amber-800 text-white hover:bg-amber-800 dark:hover:bg-amber-700'
          }`}
        >
          {showTemplateSelector ? '收起模板' : '使用模板回覆'}
        </button>
      </div>

      {showTemplateSelector && (
        <div className="space-y-4">
          {/* 模板選擇器 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              選擇回覆模板
            </label>
            {isLoadingTemplates ? (
              <div className="text-center py-4">
                <LoadingSpinner size="sm" />
                <p className="text-sm text-gray-600 dark:text-gray-300 mt-2">載入模板中...</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {templates.map(template => {
                  const isRelevant =
                    (inquiry.inquiry_type === 'product' &&
                      (template.category === 'product' ||
                        template.category === 'pricing' ||
                        template.category === 'general')) ||
                    (inquiry.inquiry_type === 'farm_tour' &&
                      (template.category === 'farm_tour' || template.category === 'general'))
                  return (
                    <button
                      key={template.id}
                      onClick={() => handleTemplateSelect(template)}
                      className={`p-3 text-left rounded-lg border transition-colors ${
                        selectedTemplate?.id === template.id
                          ? 'border-amber-500 dark:border-amber-600 bg-amber-50 dark:bg-amber-900/30'
                          : isRelevant
                            ? 'border-green-200 dark:border-green-700 bg-green-50 dark:bg-green-900/20 hover:bg-green-100 dark:hover:bg-green-900/30'
                            : 'border-gray-200 dark:border-slate-600 bg-white dark:bg-slate-700 hover:bg-gray-50 dark:hover:bg-slate-600'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <h4 className="font-medium text-sm text-gray-900 dark:text-gray-100">
                          {template.title}
                        </h4>
                        <div className="flex items-center space-x-2">
                          {isRelevant && (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300">
                              推薦
                            </span>
                          )}
                          <span
                            className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                              template.category === 'product'
                                ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300'
                                : template.category === 'farm_tour'
                                  ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-300'
                                  : template.category === 'pricing'
                                    ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-800 dark:text-amber-300'
                                    : 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-300'
                            }`}
                          >
                            {template.category === 'product'
                              ? '產品'
                              : template.category === 'farm_tour'
                                ? '導覽'
                                : template.category === 'pricing'
                                  ? '報價'
                                  : '一般'}
                          </span>
                        </div>
                      </div>
                      <p className="text-xs text-gray-600 dark:text-gray-300 line-clamp-2">
                        {template.content.substring(0, 100)}...
                      </p>
                      {template.usage_count > 0 && (
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                          使用次數: {template.usage_count}
                        </p>
                      )}
                    </button>
                  )
                })}
              </div>
            )}
          </div>

          {/* 變數填寫區域 */}
          {selectedTemplate && (
            <div className="space-y-4">
              <div>
                <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-3">
                  填寫模板變數 - {selectedTemplate.title}
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {selectedTemplate.variables.map(variable => (
                    <div key={variable}>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        {variable.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                      </label>
                      <input
                        type="text"
                        value={templateVariables[variable] || ''}
                        onChange={e =>
                          setTemplateVariables(prev => ({
                            ...prev,
                            [variable]: e.target.value,
                          }))
                        }
                        placeholder={`輸入 ${variable}`}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent bg-white dark:bg-slate-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400"
                      />
                    </div>
                  ))}
                </div>
              </div>

              {/* 產生預覽 */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-medium text-gray-900 dark:text-gray-100">回覆預覽</h4>
                  <button
                    onClick={handleGeneratePreview}
                    className="px-3 py-1 bg-amber-600 dark:bg-amber-700 text-white text-sm rounded hover:bg-amber-700 dark:hover:bg-amber-600 transition-colors"
                  >
                    產生預覽
                  </button>
                </div>
                <textarea
                  value={generatedReply}
                  onChange={e => setGeneratedReply(e.target.value)}
                  placeholder="點擊「產生預覽」來查看填寫後的模板內容，您可以在此處進一步編輯..."
                  rows={8}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent resize-none bg-white dark:bg-slate-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400"
                />
              </div>

              {/* 操作按鈕 */}
              <div className="flex items-center justify-end space-x-3">
                <button
                  onClick={handleCopyToClipboard}
                  disabled={!generatedReply}
                  className="px-4 py-2 bg-gray-600 dark:bg-gray-700 text-white text-sm rounded hover:bg-gray-700 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  複製到剪貼板
                </button>
                <button
                  onClick={() => {
                    onWarning('此功能將在後續版本中實作。請先複製內容到您的 Email 系統中。')
                  }}
                  disabled={!generatedReply}
                  className="px-4 py-2 bg-blue-600 dark:bg-blue-700 text-white text-sm rounded hover:bg-blue-700 dark:hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  發送回覆
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
