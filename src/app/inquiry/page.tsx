'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import Link from 'next/link'
import { ClipboardList } from 'lucide-react'
import { ComponentErrorBoundary } from '@/components/ui/error/ErrorBoundary'
import { useToast } from '@/components/ui/feedback/Toast'
import { LoadingSpinner } from '@/components/ui/loading/LoadingSpinner'
import { useAuth } from '@/contexts/AuthContext'
import { inquiryApi } from '@/lib/api-client'
import { formatDateTime } from '@/lib/utils/formatters'
import {
  InquiryWithItems,
  InquiryStatus,
  INQUIRY_STATUS_LABELS,
  INQUIRY_STATUS_COLORS,
  InquiryUtils,
} from '@/types/inquiry'

function InquiryListPage() {
  const { user, isLoading: authLoading } = useAuth()
  const {} = useToast()

  // 狀態管理
  const [inquiries, setInquiries] = useState<InquiryWithItems[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [statusFilter, setStatusFilter] = useState<InquiryStatus | 'all'>('all')
  const [searchTerm, setSearchTerm] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 10
  const isInitialized = useRef(false)

  // 取得使用者詢問單
  const fetchUserInquiries = useCallback(async () => {
    if (!user) return

    setIsLoading(true)
    setError(null)

    try {
      // 建立查詢參數
      const params: Record<string, string | number> = {}
      if (statusFilter !== 'all') {
        params.status = statusFilter
      }
      params.sort_by = 'created_at'
      params.sort_order = 'desc'
      params.limit = 100 // 先載入較多資料，前端進行分頁

      // 使用 API
      const response = await inquiryApi.list(params)

      if (response.success && response.data) {
        setInquiries(response.data as InquiryWithItems[])
      } else {
        throw new Error(response.message || '取得詢問單列表失敗')
      }
    } catch (error) {
      setError(error instanceof Error ? error.message : '載入詢問單時發生錯誤')
    } finally {
      setIsLoading(false)
    }
  }, [user, statusFilter])

  // 重新查詢功能已移除（不再提供複製查詢單功能）
  // const duplicateInquiry = async (inquiry: InquiryWithItems) => {
  //   ...功能已移除...
  // };

  // 篩選和搜尋功能
  const filteredInquiries = inquiries.filter(inquiry => {
    const matchesSearch =
      !searchTerm ||
      inquiry.customer_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      InquiryUtils.formatInquiryNumber(inquiry).toLowerCase().includes(searchTerm.toLowerCase()) ||
      inquiry.inquiry_items.some(item =>
        item.product_name.toLowerCase().includes(searchTerm.toLowerCase())
      )

    const matchesStatus = statusFilter === 'all' || inquiry.status === statusFilter

    return matchesSearch && matchesStatus
  })

  // 分頁計算
  const totalPages = Math.ceil(filteredInquiries.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const paginatedInquiries = filteredInquiries.slice(startIndex, startIndex + itemsPerPage)

  // 初始載入（只在使用者認證完成時載入一次）
  useEffect(() => {
    if (user && !isInitialized.current) {
      isInitialized.current = true
      fetchUserInquiries()
    }
  }, [user, fetchUserInquiries])

  // 當狀態篩選條件改變時重新載入（跳過初始值）
  useEffect(() => {
    if (user && isInitialized.current) {
      fetchUserInquiries()
    }
  }, [statusFilter, user, fetchUserInquiries])

  // 重置分頁當篩選條件改變
  useEffect(() => {
    setCurrentPage(1)
  }, [statusFilter, searchTerm])

  // 認證載入中
  if (authLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-slate-900 pt-36 flex items-center justify-center">
        <div className="text-center">
          <LoadingSpinner size="lg" />
          <p className="mt-4 text-gray-600 dark:text-gray-300">載入中...</p>
        </div>
      </div>
    )
  }

  // 未登入
  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-slate-900">
        <div className="max-w-4xl mx-auto px-6 py-16">
          <div className="text-center">
            <div className="text-6xl mb-8">🔒</div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-4">需要登入</h1>
            <p className="text-gray-600 dark:text-gray-300 mb-8">請先登入以查看您的詢問單</p>
            <div className="space-x-4">
              <Link
                href="/login"
                className="bg-amber-900 dark:bg-amber-800 text-white px-8 py-3 rounded-lg hover:bg-amber-800 dark:hover:bg-amber-700 transition-colors"
              >
                登入
              </Link>
              <Link
                href="/register"
                className="bg-gray-600 dark:bg-gray-700 text-white px-8 py-3 rounded-lg hover:bg-gray-700 dark:hover:bg-gray-600 transition-colors"
              >
                註冊
              </Link>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // 載入中
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-slate-900 flex items-center justify-center">
        <div className="text-center">
          <LoadingSpinner size="lg" />
          <p className="mt-4 text-gray-600 dark:text-gray-300">載入詢問單...</p>
        </div>
      </div>
    )
  }

  // 載入錯誤
  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-slate-900">
        <div className="max-w-4xl mx-auto px-6 py-16">
          <div className="text-center">
            <div className="text-6xl mb-8">❌</div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-4">載入失敗</h1>
            <p className="text-gray-600 dark:text-gray-300 mb-8">{error}</p>
            <button
              onClick={fetchUserInquiries}
              className="bg-amber-900 dark:bg-amber-800 text-white px-8 py-3 rounded-lg hover:bg-amber-800 dark:hover:bg-amber-700 transition-colors"
            >
              重新載入
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-900">
      {/* Header */}
      <div className="bg-white dark:bg-slate-800 shadow-sm border-b dark:border-slate-700">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
              我的詢問單問答紀錄
            </h1>
            <p className="text-gray-600 dark:text-gray-300 mt-2">
              查看和管理您的詢問單問答與預訂紀錄
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-8">
        {/* 篩選和搜尋 */}
        <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm p-6 mb-6">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            {/* 狀態篩選 */}
            <div className="flex items-center space-x-4">
              <span className="text-gray-700 dark:text-gray-300 font-medium">篩選狀態：</span>
              <div className="flex flex-wrap gap-2">
                {(['all', 'pending', 'quoted', 'confirmed', 'completed', 'cancelled'] as const).map(
                  status => (
                    <button
                      key={status}
                      onClick={() => setStatusFilter(status)}
                      className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                        statusFilter === status
                          ? 'bg-amber-900 dark:bg-amber-800 text-white'
                          : 'bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-slate-600'
                      }`}
                    >
                      {status === 'all' ? '全部' : INQUIRY_STATUS_LABELS[status]}
                    </button>
                  )
                )}
              </div>
            </div>

            {/* 搜尋欄 */}
            <div className="flex items-center space-x-4">
              <input
                type="text"
                placeholder="搜尋詢問單號、商品名稱..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="px-4 py-2 border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 min-w-[300px] text-gray-900 dark:text-gray-200 placeholder-gray-500 dark:placeholder-gray-400 dark:bg-slate-700"
              />
              <div className="text-sm text-gray-600 dark:text-gray-300">
                共 {filteredInquiries.length} 筆詢價紀錄
              </div>
            </div>
          </div>
        </div>

        {/* 詢問單列表 */}
        {filteredInquiries.length === 0 ? (
          <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm p-12 text-center">
            <div className="mb-8 flex justify-center">
              <ClipboardList className="h-16 w-16 text-gray-400 dark:text-gray-500" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-4">
              {statusFilter === 'all'
                ? '還沒有詢價紀錄'
                : `沒有${INQUIRY_STATUS_LABELS[statusFilter as InquiryStatus]}的詢價紀錄`}
            </h2>
            <p className="text-gray-600 dark:text-gray-300 mb-8">
              {searchTerm ? '請嘗試不同的搜尋條件' : '開始購物並提交詢價吧！'}
            </p>
            <Link
              href="/products"
              className="bg-amber-900 dark:bg-amber-800 text-white px-8 py-3 rounded-lg hover:bg-amber-800 dark:hover:bg-amber-700 transition-colors inline-block"
            >
              瀏覽商品
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {paginatedInquiries.map(inquiry => (
              <div
                key={inquiry.id}
                className="bg-white dark:bg-slate-800 rounded-lg shadow-sm p-6 hover:shadow-md transition-shadow"
              >
                <div className="flex flex-col lg:flex-row lg:items-center justify-between">
                  {/* 左側：詢問單資訊 */}
                  <div className="flex-1">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-1">
                          詢問單 #{InquiryUtils.formatInquiryNumber(inquiry)}
                        </h3>
                        <p className="text-sm text-gray-600 dark:text-gray-300">
                          {formatDateTime(inquiry.created_at)}
                        </p>
                      </div>
                      <span
                        className={`px-3 py-1 rounded-full text-sm font-medium ${INQUIRY_STATUS_COLORS[inquiry.status]}`}
                      >
                        {INQUIRY_STATUS_LABELS[inquiry.status]}
                      </span>
                    </div>

                    {/* 商品摘要 */}
                    <div className="mb-4">
                      <p className="text-gray-900 dark:text-gray-100 font-medium">
                        共 {InquiryUtils.calculateTotalQuantity(inquiry)} 件商品
                      </p>
                      <p className="text-sm text-gray-600 dark:text-gray-300">
                        {inquiry.inquiry_items
                          .slice(0, 3)
                          .map(item => `${item.product_name} x${item.quantity}`)
                          .join('、')}
                        {inquiry.inquiry_items.length > 3 && '...'}
                      </p>
                      <p className="text-lg font-semibold text-amber-900 dark:text-amber-300 mt-2">
                        總金額：NT$ {InquiryUtils.calculateTotalAmount(inquiry).toLocaleString()}
                      </p>
                    </div>
                  </div>

                  {/* 右側：操作按鈕 */}
                  <div className="flex flex-col sm:flex-row gap-3 lg:ml-6">
                    <Link
                      href={`/inquiries/${inquiry.id}`}
                      className="bg-blue-600 dark:bg-blue-700 text-white px-4 py-2 rounded-lg hover:bg-blue-700 dark:hover:bg-blue-600 transition-colors text-center text-sm"
                    >
                      查看詳情
                    </Link>

                    {inquiry.status === 'quoted' && (
                      <Link
                        href={`/inquiries/${inquiry.id}?action=accept`}
                        className="bg-green-600 dark:bg-green-700 text-white px-4 py-2 rounded-lg hover:bg-green-700 dark:hover:bg-green-600 transition-colors text-center text-sm"
                      >
                        確認預訂
                      </Link>
                    )}
                  </div>
                </div>

                {/* 客戶備註 */}
                {inquiry.notes && (
                  <div className="mt-4 pt-4 border-t border-gray-200 dark:border-slate-700">
                    <p className="text-sm text-gray-600 dark:text-gray-300">
                      <span className="font-medium">備註：</span>
                      {inquiry.notes}
                    </p>
                  </div>
                )}
              </div>
            ))}

            {/* 分頁 */}
            {totalPages > 1 && (
              <div className="flex justify-center mt-8">
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                    disabled={currentPage === 1}
                    className={`px-3 py-2 rounded-lg text-sm ${
                      currentPage === 1
                        ? 'bg-gray-100 dark:bg-slate-700 text-gray-400 dark:text-gray-500 cursor-not-allowed'
                        : 'bg-white dark:bg-slate-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-700 border border-gray-300 dark:border-slate-600'
                    }`}
                  >
                    上一頁
                  </button>

                  <div className="flex items-center space-x-1">
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                      <button
                        key={page}
                        onClick={() => setCurrentPage(page)}
                        className={`px-3 py-2 rounded-lg text-sm ${
                          currentPage === page
                            ? 'bg-amber-900 dark:bg-amber-800 text-white'
                            : 'bg-white dark:bg-slate-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-700 border border-gray-300 dark:border-slate-600'
                        }`}
                      >
                        {page}
                      </button>
                    ))}
                  </div>

                  <button
                    onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                    disabled={currentPage === totalPages}
                    className={`px-3 py-2 rounded-lg text-sm ${
                      currentPage === totalPages
                        ? 'bg-gray-100 dark:bg-slate-700 text-gray-400 dark:text-gray-500 cursor-not-allowed'
                        : 'bg-white dark:bg-slate-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-700 border border-gray-300 dark:border-slate-600'
                    }`}
                  >
                    下一頁
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

export default function InquiryListPageWithErrorBoundary() {
  return (
    <ComponentErrorBoundary>
      <InquiryListPage />
    </ComponentErrorBoundary>
  )
}
