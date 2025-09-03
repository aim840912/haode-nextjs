'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/lib/auth-context'
import Link from 'next/link'
import LoadingSpinner from '@/components/LoadingSpinner'
import { ComponentErrorBoundary } from '@/components/ErrorBoundary'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase-auth'
import { logger } from '@/lib/logger'
import {
  InquiryWithItems,
  InquiryStatus,
  InquiryType,
  INQUIRY_STATUS_LABELS,
  INQUIRY_STATUS_COLORS,
  INQUIRY_TYPE_LABELS,
  INQUIRY_TYPE_COLORS,
  InquiryUtils,
} from '@/types/inquiry'

function InquiriesPage() {
  const { user, isLoading: authLoading } = useAuth()
  const router = useRouter()
  const [inquiries, setInquiries] = useState<InquiryWithItems[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [statusFilter, setStatusFilter] = useState<InquiryStatus | 'all'>('all')
  const [typeFilter, setTypeFilter] = useState<InquiryType | 'all'>('all')

  // 取得詢問單列表
  const fetchInquiries = async () => {
    if (!user) return

    setIsLoading(true)
    setError(null)

    try {
      // 取得認證 token
      const {
        data: { session },
      } = await supabase.auth.getSession()
      if (!session?.access_token) {
        throw new Error('認證失敗')
      }

      // 建立查詢參數
      const params = new URLSearchParams()
      if (statusFilter !== 'all') {
        params.append('status', statusFilter)
      }
      if (typeFilter !== 'all') {
        params.append('inquiry_type', typeFilter)
      }
      params.append('sort_by', 'created_at')
      params.append('sort_order', 'desc')

      // 呼叫 API
      const response = await fetch(`/api/inquiries?${params}`, {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || '取得詢問單列表失敗')
      }

      setInquiries(result.data || [])
    } catch (err) {
      logger.error('Error fetching inquiries', err as Error, { module: 'InquiriesPage', action: 'fetchInquiries' })
      setError(err instanceof Error ? err.message : '載入詢問單時發生錯誤')
    } finally {
      setIsLoading(false)
    }
  }

  // 初始載入
  useEffect(() => {
    if (user) {
      fetchInquiries()
    } else if (!authLoading) {
      setIsLoading(false)
    }
  }, [user, authLoading, statusFilter, typeFilter])

  // 載入中狀態
  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 pt-36 flex items-center justify-center">
        <div className="text-center">
          <LoadingSpinner size="lg" />
          <p className="mt-4 text-gray-600">載入詢問單...</p>
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
            <div className="text-6xl mb-8">🔒</div>
            <h1 className="text-3xl font-bold text-gray-900 mb-4">需要登入才能查看詢問單</h1>
            <p className="text-gray-600 mb-8">請先登入您的帳戶，即可查看您的詢價歷史！</p>
            <div className="space-x-4">
              <Link
                href="/login"
                className="inline-block bg-amber-900 text-white px-8 py-3 rounded-lg hover:bg-amber-800 transition-colors"
              >
                立即登入
              </Link>
              <Link
                href="/register"
                className="inline-block border border-amber-900 text-amber-900 px-8 py-3 rounded-lg hover:bg-amber-50 transition-colors"
              >
                註冊帳戶
              </Link>
            </div>
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
            <button
              onClick={fetchInquiries}
              className="bg-amber-900 text-white px-8 py-3 rounded-lg hover:bg-amber-800 transition-colors"
            >
              重新載入
            </button>
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
            <h1 className="text-3xl font-bold text-gray-900">我的詢問單</h1>
            <p className="text-gray-600 mt-1">查看您的詢價歷史和處理狀態</p>
          </div>
        </div>

        {/* 篩選器 */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6 space-y-4">
          {/* 類型篩選 */}
          <div className="flex items-center space-x-4">
            <span className="text-gray-700 font-medium">詢問類型：</span>
            <div className="flex space-x-2">
              {['all', 'product', 'farm_tour'].map(type => (
                <button
                  key={type}
                  onClick={() => setTypeFilter(type as InquiryType | 'all')}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    typeFilter === type
                      ? 'bg-green-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {type === 'all' ? '全部' : INQUIRY_TYPE_LABELS[type as InquiryType]}
                </button>
              ))}
            </div>
          </div>

          {/* 狀態篩選 */}
          <div className="flex items-center space-x-4">
            <span className="text-gray-700 font-medium">處理狀態：</span>
            <div className="flex space-x-2">
              {['all', 'pending', 'quoted', 'confirmed', 'completed', 'cancelled'].map(status => (
                <button
                  key={status}
                  onClick={() => setStatusFilter(status as InquiryStatus | 'all')}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    statusFilter === status
                      ? 'bg-amber-900 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {status === 'all' ? '全部' : INQUIRY_STATUS_LABELS[status as InquiryStatus]}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* 詢問單列表 */}
        {inquiries.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm p-12 text-center">
            <div className="text-6xl mb-8">📋</div>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              {statusFilter === 'all'
                ? '還沒有詢問單'
                : `沒有${INQUIRY_STATUS_LABELS[statusFilter as InquiryStatus]}的詢問單`}
            </h2>
            <p className="text-gray-600 mb-8">前往購物車選擇商品後，即可送出您的第一個詢問單！</p>
            <Link
              href="/products"
              className="inline-block bg-amber-900 text-white px-8 py-3 rounded-lg hover:bg-amber-800 transition-colors"
            >
              開始選購
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {inquiries.map(inquiry => (
              <div
                key={inquiry.id}
                className="bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow"
              >
                <div className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-4">
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">
                          詢問單 #{InquiryUtils.formatInquiryNumber(inquiry)}
                        </h3>
                        <p className="text-sm text-gray-600">
                          {new Date(inquiry.created_at).toLocaleDateString('zh-TW', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3">
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
                      <Link
                        href={`/inquiries/${inquiry.id}`}
                        className="text-amber-900 hover:text-amber-800 font-medium"
                      >
                        查看詳情 →
                      </Link>
                    </div>
                  </div>

                  <div className="grid md:grid-cols-3 gap-4">
                    <div>
                      {inquiry.inquiry_type === 'product' ? (
                        <>
                          <h4 className="text-sm font-medium text-gray-800 mb-2">商品摘要</h4>
                          <p className="text-sm text-gray-700">
                            {InquiryUtils.calculateTotalQuantity(inquiry)} 件商品
                          </p>
                          <div className="text-xs text-gray-600 mt-1">
                            {inquiry.inquiry_items
                              .slice(0, 2)
                              .map(item => item.product_name)
                              .join(', ')}
                            {inquiry.inquiry_items.length > 2 &&
                              `... 等 ${inquiry.inquiry_items.length} 項`}
                          </div>
                        </>
                      ) : (
                        <>
                          <h4 className="text-sm font-medium text-gray-800 mb-2">活動資訊</h4>
                          <p className="text-sm text-gray-700">{inquiry.activity_title}</p>
                          <div className="text-xs text-gray-600 mt-1">
                            {inquiry.visit_date} · {inquiry.visitor_count}
                          </div>
                        </>
                      )}
                    </div>
                    <div>
                      <h4 className="text-sm font-medium text-gray-800 mb-2">
                        {inquiry.inquiry_type === 'product' ? '預估金額' : '費用資訊'}
                      </h4>
                      {inquiry.inquiry_type === 'product' ? (
                        <>
                          <p className="text-lg font-bold text-amber-900">
                            NT$ {InquiryUtils.calculateTotalAmount(inquiry).toLocaleString()}
                          </p>
                          <p className="text-xs text-gray-600 mt-1">實際價格以回覆為準</p>
                        </>
                      ) : (
                        <>
                          <p className="text-lg font-bold text-green-600">待報價</p>
                          <p className="text-xs text-gray-600 mt-1">費用將依活動內容報價</p>
                        </>
                      )}
                    </div>
                    <div>
                      <h4 className="text-sm font-medium text-gray-800 mb-2">聯絡資訊</h4>
                      <p className="text-sm text-gray-700">{inquiry.customer_name}</p>
                      <p className="text-xs text-gray-600">{inquiry.customer_email}</p>
                    </div>
                  </div>

                  {inquiry.notes && (
                    <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                      <h4 className="text-sm font-medium text-gray-800 mb-1">備註</h4>
                      <p className="text-sm text-gray-700">{inquiry.notes}</p>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* 底部說明 */}
        <div className="mt-12 bg-blue-50 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-blue-900 mb-4">詢問流程說明</h3>
          <div className="grid md:grid-cols-4 gap-4 text-sm">
            <div className="text-center">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-2">
                <span className="text-blue-600 font-bold">1</span>
              </div>
              <h4 className="font-medium text-blue-900 mb-1">選擇商品</h4>
              <p className="text-blue-700">將商品加入購物車</p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-2">
                <span className="text-blue-600 font-bold">2</span>
              </div>
              <h4 className="font-medium text-blue-900 mb-1">送出詢價</h4>
              <p className="text-blue-700">填寫聯絡資訊並送出</p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-2">
                <span className="text-blue-600 font-bold">3</span>
              </div>
              <h4 className="font-medium text-blue-900 mb-1">等待報價</h4>
              <p className="text-blue-700">24小時內收到回覆</p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-2">
                <span className="text-blue-600 font-bold">4</span>
              </div>
              <h4 className="font-medium text-blue-900 mb-1">確認訂購</h4>
              <p className="text-blue-700">確認價格後完成訂購</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function InquiriesPageWithErrorBoundary() {
  return (
    <ComponentErrorBoundary>
      <InquiriesPage />
    </ComponentErrorBoundary>
  )
}
