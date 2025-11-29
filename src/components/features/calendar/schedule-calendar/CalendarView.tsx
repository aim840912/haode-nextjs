'use client'

import { SimpleCalendar, type CalendarEvent } from '@/components/ui/calendar'
import type { ScheduleCalendarEvent } from '@/hooks/useScheduleCalendar'

interface CalendarViewProps {
  events: ScheduleCalendarEvent[]
  height: string | number
  onEventClick: (clickInfo: { event: { id: string } }) => void
}

export function CalendarView({ events, height, onEventClick }: CalendarViewProps) {
  // 轉換事件格式
  const calendarEvents: CalendarEvent[] = events.map(event => ({
    id: event.id,
    title: event.title,
    start: event.start,
    end: event.end,
    backgroundColor: event.backgroundColor,
    textColor: '#FFFFFF', // 預設白色文字
    extendedProps: event.extendedProps,
  }))

  const handleEventClick = (event: CalendarEvent) => {
    onEventClick({ event: { id: event.id } })
  }

  return <SimpleCalendar events={calendarEvents} height={height} onEventClick={handleEventClick} />
}
