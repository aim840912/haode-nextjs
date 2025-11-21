'use client'

/**
 * 管理員訂單管理頁面
 *
 * 顯示所有訂單列表，支援篩選、分頁和狀態更新
 */

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import {
  Package,
  Clock,
  Truck,
  CheckCircle,
  XCircle,
  AlertTriangle,
  RefreshCw,
  Eye,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react'
import { AdminProtection } from '@/components/features/admin/AdminProtection'
import { LoadingSpinner } from '@/components/ui/loading/LoadingSpinner'
import { useToast } from '@/components/ui/feedback/Toast'
import { getCSRFTokenFromCookie } from '@/lib/api/core/api-headers'
import type { Order, OrderStatus, PaymentStatus, OrderSummary } from '@/types/order'

// 訂單狀態配置
const ORDER_STATUS_CONFIG: Record<
  OrderStatus,
  { label: string; color: string; icon: typeof Clock }
> = {
  pending: { label: '待處理', color: 'text-yellow-600 bg-yellow-100', icon: Clock },
  confirmed: { label: '已確認', color: 'text-blue-600 bg-blue-100', icon: Package },
  processing: { label: '處理中', color: 'text-indigo-600 bg-indigo-100', icon: Package },
  shipped: { label: '已出貨', color: 'text-purple-600 bg-purple-100', icon: Truck },
  delivered: { label: '已送達', color: 'text-green-600 bg-green-100', icon: CheckCircle },
  cancelled: { label: '已取消', color: 'text-red-600 bg-red-100', icon: XCircle },
  refunded: { label: '已退款', color: 'text-gray-600 bg-gray-100', icon: XCircle },
}

// 付款狀態配置
const PAYMENT_STATUS_CONFIG: Record<PaymentStatus, { label: string; color: string }> = {
  pending: { label: '待付款', color: 'text-yellow-600 bg-yellow-100' },
  paid: { label: '已付款', color: 'text-green-600 bg-green-100' },
  failed: { label: '付款失敗', color: 'text-red-600 bg-red-100' },
  refunded: { label: '已退款', color: 'text-gray-600 bg-gray-100' },
  expired: { label: '已過期', color: 'text-gray-600 bg-gray-100' },
}

interface OrdersResponse {
  orders: Order[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
    hasNext: boolean
    hasPrev: boolean
  }
  summary: OrderSummary
}

export default function AdminOrdersPage() {
  const { success, error: showError } = useToast()

  // 狀態
  const [orders, setOrders] = useState<Order[]>([])
  const [summary, setSummary] = useState<OrderSummary | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // 分頁狀態
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [total, setTotal] = useState(0)
  const limit = 20

  // 篩選狀態
  const [statusFilter, setStatusFilter] = useState<OrderStatus | 'all'>('all')

  // 取得訂單
  const fetchOrders = useCallback(async () => {
    setIsLoading(true)
    setError(null)

    try {
      const csrfToken = getCSRFTokenFromCookie()
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      }
      if (csrfToken) {
        headers['X-CSRF-Token'] = csrfToken
      }

      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
      })
      if (statusFilter !== 'all') {
        params.set('status', statusFilter)
      }

      const response = await fetch(`/api/admin/orders?${params}`, { headers })
      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error?.message || result.error || '取得訂單失敗')
      }

      const data = result.data as OrdersResponse
      setOrders(data.orders)
      setSummary(data.summary)
      setTotalPages(data.pagination.totalPages)
      setTotal(data.pagination.total)
    } catch (err) {
      const message = err instanceof Error ? err.message : '取得訂單失敗'
      setError(message)
      showError(message)
    } finally {
      setIsLoading(false)
    }
  }, [page, statusFilter, showError])

  // 初始載入和篩選變更時重新取得
  useEffect(() => {
    fetchOrders()
  }, [fetchOrders])

  // 格式化日期
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('zh-TW', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  // Loading 狀態
  if (isLoading && orders.length === 0) {
    return (
      <AdminProtection>
        <div className="min-h-screen bg-gray-50 pt-24 flex items-center justify-center">
          <div className="text-center">
            <LoadingSpinner size="lg" />
            <p className="mt-4 text-gray-600">載入訂單管理...</p>
          </div>
        </div>
      </AdminProtection>
    )
  }

  // Error 狀態
  if (error && orders.length === 0) {
    return (
      <AdminProtection>
        <div className="min-h-screen bg-gray-50 pt-24">
          <div className="max-w-4xl mx-auto px-6 py-16">
            <div className="text-center">
              <AlertTriangle className="w-24 h-24 mx-auto mb-8 text-red-500" />
              <h1 className="text-3xl font-bold text-gray-900 mb-4">載入失敗</h1>
              <p className="text-gray-600 mb-8">{error}</p>
              <button
                onClick={fetchOrders}
                className="bg-green-600 text-white px-8 py-3 rounded-lg hover:bg-green-700 transition-colors"
              >
                重新載入
              </button>
            </div>
          </div>
        </div>
      </AdminProtection>
    )
  }

  return (
    <AdminProtection>
      <div className="min-h-screen bg-gray-50 pt-20">
        <div className="max-w-7xl mx-auto px-6 py-8">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">訂單管理</h1>
              <p className="text-gray-600 mt-1">共 {total} 筆訂單</p>
            </div>
            <button
              onClick={fetchOrders}
              disabled={isLoading}
              className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
              重新整理
            </button>
          </div>

          {/* 統計摘要 */}
          {summary && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
                <p className="text-sm text-gray-600">總訂單數</p>
                <p className="text-2xl font-bold text-gray-900">{summary.totalOrders}</p>
              </div>
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
                <p className="text-sm text-gray-600">總金額</p>
                <p className="text-2xl font-bold text-green-600">
                  NT$ {summary.totalAmount.toLocaleString()}
                </p>
              </div>
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
                <p className="text-sm text-gray-600">待處理</p>
                <p className="text-2xl font-bold text-yellow-600">{summary.pendingOrders}</p>
              </div>
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
                <p className="text-sm text-gray-600">已送達</p>
                <p className="text-2xl font-bold text-green-600">{summary.deliveredOrders}</p>
              </div>
            </div>
          )}

          {/* 篩選 */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
            <div className="flex items-center gap-4">
              <span className="text-sm font-medium text-gray-700">狀態篩選：</span>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => {
                    setStatusFilter('all')
                    setPage(1)
                  }}
                  className={`px-3 py-1 text-sm rounded-full transition-colors ${
                    statusFilter === 'all'
                      ? 'bg-gray-900 text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  全部
                </button>
                {Object.entries(ORDER_STATUS_CONFIG).map(([status, config]) => (
                  <button
                    key={status}
                    onClick={() => {
                      setStatusFilter(status as OrderStatus)
                      setPage(1)
                    }}
                    className={`px-3 py-1 text-sm rounded-full transition-colors ${
                      statusFilter === status
                        ? 'bg-gray-900 text-white'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    {config.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* 訂單列表 */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            {orders.length === 0 ? (
              <div className="p-8 text-center">
                <Package className="w-16 h-16 mx-auto text-gray-300 mb-4" />
                <p className="text-gray-600">沒有符合條件的訂單</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">
                        訂單編號
                      </th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">
                        訂單狀態
                      </th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">
                        付款狀態
                      </th>
                      <th className="px-4 py-3 text-right text-sm font-medium text-gray-600">
                        金額
                      </th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">
                        建立時間
                      </th>
                      <th className="px-4 py-3 text-center text-sm font-medium text-gray-600">
                        操作
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {orders.map(order => {
                      const statusConfig = ORDER_STATUS_CONFIG[order.status]
                      const paymentConfig = order.paymentStatus
                        ? PAYMENT_STATUS_CONFIG[order.paymentStatus]
                        : null
                      const StatusIcon = statusConfig.icon

                      return (
                        <tr key={order.id} className="hover:bg-gray-50">
                          <td className="px-4 py-4">
                            <div className="font-medium text-gray-900">{order.orderNumber}</div>
                            <div className="text-xs text-gray-500 truncate max-w-[150px]">
                              {order.id}
                            </div>
                          </td>
                          <td className="px-4 py-4">
                            <span
                              className={`inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full ${statusConfig.color}`}
                            >
                              <StatusIcon className="w-3 h-3" />
                              {statusConfig.label}
                            </span>
                          </td>
                          <td className="px-4 py-4">
                            {paymentConfig ? (
                              <span
                                className={`inline-flex items-center px-2 py-1 text-xs font-medium rounded-full ${paymentConfig.color}`}
                              >
                                {paymentConfig.label}
                              </span>
                            ) : (
                              <span className="text-gray-400">-</span>
                            )}
                          </td>
                          <td className="px-4 py-4 text-right">
                            <span className="font-semibold text-gray-900">
                              NT$ {order.totalAmount.toLocaleString()}
                            </span>
                          </td>
                          <td className="px-4 py-4 text-sm text-gray-600">
                            {formatDate(order.createdAt)}
                          </td>
                          <td className="px-4 py-4 text-center">
                            <Link
                              href={`/admin/orders/${order.id}`}
                              className="inline-flex items-center gap-1 px-3 py-1 text-sm text-green-600 hover:text-green-700 hover:bg-green-50 rounded transition-colors"
                            >
                              <Eye className="w-4 h-4" />
                              查看
                            </Link>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}

            {/* 分頁 */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between px-4 py-3 border-t border-gray-200">
                <div className="text-sm text-gray-600">
                  第 {page} 頁，共 {totalPages} 頁
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setPage(p => Math.max(1, p - 1))}
                    disabled={page === 1}
                    className="p-2 rounded-lg hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages}
                    className="p-2 rounded-lg hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <ChevronRight className="w-5 h-5" />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </AdminProtection>
  )
}
