'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  LockClosedIcon,
  ClipboardDocumentListIcon,
  PhoneIcon,
  EnvelopeIcon,
  ClockIcon,
} from '@heroicons/react/24/outline'
import { InquiryStatusFlowDetailed } from '@/components/features/inquiry/InquiryStatusFlow'
import { ComponentErrorBoundary } from '@/components/ui/error/ErrorBoundary'
import { LoadingSpinner } from '@/components/ui/loading/LoadingSpinner'
import { useAuth } from '@/contexts/AuthContext'
import { fetchInquiryById } from '@/lib/api/inquiries-api'
import { logger } from '@/lib/logger'
import { formatDateTime, formatDate } from '@/lib/utils/formatters'
import {
  InquiryWithItems,
  INQUIRY_STATUS_LABELS,
  INQUIRY_STATUS_COLORS,
  INQUIRY_TYPE_LABELS,
  INQUIRY_TYPE_COLORS,
  InquiryUtils,
} from '@/types/inquiry'

interface InquiryDetailPageProps {
  params: Promise<{
    id: string
  }>
}

function InquiryDetailPage({ params }: InquiryDetailPageProps) {
  const { user, isLoading: authLoading } = useAuth()
  const _router = useRouter()
  const [inquiry, setInquiry] = useState<InquiryWithItems | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [inquiryId, setInquiryId] = useState<string>('')

  // 取得參數
  useEffect(() => {
    const getParams = async () => {
      const { id } = await params
      setInquiryId(id)
    }
    getParams()
  }, [params])

  // 取得詢問單詳情
  const fetchInquiry = useCallback(async () => {
    if (!user || !inquiryId) return

    setIsLoading(true)
    setError(null)

    try {
      const data = await fetchInquiryById(inquiryId)
      setInquiry(data)
    } catch (err) {
      logger.error('Error fetching inquiry', err as Error, {
        module: 'InquiryDetailPage',
        action: 'fetchInquiry',
        metadata: { inquiryId },
      })
      setError(err instanceof Error ? err.message : '載入詢問單時發生錯誤')
    } finally {
      setIsLoading(false)
    }
  }, [user, inquiryId])

  // 初始載入
  useEffect(() => {
    if (user && inquiryId) {
      fetchInquiry()
    } else if (!authLoading && !inquiryId) {
      setIsLoading(false)
    }
  }, [user, authLoading, inquiryId, fetchInquiry])

  // 載入中狀態
  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 pt-36 flex items-center justify-center">
        <div className="text-center">
          <LoadingSpinner size="lg" />
          <p className="mt-4 text-gray-600">載入詢問單詳情...</p>
        </div>
      </div>
    )
  }

  // 未登入檢查
  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 pt-36">
        <div className="max-w-4xl mx-auto px-6 py-16">
          <div className="text-center">
            <div className="flex justify-center mb-8">
              <LockClosedIcon className="w-20 h-20 text-gray-400" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-4">需要登入才能查看詢問單</h1>
            <p className="text-gray-600 mb-8">請先登入您的帳戶！</p>
            <Link
              href="/login"
              className="bg-amber-900 text-white px-8 py-3 rounded-lg hover:bg-amber-800 transition-colors"
            >
              立即登入
            </Link>
          </div>
        </div>
      </div>
    )
  }

  // 錯誤狀態
  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 pt-36">
        <div className="max-w-4xl mx-auto px-6 py-16">
          <div className="text-center">
            <div className="text-6xl mb-8">❌</div>
            <h1 className="text-3xl font-bold text-gray-900 mb-4">載入失敗</h1>
            <p className="text-gray-600 mb-8">{error}</p>
            <div className="space-x-4">
              <button
                onClick={fetchInquiry}
                className="bg-amber-900 text-white px-8 py-3 rounded-lg hover:bg-amber-800 transition-colors"
              >
                重新載入
              </button>
              <Link
                href="/inquiries"
                className="border border-amber-900 text-amber-900 px-8 py-3 rounded-lg hover:bg-amber-50 transition-colors"
              >
                返回列表
              </Link>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (!inquiry) {
    return (
      <div className="min-h-screen bg-gray-50 pt-36">
        <div className="max-w-4xl mx-auto px-6 py-16">
          <div className="text-center">
            <div className="flex justify-center mb-8">
              <ClipboardDocumentListIcon className="w-20 h-20 text-gray-400" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-4">找不到詢問單</h1>
            <p className="text-gray-600 mb-8">這個詢問單可能已被刪除或您沒有權限查看</p>
            <Link
              href="/inquiries"
              className="bg-amber-900 text-white px-8 py-3 rounded-lg hover:bg-amber-800 transition-colors"
            >
              返回詢價列表
            </Link>
          </div>
        </div>
      </div>
    )
  }

  // 主要內容
  return (
    <div className="min-h-screen bg-gray-50 pt-36">
      <div className="max-w-6xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <div className="flex items-center space-x-4">
              <Link href="/inquiries" className="text-gray-700 hover:text-gray-900">
                ← 返回列表
              </Link>
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mt-2">
              詢問單 #{InquiryUtils.formatInquiryNumber(inquiry)}
            </h1>
            <div className="flex items-center space-x-4 mt-2">
              <span
                className={`px-3 py-1 rounded-full text-xs font-medium ${INQUIRY_TYPE_COLORS[inquiry.inquiry_type]}`}
              >
                {INQUIRY_TYPE_LABELS[inquiry.inquiry_type]}
              </span>
              <span
                className={`px-3 py-1 rounded-full text-sm font-medium ${INQUIRY_STATUS_COLORS[inquiry.status]}`}
              >
                {INQUIRY_STATUS_LABELS[inquiry.status]}
              </span>
              <span className="text-gray-700">{formatDateTime(inquiry.created_at)}</span>
            </div>
          </div>
        </div>

        {/* 狀態流程追蹤 */}
        <div className="mb-8">
          <InquiryStatusFlowDetailed inquiry={inquiry} className="shadow-md" />
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* 詢問單詳情 */}
          <div className="lg:col-span-2 space-y-6">
            {inquiry.inquiry_type === 'product' ? (
              // 產品詢價內容
              <div className="bg-white rounded-lg shadow-sm">
                <div className="p-6 border-b border-gray-200">
                  <h2 className="text-xl font-bold text-gray-900">詢價商品</h2>
                </div>
                <div className="divide-y divide-gray-200">
                  {inquiry.inquiry_items.map((item, _index) => (
                    <div key={item.id} className="p-6">
                      <div className="flex items-start space-x-4">
                        <div className="w-16 h-16 bg-gray-200 rounded-lg flex-shrink-0 flex items-center justify-center">
                          <span className="text-gray-600 text-xs">圖片</span>
                        </div>
                        <div className="flex-1">
                          <h3 className="text-lg font-semibold text-gray-900 mb-1">
                            {item.product_name}
                          </h3>
                          {item.product_category && (
                            <p className="text-gray-700 text-sm mb-2">
                              分類：{item.product_category}
                            </p>
                          )}
                          <div className="flex items-center space-x-4 text-sm text-gray-700">
                            <span>數量：{item.quantity}</span>
                            {item.unit_price && (
                              <span>單價：NT$ {item.unit_price.toLocaleString()}</span>
                            )}
                          </div>
                          {item.notes && (
                            <p className="text-sm text-gray-700 mt-2 bg-gray-50 p-2 rounded">
                              備註：{item.notes}
                            </p>
                          )}
                        </div>
                        <div className="text-right">
                          <p className="text-lg font-bold text-gray-900">
                            NT${' '}
                            {(
                              item.total_price || (item.unit_price || 0) * item.quantity
                            ).toLocaleString()}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              // 農場參觀內容
              <div className="bg-white rounded-lg shadow-sm">
                <div className="p-6 border-b border-gray-200">
                  <h2 className="text-xl font-bold text-gray-900">農場參觀預約</h2>
                </div>
                <div className="p-6">
                  <div className="space-y-6">
                    <div className="text-center p-6 bg-gradient-to-r from-green-100 to-amber-100 rounded-lg">
                      <h3 className="text-2xl font-bold text-green-900 mb-2">
                        {inquiry.activity_title}
                      </h3>
                      <p className="text-green-800">體驗山間農情，感受自然之美</p>
                    </div>

                    <div className="grid md:grid-cols-2 gap-6">
                      <div>
                        <h4 className="text-sm font-medium text-gray-800 mb-2">預定參觀日期</h4>
                        <p className="text-lg text-gray-900">
                          {inquiry.visit_date ? formatDate(inquiry.visit_date, 'full') : '未指定'}
                        </p>
                      </div>
                      <div>
                        <h4 className="text-sm font-medium text-gray-800 mb-2">參觀人數</h4>
                        <p className="text-lg text-gray-900">{inquiry.visitor_count}</p>
                      </div>
                    </div>

                    <div className="bg-blue-50 p-4 rounded-lg">
                      <h4 className="font-medium text-blue-900 mb-2">預約須知</h4>
                      <ul className="text-sm text-blue-800 space-y-1">
                        <li>• 預約成功後會有專人聯繫確認詳細時間</li>
                        <li>• 活動費用依參加人數和項目內容而定</li>
                        <li>• 如遇天候不佳，將協調調整時間</li>
                        <li>• 建議穿著舒適的運動鞋或登山鞋</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* 聯絡資訊 */}
            <div className="bg-white rounded-lg shadow-sm">
              <div className="p-6 border-b border-gray-200">
                <h2 className="text-xl font-bold text-gray-900">聯絡資訊</h2>
              </div>
              <div className="p-6">
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <h3 className="text-sm font-medium text-gray-800 mb-2">姓名</h3>
                    <p className="text-gray-900">{inquiry.customer_name}</p>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-gray-800 mb-2">Email</h3>
                    <p className="text-gray-900">{inquiry.customer_email}</p>
                  </div>
                  {inquiry.customer_phone && (
                    <div>
                      <h3 className="text-sm font-medium text-gray-800 mb-2">電話</h3>
                      <p className="text-gray-900">{inquiry.customer_phone}</p>
                    </div>
                  )}
                  {inquiry.delivery_address && (
                    <div>
                      <h3 className="text-sm font-medium text-gray-800 mb-2">配送地址</h3>
                      <p className="text-gray-900">{inquiry.delivery_address}</p>
                    </div>
                  )}
                </div>
                {inquiry.notes && (
                  <div className="mt-6">
                    <h3 className="text-sm font-medium text-gray-800 mb-2">備註</h3>
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <p className="text-gray-900">{inquiry.notes}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* 詢問摘要 */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-sm p-6 sticky top-36">
              <h2 className="text-xl font-bold text-gray-900 mb-4">
                {inquiry.inquiry_type === 'product' ? '詢價摘要' : '預約摘要'}
              </h2>

              {inquiry.inquiry_type === 'product' ? (
                <div className="space-y-3 mb-6">
                  <div className="flex justify-between">
                    <span className="text-gray-800">商品總數</span>
                    <span className="font-semibold text-gray-900">
                      {InquiryUtils.calculateTotalQuantity(inquiry)} 件
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-800">商品小計</span>
                    <span className="font-semibold text-gray-900">
                      NT$ {InquiryUtils.calculateTotalAmount(inquiry).toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-800">運費</span>
                    <span className="text-blue-600">待報價</span>
                  </div>
                  <hr />
                  <div className="flex justify-between text-lg font-bold">
                    <span>預估總計</span>
                    <span className="text-amber-900">
                      NT$ {InquiryUtils.calculateTotalAmount(inquiry).toLocaleString()}+
                    </span>
                  </div>
                  <p className="text-xs text-gray-600">* 實際價格以回覆為準</p>
                </div>
              ) : (
                <div className="space-y-3 mb-6">
                  <div className="flex justify-between">
                    <span className="text-gray-800">活動名稱</span>
                    <span className="font-semibold text-right text-sm text-gray-900">
                      {inquiry.activity_title}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-800">預約日期</span>
                    <span className="font-semibold text-gray-900">{inquiry.visit_date}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-800">參觀人數</span>
                    <span className="font-semibold text-gray-900">{inquiry.visitor_count}</span>
                  </div>
                  <hr />
                  <div className="flex justify-between text-lg font-bold">
                    <span>費用</span>
                    <span className="text-green-600">待報價</span>
                  </div>
                  <p className="text-xs text-gray-600">* 費用將依活動內容報價</p>
                </div>
              )}

              {/* 狀態說明 */}
              <div className="bg-blue-50 p-4 rounded-lg mb-6">
                <h3 className="font-medium text-blue-900 mb-2">
                  目前狀態：{INQUIRY_STATUS_LABELS[inquiry.status]}
                </h3>
                {inquiry.status === 'pending' && (
                  <p className="text-sm text-blue-800">
                    {inquiry.inquiry_type === 'product'
                      ? '我們已收到您的詢價，會在24小時內回覆詳細報價。'
                      : '我們已收到您的預約詢問，會在24小時內回覆並聯繫您確認詳細時間。'}
                  </p>
                )}
                {inquiry.status === 'quoted' && (
                  <p className="text-sm text-blue-800">
                    {inquiry.inquiry_type === 'product'
                      ? '我們已回覆報價，請確認後聯絡我們。'
                      : '我們已回覆預約詳情，請確認後聯絡我們。'}
                  </p>
                )}
                {inquiry.status === 'confirmed' && (
                  <p className="text-sm text-blue-800">
                    {inquiry.inquiry_type === 'product'
                      ? '訂單已確認，我們正在準備您的商品。'
                      : '預約已確認，期待您的蒞臨參觀！'}
                  </p>
                )}
                {inquiry.status === 'completed' && (
                  <p className="text-sm text-green-800">
                    {inquiry.inquiry_type === 'product'
                      ? '訂單已完成，感謝您的購買！'
                      : '參觀已完成，感謝您的蒞臨！'}
                  </p>
                )}
                {inquiry.status === 'cancelled' && (
                  <p className="text-sm text-red-800">
                    此{inquiry.inquiry_type === 'product' ? '詢問單' : '預約'}已取消。
                  </p>
                )}
              </div>

              {/* 操作按鈕 */}
              <div className="space-y-3">
                <Link
                  href="/inquiries"
                  className="block w-full text-center py-3 bg-gray-100 text-gray-800 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  返回詢價列表
                </Link>
                <Link
                  href="/products"
                  className="block w-full text-center py-3 bg-amber-900 text-white rounded-lg hover:bg-amber-800 transition-colors"
                >
                  新增詢價
                </Link>
              </div>

              {/* 聯絡資訊 */}
              <div className="mt-6 pt-6 border-t border-gray-200">
                <h3 className="font-semibold text-gray-900 mb-3">需要協助？</h3>
                <div className="text-sm text-gray-700 space-y-2">
                  <p className="flex items-center">
                    <PhoneIcon className="w-5 h-5 text-amber-600 mr-2" />
                    客服電話：0800-123-456
                  </p>
                  <p className="flex items-center">
                    <EnvelopeIcon className="w-5 h-5 text-amber-600 mr-2" />
                    客服信箱：service@example.com
                  </p>
                  <p className="flex items-center">
                    <ClockIcon className="w-5 h-5 text-amber-600 mr-2" />
                    服務時間：週一至週五 9:00-18:00
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function InquiryDetailPageWithErrorBoundary({ params }: InquiryDetailPageProps) {
  return (
    <ComponentErrorBoundary>
      <InquiryDetailPage params={params} />
    </ComponentErrorBoundary>
  )
}
