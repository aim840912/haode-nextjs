/**
 * 使用者訂單列表頁面
 */

import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Package, ChevronRight, Clock, CheckCircle, XCircle, Truck } from 'lucide-react'
import { createClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'
import { createServerClient } from '@supabase/ssr'

async function getUser() {
  const cookieStore = await cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
      },
    }
  )

  const {
    data: { user },
  } = await supabase.auth.getUser()
  return user
}

async function getUserOrders(userId: string) {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const { data, error } = await supabase
    .from('orders')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching orders:', error)
    return []
  }

  return data || []
}

function getStatusIcon(status: string) {
  switch (status) {
    case 'pending':
      return <Clock className="h-5 w-5 text-yellow-500" />
    case 'confirmed':
    case 'processing':
      return <Package className="h-5 w-5 text-blue-500" />
    case 'shipped':
      return <Truck className="h-5 w-5 text-purple-500" />
    case 'delivered':
      return <CheckCircle className="h-5 w-5 text-green-500" />
    case 'cancelled':
      return <XCircle className="h-5 w-5 text-red-500" />
    default:
      return <Package className="h-5 w-5 text-gray-500" />
  }
}

function getStatusText(status: string) {
  const statusMap: Record<string, string> = {
    pending: '待確認',
    confirmed: '已確認',
    processing: '處理中',
    shipped: '已出貨',
    delivered: '已送達',
    cancelled: '已取消',
    refunded: '已退款',
  }
  return statusMap[status] || status
}

function getPaymentStatusText(status: string | null) {
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

function getPaymentStatusColor(status: string | null) {
  if (!status || status === 'pending') return 'bg-yellow-100 text-yellow-800'
  if (status === 'paid') return 'bg-green-100 text-green-800'
  if (status === 'failed' || status === 'expired') return 'bg-red-100 text-red-800'
  return 'bg-gray-100 text-gray-800'
}

export default async function OrdersPage() {
  const user = await getUser()

  if (!user) {
    redirect('/login?redirect=/profile/orders')
  }

  const orders = await getUserOrders(user.id)

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="mx-auto max-w-4xl px-4">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">我的訂單</h1>
          <p className="mt-1 text-sm text-gray-600">查看和管理您的訂單</p>
        </div>

        {orders.length === 0 ? (
          <div className="rounded-lg bg-white p-8 text-center shadow">
            <Package className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-4 text-lg font-medium text-gray-900">尚無訂單</h3>
            <p className="mt-2 text-sm text-gray-500">您還沒有任何訂單記錄</p>
            <Link
              href="/products"
              className="mt-4 inline-flex items-center rounded-md bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700"
            >
              開始購物
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {orders.map(order => (
              <Link
                key={order.id}
                href={`/profile/orders/${order.id}`}
                className="block rounded-lg bg-white p-4 shadow transition hover:shadow-md"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    {getStatusIcon(order.status)}
                    <div>
                      <div className="text-sm font-medium text-gray-900">
                        訂單編號：{order.order_number}
                      </div>
                      <div className="text-xs text-gray-500">
                        {new Date(order.created_at).toLocaleString('zh-TW')}
                      </div>
                    </div>
                  </div>
                  <ChevronRight className="h-5 w-5 text-gray-400" />
                </div>

                <div className="mt-3 flex items-center justify-between border-t pt-3">
                  <div className="flex items-center space-x-3">
                    <span className="text-sm text-gray-600">{getStatusText(order.status)}</span>
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs font-medium ${getPaymentStatusColor(order.payment_status)}`}
                    >
                      {getPaymentStatusText(order.payment_status)}
                    </span>
                  </div>
                  <div className="text-sm font-medium text-gray-900">
                    NT$ {order.total_amount.toLocaleString()}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export const metadata = {
  title: '我的訂單 | 豪德農場',
  description: '查看和管理您的訂單',
}
