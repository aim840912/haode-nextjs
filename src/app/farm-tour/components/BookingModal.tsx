import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Circle, Users2, Calendar, Banknote, Info } from 'lucide-react'
import type { FarmTourFormData, FarmTourFormErrors } from '@/hooks/farm-tour/useFarmTourForm'
import { getSupabaseClient } from '@/lib/database/supabase-auth'
import { logger } from '@/lib/logger'
import type { User } from '@/types/auth'
import type { FarmTourActivity } from '@/types/farmTour'

interface BookingModalProps {
  activity: FarmTourActivity
  user: User | null
  formData: FarmTourFormData
  fieldErrors: FarmTourFormErrors
  onClose: () => void
  onFormChange: (field: string, value: string) => void
  onFieldBlur: (field: string, value: string) => void
  validateAllFields: () => boolean
}

/**
 * 農場導覽預約 Modal 元件
 * 顯示活動詳情並提供預約表單
 */
export function BookingModal({
  activity,
  user,
  formData,
  fieldErrors,
  onClose,
  onFormChange,
  onFieldBlur,
  validateAllFields,
}: BookingModalProps) {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)

  const handleSubmit = async () => {
    if (!user) {
      setSubmitError('請先登入以提交預約詢問')
      return
    }

    // 驗證所有欄位
    const isValid = validateAllFields()
    if (!isValid) {
      setSubmitError('請修正表單中的錯誤後再提交')
      return
    }

    setIsSubmitting(true)
    setSubmitError(null)

    try {
      // 取得認證 token
      const supabase = getSupabaseClient()
      const {
        data: { session },
      } = await supabase.auth.getSession()
      if (!session?.access_token) {
        throw new Error('認證失敗，請重新登入')
      }

      const response = await fetch('/api/farm-tour/inquiry', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          customer_name: formData.customer_name,
          customer_email: formData.customer_email,
          customer_phone: formData.customer_phone,
          activity_title: activity.title,
          visit_date: formData.visit_date,
          visitor_count: formData.visitor_count,
          notes: formData.notes,
        }),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || '提交預約詢問失敗')
      }

      // 成功提交，導向詢問單詳情頁
      router.push(`/inquiries/${result.data.id}`)
    } catch (error) {
      logger.error(
        'Error submitting farm tour inquiry:',
        error instanceof Error ? error : new Error('Unknown error')
      )
      setSubmitError(error instanceof Error ? error.message : '提交預約詢問時發生錯誤')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 animate-fade-in"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl transform transition-all"
        onClick={e => e.stopPropagation()}
      >
        <div className="p-8">
          <div className="flex justify-between items-start mb-6">
            <div>
              <h3 className="text-2xl font-bold text-amber-900 mb-2">{activity.title}</h3>
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <span className="flex items-center gap-1">
                  <Circle className="w-3 h-3 text-green-500 fill-current" />
                  即時確認
                </span>
                <span>|</span>
                <span className="flex items-center gap-1">
                  <Users2 className="w-4 h-4" />
                  適合全家
                </span>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 text-2xl transition-colors"
            >
              ×
            </button>
          </div>

          <div className="space-y-6">
            {/* 活動資訊卡片 */}
            <div className="p-6 bg-gradient-to-r from-amber-50 to-orange-50 rounded-lg border border-amber-200">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center gap-2">
                  <Calendar className="w-8 h-8 text-amber-600" />
                  <div>
                    <p className="text-xs text-gray-600">體驗期間</p>
                    <p className="font-bold text-amber-800">
                      {activity.start_month}月 - {activity.end_month}月
                    </p>
                  </div>
                </div>
                {Number(activity.price) > 0 && (
                  <div className="flex items-center gap-2">
                    <Banknote className="w-8 h-8 text-amber-600" />
                    <div>
                      <p className="text-xs text-gray-600">體驗費用</p>
                      <p className="font-bold text-amber-800">NT$ {activity.price}</p>
                    </div>
                  </div>
                )}
              </div>
              {activity.note && (
                <div className="mt-4 pt-4 border-t border-amber-200">
                  <p className="text-amber-700 text-sm flex items-start gap-2">
                    <Info className="w-4 h-4 mt-0.5" />
                    <span>{activity.note}</span>
                  </p>
                </div>
              )}
            </div>

            {/* 未登入提示 */}
            {!user && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <p className="text-yellow-800 text-sm">
                  請先登入以提交預約詢問。
                  <a href="/login" className="underline ml-1">
                    點此登入
                  </a>
                </p>
              </div>
            )}

            {/* 預約表單 */}
            <div>
              <h4 className="font-semibold text-gray-800 mb-3">預約資訊</h4>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <label className="block text-gray-700 mb-1 font-medium">參觀日期 *</label>
                  <input
                    type="date"
                    value={formData.visit_date}
                    onChange={e => onFormChange('visit_date', e.target.value)}
                    onBlur={e => onFieldBlur('visit_date', e.target.value)}
                    className={`w-full border rounded-lg px-3 py-2 text-gray-900 focus:outline-none focus:ring-2 ${
                      fieldErrors.visit_date
                        ? 'border-red-500 focus:ring-red-200'
                        : 'border-gray-300 focus:ring-amber-200'
                    }`}
                    required
                  />
                  {fieldErrors.visit_date && (
                    <p className="text-red-500 text-sm mt-1">{fieldErrors.visit_date}</p>
                  )}
                </div>
                <div>
                  <label className="block text-gray-700 mb-1 font-medium">參觀人數</label>
                  <select
                    value={formData.visitor_count}
                    onChange={e => onFormChange('visitor_count', e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-gray-900"
                  >
                    <option>1人</option>
                    <option>2人</option>
                    <option>3-5人</option>
                    <option>6-10人</option>
                    <option>團體（11人以上）</option>
                  </select>
                </div>
                <div>
                  <label className="block text-gray-700 mb-1 font-medium">聯絡姓名 *</label>
                  <input
                    type="text"
                    value={formData.customer_name}
                    onChange={e => onFormChange('customer_name', e.target.value)}
                    onBlur={e => onFieldBlur('customer_name', e.target.value)}
                    className={`w-full border rounded-lg px-3 py-2 text-gray-900 focus:outline-none focus:ring-2 ${
                      fieldErrors.customer_name
                        ? 'border-red-500 focus:ring-red-200'
                        : 'border-gray-300 focus:ring-amber-200'
                    }`}
                    placeholder="請輸入您的姓名"
                    required
                  />
                  {fieldErrors.customer_name && (
                    <p className="text-red-500 text-sm mt-1">{fieldErrors.customer_name}</p>
                  )}
                </div>
                <div>
                  <label className="block text-gray-700 mb-1 font-medium">聯絡電話</label>
                  <input
                    type="tel"
                    value={formData.customer_phone}
                    onChange={e => onFormChange('customer_phone', e.target.value)}
                    onBlur={e => onFieldBlur('customer_phone', e.target.value)}
                    className={`w-full border rounded-lg px-3 py-2 text-gray-900 focus:outline-none focus:ring-2 ${
                      fieldErrors.customer_phone
                        ? 'border-red-500 focus:ring-red-200'
                        : 'border-gray-300 focus:ring-amber-200'
                    }`}
                    placeholder="選填：如 0912-345-678"
                  />
                  {fieldErrors.customer_phone && (
                    <p className="text-red-500 text-sm mt-1">{fieldErrors.customer_phone}</p>
                  )}
                </div>
              </div>
              <div className="mt-4">
                <label className="block text-gray-700 mb-1 font-medium">Email *</label>
                <input
                  type="email"
                  value={formData.customer_email}
                  onChange={e => onFormChange('customer_email', e.target.value)}
                  onBlur={e => onFieldBlur('customer_email', e.target.value)}
                  className={`w-full border rounded-lg px-3 py-2 text-gray-900 focus:outline-none focus:ring-2 ${
                    fieldErrors.customer_email
                      ? 'border-red-500 focus:ring-red-200'
                      : 'border-gray-300 focus:ring-amber-200'
                  }`}
                  placeholder="請輸入有效的 Email 地址"
                  required
                />
                {fieldErrors.customer_email && (
                  <p className="text-red-500 text-sm mt-1">{fieldErrors.customer_email}</p>
                )}
              </div>
            </div>

            {/* 特殊需求 */}
            <div>
              <label className="block text-gray-700 mb-1 font-medium">特殊需求或備註</label>
              <textarea
                value={formData.notes}
                onChange={e => onFormChange('notes', e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 h-20 text-gray-900"
                placeholder="如有素食需求、行動不便或其他特殊需求請註明"
              ></textarea>
            </div>

            {/* 錯誤訊息 */}
            {submitError && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <p className="text-red-800 text-sm">{submitError}</p>
              </div>
            )}

            {/* 按鈕 */}
            <div className="flex gap-4">
              <button
                onClick={onClose}
                disabled={isSubmitting}
                className="flex-1 bg-gray-300 text-gray-700 py-3 rounded-lg hover:bg-gray-400 transition-colors disabled:opacity-50"
              >
                取消
              </button>
              <button
                onClick={handleSubmit}
                disabled={isSubmitting || !user}
                className="flex-1 bg-amber-900 text-white py-3 rounded-lg hover:bg-amber-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? '提交中...' : '送出預約詢問'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
