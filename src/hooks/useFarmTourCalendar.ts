'use client';

import { useState, useCallback, useRef } from 'react';
import type FullCalendar from '@fullcalendar/react';
import { useAuth } from '@/lib/auth-context';
import { logger } from '@/lib/logger';
import type { CalendarEvent, CalendarResponse, CalendarStatistics } from '@/app/api/farm-tour/calendar/route';
import type { InquiryStatus } from '@/types/inquiry';

export interface UseFarmTourCalendarOptions {
  defaultView?: 'dayGridMonth' | 'timeGridWeek' | 'timeGridDay' | 'listWeek';
  enableDragAndDrop?: boolean;
  statusFilter?: InquiryStatus[] | 'all';
}

export interface UseFarmTourCalendarReturn {
  // 資料狀態
  events: CalendarEvent[];
  statistics: CalendarStatistics | null;
  loading: boolean;
  error: string | null;
  
  // 操作方法
  fetchEvents: (start: Date, end: Date) => Promise<void>;
  updateEventTime: (eventId: string, newDate: Date) => Promise<boolean>;
  refreshData: () => Promise<void>;
  
  // 設定狀態
  statusFilter: InquiryStatus[] | 'all';
  setStatusFilter: (filter: InquiryStatus[] | 'all') => void;
  
  // 行事曆參考
  calendarRef: React.RefObject<FullCalendar>;
}

export function useFarmTourCalendar(options: UseFarmTourCalendarOptions = {}): UseFarmTourCalendarReturn {
  const {
    defaultView = 'dayGridMonth',
    enableDragAndDrop = true,
    statusFilter: initialStatusFilter = 'all'
  } = options;

  const { user } = useAuth();
  const calendarRef = useRef<FullCalendar>(null);

  // 狀態管理
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [statistics, setStatistics] = useState<CalendarStatistics | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<InquiryStatus[] | 'all'>(initialStatusFilter);
  
  // 當前查詢參數（用於重新整理）
  const [currentRange, setCurrentRange] = useState<{ start: Date; end: Date } | null>(null);

  // 取得事件資料
  const fetchEvents = useCallback(async (start: Date, end: Date) => {
    setLoading(true);
    setError(null);
    setCurrentRange({ start, end });

    try {
      const params = new URLSearchParams({
        start: start.toISOString(),
        end: end.toISOString()
      });

      // 如果有狀態過濾
      if (statusFilter !== 'all') {
        params.append('status', Array.isArray(statusFilter) ? statusFilter.join(',') : statusFilter);
      }

      const response = await fetch(`/api/farm-tour/calendar?${params}`);
      
      if (!response.ok) {
        throw new Error('取得行事曆資料失敗');
      }

      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error || '取得資料失敗');
      }

      const data: CalendarResponse = result.data;
      setEvents(data.events);
      setStatistics(data.statistics);

      logger.debug('農場導覽行事曆資料載入成功');

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '未知錯誤';
      setError(errorMessage);
      logger.error('載入農場導覽行事曆資料失敗');
      setEvents([]);
      setStatistics(null);
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  // 更新事件時間（拖放功能）
  const updateEventTime = useCallback(async (eventId: string, newDate: Date): Promise<boolean> => {
    if (!enableDragAndDrop || !user || user.role !== 'admin') {
      logger.warn('無權限執行拖放操作');
      return false;
    }

    try {
      const response = await fetch(`/api/farm-tour/calendar?id=${eventId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          visit_date: newDate.toISOString()
        })
      });

      if (!response.ok) {
        throw new Error('更新預約時間失敗');
      }

      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error || '更新失敗');
      }

      // 更新本地事件資料
      setEvents(prevEvents => 
        prevEvents.map(event => 
          event.id === eventId 
            ? { ...event, start: newDate.toISOString() }
            : event
        )
      );

      logger.info('預約時間更新成功');

      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '更新失敗';
      logger.error('更新預約時間失敗');
      setError(errorMessage);
      return false;
    }
  }, [enableDragAndDrop, user]);

  // 重新整理資料
  const refreshData = useCallback(async () => {
    if (currentRange) {
      await fetchEvents(currentRange.start, currentRange.end);
    }
  }, [currentRange, fetchEvents]);

  // 當狀態過濾變更時，重新取得資料
  const handleStatusFilterChange = useCallback((filter: InquiryStatus[] | 'all') => {
    setStatusFilter(filter);
    // 觸發重新載入資料
    if (currentRange) {
      fetchEvents(currentRange.start, currentRange.end);
    }
  }, [currentRange, fetchEvents]);

  return {
    // 資料狀態
    events,
    statistics,
    loading,
    error,
    
    // 操作方法
    fetchEvents,
    updateEventTime,
    refreshData,
    
    // 設定狀態
    statusFilter,
    setStatusFilter: handleStatusFilterChange,
    
    // 行事曆參考
    calendarRef
  };
}