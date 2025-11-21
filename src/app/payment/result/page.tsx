/**
 * 付款結果頁面
 *
 * 顯示付款成功或失敗的結果
 */

import { Suspense } from 'react'
import Link from 'next/link'
import { CheckCircle, XCircle, Clock, AlertCircle } from 'lucide-react'
import { createClient } from '@supabase/supabase-js'

interface PaymentResultPageProps {
  searchParams: Promise<{
    orderNo?: string
    status?: string
    tradeNo?: string
    error?: string
  }>
}

async function PaymentResultContent({
  searchParams,
}: {
  searchParams: PaymentResultPageProps['searchParams']
}) {
  const params = await searchParams
  const { orderNo, status, tradeNo, error } = params

  // 處理錯誤情況
  if (error) {
    return (
      <div className="text-center">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-red-100">
          <AlertCircle className="h-8 w-8 text-red-600" />
        </div>
        <h1 className="mt-4 text-2xl font-bold text-gray-900">付款處理失敗</h1>
        <p className="mt-2 text-gray-600">
          {error === 'missing_params' && '缺少必要參數'}
          {error === 'invalid_signature' && '簽名驗證失敗'}
          {error === 'processing_error' && '處理過程發生錯誤'}
          {!['missing_params', 'invalid_signature', 'processing_error'].includes(error) &&
            '發生未知錯誤'}
        </p>
        <div className="mt-6">
          <Link
            href="/"
            className="inline-flex items-center rounded-md bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700"
          >
            返回首頁
          </Link>
        </div>
      </div>
    )
  }

  // 如果有訂單編號，查詢訂單詳情
  let orderDetails = null
  if (orderNo) {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    const { data } = await supabase
      .from('orders')
      .select('id, order_number, total_amount, payment_status, payment_method, payment_time')
      .eq('order_number', orderNo)
      .single()

    orderDetails = data
  }

  const isSuccess = status === 'success' || orderDetails?.payment_status === 'paid'
  const isPending = orderDetails?.payment_status === 'pending'

  return (
    <div className="text-center">
      {/* 狀態圖示 */}
      <div
        className={`mx-auto flex h-16 w-16 items-center justify-center rounded-full ${
          isSuccess ? 'bg-green-100' : isPending ? 'bg-yellow-100' : 'bg-red-100'
        }`}
      >
        {isSuccess ? (
          <CheckCircle className="h-8 w-8 text-green-600" />
        ) : isPending ? (
          <Clock className="h-8 w-8 text-yellow-600" />
        ) : (
          <XCircle className="h-8 w-8 text-red-600" />
        )}
      </div>

      {/* 標題 */}
      <h1 className="mt-4 text-2xl font-bold text-gray-900">
        {isSuccess ? '付款成功' : isPending ? '等待付款' : '付款失敗'}
      </h1>

      {/* 說明文字 */}
      <p className="mt-2 text-gray-600">
        {isSuccess && '感謝您的購買，我們將盡快處理您的訂單。'}
        {isPending && '請依照指示完成付款，付款完成後訂單將自動更新。'}
        {!isSuccess && !isPending && '付款未完成，請重新嘗試或選擇其他付款方式。'}
      </p>

      {/* 訂單資訊 */}
      {orderDetails && (
        <div className="mt-6 rounded-lg bg-gray-50 p-4">
          <dl className="space-y-2 text-sm">
            <div className="flex justify-between">
              <dt className="text-gray-500">訂單編號</dt>
              <dd className="font-medium text-gray-900">{orderDetails.order_number}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-gray-500">付款金額</dt>
              <dd className="font-medium text-gray-900">
                NT$ {orderDetails.total_amount.toLocaleString()}
              </dd>
            </div>
            {orderDetails.payment_method && (
              <div className="flex justify-between">
                <dt className="text-gray-500">付款方式</dt>
                <dd className="font-medium text-gray-900">
                  {orderDetails.payment_method === 'CREDIT' && '信用卡'}
                  {orderDetails.payment_method === 'VACC' && 'ATM 轉帳'}
                  {orderDetails.payment_method === 'CVS' && '超商代碼'}
                  {orderDetails.payment_method === 'WEBATM' && '網路 ATM'}
                </dd>
              </div>
            )}
            {tradeNo && (
              <div className="flex justify-between">
                <dt className="text-gray-500">交易編號</dt>
                <dd className="font-medium text-gray-900">{tradeNo}</dd>
              </div>
            )}
            {orderDetails.payment_time && (
              <div className="flex justify-between">
                <dt className="text-gray-500">付款時間</dt>
                <dd className="font-medium text-gray-900">
                  {new Date(orderDetails.payment_time).toLocaleString('zh-TW')}
                </dd>
              </div>
            )}
          </dl>
        </div>
      )}

      {/* 操作按鈕 */}
      <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-center">
        {orderDetails && (
          <Link
            href={`/profile/orders/${orderDetails.id}`}
            className="inline-flex items-center justify-center rounded-md bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700"
          >
            查看訂單詳情
          </Link>
        )}
        <Link
          href="/products"
          className="inline-flex items-center justify-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
        >
          繼續購物
        </Link>
      </div>
    </div>
  )
}

export default function PaymentResultPage(props: PaymentResultPageProps) {
  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="mx-auto max-w-md px-4">
        <Suspense
          fallback={
            <div className="text-center">
              <div className="mx-auto h-16 w-16 animate-pulse rounded-full bg-gray-200" />
              <div className="mt-4 h-6 animate-pulse rounded bg-gray-200" />
              <div className="mt-2 h-4 animate-pulse rounded bg-gray-200" />
            </div>
          }
        >
          <PaymentResultContent searchParams={props.searchParams} />
        </Suspense>
      </div>
    </div>
  )
}

export const metadata = {
  title: '付款結果 | 豪德農場',
  description: '查看您的付款結果',
}
