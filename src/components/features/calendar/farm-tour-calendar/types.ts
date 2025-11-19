/**
 * FarmTourCalendar 型別定義
 *
 * 定義農場體驗行事曆元件的介面和型別
 */

export interface FarmTourCalendarProps {
  /** 自訂 CSS 類別 */
  className?: string
  /** 預設視圖模式 */
  defaultView?: 'dayGridMonth' | 'timeGridWeek' | 'timeGridDay' | 'listWeek'
  /** 行事曆高度 */
  height?: string | number
  /** 事件點擊回調 */
  onEventClick?: (eventId: string) => void
  /** 日期點擊回調 */
  onDateClick?: (date: Date) => void
}
