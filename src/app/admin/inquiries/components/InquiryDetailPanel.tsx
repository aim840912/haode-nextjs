import { XMarkIcon } from '@heroicons/react/24/outline'
import { InquiryStatusFlowCompact } from '@/components/features/inquiry/InquiryStatusFlow'
import {
  InquiryWithItems,
  InquiryStatus,
  INQUIRY_STATUS_LABELS,
  INQUIRY_STATUS_COLORS,
  InquiryUtils,
} from '@/types/inquiry'

interface InquiryDetailPanelProps {
  inquiry: InquiryWithItems
  isUpdatingStatus: boolean
  onClose: () => void
  onStatusChange: (inquiryId: string, newStatus: InquiryStatus) => void
  children?: React.ReactNode
}

/**
 * 詢問單詳情面板元件
 * 顯示完整的詢問單資訊
 */
export function InquiryDetailPanel({
  inquiry,
  isUpdatingStatus,
  onClose,
  onStatusChange,
  children,
}: InquiryDetailPanelProps) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 dark:bg-opacity-70 z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-800 rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white dark:bg-slate-800 border-b border-gray-200 dark:border-slate-700 p-6 flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">詢問單詳情</h2>
            <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">ID: {inquiry.id}</p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
          >
            <XMarkIcon className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Status Flow */}
          <div className="bg-gray-50 dark:bg-slate-700 p-4 rounded-lg">
            <InquiryStatusFlowCompact
              inquiry={inquiry}
              className="border border-gray-200 dark:border-slate-600"
            />
          </div>

          {/* Basic Info */}
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-3">客戶資訊</h3>
              <div className="space-y-2">
                <p>
                  <span className="text-gray-700 dark:text-gray-300">姓名：</span>
                  <span className="text-gray-900 dark:text-gray-100">{inquiry.customer_name}</span>
                </p>
                <p>
                  <span className="text-gray-700 dark:text-gray-300">Email：</span>
                  <span className="text-gray-900 dark:text-gray-100">{inquiry.customer_email}</span>
                </p>
                <p>
                  <span className="text-gray-700 dark:text-gray-300">電話：</span>
                  <span className="text-gray-900 dark:text-gray-100">{inquiry.customer_phone}</span>
                </p>
                {inquiry.delivery_address && (
                  <p>
                    <span className="text-gray-700 dark:text-gray-300">配送地址：</span>
                    <span className="text-gray-900 dark:text-gray-100">
                      {inquiry.delivery_address}
                    </span>
                  </p>
                )}
              </div>
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-3">詢問資訊</h3>
              <div className="space-y-2">
                <div className="flex items-center">
                  <span className="text-gray-700 dark:text-gray-300 mr-3">狀態：</span>
                  <select
                    value={inquiry.status}
                    onChange={e => onStatusChange(inquiry.id, e.target.value as InquiryStatus)}
                    disabled={isUpdatingStatus}
                    className={`text-sm font-medium rounded px-3 py-1.5 border focus:outline-none focus:ring-2 focus:ring-amber-500 ${
                      INQUIRY_STATUS_COLORS[inquiry.status]
                    } ${isUpdatingStatus ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                  >
                    {(['pending', 'quoted', 'confirmed', 'completed', 'cancelled'] as const).map(
                      status => (
                        <option key={status} value={status}>
                          {INQUIRY_STATUS_LABELS[status]}
                        </option>
                      )
                    )}
                  </select>
                </div>
                <p>
                  <span className="text-gray-700 dark:text-gray-300">建立時間：</span>
                  <span className="text-gray-900 dark:text-gray-100">
                    {new Date(inquiry.created_at).toLocaleString('zh-TW')}
                  </span>
                </p>
                <p>
                  <span className="text-gray-700 dark:text-gray-300">讀取狀態：</span>
                  <span
                    className={`ml-2 px-2 py-1 rounded-full text-xs font-medium ${
                      inquiry.is_read
                        ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300'
                        : 'bg-orange-100 dark:bg-orange-900/30 text-orange-800 dark:text-orange-300'
                    }`}
                  >
                    {inquiry.is_read ? '已讀' : '未讀'}
                  </span>
                </p>
                <p>
                  <span className="text-gray-700 dark:text-gray-300">回覆狀態：</span>
                  <span
                    className={`ml-2 px-2 py-1 rounded-full text-xs font-medium ${
                      inquiry.is_replied
                        ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300'
                        : 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300'
                    }`}
                  >
                    {inquiry.is_replied ? '已回覆' : '待回覆'}
                  </span>
                </p>
                {inquiry.is_replied && InquiryUtils.calculateResponseTime(inquiry) && (
                  <p>
                    <span className="text-gray-700 dark:text-gray-300">回覆時間：</span>
                    <span className="text-gray-900 dark:text-gray-100">
                      {InquiryUtils.formatResponseTime(inquiry)}
                    </span>
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Notes */}
          {inquiry.notes && (
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-3">客戶備註</h3>
              <div className="bg-gray-50 dark:bg-slate-700 p-4 rounded-lg">
                <p className="text-gray-900 dark:text-gray-100">{inquiry.notes}</p>
              </div>
            </div>
          )}

          {/* Inquiry Items */}
          <div>
            <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-3">詢問商品</h3>
            <div className="space-y-3">
              {inquiry.inquiry_items.map(item => (
                <div
                  key={item.id}
                  className="flex justify-between items-center p-3 bg-gray-50 dark:bg-slate-700 rounded-lg"
                >
                  <div>
                    <h4 className="font-medium text-gray-900 dark:text-gray-100">
                      {item.product_name}
                    </h4>
                    {item.product_category && (
                      <p className="text-sm text-gray-700 dark:text-gray-300">
                        分類：{item.product_category}
                      </p>
                    )}
                    <p className="text-sm text-gray-700 dark:text-gray-300">
                      數量：{item.quantity}
                    </p>
                  </div>
                  <div className="text-right">
                    {item.unit_price && (
                      <p className="text-sm text-gray-700 dark:text-gray-300">
                        單價：NT$ {item.unit_price.toLocaleString()}
                      </p>
                    )}
                    <p className="font-medium text-gray-900 dark:text-gray-100">
                      小計：NT${' '}
                      {(
                        item.total_price || (item.unit_price || 0) * item.quantity
                      ).toLocaleString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-4 p-4 bg-amber-50 dark:bg-amber-900/30 rounded-lg">
              <div className="flex justify-between items-center">
                <span className="font-semibold text-gray-900 dark:text-gray-100">總計：</span>
                <span className="text-xl font-bold text-amber-900 dark:text-amber-300">
                  NT$ {InquiryUtils.calculateTotalAmount(inquiry).toLocaleString()}
                </span>
              </div>
            </div>
          </div>

          {/* Additional Content (Quick Reply, etc.) */}
          {children}
        </div>
      </div>
    </div>
  )
}
