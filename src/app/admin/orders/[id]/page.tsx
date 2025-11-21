'use client'

/**
 * 管理員訂單詳情頁面
 *
 * 顯示訂單完整資訊，支援更新狀態和物流資訊
 */

import { useState, useEffect, useCallback, use } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import {
  ArrowLeft,
  Package,
  Clock,
  Truck,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Save,
  User,
  MapPin,
  CreditCard,
  ShoppingBag,
} from 'lucide-react'
import { AdminProtection } from '@/components/features/admin/AdminProtection'
import { LoadingSpinner } from '@/components/ui/loading/LoadingSpinner'
import { useToast } from '@/components/ui/feedback/Toast'
import { getCSRFTokenFromCookie } from '@/lib/api/core/api-headers'
import type { Order, OrderStatus, PaymentStatus } from '@/types/order'

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

// 狀態更新選項
const STATUS_OPTIONS: { value: OrderStatus; label: string }[] = [
  { value: 'pending', label: '待處理' },
  { value: 'confirmed', label: '已確認' },
  { value: 'processing', label: '處理中' },
  { value: 'shipped', label: '已出貨' },
  { value: 'delivered', label: '已送達' },
  { value: 'cancelled', label: '已取消' },
  { value: 'refunded', label: '已退款' },
]

export default function AdminOrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const { success, error: showError } = useToast()

  // 狀態
  const [order, setOrder] = useState<Order | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isSaving, setIsSaving] = useState(false)

  // 編輯狀態
  const [newStatus, setNewStatus] = useState<OrderStatus | ''>('')
  const [trackingNumber, setTrackingNumber] = useState('')
  const [notes, setNotes] = useState('')

  // 取得訂單詳情
  const fetchOrder = useCallback(async () => {
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

      const response = await fetch(`/api/admin/orders/${id}`, { headers })
      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error?.message || result.error || '取得訂單失敗')
      }

      const orderData = result.data as Order
      setOrder(orderData)
      setNewStatus(orderData.status)
      setTrackingNumber(orderData.trackingNumber || '')
      setNotes(orderData.notes || '')
    } catch (err) {
      const message = err instanceof Error ? err.message : '取得訂單失敗'
      setError(message)
      showError(message)
    } finally {
      setIsLoading(false)
    }
  }, [id, showError])

  // 初始載入
  useEffect(() => {
    fetchOrder()
  }, [fetchOrder])

  // 儲存變更
  const handleSave = async () => {
    if (!order) return

    setIsSaving(true)

    try {
      const csrfToken = getCSRFTokenFromCookie()
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      }
      if (csrfToken) {
        headers['X-CSRF-Token'] = csrfToken
      }

      const updates: Record<string, string> = {}
      if (newStatus && newStatus !== order.status) {
        updates.status = newStatus
      }
      if (trackingNumber !== (order.trackingNumber || '')) {
        updates.trackingNumber = trackingNumber
      }
      if (notes !== (order.notes || '')) {
        updates.notes = notes
      }

      if (Object.keys(updates).length === 0) {
        showError('沒有變更需要儲存')
        setIsSaving(false)
        return
      }

      const response = await fetch(`/api/admin/orders/${id}`, {
        method: 'PATCH',
        headers,
        body: JSON.stringify(updates),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error?.message || result.error || '更新訂單失敗')
      }

      setOrder(result.data)
      success('訂單更新成功')
    } catch (err) {
      const message = err instanceof Error ? err.message : '更新訂單失敗'
      showError(message)
    } finally {
      setIsSaving(false)
    }
  }

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
  if (isLoading) {
    return (
      <AdminProtection>
        <div className="min-h-screen bg-gray-50 pt-24 flex items-center justify-center">
          <div className="text-center">
            <LoadingSpinner size="lg" />
            <p className="mt-4 text-gray-600">載入訂單詳情...</p>
          </div>
        </div>
      </AdminProtection>
    )
  }

  // Error 狀態
  if (error || !order) {
    return (
      <AdminProtection>
        <div className="min-h-screen bg-gray-50 pt-24">
          <div className="max-w-4xl mx-auto px-6 py-16">
            <div className="text-center">
              <AlertTriangle className="w-24 h-24 mx-auto mb-8 text-red-500" />
              <h1 className="text-3xl font-bold text-gray-900 mb-4">載入失敗</h1>
              <p className="text-gray-600 mb-8">{error || '找不到訂單'}</p>
              <Link
                href="/admin/orders"
                className="bg-green-600 text-white px-8 py-3 rounded-lg hover:bg-green-700 transition-colors"
              >
                返回訂單列表
              </Link>
            </div>
          </div>
        </div>
      </AdminProtection>
    )
  }

  const statusConfig = ORDER_STATUS_CONFIG[order.status]
  const StatusIcon = statusConfig.icon
  const paymentConfig = order.paymentStatus ? PAYMENT_STATUS_CONFIG[order.paymentStatus] : null

  return (
    <AdminProtection>
      <div className="min-h-screen bg-gray-50 pt-20">
        <div className="max-w-5xl mx-auto px-6 py-8">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-4">
              <Link
                href="/admin/orders"
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
              </Link>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">訂單 {order.orderNumber}</h1>
                <p className="text-gray-600">建立於 {formatDate(order.createdAt)}</p>
              </div>
            </div>
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              {isSaving ? '儲存中...' : '儲存變更'}
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* 左側：訂單詳情 */}
            <div className="lg:col-span-2 space-y-6">
              {/* 狀態更新 */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h2 className="text-lg font-bold text-gray-900 mb-4">訂單狀態</h2>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">目前狀態</label>
                    <span
                      className={`inline-flex items-center gap-1 px-3 py-1 text-sm font-medium rounded-full ${statusConfig.color}`}
                    >
                      <StatusIcon className="w-4 h-4" />
                      {statusConfig.label}
                    </span>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">更新狀態</label>
                    <select
                      value={newStatus}
                      onChange={e => setNewStatus(e.target.value as OrderStatus)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                    >
                      {STATUS_OPTIONS.map(option => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* 訂單項目 */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h2 className="text-lg font-bold text-gray-900 mb-4">訂購商品</h2>
                <div className="space-y-4">
                  {order.items.map(item => (
                    <div
                      key={item.id}
                      className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg"
                    >
                      <div className="relative w-16 h-16 flex-shrink-0 bg-gray-200 rounded-lg overflow-hidden">
                        {item.productImage ? (
                          <Image
                            src={item.productImage}
                            alt={item.productName}
                            fill
                            className="object-cover"
                            sizes="64px"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <ShoppingBag className="w-6 h-6 text-gray-400" />
                          </div>
                        )}
                      </div>
                      <div className="flex-grow">
                        <p className="font-medium text-gray-900">{item.productName}</p>
                        <p className="text-sm text-gray-600">
                          NT$ {item.unitPrice.toLocaleString()} x {item.quantity}
                        </p>
                      </div>
                      <p className="font-semibold text-gray-900">
                        NT$ {item.subtotal.toLocaleString()}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              {/* 物流資訊 */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h2 className="text-lg font-bold text-gray-900 mb-4">物流資訊</h2>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      物流追蹤號碼
                    </label>
                    <input
                      type="text"
                      value={trackingNumber}
                      onChange={e => setTrackingNumber(e.target.value)}
                      placeholder="輸入物流追蹤號碼"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">備註</label>
                    <textarea
                      value={notes}
                      onChange={e => setNotes(e.target.value)}
                      placeholder="訂單備註"
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* 右側：摘要資訊 */}
            <div className="space-y-6">
              {/* 付款資訊 */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h3 className="text-sm font-medium text-gray-900 mb-4 flex items-center gap-2">
                  <CreditCard className="w-4 h-4" />
                  付款資訊
                </h3>
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">付款狀態</span>
                    {paymentConfig ? (
                      <span className={`px-2 py-0.5 rounded-full text-xs ${paymentConfig.color}`}>
                        {paymentConfig.label}
                      </span>
                    ) : (
                      <span className="text-gray-400">-</span>
                    )}
                  </div>
                  {order.paymentMethod && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">付款方式</span>
                      <span className="text-gray-900">{order.paymentMethod}</span>
                    </div>
                  )}
                  {order.paymentTime && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">付款時間</span>
                      <span className="text-gray-900">{formatDate(order.paymentTime)}</span>
                    </div>
                  )}
                  <hr className="border-gray-200" />
                  <div className="flex justify-between">
                    <span className="text-gray-600">商品小計</span>
                    <span>NT$ {order.subtotal.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">運費</span>
                    <span>NT$ {order.shippingFee.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between font-bold text-gray-900">
                    <span>總金額</span>
                    <span>NT$ {order.totalAmount.toLocaleString()}</span>
                  </div>
                </div>
              </div>

              {/* 配送資訊 */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h3 className="text-sm font-medium text-gray-900 mb-4 flex items-center gap-2">
                  <MapPin className="w-4 h-4" />
                  配送資訊
                </h3>
                <div className="text-sm space-y-2">
                  <p className="font-medium text-gray-900">{order.shippingAddress.name}</p>
                  <p className="text-gray-600">{order.shippingAddress.phone}</p>
                  <p className="text-gray-600">
                    {order.shippingAddress.postalCode} {order.shippingAddress.city}
                  </p>
                  <p className="text-gray-600">{order.shippingAddress.street}</p>
                  {order.shippingAddress.notes && (
                    <p className="text-gray-500 text-xs mt-2">
                      備註：{order.shippingAddress.notes}
                    </p>
                  )}
                </div>
              </div>

              {/* 客戶資訊 */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h3 className="text-sm font-medium text-gray-900 mb-4 flex items-center gap-2">
                  <User className="w-4 h-4" />
                  客戶資訊
                </h3>
                <div className="text-sm">
                  <p className="text-gray-600 text-xs truncate">ID: {order.userId}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AdminProtection>
  )
}
