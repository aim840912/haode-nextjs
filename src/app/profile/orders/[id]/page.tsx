/**
 * 訂單詳情頁面
 *
 * 顯示訂單詳細資訊，待付款訂單顯示付款表單
 */

import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Package, MapPin, CreditCard } from 'lucide-react'
import { createClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'
import { createServerClient } from '@supabase/ssr'
import { PaymentForm } from '@/components/features/payment'

interface OrderDetailPageProps {
  params: Promise<{ id: string }>
}

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

async function getOrderWithItems(orderId: string, userId: string) {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  // 取得訂單基本資料
  const { data: order, error: orderError } = await supabase
    .from('orders')
    .select('*')
    .eq('id', orderId)
    .eq('user_id', userId)
    .single()

  if (orderError || !order) {
    return null
  }

  // 取得訂單項目
  const { data: items } = await supabase.from('order_items').select('*').eq('order_id', orderId)

  return { ...order, items: items || [] }
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

function getPaymentMethodText(method: string | null) {
  if (!method) return '-'
  const methodMap: Record<string, string> = {
    CREDIT: '信用卡',
    VACC: 'ATM 轉帳',
    CVS: '超商代碼',
    WEBATM: '網路 ATM',
  }
  return methodMap[method] || method
}

export default async function OrderDetailPage({ params }: OrderDetailPageProps) {
  const { id } = await params
  const user = await getUser()

  if (!user) {
    redirect(`/login?redirect=/profile/orders/${id}`)
  }

  const order = await getOrderWithItems(id, user.id)

  if (!order) {
    notFound()
  }

  const shippingAddress = order.shipping_address as {
    name: string
    phone: string
    street: string
    city: string
    postalCode: string
  }

  const canPay = order.payment_status === 'pending' || !order.payment_status
  const isPaid = order.payment_status === 'paid'

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="mx-auto max-w-4xl px-4">
        {/* 返回連結 */}
        <Link
          href="/profile/orders"
          className="mb-6 inline-flex items-center text-sm text-gray-600 hover:text-gray-900"
        >
          <ArrowLeft className="mr-1 h-4 w-4" />
          返回訂單列表
        </Link>

        {/* 訂單標題 */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">訂單 {order.order_number}</h1>
          <p className="mt-1 text-sm text-gray-600">
            {new Date(order.created_at).toLocaleString('zh-TW')}
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          {/* 左側：訂單資訊 */}
          <div className="space-y-6 lg:col-span-2">
            {/* 訂單狀態 */}
            <div className="rounded-lg bg-white p-4 shadow">
              <h2 className="mb-3 flex items-center text-lg font-medium text-gray-900">
                <Package className="mr-2 h-5 w-5" />
                訂單狀態
              </h2>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-500">訂單狀態</span>
                  <p className="font-medium">{getStatusText(order.status)}</p>
                </div>
                <div>
                  <span className="text-gray-500">付款狀態</span>
                  <p className={`font-medium ${isPaid ? 'text-green-600' : 'text-yellow-600'}`}>
                    {getPaymentStatusText(order.payment_status)}
                  </p>
                </div>
                {order.payment_method && (
                  <div>
                    <span className="text-gray-500">付款方式</span>
                    <p className="font-medium">{getPaymentMethodText(order.payment_method)}</p>
                  </div>
                )}
                {order.payment_time && (
                  <div>
                    <span className="text-gray-500">付款時間</span>
                    <p className="font-medium">
                      {new Date(order.payment_time).toLocaleString('zh-TW')}
                    </p>
                  </div>
                )}
                {order.payment_trade_no && (
                  <div className="col-span-2">
                    <span className="text-gray-500">交易編號</span>
                    <p className="font-mono text-sm">{order.payment_trade_no}</p>
                  </div>
                )}
              </div>
            </div>

            {/* 訂單商品 */}
            <div className="rounded-lg bg-white p-4 shadow">
              <h2 className="mb-3 text-lg font-medium text-gray-900">訂購商品</h2>
              <div className="divide-y">
                {order.items.map(
                  (item: {
                    id: string
                    product_name: string
                    product_image: string | null
                    quantity: number
                    unit_price: number
                    subtotal: number
                    price_unit: string | null
                  }) => (
                    <div key={item.id} className="flex items-center py-3">
                      <div className="h-16 w-16 flex-shrink-0 overflow-hidden rounded-md bg-gray-100">
                        {item.product_image ? (
                          <img
                            src={item.product_image}
                            alt={item.product_name}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center">
                            <Package className="h-6 w-6 text-gray-400" />
                          </div>
                        )}
                      </div>
                      <div className="ml-4 flex-1">
                        <div className="font-medium text-gray-900">{item.product_name}</div>
                        <div className="text-sm text-gray-500">
                          NT$ {item.unit_price} x {item.quantity}
                          {item.price_unit && ` ${item.price_unit}`}
                        </div>
                      </div>
                      <div className="text-right font-medium text-gray-900">
                        NT$ {item.subtotal.toLocaleString()}
                      </div>
                    </div>
                  )
                )}
              </div>
            </div>

            {/* 配送資訊 */}
            <div className="rounded-lg bg-white p-4 shadow">
              <h2 className="mb-3 flex items-center text-lg font-medium text-gray-900">
                <MapPin className="mr-2 h-5 w-5" />
                配送資訊
              </h2>
              <div className="text-sm">
                <p className="font-medium">{shippingAddress.name}</p>
                <p className="text-gray-600">{shippingAddress.phone}</p>
                <p className="mt-1 text-gray-600">
                  {shippingAddress.postalCode} {shippingAddress.city}
                  {shippingAddress.street}
                </p>
              </div>
              {order.tracking_number && (
                <div className="mt-3 border-t pt-3">
                  <span className="text-sm text-gray-500">物流追蹤號碼</span>
                  <p className="font-mono text-sm">{order.tracking_number}</p>
                </div>
              )}
            </div>
          </div>

          {/* 右側：付款摘要 */}
          <div className="space-y-6">
            {/* 金額摘要 */}
            <div className="rounded-lg bg-white p-4 shadow">
              <h2 className="mb-3 flex items-center text-lg font-medium text-gray-900">
                <CreditCard className="mr-2 h-5 w-5" />
                付款摘要
              </h2>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">商品小計</span>
                  <span>NT$ {order.subtotal.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">運費</span>
                  <span>NT$ {order.shipping_fee.toLocaleString()}</span>
                </div>
                {order.tax > 0 && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">稅金</span>
                    <span>NT$ {order.tax.toLocaleString()}</span>
                  </div>
                )}
                <div className="flex justify-between border-t pt-2 text-base font-medium">
                  <span>總計</span>
                  <span className="text-green-600">NT$ {order.total_amount.toLocaleString()}</span>
                </div>
              </div>
            </div>

            {/* 付款表單（僅顯示未付款訂單） */}
            {canPay && (
              <div className="rounded-lg bg-white p-4 shadow">
                <h2 className="mb-3 text-lg font-medium text-gray-900">立即付款</h2>
                <PaymentForm orderId={order.id} amount={order.total_amount} email={user.email} />
              </div>
            )}

            {/* 已付款提示 */}
            {isPaid && (
              <div className="rounded-lg bg-green-50 p-4 text-center">
                <p className="text-sm font-medium text-green-800">此訂單已完成付款</p>
              </div>
            )}
          </div>
        </div>

        {/* 備註 */}
        {order.notes && (
          <div className="mt-6 rounded-lg bg-white p-4 shadow">
            <h2 className="mb-2 text-lg font-medium text-gray-900">訂單備註</h2>
            <p className="text-sm text-gray-600">{order.notes}</p>
          </div>
        )}
      </div>
    </div>
  )
}

export const metadata = {
  title: '訂單詳情 | 豪德農場',
  description: '查看訂單詳細資訊',
}
