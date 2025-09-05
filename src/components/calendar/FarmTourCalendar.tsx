'use client';

import { useCallback, useState } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import listPlugin from '@fullcalendar/list';
import type { EventClickArg, EventDropArg, DatesSetArg } from '@fullcalendar/core';
import type { DateClickArg } from '@fullcalendar/interaction';
import { useFarmTourCalendar } from '@/hooks/useFarmTourCalendar';
import { INQUIRY_STATUS_LABELS, type InquiryStatus } from '@/types/inquiry';
import { useAuth } from '@/lib/auth-context';
import { logger } from '@/lib/logger';

// 狀態過濾選項
const statusOptions = [
  { value: 'all', label: '全部狀態', color: '#6B7280' },
  { value: 'pending', label: INQUIRY_STATUS_LABELS.pending, color: '#9CA3AF' },
  { value: 'quoted', label: INQUIRY_STATUS_LABELS.quoted, color: '#3B82F6' },
  { value: 'confirmed', label: INQUIRY_STATUS_LABELS.confirmed, color: '#10B981' },
  { value: 'completed', label: INQUIRY_STATUS_LABELS.completed, color: '#8B5CF6' },
  { value: 'cancelled', label: INQUIRY_STATUS_LABELS.cancelled, color: '#EF4444' }
];

interface FarmTourCalendarProps {
  className?: string;
  defaultView?: 'dayGridMonth' | 'timeGridWeek' | 'timeGridDay' | 'listWeek';
  height?: string | number;
  onEventClick?: (eventId: string) => void;
  onDateClick?: (date: Date) => void;
}

export default function FarmTourCalendar({
  className = '',
  defaultView = 'dayGridMonth',
  height = 'auto',
  onEventClick,
  onDateClick
}: FarmTourCalendarProps) {
  const { user } = useAuth();
  
  const {
    events,
    statistics,
    loading,
    error,
    fetchEvents,
    updateEventTime,
    refreshData,
    statusFilter,
    setStatusFilter,
    calendarRef
  } = useFarmTourCalendar({
    defaultView,
    enableDragAndDrop: user?.role === 'admin'
  });

  // 處理事件點擊
  const handleEventClick = useCallback((clickInfo: EventClickArg) => {
    const eventId = clickInfo.event.id;
    logger.debug('行事曆事件被點擊');
    
    if (onEventClick) {
      onEventClick(eventId);
    } else {
      // 預設行為：顯示事件詳情（這裡可以開啟彈窗等）
      const event = events.find(e => e.id === eventId);
      if (event) {
        alert(`預約詳情：\n客戶：${event.extendedProps.customer_name}\n活動：${event.extendedProps.activity_title}\n人數：${event.extendedProps.visitor_count}人\n狀態：${INQUIRY_STATUS_LABELS[event.extendedProps.status]}`);
      }
    }
  }, [events, onEventClick]);

  // 處理日期點擊
  const handleDateClick = useCallback((dateClickInfo: DateClickArg) => {
    const clickedDate = dateClickInfo.date;
    logger.debug('行事曆日期被點擊');
    
    if (onDateClick) {
      onDateClick(clickedDate);
    } else {
      // 預設行為：快速新增預約（這裡可以開啟表單等）
      if (user?.role === 'admin') {
        const confirmed = confirm(`要在 ${clickedDate.toLocaleDateString('zh-TW')} 新增預約嗎？`);
        if (confirmed) {
          // 這裡可以開啟快速預約表單
          logger.info('用戶選擇新增預約');
        }
      }
    }
  }, [onDateClick, user]);

  // 處理事件拖放
  const handleEventDrop = useCallback(async (dropInfo: EventDropArg) => {
    if (user?.role !== 'admin') {
      dropInfo.revert(); // 恢復原位置
      alert('只有管理員可以調整預約時間');
      return;
    }

    const eventId = dropInfo.event.id;
    const newDate = dropInfo.event.start;

    if (!newDate) {
      dropInfo.revert();
      alert('無法獲取新的日期時間');
      return;
    }

    logger.debug('事件被拖放');

    // 確認操作
    const confirmed = confirm(`確定要將此預約調整到 ${newDate.toLocaleDateString('zh-TW')} 嗎？`);
    
    if (!confirmed) {
      dropInfo.revert(); // 恢復原位置
      return;
    }

    // 更新事件時間
    const success = await updateEventTime(eventId, newDate);
    
    if (!success) {
      dropInfo.revert(); // 失敗時恢復原位置
      alert('更新預約時間失敗，請稍後再試');
    } else {
      // 成功提示
      const event = events.find(e => e.id === eventId);
      if (event) {
        alert(`「${event.extendedProps.customer_name}」的預約時間已更新至 ${newDate.toLocaleDateString('zh-TW')}`);
      }
    }
  }, [user, updateEventTime, events]);

  // 處理視圖變更和資料載入
  const handleDatesSet = useCallback((dateInfo: DatesSetArg) => {
    fetchEvents(dateInfo.start, dateInfo.end);
  }, [fetchEvents]);

  // 處理狀態過濾變更
  const handleStatusFilterChange = useCallback((newFilter: string) => {
    if (newFilter === 'all') {
      setStatusFilter('all');
    } else {
      setStatusFilter([newFilter as InquiryStatus]);
    }
  }, [setStatusFilter]);

  return (
    <div className={`farm-tour-calendar ${className}`}>
      {/* 工具列 */}
      <div className="mb-6 flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
        {/* 狀態過濾器 */}
        <div className="flex flex-wrap gap-2">
          {statusOptions.map(option => (
            <button
              key={option.value}
              onClick={() => handleStatusFilterChange(option.value)}
              className={`px-3 py-1.5 text-sm rounded-lg border transition-all duration-200 ${
                (statusFilter === 'all' && option.value === 'all') ||
                (Array.isArray(statusFilter) && statusFilter.includes(option.value as InquiryStatus))
                  ? 'border-transparent text-white shadow-md'
                  : 'border-gray-300 text-gray-700 hover:border-gray-400'
              }`}
              style={{
                backgroundColor: 
                  (statusFilter === 'all' && option.value === 'all') ||
                  (Array.isArray(statusFilter) && statusFilter.includes(option.value as InquiryStatus))
                    ? option.color 
                    : 'transparent'
              }}
            >
              {option.label}
              {statistics && (
                <span className="ml-1 text-xs">
                  {option.value === 'all' 
                    ? `(${statistics.total})`
                    : `(${statistics.byStatus[option.value as InquiryStatus] || 0})`
                  }
                </span>
              )}
            </button>
          ))}
        </div>

        {/* 操作按鈕 */}
        <div className="flex gap-2">
          <button
            onClick={refreshData}
            disabled={loading}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors text-sm"
          >
            {loading ? '載入中...' : '重新整理'}
          </button>
          
          {user?.role === 'admin' && (
            <button
              onClick={() => alert('快速新增預約功能開發中...')}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm"
            >
              新增預約
            </button>
          )}
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
          載入行事曆資料中...
        </div>
      )}

      {/* 統計資訊 */}
      {statistics && !loading && (
        <div className="mb-4 p-4 bg-gray-50 rounded-lg">
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold text-gray-900">{statistics.total}</div>
              <div className="text-sm text-gray-600">總預約</div>
            </div>
            {Object.entries(statistics.byStatus).map(([status, count]) => (
              <div key={status}>
                <div className="text-lg font-semibold" style={{ color: statusOptions.find(opt => opt.value === status)?.color }}>
                  {count}
                </div>
                <div className="text-xs text-gray-600">{INQUIRY_STATUS_LABELS[status as InquiryStatus]}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 行事曆 */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <FullCalendar
          ref={calendarRef}
          plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin, listPlugin]}
          initialView={selectedView}
          headerToolbar={{
            left: 'prev,next today',
            center: 'title',
            right: 'dayGridMonth,timeGridWeek,timeGridDay,listWeek'
          }}
          buttonText={{
            today: '今天',
            month: '月',
            week: '週',
            day: '日',
            list: '列表'
          }}
          locale="zh-tw"
          height={height}
          events={events}
          eventClick={handleEventClick}
          dateClick={handleDateClick}
          editable={user?.role === 'admin'}
          eventDrop={handleEventDrop}
          datesSet={handleDatesSet}
          dayMaxEvents={3}
          moreLinkText="更多"
          eventTimeFormat={{
            hour: '2-digit',
            minute: '2-digit',
            hour12: false
          }}
          slotLabelFormat={{
            hour: '2-digit',
            minute: '2-digit',
            hour12: false
          }}
          allDaySlot={false}
          nowIndicator={true}
          weekends={true}
          businessHours={{
            daysOfWeek: [1, 2, 3, 4, 5, 6], // 週一到週六
            startTime: '08:00',
            endTime: '18:00'
          }}
          slotMinTime="08:00:00"
          slotMaxTime="18:00:00"
          expandRows={true}
          eventDisplay="block"
          dayHeaderFormat={{ weekday: 'short', month: 'numeric', day: 'numeric' }}
        />
      </div>

      {/* 說明文字 */}
      <div className="mt-4 text-sm text-gray-600">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <strong>使用說明：</strong>
            <ul className="mt-2 space-y-1 list-disc list-inside">
              <li>點擊預約查看詳細資訊</li>
              <li>點擊日期可快速新增預約</li>
              <li>使用上方按鈕過濾不同狀態</li>
            </ul>
          </div>
          
          {user?.role === 'admin' && (
            <div>
              <strong>管理員功能：</strong>
              <ul className="mt-2 space-y-1 list-disc list-inside">
                <li>拖放預約可調整時間</li>
                <li>所有操作都會記錄日誌</li>
                <li>變更會即時同步到系統</li>
              </ul>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}