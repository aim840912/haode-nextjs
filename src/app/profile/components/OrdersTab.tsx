import Link from 'next/link'
import { Package, CreditCard } from 'lucide-react'
import { LoadingSpinner } from '@/components/ui/loading/LoadingSpinner'
import { formatDate } from '@/lib/utils/formatters'
import type { Order } from '@/types/order'

function getPaymentStatusText(status: string | undefined) {
  if (!status) return '未付款'
  const statusMap: Record<string, string> = {
    pending: '待付款',
    paid: '已付款',
    failed: '付款失敗',
    refunded: '已退款',
    expired: '已過期',
  }
  return statusMap[status] || status
}

function getPaymentStatusColor(status: string | undefined) {
  if (!status || status === 'pending') return 'bg-yellow-100 text-yellow-800'
  if (status === 'paid') return 'bg-green-100 text-green-800'
  if (status === 'failed' || status === 'expired') return 'bg-red-100 text-red-800'
  return 'bg-gray-100 text-gray-800'
}

interface OrdersTabProps {
  orders: Order[]
  loading: boolean
  error: string | null
  onCancelOrder: (orderId: string) => void
  getStatusText: (status: string) => string
  getStatusColor: (status: string) => string
}

/**
 * 訂單分頁元件
 * 顯示使用者的訂單列表
 */
export function OrdersTab({
  orders,
  loading,
  error,
  onCancelOrder,
  getStatusText,
  getStatusColor,
}: OrdersTabProps) {
  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex justify-center py-12">
          <LoadingSpinner size="lg" />
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="text-center py-12">
          <p className="text-red-600">{error}</p>
        </div>
      </div>
    )
  }

  if (orders.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="text-center py-12">
          <Package className="w-16 h-16 mx-auto mb-4 text-amber-900" strokeWidth={1.5} />
          <h3 className="text-xl font-medium text-gray-900 mb-2">尚無訂單記錄</h3>
          <p className="text-gray-600 mb-4">開始探索我們的產品吧！</p>
          <Link
            href="/products"
            className="inline-block px-6 py-2 bg-amber-900 text-white rounded-lg hover:bg-amber-800 transition-colors"
          >
            瀏覽產品
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">訂單記錄</h2>
      <div className="space-y-4">
        {orders.map(order => {
          const canPay = order.paymentStatus === 'pending' || !order.paymentStatus
          const isPaid = order.paymentStatus === 'paid'

          return (
            <div key={order.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
              <div className="flex justify-between items-start mb-3">
                <div>
                  <p className="text-sm text-gray-600">訂單編號：{order.orderNumber || order.id}</p>
                  <p className="text-sm text-gray-600">
                    訂單日期：{formatDate(order.createdAt, 'short')}
                  </p>
                </div>
                <div className="flex flex-col items-end gap-1">
                  <span
                    className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(order.status)}`}
                  >
                    {getStatusText(order.status)}
                  </span>
                  <span
                    className={`px-2 py-0.5 rounded-full text-xs font-medium ${getPaymentStatusColor(order.paymentStatus)}`}
                  >
                    {getPaymentStatusText(order.paymentStatus)}
                  </span>
                </div>
              </div>

              <div className="mb-3">
                <p className="text-gray-900 font-medium">
                  總金額：NT$ {order.totalAmount.toLocaleString()}
                </p>
              </div>

              <div className="flex justify-end space-x-2">
                <Link
                  href={`/profile/orders/${order.id}`}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  查看詳情
                </Link>
                {canPay && !isPaid && (
                  <Link
                    href={`/profile/orders/${order.id}`}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center"
                  >
                    <CreditCard className="w-4 h-4 mr-1" />
                    付款
                  </Link>
                )}
                {order.status === 'pending' && (
                  <button
                    onClick={() => onCancelOrder(order.id)}
                    className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                  >
                    取消訂單
                  </button>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
