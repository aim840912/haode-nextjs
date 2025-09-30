import { ClipboardDocumentListIcon } from '@heroicons/react/24/outline'
import {
  InquiryWithItems,
  InquiryStatus,
  InquiryUtils,
  INQUIRY_STATUS_LABELS,
  INQUIRY_STATUS_COLORS,
  INQUIRY_TYPE_LABELS,
  INQUIRY_TYPE_COLORS,
} from '@/types/inquiry'

interface InquiryListProps {
  inquiries: InquiryWithItems[]
  selectedInquiries: Set<string>
  isUpdatingStatus: boolean
  statusFilter: InquiryStatus | 'all' | 'unread' | 'unreplied'
  onSelectInquiry: (inquiry: InquiryWithItems) => void
  onToggleSelection: (inquiryId: string) => void
  onSelectAll: () => void
  onMarkAsRead: (inquiryId: string) => void
  onDeleteInquiry: (inquiryId: string) => void
  onUpdateStatus: (inquiryId: string, status: InquiryStatus) => void
}

export default function InquiryList({
  inquiries,
  selectedInquiries,
  isUpdatingStatus,
  statusFilter,
  onSelectInquiry,
  onToggleSelection,
  onSelectAll,
  onMarkAsRead,
  onDeleteInquiry,
  onUpdateStatus,
}: InquiryListProps) {
  // 空狀態
  if (inquiries.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-8 sm:p-12 text-center">
        <div className="mx-auto w-16 h-16 sm:w-24 sm:h-24 mb-6 sm:mb-8 text-gray-400">
          <ClipboardDocumentListIcon className="w-full h-full" />
        </div>
        <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-3 sm:mb-4">
          {statusFilter === 'all' && '還沒有詢問單'}
          {statusFilter === 'unread' && '沒有未讀的詢問單'}
          {statusFilter === 'unreplied' && '沒有待回覆的詢問單'}
          {statusFilter !== 'all' &&
            statusFilter !== 'unread' &&
            statusFilter !== 'unreplied' &&
            `沒有${INQUIRY_STATUS_LABELS[statusFilter as InquiryStatus]}的詢問單`}
        </h2>
        <p className="text-gray-600">當客戶送出詢問時，會顯示在這裡</p>
      </div>
    )
  }

  return (
    <>
      {/* 桌面版表格 */}
      <div className="hidden lg:block bg-white rounded-lg shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left">
                  <input
                    type="checkbox"
                    checked={inquiries.length > 0 && selectedInquiries.size === inquiries.length}
                    onChange={onSelectAll}
                    className="h-4 w-4 text-amber-600 focus:ring-amber-500 border-gray-300 rounded"
                  />
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                  詢問單號
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                  客戶
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                  類型
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                  詢問內容
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                  金額
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                  建立時間
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                  狀態
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider min-w-[180px]">
                  操作
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {inquiries.map(inquiry => (
                <tr
                  key={inquiry.id}
                  className={`hover:bg-gray-50 ${!inquiry.is_read ? 'bg-orange-50' : ''} ${selectedInquiries.has(inquiry.id) ? 'bg-amber-50' : ''}`}
                >
                  <td className="px-4 py-4 whitespace-nowrap">
                    <input
                      type="checkbox"
                      checked={selectedInquiries.has(inquiry.id)}
                      onChange={() => onToggleSelection(inquiry.id)}
                      className="h-4 w-4 text-amber-600 focus:ring-amber-500 border-gray-300 rounded"
                    />
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center space-x-3">
                      <div className="text-sm font-medium text-gray-900">
                        #{InquiryUtils.formatInquiryNumber(inquiry)}
                      </div>
                      {!inquiry.is_read && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
                          NEW
                        </span>
                      )}
                      {inquiry.is_read && !inquiry.is_replied && inquiry.status !== 'cancelled' && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                          待回覆
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900">
                        {inquiry.customer_name}
                      </div>
                      <div className="text-sm text-gray-700">{inquiry.customer_email}</div>
                      {inquiry.customer_phone && (
                        <div className="text-sm text-gray-700">{inquiry.customer_phone}</div>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${INQUIRY_TYPE_COLORS[inquiry.inquiry_type]}`}
                    >
                      {INQUIRY_TYPE_LABELS[inquiry.inquiry_type]}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    {inquiry.inquiry_type === 'product' ? (
                      <>
                        <div className="text-sm text-gray-900">
                          {InquiryUtils.calculateTotalQuantity(inquiry)} 件商品
                        </div>
                        <div className="text-sm text-gray-700">
                          {inquiry.inquiry_items
                            .slice(0, 2)
                            .map(item => item.product_name)
                            .join(', ')}
                          {inquiry.inquiry_items.length > 2 && '...'}
                        </div>
                      </>
                    ) : (
                      <div>
                        <div className="text-sm text-gray-900 font-medium">
                          {inquiry.activity_title}
                        </div>
                        <div className="text-sm text-gray-700">
                          {inquiry.visit_date} · {inquiry.visitor_count}
                        </div>
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      {inquiry.inquiry_type === 'product'
                        ? `NT$ ${InquiryUtils.calculateTotalAmount(inquiry).toLocaleString()}`
                        : '待報價'}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                    {new Date(inquiry.created_at).toLocaleDateString('zh-TW')}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <select
                      value={inquiry.status}
                      onChange={e => onUpdateStatus(inquiry.id, e.target.value as InquiryStatus)}
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
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm min-w-[180px]">
                    <div className="flex items-center space-x-3">
                      <button
                        onClick={() => onSelectInquiry(inquiry)}
                        className="text-blue-600 hover:text-blue-800 text-sm"
                      >
                        查看詳情
                      </button>
                      {!inquiry.is_read && (
                        <button
                          onClick={() => onMarkAsRead(inquiry.id)}
                          className="text-green-600 hover:text-green-800 text-sm"
                        >
                          標記已讀
                        </button>
                      )}
                      <button
                        onClick={() => onDeleteInquiry(inquiry.id)}
                        className="text-red-600 hover:text-red-800 text-sm"
                      >
                        刪除
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* 手機和平板版卡片列表 */}
      <div className="lg:hidden space-y-4">
        {/* 全選控制 */}
        <div className="bg-white rounded-lg shadow-sm p-4">
          <div className="flex items-center justify-between">
            <label className="flex items-center space-x-3">
              <input
                type="checkbox"
                checked={inquiries.length > 0 && selectedInquiries.size === inquiries.length}
                onChange={onSelectAll}
                className="h-4 w-4 text-amber-600 focus:ring-amber-500 border-gray-300 rounded"
              />
              <span className="text-sm font-medium text-gray-700">
                {selectedInquiries.size > 0 ? `已選取 ${selectedInquiries.size} 筆` : '全選'}
              </span>
            </label>
            <span className="text-sm text-gray-500">共 {inquiries.length} 筆</span>
          </div>
        </div>

        {/* 詢問單卡片 */}
        {inquiries.map(inquiry => (
          <div
            key={inquiry.id}
            className={`bg-white rounded-lg shadow-sm border-l-4 ${
              !inquiry.is_read
                ? 'border-orange-400 bg-orange-50'
                : selectedInquiries.has(inquiry.id)
                  ? 'border-amber-400 bg-amber-50'
                  : 'border-gray-200'
            }`}
          >
            <div className="p-4">
              {/* 卡片頭部 */}
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    checked={selectedInquiries.has(inquiry.id)}
                    onChange={() => onToggleSelection(inquiry.id)}
                    className="h-4 w-4 text-amber-600 focus:ring-amber-500 border-gray-300 rounded"
                  />
                  <div>
                    <div className="text-sm font-medium text-gray-900">
                      #{InquiryUtils.formatInquiryNumber(inquiry)}
                    </div>
                    <div className="text-xs text-gray-500">
                      {new Date(inquiry.created_at).toLocaleDateString('zh-TW')}
                    </div>
                  </div>
                </div>
                <div className="flex flex-wrap gap-1">
                  {!inquiry.is_read && (
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
                      NEW
                    </span>
                  )}
                  {inquiry.is_read && !inquiry.is_replied && inquiry.status !== 'cancelled' && (
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                      待回覆
                    </span>
                  )}
                  <span
                    className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${INQUIRY_TYPE_COLORS[inquiry.inquiry_type]}`}
                  >
                    {INQUIRY_TYPE_LABELS[inquiry.inquiry_type]}
                  </span>
                </div>
              </div>

              {/* 客戶資訊 */}
              <div className="mb-3">
                <div className="text-sm font-medium text-gray-900">{inquiry.customer_name}</div>
                <div className="text-xs text-gray-600">{inquiry.customer_email}</div>
                {inquiry.customer_phone && (
                  <div className="text-xs text-gray-600">{inquiry.customer_phone}</div>
                )}
              </div>

              {/* 詢問內容 */}
              <div className="mb-3">
                {inquiry.inquiry_type === 'product' ? (
                  <>
                    <div className="text-sm text-gray-900 font-medium">
                      {InquiryUtils.calculateTotalQuantity(inquiry)} 件商品
                    </div>
                    <div className="text-sm text-gray-600">
                      {inquiry.inquiry_items
                        .slice(0, 2)
                        .map(item => item.product_name)
                        .join(', ')}
                      {inquiry.inquiry_items.length > 2 && '...'}
                    </div>
                    <div className="text-sm font-medium text-gray-900 mt-1">
                      NT$ {InquiryUtils.calculateTotalAmount(inquiry).toLocaleString()}
                    </div>
                  </>
                ) : (
                  <>
                    <div className="text-sm text-gray-900 font-medium">
                      {inquiry.activity_title}
                    </div>
                    <div className="text-sm text-gray-600">
                      {inquiry.visit_date} · {inquiry.visitor_count} 人
                    </div>
                    <div className="text-sm text-gray-900 mt-1">待報價</div>
                  </>
                )}
              </div>

              {/* 狀態和操作 */}
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <select
                  value={inquiry.status}
                  onChange={e => onUpdateStatus(inquiry.id, e.target.value as InquiryStatus)}
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

                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => onSelectInquiry(inquiry)}
                    className="px-3 py-1.5 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                  >
                    查看詳情
                  </button>
                  {!inquiry.is_read && (
                    <button
                      onClick={() => onMarkAsRead(inquiry.id)}
                      className="px-3 py-1.5 text-xs bg-green-600 text-white rounded hover:bg-green-700 transition-colors"
                    >
                      標記已讀
                    </button>
                  )}
                  <button
                    onClick={() => onDeleteInquiry(inquiry.id)}
                    className="px-3 py-1.5 text-xs bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
                  >
                    刪除
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </>
  )
}
