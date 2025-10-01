import { XMarkIcon } from '@heroicons/react/24/outline'
import {
  InquiryWithItems,
  InquiryStatus,
  INQUIRY_STATUS_LABELS,
  INQUIRY_STATUS_COLORS,
  InquiryUtils,
} from '@/types/inquiry'
import { InquiryStatusFlowCompact } from '@/components/features/inquiry/InquiryStatusFlow'

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
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 p-6 flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">詢問單詳情</h2>
            <p className="text-sm text-gray-600 mt-1">ID: {inquiry.id}</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
            <XMarkIcon className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Status Flow */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <InquiryStatusFlowCompact inquiry={inquiry} className="border border-gray-200" />
          </div>

          {/* Basic Info */}
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <h3 className="font-semibold text-gray-900 mb-3">客戶資訊</h3>
              <div className="space-y-2">
                <p>
                  <span className="text-gray-700">姓名：</span>
                  <span className="text-gray-900">{inquiry.customer_name}</span>
                </p>
                <p>
                  <span className="text-gray-700">Email：</span>
                  <span className="text-gray-900">{inquiry.customer_email}</span>
                </p>
                <p>
                  <span className="text-gray-700">電話：</span>
                  <span className="text-gray-900">{inquiry.customer_phone}</span>
                </p>
                {inquiry.delivery_address && (
                  <p>
                    <span className="text-gray-700">配送地址：</span>
                    <span className="text-gray-900">{inquiry.delivery_address}</span>
                  </p>
                )}
              </div>
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 mb-3">詢問資訊</h3>
              <div className="space-y-2">
                <div className="flex items-center">
                  <span className="text-gray-700 mr-3">狀態：</span>
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
                  <span className="text-gray-700">建立時間：</span>
                  <span className="text-gray-900">
                    {new Date(inquiry.created_at).toLocaleString('zh-TW')}
                  </span>
                </p>
                <p>
                  <span className="text-gray-700">讀取狀態：</span>
                  <span
                    className={`ml-2 px-2 py-1 rounded-full text-xs font-medium ${
                      inquiry.is_read
                        ? 'bg-green-100 text-green-800'
                        : 'bg-orange-100 text-orange-800'
                    }`}
                  >
                    {inquiry.is_read ? '已讀' : '未讀'}
                  </span>
                </p>
                <p>
                  <span className="text-gray-700">回覆狀態：</span>
                  <span
                    className={`ml-2 px-2 py-1 rounded-full text-xs font-medium ${
                      inquiry.is_replied ? 'bg-blue-100 text-blue-800' : 'bg-red-100 text-red-800'
                    }`}
                  >
                    {inquiry.is_replied ? '已回覆' : '待回覆'}
                  </span>
                </p>
                {inquiry.is_replied && InquiryUtils.calculateResponseTime(inquiry) && (
                  <p>
                    <span className="text-gray-700">回覆時間：</span>
                    <span className="text-gray-900">
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
              <h3 className="font-semibold text-gray-900 mb-3">客戶備註</h3>
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-gray-900">{inquiry.notes}</p>
              </div>
            </div>
          )}

          {/* Inquiry Items */}
          <div>
            <h3 className="font-semibold text-gray-900 mb-3">詢問商品</h3>
            <div className="space-y-3">
              {inquiry.inquiry_items.map(item => (
                <div
                  key={item.id}
                  className="flex justify-between items-center p-3 bg-gray-50 rounded-lg"
                >
                  <div>
                    <h4 className="font-medium text-gray-900">{item.product_name}</h4>
                    {item.product_category && (
                      <p className="text-sm text-gray-700">分類：{item.product_category}</p>
                    )}
                    <p className="text-sm text-gray-700">數量：{item.quantity}</p>
                  </div>
                  <div className="text-right">
                    {item.unit_price && (
                      <p className="text-sm text-gray-700">
                        單價：NT$ {item.unit_price.toLocaleString()}
                      </p>
                    )}
                    <p className="font-medium text-gray-900">
                      小計：NT${' '}
                      {(
                        item.total_price || (item.unit_price || 0) * item.quantity
                      ).toLocaleString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-4 p-4 bg-amber-50 rounded-lg">
              <div className="flex justify-between items-center">
                <span className="font-semibold text-gray-900">總計：</span>
                <span className="text-xl font-bold text-amber-900">
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
