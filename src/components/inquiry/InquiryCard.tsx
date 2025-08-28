'use client';

import Link from 'next/link';
import { InquiryWithItems, InquiryUtils } from '@/types/inquiry';
import InquiryStatusBadge from './InquiryStatusBadge';

interface InquiryCardProps {
  inquiry: InquiryWithItems;
  showActions?: boolean;
}

export default function InquiryCard({ 
  inquiry, 
  showActions = true 
}: InquiryCardProps) {
  return (
    <div className="bg-white rounded-lg shadow-sm p-6 hover:shadow-md transition-shadow">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between">
        {/* 左側：詢價單資訊 */}
        <div className="flex-1">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-1">
                庫存查詢單 #{InquiryUtils.formatInquiryNumber(inquiry)}
              </h3>
              <p className="text-sm text-gray-600">
                {new Date(inquiry.created_at).toLocaleDateString('zh-TW', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </p>
            </div>
            <InquiryStatusBadge status={inquiry.status} />
          </div>

          {/* 商品摘要 */}
          <div className="mb-4">
            <p className="text-gray-900 font-medium">
              共 {InquiryUtils.calculateTotalQuantity(inquiry)} 件商品
            </p>
            <p className="text-sm text-gray-600">
              {inquiry.inquiry_items.slice(0, 3).map(item => 
                `${item.product_name} x${item.quantity}`
              ).join('、')}
              {inquiry.inquiry_items.length > 3 && '...'}
            </p>
            <p className="text-lg font-semibold text-amber-900 mt-2">
              總金額：NT$ {InquiryUtils.calculateTotalAmount(inquiry).toLocaleString()}
            </p>
          </div>
        </div>

        {/* 右側：操作按鈕 */}
        {showActions && (
          <div className="flex flex-col sm:flex-row gap-3 lg:ml-6">
            <Link
              href={`/inquiries/${inquiry.id}`}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors text-center text-sm"
            >
              查看詳情
            </Link>
            
            {inquiry.status === 'quoted' && (
              <Link
                href={`/inquiries/${inquiry.id}?action=accept`}
                className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors text-center text-sm"
              >
                確認資訊
              </Link>
            )}
          </div>
        )}
      </div>

      {/* 客戶備註 */}
      {inquiry.notes && (
        <div className="mt-4 pt-4 border-t border-gray-200">
          <p className="text-sm text-gray-600">
            <span className="font-medium">備註：</span>{inquiry.notes}
          </p>
        </div>
      )}
    </div>
  );
}