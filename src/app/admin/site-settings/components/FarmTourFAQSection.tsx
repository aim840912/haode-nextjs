import { useMemo } from 'react'
import { HelpCircle, Plus, Trash2, Clock, Car, Users2, Banknote } from 'lucide-react'
import { SectionProps } from './types'
import { FAQItem } from '@/types/siteSettings'

const ICON_OPTIONS = [
  { value: 'clock', label: '時鐘', icon: Clock },
  { value: 'car', label: '汽車', icon: Car },
  { value: 'users', label: '人群', icon: Users2 },
  { value: 'banknote', label: '鈔票', icon: Banknote },
] as const

const DEFAULT_FAQ: FAQItem = {
  question: '',
  answer: '',
  icon: 'clock',
}

export function FarmTourFAQSection({ state, actions }: SectionProps) {
  // 解析 JSON 為 FAQItem 陣列
  const faqs = useMemo<FAQItem[]>(() => {
    if (!state.farmFaqs) return []
    try {
      const parsed = JSON.parse(state.farmFaqs)
      return Array.isArray(parsed) ? parsed : []
    } catch {
      return []
    }
  }, [state.farmFaqs])

  // 更新單一 FAQ 項目
  const updateFaq = (index: number, field: keyof FAQItem, value: string) => {
    const newFaqs = [...faqs]
    newFaqs[index] = { ...newFaqs[index], [field]: value }
    actions.setFarmContent('faqs', JSON.stringify(newFaqs))
  }

  // 新增 FAQ 項目
  const addFaq = () => {
    const newFaqs = [...faqs, { ...DEFAULT_FAQ }]
    actions.setFarmContent('faqs', JSON.stringify(newFaqs))
  }

  // 刪除 FAQ 項目
  const removeFaq = (index: number) => {
    const newFaqs = faqs.filter((_, i) => i !== index)
    actions.setFarmContent('faqs', JSON.stringify(newFaqs))
  }

  // 移動 FAQ 項目（上移）
  const moveFaqUp = (index: number) => {
    if (index === 0) return
    const newFaqs = [...faqs]
    ;[newFaqs[index - 1], newFaqs[index]] = [newFaqs[index], newFaqs[index - 1]]
    actions.setFarmContent('faqs', JSON.stringify(newFaqs))
  }

  // 移動 FAQ 項目（下移）
  const moveFaqDown = (index: number) => {
    if (index === faqs.length - 1) return
    const newFaqs = [...faqs]
    ;[newFaqs[index], newFaqs[index + 1]] = [newFaqs[index + 1], newFaqs[index]]
    actions.setFarmContent('faqs', JSON.stringify(newFaqs))
  }

  return (
    <section className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-200 dark:border-slate-600 p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <HelpCircle className="w-6 h-6 text-amber-600" />
          <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">常見問題管理</h2>
        </div>
        <button
          type="button"
          onClick={addFaq}
          className="flex items-center space-x-2 px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>新增問題</span>
        </button>
      </div>

      {faqs.length === 0 ? (
        <div className="text-center py-8 text-gray-500 dark:text-gray-400">
          <HelpCircle className="w-12 h-12 mx-auto mb-3 opacity-50" />
          <p>尚未新增任何常見問題</p>
          <p className="text-sm mt-1">點擊「新增問題」按鈕來添加第一個問題</p>
        </div>
      ) : (
        <div className="space-y-4">
          {faqs.map((faq, index) => (
            <div
              key={index}
              className="border border-gray-200 dark:border-slate-600 rounded-lg p-4 bg-gray-50 dark:bg-slate-700"
            >
              <div className="flex items-start justify-between mb-3">
                <span className="text-sm font-medium text-gray-500 dark:text-gray-400">
                  問題 {index + 1}
                </span>
                <div className="flex items-center space-x-1">
                  <button
                    type="button"
                    onClick={() => moveFaqUp(index)}
                    disabled={index === 0}
                    className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-30 disabled:cursor-not-allowed"
                    title="上移"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M5 15l7-7 7 7"
                      />
                    </svg>
                  </button>
                  <button
                    type="button"
                    onClick={() => moveFaqDown(index)}
                    disabled={index === faqs.length - 1}
                    className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-30 disabled:cursor-not-allowed"
                    title="下移"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 9l-7 7-7-7"
                      />
                    </svg>
                  </button>
                  <button
                    type="button"
                    onClick={() => removeFaq(index)}
                    className="p-1 text-red-400 hover:text-red-600"
                    title="刪除"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="space-y-3">
                {/* 圖示選擇 */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    圖示
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {ICON_OPTIONS.map(option => {
                      const IconComponent = option.icon
                      return (
                        <button
                          key={option.value}
                          type="button"
                          onClick={() => updateFaq(index, 'icon', option.value)}
                          className={`flex items-center space-x-2 px-3 py-2 rounded-lg border transition-colors ${
                            faq.icon === option.value
                              ? 'border-amber-500 bg-amber-50 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300'
                              : 'border-gray-200 dark:border-slate-500 hover:border-gray-300 dark:hover:border-slate-400'
                          }`}
                        >
                          <IconComponent className="w-4 h-4" />
                          <span className="text-sm">{option.label}</span>
                        </button>
                      )
                    })}
                  </div>
                </div>

                {/* 問題輸入 */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    問題
                  </label>
                  <input
                    type="text"
                    value={faq.question}
                    onChange={e => updateFaq(index, 'question', e.target.value)}
                    placeholder="輸入問題..."
                    className="w-full px-3 py-2 border border-gray-200 dark:border-slate-500 rounded-lg bg-white dark:bg-slate-600 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                  />
                </div>

                {/* 答案輸入 */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    答案
                  </label>
                  <textarea
                    value={faq.answer}
                    onChange={e => updateFaq(index, 'answer', e.target.value)}
                    placeholder="輸入答案... (可使用 \n 換行)"
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-200 dark:border-slate-500 rounded-lg bg-white dark:bg-slate-600 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-amber-500 focus:border-transparent resize-y"
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 提示說明 */}
      <div className="mt-4 p-3 bg-amber-50 dark:bg-amber-900/20 rounded-lg border border-amber-200 dark:border-amber-800">
        <p className="text-sm text-amber-700 dark:text-amber-300">
          <strong>提示：</strong>答案中可以使用{' '}
          <code className="bg-amber-100 dark:bg-amber-800 px-1 rounded">\n</code> 來換行。
          例如：「第一行\n第二行」會顯示為兩行文字。
        </p>
      </div>
    </section>
  )
}
