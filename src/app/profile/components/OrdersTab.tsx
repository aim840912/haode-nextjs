import LoadingSpinner from '@/components/ui/loading/LoadingSpinner'
import Link from 'next/link'
import type { Order } from '@/types/order'
import { Package } from 'lucide-react'
import { formatDate } from '@/lib/utils/formatters'

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
        {orders.map(order => (
          <div key={order.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
            <div className="flex justify-between items-start mb-3">
              <div>
                <p className="text-sm text-gray-600">訂單編號：{order.id}</p>
                <p className="text-sm text-gray-600">
                  訂單日期：{formatDate(order.createdAt, 'short')}
                </p>
              </div>
              <span
                className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(order.status)}`}
              >
                {getStatusText(order.status)}
              </span>
            </div>

            <div className="mb-3">
              <p className="text-gray-900 font-medium">
                總金額：NT$ {order.totalAmount.toLocaleString()}
              </p>
            </div>

            <div className="flex justify-end space-x-2">
              <Link
                href={`/orders/${order.id}`}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                查看詳情
              </Link>
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
        ))}
      </div>
    </div>
  )
}
