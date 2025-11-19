/**
 * FullCalendar 配置工具
 *
 * 提供標準化的 FullCalendar 配置物件
 */

import dayGridPlugin from '@fullcalendar/daygrid'
import interactionPlugin from '@fullcalendar/interaction'
import listPlugin from '@fullcalendar/list'
import timeGridPlugin from '@fullcalendar/timegrid'
import type { CalendarOptions, EventInput } from '@fullcalendar/core'

interface GetCalendarConfigParams {
  /** 預設視圖 */
  defaultView: 'dayGridMonth' | 'timeGridWeek' | 'timeGridDay' | 'listWeek'
  /** 行事曆高度 */
  height: string | number
  /** 事件列表 */
  events: EventInput[]
  /** 是否可編輯（管理員） */
  editable: boolean
  /** 事件點擊處理 */
  eventClick: CalendarOptions['eventClick']
  /** 日期點擊處理 */
  dateClick: CalendarOptions['dateClick']
  /** 事件拖放處理 */
  eventDrop: CalendarOptions['eventDrop']
  /** 視圖變更處理 */
  datesSet: CalendarOptions['datesSet']
}

/**
 * 取得 FullCalendar 配置物件
 */
export function getCalendarConfig({
  defaultView,
  height,
  events,
  editable,
  eventClick,
  dateClick,
  eventDrop,
  datesSet,
}: GetCalendarConfigParams): CalendarOptions {
  return {
    plugins: [dayGridPlugin, timeGridPlugin, interactionPlugin, listPlugin],
    initialView: defaultView,
    headerToolbar: {
      left: 'prev,next today',
      center: 'title',
      right: 'dayGridMonth,timeGridWeek,timeGridDay,listWeek',
    },
    buttonText: {
      today: '今天',
      month: '月',
      week: '週',
      day: '日',
      list: '列表',
    },
    locale: 'zh-tw',
    height,
    events,
    eventClick,
    dateClick,
    editable,
    eventDrop,
    datesSet,
    dayMaxEvents: 3,
    moreLinkText: '更多',
    eventTimeFormat: {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    },
    slotLabelFormat: {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    },
    allDaySlot: false,
    nowIndicator: true,
    weekends: true,
    businessHours: {
      daysOfWeek: [1, 2, 3, 4, 5, 6], // 週一到週六
      startTime: '08:00',
      endTime: '18:00',
    },
    slotMinTime: '08:00:00',
    slotMaxTime: '18:00:00',
    expandRows: true,
    eventDisplay: 'block',
    dayHeaderFormat: { weekday: 'short', month: 'numeric', day: 'numeric' },
  }
}
