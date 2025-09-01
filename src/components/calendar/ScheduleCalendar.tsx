'use client';

import { useCallback, useState } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import listPlugin from '@fullcalendar/list';
import { useScheduleCalendar, type ScheduleCalendarEvent } from '@/hooks/useScheduleCalendar';
import { logger } from '@/lib/logger';

// 狀態過濾選項 - 客戶版本
const statusOptions = [
  { value: 'all', label: '全部狀態', color: '#6B7280' },
  { value: 'upcoming', label: '即將到來', color: '#10b981' },
  { value: 'ongoing', label: '進行中', color: '#3b82f6' },
  { value: 'completed', label: '已結束', color: '#6b7280' }
];

interface ScheduleCalendarProps {
  className?: string;
  defaultView?: 'dayGridMonth' | 'listWeek';
  height?: string | number;
}

export default function ScheduleCalendar({
  className = '',
  defaultView = 'dayGridMonth',
  height = 'auto'
}: ScheduleCalendarProps) {
  const [selectedView, setSelectedView] = useState(defaultView);
  const [selectedEvent, setSelectedEvent] = useState<ScheduleCalendarEvent | null>(null);
  const [showEventModal, setShowEventModal] = useState(false);
  
  const {
    events,
    statistics,
    loading,
    error,
    refreshData,
    statusFilter,
    setStatusFilter
  } = useScheduleCalendar();

  // 處理事件點擊 - 顯示詳細資訊
  const handleEventClick = useCallback((clickInfo: { event: { id: string } }) => {
    const eventId = clickInfo.event.id;
    const event = events.find(e => e.id === eventId);
    
    logger.debug(`擺攤行程事件被點擊: ${eventId}`);
    
    if (event) {
      setSelectedEvent(event);
      setShowEventModal(true);
    }
  }, [events]);

  // 關閉事件詳情彈窗
  const closeEventModal = useCallback(() => {
    setShowEventModal(false);
    setSelectedEvent(null);
  }, []);

  // 處理狀態過濾變更
  const handleStatusFilterChange = useCallback((newFilter: string) => {
    setStatusFilter(newFilter as 'all' | 'upcoming' | 'ongoing' | 'completed');
  }, [setStatusFilter]);

  // 格式化日期時間
  const formatDateTime = (dateTimeStr: string) => {
    const date = new Date(dateTimeStr);
    return {
      date: date.toLocaleDateString('zh-TW'),
      time: date.toLocaleTimeString('zh-TW', { 
        hour: '2-digit', 
        minute: '2-digit', 
        hour12: false 
      })
    };
  };

  return (
    <div className={`schedule-calendar ${className}`}>
      {/* 工具列 */}
      <div className="mb-6 flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
        {/* 狀態過濾器 */}
        <div className="flex flex-wrap gap-2">
          {statusOptions.map(option => (
            <button
              key={option.value}
              onClick={() => handleStatusFilterChange(option.value)}
              className={`px-3 py-1.5 text-sm rounded-lg border transition-all duration-200 ${
                statusFilter === option.value
                  ? 'border-transparent text-white shadow-md'
                  : 'border-gray-300 text-gray-700 hover:border-gray-400'
              }`}
              style={{
                backgroundColor: statusFilter === option.value ? option.color : 'transparent'
              }}
            >
              {option.label}
              {statistics && (
                <span className="ml-1 text-xs">
                  {option.value === 'all' 
                    ? `(${statistics.total})`
                    : `(${statistics.byStatus[option.value] || 0})`
                  }
                </span>
              )}
            </button>
          ))}
        </div>

        {/* 操作按鈕 */}
        <div className="flex gap-2">
          <button
            onClick={() => setSelectedView(selectedView === 'dayGridMonth' ? 'listWeek' : 'dayGridMonth')}
            className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors text-sm"
          >
            {selectedView === 'dayGridMonth' ? '列表檢視' : '月曆檢視'}
          </button>
          
          <button
            onClick={refreshData}
            disabled={loading}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors text-sm"
          >
            {loading ? '載入中...' : '重新整理'}
          </button>
        </div>
      </div>

      {/* 錯誤顯示 */}
      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-800">
          <strong>載入失敗：</strong>{error}
          <button
            onClick={refreshData}
            className="ml-2 text-red-600 hover:text-red-800 underline"
          >
            重試
          </button>
        </div>
      )}

      {/* 載入指示器 */}
      {loading && (
        <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg text-blue-800 text-center">
          載入擺攤行程中...
        </div>
      )}

      {/* 統計資訊 */}
      {statistics && !loading && (
        <div className="mb-4 p-4 bg-gray-50 rounded-lg">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold text-gray-900">{statistics.total}</div>
              <div className="text-sm text-gray-600">總場次</div>
            </div>
            {Object.entries(statistics.byStatus).map(([status, count]) => (
              <div key={status}>
                <div 
                  className="text-lg font-semibold" 
                  style={{ color: statusOptions.find(opt => opt.value === status)?.color }}
                >
                  {count}
                </div>
                <div className="text-xs text-gray-600">
                  {statusOptions.find(opt => opt.value === status)?.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 行事曆 */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <FullCalendar
          plugins={[dayGridPlugin, listPlugin]}
          initialView={selectedView}
          headerToolbar={{
            left: 'prev,next today',
            center: 'title',
            right: selectedView === 'dayGridMonth' ? 'dayGridMonth' : 'listWeek'
          }}
          buttonText={{
            today: '今天',
            month: '月曆',
            list: '列表'
          }}
          locale="zh-tw"
          height={height}
          events={events}
          eventClick={handleEventClick}
          dayMaxEvents={3}
          moreLinkText="更多"
          eventTimeFormat={{
            hour: '2-digit',
            minute: '2-digit',
            hour12: false
          }}
          nowIndicator={true}
          weekends={true}
          eventDisplay="block"
          dayHeaderFormat={{ weekday: 'short', month: 'numeric', day: 'numeric' }}
          // 移除互動功能 - 客戶只能檢視
          editable={false}
          selectable={false}
        />
      </div>

      {/* 說明文字 */}
      <div className="mt-4 text-sm text-gray-600">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <strong>使用說明：</strong>
            <ul className="mt-2 space-y-1 list-disc list-inside">
              <li>點擊擺攤行程查看詳細資訊</li>
              <li>使用上方按鈕過濾不同狀態</li>
              <li>切換月曆或列表檢視模式</li>
            </ul>
          </div>
          
          <div>
            <strong>圖例說明：</strong>
            <div className="mt-2 space-y-2">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded bg-green-500"></div>
                <span>即將到來的擺攤行程</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded bg-blue-500"></div>
                <span>進行中的擺攤行程</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded bg-gray-500"></div>
                <span>已結束的擺攤行程</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 事件詳情彈窗 */}
      {showEventModal && selectedEvent && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-start mb-4">
                <h3 className="text-xl font-bold text-gray-900">擺攤行程詳情</h3>
                <button
                  onClick={closeEventModal}
                  className="text-gray-400 hover:text-gray-600 text-2xl"
                >
                  ×
                </button>
              </div>
              
              <div className="space-y-4">
                <div>
                  <span className="text-2xl">📍</span>
                  <strong className="ml-2">{selectedEvent.extendedProps.location}</strong>
                </div>
                
                <div>
                  <span className="text-2xl">📅</span>
                  <strong className="ml-2">
                    {formatDateTime(selectedEvent.start).date}
                  </strong>
                </div>
                
                <div>
                  <span className="text-2xl">⏰</span>
                  <strong className="ml-2">
                    {formatDateTime(selectedEvent.start).time}
                  </strong>
                </div>
                
                {selectedEvent.extendedProps.products && selectedEvent.extendedProps.products.length > 0 && (
                  <div>
                    <span className="text-2xl">🛍️</span>
                    <strong className="ml-2">供應商品：</strong>
                    <div className="mt-1 ml-8">
                      {selectedEvent.extendedProps.products.join('、')}
                    </div>
                  </div>
                )}
                
                {selectedEvent.extendedProps.specialOffer && (
                  <div>
                    <span className="text-2xl">💰</span>
                    <strong className="ml-2">特別優惠：</strong>
                    <div className="mt-1 ml-8 text-red-600">
                      {selectedEvent.extendedProps.specialOffer}
                    </div>
                  </div>
                )}
                
                {selectedEvent.extendedProps.weatherNote && (
                  <div>
                    <span className="text-2xl">☔</span>
                    <strong className="ml-2">天氣備註：</strong>
                    <div className="mt-1 ml-8">
                      {selectedEvent.extendedProps.weatherNote}
                    </div>
                  </div>
                )}
                
                {selectedEvent.extendedProps.description && (
                  <div>
                    <span className="text-2xl">📝</span>
                    <strong className="ml-2">詳細說明：</strong>
                    <div className="mt-1 ml-8">
                      {selectedEvent.extendedProps.description}
                    </div>
                  </div>
                )}
                
                <div>
                  <span className="text-2xl">📞</span>
                  <strong className="ml-2">聯絡資訊：</strong>
                  <div className="mt-1 ml-8">
                    {selectedEvent.extendedProps.contact}
                  </div>
                </div>
              </div>
              
              <div className="mt-6 flex justify-end">
                <button
                  onClick={closeEventModal}
                  className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                >
                  關閉
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}