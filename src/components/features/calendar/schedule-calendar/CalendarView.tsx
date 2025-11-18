'use client'

import dayGridPlugin from '@fullcalendar/daygrid'
import FullCalendar from '@fullcalendar/react'
import type { ScheduleCalendarEvent } from '@/hooks/useScheduleCalendar'

interface CalendarViewProps {
  events: ScheduleCalendarEvent[]
  height: string | number
  onEventClick: (clickInfo: { event: { id: string } }) => void
}

export function CalendarView({ events, height, onEventClick }: CalendarViewProps) {
  return (
    <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-gray-200 dark:border-slate-700 overflow-hidden">
      <FullCalendar
        plugins={[dayGridPlugin]}
        initialView="dayGridMonth"
        headerToolbar={{
          left: 'prev,next today',
          center: 'title',
          right: '',
        }}
        buttonText={{
          today: '今天',
        }}
        locale="zh-tw"
        height={height}
        events={events}
        eventClick={onEventClick}
        dayMaxEvents={3}
        moreLinkText="更多"
        eventTimeFormat={{
          hour: '2-digit',
          minute: '2-digit',
          hour12: false,
        }}
        nowIndicator={true}
        weekends={true}
        eventDisplay="block"
        dayHeaderFormat={{ weekday: 'short', month: 'numeric', day: 'numeric' }}
        editable={false}
        selectable={false}
      />
    </div>
  )
}
