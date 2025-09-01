'use client';

import { InquiryWithItems } from '@/types/inquiry';
import { useInquiryStatusFlow } from '@/hooks/useInquiryStatusFlow';
import StatusStep from './StatusStep';

interface InquiryStatusFlowProps {
  inquiry: InquiryWithItems;
  layout?: 'horizontal' | 'vertical';
  showProgress?: boolean;
  showEstimatedTimes?: boolean;
  showDescriptions?: boolean;
  className?: string;
  title?: string;
}

export default function InquiryStatusFlow({
  inquiry,
  layout = 'horizontal',
  showProgress = true,
  showEstimatedTimes = true,
  showDescriptions = true,
  className = '',
  title = '處理進度'
}: InquiryStatusFlowProps) {
  const {
    statusFlowSteps,
    progressPercentage,
    formattedEstimatedCompletion,
    currentStatusDescription,
    responseTime,
    isCompleted,
    isCancelled
  } = useInquiryStatusFlow({
    inquiry,
    showEstimatedTimes,
    showDescriptions
  });

  return (
    <div className={`bg-white rounded-lg shadow-sm ${className}`}>
      {/* 標題區域 */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-900">{title}</h2>
          {showProgress && (
            <div className="flex items-center space-x-3">
              <div className="text-right">
                <div className="text-sm text-gray-600">完成進度</div>
                <div className={`text-lg font-bold ${
                  isCompleted ? 'text-green-600' : 
                  isCancelled ? 'text-red-600' : 
                  'text-amber-600'
                }`}>
                  {progressPercentage}%
                </div>
              </div>
              <div className="w-16 h-16 relative">
                <svg className="w-16 h-16 transform -rotate-90" viewBox="0 0 100 100">
                  {/* 背景圓圈 */}
                  <circle
                    cx="50"
                    cy="50"
                    r="40"
                    stroke="currentColor"
                    strokeWidth="8"
                    fill="none"
                    className="text-gray-200"
                  />
                  {/* 進度圓圈 */}
                  <circle
                    cx="50"
                    cy="50"
                    r="40"
                    stroke="currentColor"
                    strokeWidth="8"
                    fill="none"
                    strokeDasharray={`${2 * Math.PI * 40}`}
                    strokeDashoffset={`${2 * Math.PI * 40 * (1 - progressPercentage / 100)}`}
                    className={`transition-all duration-1000 ease-in-out ${
                      isCompleted ? 'text-green-500' : 
                      isCancelled ? 'text-red-500' : 
                      'text-amber-500'
                    }`}
                    strokeLinecap="round"
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-xs font-bold text-gray-600">
                    {isCompleted ? '✓' : isCancelled ? '✕' : progressPercentage + '%'}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* 目前狀態說明 */}
        {currentStatusDescription && (
          <div className="mt-4 p-3 bg-blue-50 rounded-lg">
            <p className="text-sm text-blue-800">{currentStatusDescription}</p>
          </div>
        )}
      </div>

      {/* 狀態流程區域 */}
      <div className="p-6">
        {layout === 'vertical' ? (
          // 垂直佈局
          <div className="space-y-0">
            {statusFlowSteps.map((step, index) => (
              <StatusStep
                key={step.status}
                status={step.status}
                isActive={step.isActive}
                isCompleted={step.isCompleted}
                timestamp={step.timestamp}
                description={showDescriptions ? step.description : undefined}
                stepNumber={index + 1}
                isLast={index === statusFlowSteps.length - 1}
                layout="vertical"
              />
            ))}
          </div>
        ) : (
          // 水平佈局
          <div className="flex items-start justify-between">
            {statusFlowSteps.map((step, index) => (
              <StatusStep
                key={step.status}
                status={step.status}
                isActive={step.isActive}
                isCompleted={step.isCompleted}
                timestamp={step.timestamp}
                description={showDescriptions ? step.description : undefined}
                stepNumber={index + 1}
                isLast={index === statusFlowSteps.length - 1}
                layout="horizontal"
              />
            ))}
          </div>
        )}
      </div>

      {/* 額外資訊區域 */}
      {(formattedEstimatedCompletion || responseTime !== '未回覆') && (
        <div className="px-6 pb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            {formattedEstimatedCompletion && !isCompleted && !isCancelled && (
              <div className="bg-amber-50 p-3 rounded-lg">
                <h4 className="font-medium text-amber-900 mb-1">預估完成時間</h4>
                <p className="text-amber-800">{formattedEstimatedCompletion}</p>
              </div>
            )}
            
            {responseTime !== '未回覆' && (
              <div className="bg-green-50 p-3 rounded-lg">
                <h4 className="font-medium text-green-900 mb-1">回覆時間</h4>
                <p className="text-green-800">{responseTime}</p>
              </div>
            )}
            
            {inquiry.inquiry_type === 'product' && inquiry.total_estimated_amount && (
              <div className="bg-blue-50 p-3 rounded-lg">
                <h4 className="font-medium text-blue-900 mb-1">詢價金額</h4>
                <p className="text-blue-800">NT$ {inquiry.total_estimated_amount.toLocaleString()}</p>
              </div>
            )}

            {inquiry.inquiry_type === 'farm_tour' && inquiry.visit_date && (
              <div className="bg-green-50 p-3 rounded-lg">
                <h4 className="font-medium text-green-900 mb-1">預約日期</h4>
                <p className="text-green-800">
                  {new Date(inquiry.visit_date).toLocaleDateString('zh-TW', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                    weekday: 'short'
                  })}
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 說明文字 */}
      <div className="px-6 pb-6">
        <div className="text-xs text-gray-500 space-y-1">
          <p>💡 <strong>提示</strong>：我們會在每個階段主動通知您處理進度</p>
          {inquiry.inquiry_type === 'product' && (
            <p>📦 <strong>配送</strong>：確認訂單後，商品將在 3-5 個工作天內配送</p>
          )}
          {inquiry.inquiry_type === 'farm_tour' && (
            <p>🌱 <strong>參觀</strong>：如遇天候不佳，我們會聯繫您調整時間</p>
          )}
        </div>
      </div>
    </div>
  );
}

// 響應式佈局變體
export function InquiryStatusFlowCompact({ 
  inquiry, 
  className = '' 
}: { 
  inquiry: InquiryWithItems; 
  className?: string; 
}) {
  return (
    <InquiryStatusFlow
      inquiry={inquiry}
      layout="horizontal"
      showProgress={false}
      showDescriptions={false}
      showEstimatedTimes={false}
      className={className}
      title="處理狀態"
    />
  );
}

// 詳細版本（適用於詳情頁）
export function InquiryStatusFlowDetailed({ 
  inquiry, 
  className = '' 
}: { 
  inquiry: InquiryWithItems; 
  className?: string; 
}) {
  return (
    <InquiryStatusFlow
      inquiry={inquiry}
      layout="vertical"
      showProgress={true}
      showDescriptions={true}
      showEstimatedTimes={true}
      className={className}
      title="詳細處理進度"
    />
  );
}